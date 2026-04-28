// ═══════════════════════════════════════════════════════════════════════════
// V3 UI-INPUTS — Wires HTML form elements to V3State
// ═══════════════════════════════════════════════════════════════════════════
//
// Responsibilities:
//   1. Populate dynamic dropdowns (cities from CITY_DATA)
//   2. Bind all [data-path] inputs to V3State.set()
//   3. Sync UI from state on load/reset (state → DOM)
//   4. Handle mode toggle (sales/engineering)
//   5. Handle total site area + preset → distribute to design-mode areas (B/L/P %)
//   6. Update debug panel on every state change
//
// No calculation logic. No engine calls. Just input ↔ state binding.
//
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {

  // ── Preset definitions (same as v2 SITE_PRESETS) ────────────────────

  const PRESETS = {
    'balanced':         { building: 25000, landscape: 12500, parking: 12500 },
    'dense-urban':      { building: 40000, landscape: 0,     parking: 10000 },
    'campus':           { building: 15000, landscape: 25000, parking: 10000 },
    'parking-dominant': { building: 10000, landscape: 5000,  parking: 35000 },
    'podium':           { building: 30000, landscape: 15000, parking: 5000  },
    'big-box-retail':   { building: 55000, landscape: 5000,  parking: 40000 }
  };

  const SITE_TYPE_METADATA = {
    'balanced': {
      label: 'Balanced Mixed-Use',
      description: 'A blended building, landscape, and parking site with several BMP pathways.',
      challenges: 'Balance surface BMPs with roof detention and client-facing outdoor areas.'
    },
    'dense-urban': {
      label: 'Dense Urban',
      description: 'Building-heavy site with limited open ground and high value at-grade space.',
      challenges: 'Ground BMP footprint is limited; roof and on-structure strategies often carry more of the target.'
    },
    'campus': {
      label: 'Campus / Landscape-Heavy',
      description: 'Landscape-forward site with more room for distributed green infrastructure.',
      challenges: 'Coordinate grading, soil suitability, and accessible landscape programming.'
    },
    'parking-dominant': {
      label: 'Parking-Dominant',
      description: 'Large pavement areas create runoff volume and strong at-grade retrofit pressure.',
      challenges: 'Utilities, circulation, and pavement disruption can limit underground or bioretention options.'
    },
    'podium': {
      label: 'Podium / Structured Deck',
      description: 'On-structure site where roof, deck, and paver areas drive the strategy.',
      challenges: 'Structural loading, waterproofing, and amenity value matter as much as storage volume.'
    },
    'big-box-retail': {
      label: 'Big Box Retail',
      description: 'Large roof and surface parking site with high runoff volume and broad retrofit options.',
      challenges: 'Compare roof area, parking disruption, and constructability around active retail operations.'
    }
  };

  const ENGINEERING_SPLITS = {
    'balanced':         { slopedRoof: 0.60, flatDeck: 0.40, pavers: 0,    vehicular: 0.80, pedestrian: 0.20 },
    'dense-urban':      { slopedRoof: 0.45, flatDeck: 0.40, pavers: 0.15, vehicular: 0.50, pedestrian: 0.50 },
    'campus':           { slopedRoof: 0.75, flatDeck: 0.25, pavers: 0,    vehicular: 0.65, pedestrian: 0.35 },
    'parking-dominant': { slopedRoof: 0.75, flatDeck: 0.25, pavers: 0,    vehicular: 0.90, pedestrian: 0.10 },
    'podium':           { slopedRoof: 0.25, flatDeck: 0.50, pavers: 0.25, vehicular: 0.50, pedestrian: 0.50 },
    'big-box-retail':   { slopedRoof: 0.70, flatDeck: 0.20, pavers: 0.10, vehicular: 0.92, pedestrian: 0.08 }
  };

  /**
   * Display order for image-only site tiles. Must match keys in PRESETS / ENGINEERING_SPLITS
   * and TECHNICAL_ASSETS (category site-type, related.presetKey).
   */
  const SITE_TYPE_PRESET_ORDER = Object.freeze([
    'balanced',
    'dense-urban',
    'campus',
    'parking-dominant',
    'podium',
    'big-box-retail'
  ]);

  /** Default when no preset is stored (e.g. legacy saves). */
  const DEFAULT_SITE_PRESET = 'balanced';

  /** When false, site-type tiles stay a 6-up grid; set true after user picks, restore, or load project. */
  let _siteTypeTilesPicked = false;

  /** US liquid gallons per cubic foot (for target volume entry). */
  const GAL_PER_CF = 7.480519480519481;
  const SITE_AREA_SLIDER_BASE_MAX = 200000;
  const SITE_AREA_SLIDER_STEP = 100;

  /** Fractions of total site area per preset (derived from PRESETS template totals). */
  function _presetFractions(presetKey) {
    const p = PRESETS[presetKey];
    if (!p) return null;
    const sum = (p.building || 0) + (p.landscape || 0) + (p.parking || 0);
    if (sum <= 0) return null;
    return {
      building: (p.building || 0) / sum,
      landscape: (p.landscape || 0) / sum,
      parking: (p.parking || 0) / sum
    };
  }

  /**
   * Distributes total site SF into B/L/P using preset percentages, then engineering splits.
   */
  function _applyDesignAreasFromTotalAndPreset(presetKey, totalSiteSF) {
    const fr = _presetFractions(presetKey);
    if (!fr) return;
    const T = Math.max(0, Math.round(Number(totalSiteSF) || 0));
    if (T <= 0) {
      V3State.set('site.designModeAreas.totalBuildingSF', 0);
      V3State.set('site.designModeAreas.totalLandscapeSF', 0);
      V3State.set('site.designModeAreas.totalParkingSF', 0);
      _distributeToEngineeringAreas(presetKey, { building: 0, landscape: 0, parking: 0 });
      return;
    }
    let b = Math.floor(T * fr.building);
    let l = Math.floor(T * fr.landscape);
    let p = Math.floor(T * fr.parking);
    const remainder = T - b - l - p;
    p += remainder;
    V3State.set('site.designModeAreas.totalBuildingSF', b);
    V3State.set('site.designModeAreas.totalLandscapeSF', l);
    V3State.set('site.designModeAreas.totalParkingSF', p);
    _distributeToEngineeringAreas(presetKey, { building: b, landscape: l, parking: p });
  }

  function _resolveAssetUrl(relPath) {
    if (!relPath) return '';
    try {
      return new URL(relPath, window.location.href).href;
    } catch (e) {
      return relPath;
    }
  }

  function _escAttr(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function _escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _getSiteTypeAssets() {
    if (typeof TECHNICAL_ASSETS === 'undefined' || !Array.isArray(TECHNICAL_ASSETS)) return [];
    return TECHNICAL_ASSETS.filter(function (a) {
      return a && a.active !== false && a.category === 'site-type' && a.related && a.related.presetKey;
    });
  }

  /** Map presetKey → asset row from TECHNICAL_ASSETS (site-type). */
  function _siteTypeAssetByPreset() {
    const map = {};
    for (const a of _getSiteTypeAssets()) {
      const k = a.related && a.related.presetKey;
      if (k) map[String(k)] = a;
    }
    return map;
  }

  function _siteTypeMeta(presetKey, asset) {
    const meta = SITE_TYPE_METADATA[presetKey] || {};
    return {
      label: meta.label || (asset && asset.title) || presetKey,
      description: meta.description || (asset && (asset.hoverDescription || asset.caption)) || '',
      challenges: meta.challenges || ''
    };
  }

  function _presetSplitParts(presetKey) {
    const p = PRESETS[presetKey];
    if (!p) return null;
    const total = (p.building || 0) + (p.landscape || 0) + (p.parking || 0);
    if (total <= 0) return null;
    const b = Math.round(((p.building || 0) / total) * 100);
    const l = Math.round(((p.landscape || 0) / total) * 100);
    const k = Math.max(0, 100 - b - l);
    return { building: b, landscape: l, pavement: k };
  }

  function _presetSplitTooltip(presetKey) {
    const split = _presetSplitParts(presetKey);
    if (!split) return '';
    return 'Template: Building/Roof ' + split.building + '% · Landscape ' + split.landscape + '% · Pavement ' + split.pavement + '%';
  }

  /** One-line B/L/P % for under-tile hints (same rounding as template totals). */
  function _presetSplitMini(presetKey) {
    const split = _presetSplitParts(presetKey);
    if (!split) return '';
    return 'B/R ' + split.building + '% · L ' + split.landscape + '% · P ' + split.pavement + '%';
  }

  function _siteTypeShareHtml(presetKey) {
    const split = _presetSplitParts(presetKey);
    if (!split) return '';
    return (
      '<span class="site-type-share-grid" aria-label="Assumed site area split">' +
      '<span><strong>' + split.building + '%</strong><small>Bldg/Roof</small></span>' +
      '<span><strong>' + split.landscape + '%</strong><small>Landscape</small></span>' +
      '<span><strong>' + split.pavement + '%</strong><small>Pavement</small></span>' +
      '</span>'
    );
  }

  function _splitPanelHtml(presetKey) {
    const split = _presetSplitParts(presetKey);
    if (!split) return '';
    const meta = _siteTypeMeta(presetKey, null);
    return (
      '<aside class="site-type-split-panel" aria-labelledby="site-type-split-heading">' +
      '<div id="site-type-split-heading" class="site-type-split-panel-title">Selected site type</div>' +
      '<h4 class="site-type-summary-title">' + _escHtml(meta.label) + '</h4>' +
      '<p class="site-type-summary-description">' + _escHtml(meta.description) + '</p>' +
      '<ul class="site-type-split-list">' +
      '<li><span class="site-type-split-label">Building/Roof</span>' +
      '<span class="site-type-split-pct">' + split.building + '%</span></li>' +
      '<li><span class="site-type-split-label">Landscape</span>' +
      '<span class="site-type-split-pct">' + split.landscape + '%</span></li>' +
      '<li><span class="site-type-split-label">Pavement</span>' +
      '<span class="site-type-split-pct">' + split.pavement + '%</span></li>' +
      '</ul>' +
      '<p class="site-type-challenge-note"><strong>Likely BMP challenge:</strong> ' + _escHtml(meta.challenges) + '</p>' +
      '<p class="site-type-split-footnote">Applied to your total site area (SF) above.</p>' +
      '</aside>'
    );
  }

  function _siteTypeTileButtonHtml(presetKey, asset, selected, options) {
    const opts = options || {};
    const showMini = !!opts.showMini;
    const compact = !!opts.compact;
    const meta = _siteTypeMeta(presetKey, asset);
    const splitTip = _presetSplitTooltip(presetKey);
    const titleBits = [
      meta.label,
      splitTip,
      meta.description
    ].filter(Boolean);
    const titleAttr = _escAttr(titleBits.join(' — '));
    const imgAlt = _escAttr(meta.label);
    const titleText = _escHtml(meta.label);

    let html = '<button type="button" class="site-type-tile' + (selected ? ' selected' : '') + '" ';
    html += 'data-preset-key="' + presetKey + '" ';
    html += 'role="radio" aria-checked="' + (selected ? 'true' : 'false') + '" ';
    html += 'title="' + titleAttr + '">';
    html += '<span class="site-type-tile-img-wrap">';
    if (asset && asset.filePath) {
      html += '<img src="' + _resolveAssetUrl(asset.filePath) + '" alt="' + imgAlt + '">';
    } else {
      html += '<span class="site-type-tile-img-placeholder" aria-hidden="true"></span>';
    }
    html += '</span>';
    html += '<span class="site-type-tile-title">' + titleText + '</span>';
    if (!compact) {
      html += '<span class="site-type-tile-description">' + _escHtml(meta.description) + '</span>';
      html += _siteTypeShareHtml(presetKey);
      html += '<span class="site-type-tile-challenge"><strong>Challenge:</strong> ' + _escHtml(meta.challenges) + '</span>';
    }
    if (showMini) {
      html += '<span class="site-type-tile-split-mini">' + _escHtml(_presetSplitMini(presetKey)) + '</span>';
    }
    html += '</button>';
    return html;
  }

  function _renderSiteTypeTiles(selectedPresetKey) {
    const container = document.getElementById('site-type-tiles');
    if (!container) return;

    const byPreset = _siteTypeAssetByPreset();
    const effectiveKey = selectedPresetKey || DEFAULT_SITE_PRESET;

    let html = '';

    if (!_siteTypeTilesPicked) {
      for (let i = 0; i < SITE_TYPE_PRESET_ORDER.length; i++) {
        const presetKey = SITE_TYPE_PRESET_ORDER[i];
        const asset = byPreset[presetKey];
        const selected = effectiveKey === presetKey;
        html += _siteTypeTileButtonHtml(presetKey, asset, selected, { showMini: true });
      }
    } else {
      html += '<div class="site-type-picked-shell">';
      html += '<div class="site-type-tiles-strip">';
      for (let i = 0; i < SITE_TYPE_PRESET_ORDER.length; i++) {
        const presetKey = SITE_TYPE_PRESET_ORDER[i];
        if (presetKey === effectiveKey) continue;
        const asset = byPreset[presetKey];
        html += _siteTypeTileButtonHtml(presetKey, asset, false, { showMini: true, compact: true });
      }
      html += '</div>';
      html += '<div class="site-type-hero-row">';
      const heroAsset = byPreset[effectiveKey];
      html += _siteTypeTileButtonHtml(effectiveKey, heroAsset, true, { showMini: false });
      html += _splitPanelHtml(effectiveKey);
      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;
    container.setAttribute('role', 'radiogroup');
    container.setAttribute('aria-required', 'true');
    const labelEl = document.getElementById('site-type-label');
    if (labelEl && labelEl.id) {
      container.setAttribute('aria-labelledby', labelEl.id);
    } else {
      container.setAttribute('aria-label', 'Site type');
    }
    container.classList.toggle('site-type-tiles--picked', _siteTypeTilesPicked);
  }

  function applySitePreset(presetKey) {
    if (!presetKey || !PRESETS[presetKey]) return;
    V3State.set('site.presetKey', presetKey);
    const dm = V3State.getRef().site && V3State.getRef().site.designModeAreas;
    const totalSF = dm && dm.totalSiteAreaSF != null ? Number(dm.totalSiteAreaSF) : 0;
    if (totalSF > 0) {
      _applyDesignAreasFromTotalAndPreset(presetKey, totalSF);
    } else {
      const defaults = PRESETS[presetKey];
      V3State.set('site.designModeAreas.totalBuildingSF', defaults.building);
      V3State.set('site.designModeAreas.totalLandscapeSF', defaults.landscape);
      V3State.set('site.designModeAreas.totalParkingSF', defaults.parking);
      V3State.set('site.designModeAreas.totalSiteAreaSF', defaults.building + defaults.landscape + defaults.parking);
      _distributeToEngineeringAreas(presetKey, defaults);
    }
  }

  function bindTotalSiteArea() {
    const el = document.getElementById('f-totalSiteAreaSF');
    const slider = document.getElementById('f-totalSiteAreaSF-slider');
    const tickList = document.getElementById('f-totalSiteAreaSF-slider-ticks');
    const tickMin = document.getElementById('site-area-slider-min');
    const tickMid = document.getElementById('site-area-slider-mid');
    const tickMax = document.getElementById('site-area-slider-max');
    if (!el) return;

    function sliderMaxFor(value) {
      const v = Math.max(0, Number(value) || 0);
      if (v <= SITE_AREA_SLIDER_BASE_MAX) return SITE_AREA_SLIDER_BASE_MAX;
      return Math.ceil(v / 50000) * 50000;
    }

    function formatSfTick(v) {
      var n = Math.max(0, Math.round(Number(v) || 0));
      if (n >= 1000000) return (Math.round((n / 1000000) * 10) / 10) + 'M';
      if (n >= 1000) return Math.round(n / 1000) + 'k';
      return String(n);
    }

    function syncSliderTicks(maxVal) {
      if (!slider) return;
      var max = Math.max(SITE_AREA_SLIDER_BASE_MAX, Math.round(Number(maxVal) || SITE_AREA_SLIDER_BASE_MAX));
      if (tickList) {
        var q1 = Math.round(max * 0.25);
        var q2 = Math.round(max * 0.5);
        var q3 = Math.round(max * 0.75);
        tickList.innerHTML =
          '<option value="0"></option>' +
          '<option value="' + q1 + '"></option>' +
          '<option value="' + q2 + '"></option>' +
          '<option value="' + q3 + '"></option>' +
          '<option value="' + max + '"></option>';
      }
      if (tickMin) tickMin.textContent = '0';
      if (tickMid) tickMid.textContent = formatSfTick(max * 0.5);
      if (tickMax) tickMax.textContent = formatSfTick(max);
    }

    function syncTotalAreaControls(value) {
      const v = Math.max(0, Math.round(Number(value) || 0));
      el.value = String(v);
      if (!slider) return;
      const max = sliderMaxFor(v);
      slider.max = String(max);
      slider.step = String(SITE_AREA_SLIDER_STEP);
      slider.value = String(v);
      syncSliderTicks(max);
    }

    function applyTotalSiteArea(v) {
      V3State.set('site.designModeAreas.totalSiteAreaSF', v);
      const pk = (V3State.getRef().site && V3State.getRef().site.presetKey) || DEFAULT_SITE_PRESET;
      if (!PRESETS[pk]) return;
      if (v > 0) {
        _applyDesignAreasFromTotalAndPreset(pk, v);
      } else {
        V3State.set('site.designModeAreas.totalBuildingSF', 0);
        V3State.set('site.designModeAreas.totalLandscapeSF', 0);
        V3State.set('site.designModeAreas.totalParkingSF', 0);
        _distributeToEngineeringAreas(pk, { building: 0, landscape: 0, parking: 0 });
      }
      syncTotalAreaControls(v);
      syncDOMFromState();
      if (bindMarkupControls._sync) bindMarkupControls._sync();
    }

    el.addEventListener('input', () => {
      const raw = el.value === '' ? 0 : Number(el.value);
      const v = raw < 0 ? 0 : raw;
      applyTotalSiteArea(v);
    });

    if (slider) {
      slider.addEventListener('input', () => {
        const raw = slider.value === '' ? 0 : Number(slider.value);
        const v = raw < 0 ? 0 : raw;
        applyTotalSiteArea(v);
      });
      syncSliderTicks(Number(slider.max) || SITE_AREA_SLIDER_BASE_MAX);
    }
  }

  function bindSiteTypeTiles() {
    const container = document.getElementById('site-type-tiles');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const tile = e.target.closest('.site-type-tile');
      if (!tile) return;
      const key = tile.dataset.presetKey;
      if (!key || !PRESETS[key]) return;
      _siteTypeTilesPicked = true;
      applySitePreset(key);
      syncDOMFromState();
      if (bindMarkupControls._sync) bindMarkupControls._sync();
      requestAnimationFrame(function () {
        const selected = container.querySelector('.site-type-tile.selected');
        if (selected && typeof selected.scrollIntoView === 'function') {
          selected.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      });
    });
  }

  function ensureSitePreset() {
    const pk = V3State.getRef().site && V3State.getRef().site.presetKey;
    if (!pk) {
      applySitePreset(DEFAULT_SITE_PRESET);
    }
  }


  // ── City dropdown population ────────────────────────────────────────

  function populateCityDropdown() {
    const select = document.getElementById('f-cityKey');
    if (!select || typeof CITY_DATA === 'undefined') return;

    // Reset options to avoid duplicate city entries if init runs more than once.
    select.innerHTML = '<option value="">Select city...</option>';
    const rows = Object.entries(CITY_DATA).slice().sort(function (a, b) {
      const an = (a[1] && a[1].name) ? String(a[1].name) : String(a[0]);
      const bn = (b[1] && b[1].name) ? String(b[1].name) : String(b[0]);
      return an.localeCompare(bn);
    });
    for (const [key, city] of rows) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = city.name;
      select.appendChild(opt);
    }
  }

  const CITY_THEME_PALETTE = [
    { accent: '#0f766e', accentDark: '#115e59', accentBg: '#d1fae5', accentBorder: '#99f6e4', accentText: '#134e4a', pageStart: '#ecfeff', pageEnd: '#f8fafc' },
    { accent: '#1d4ed8', accentDark: '#1e40af', accentBg: '#dbeafe', accentBorder: '#93c5fd', accentText: '#1e3a8a', pageStart: '#eff6ff', pageEnd: '#f8fafc' },
    { accent: '#7c3aed', accentDark: '#6d28d9', accentBg: '#ede9fe', accentBorder: '#c4b5fd', accentText: '#4c1d95', pageStart: '#f5f3ff', pageEnd: '#f8fafc' },
    { accent: '#c2410c', accentDark: '#9a3412', accentBg: '#ffedd5', accentBorder: '#fdba74', accentText: '#7c2d12', pageStart: '#fff7ed', pageEnd: '#f8fafc' },
    { accent: '#0e7490', accentDark: '#155e75', accentBg: '#cffafe', accentBorder: '#67e8f9', accentText: '#164e63', pageStart: '#ecfeff', pageEnd: '#f8fafc' },
    { accent: '#374151', accentDark: '#1f2937', accentBg: '#e5e7eb', accentBorder: '#d1d5db', accentText: '#111827', pageStart: '#f3f4f6', pageEnd: '#f8fafc' }
  ];
  const _rainfallCache = new Map();
  const _rainfallInflight = new Map();
  const _rainfallExpandedByCity = {};
  let _rainfallRenderToken = 0;

  function _cityThemeForKey(cityKey) {
    const key = String(cityKey || '');
    if (!key) return null;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % CITY_THEME_PALETTE.length;
    return CITY_THEME_PALETTE[idx];
  }

  function _applyCityTheme(cityKey, mode) {
    const body = document.body;
    const root = document.documentElement;
    const header = document.getElementById('app-header');
    const headerCenter = document.getElementById('header-center');
    const city = (cityKey && typeof CITY_DATA !== 'undefined' && CITY_DATA[cityKey]) ? CITY_DATA[cityKey] : null;
    const theme = _cityThemeForKey(cityKey);
    const hasCity = !!city;

    body.setAttribute('data-city-selected', hasCity ? 'true' : 'false');
    body.setAttribute('data-city-key', hasCity ? String(cityKey) : '');
    if (header) header.setAttribute('data-city-label', hasCity ? (city.name || String(cityKey)) : '');
    if (headerCenter) headerCenter.setAttribute('data-city-label', hasCity ? (city.name || String(cityKey)) : '');

    if (!hasCity || !theme) {
      root.style.removeProperty('--city-theme-accent');
      root.style.removeProperty('--city-theme-page-start');
      root.style.removeProperty('--city-theme-page-end');
      root.style.removeProperty('--mode-accent');
      root.style.removeProperty('--mode-accent-dark');
      root.style.removeProperty('--mode-accent-bg');
      root.style.removeProperty('--mode-accent-border');
      root.style.removeProperty('--mode-accent-text');
      return;
    }

    root.style.setProperty('--city-theme-accent', theme.accent);
    root.style.setProperty('--city-theme-page-start', theme.pageStart);
    root.style.setProperty('--city-theme-page-end', theme.pageEnd);

    // Apply city accent strongly in Sales mode for visible context shift.
    if (mode !== 'engineering') {
      root.style.setProperty('--mode-accent', theme.accent);
      root.style.setProperty('--mode-accent-dark', theme.accentDark);
      root.style.setProperty('--mode-accent-bg', theme.accentBg);
      root.style.setProperty('--mode-accent-border', theme.accentBorder);
      root.style.setProperty('--mode-accent-text', theme.accentText);
    }
  }

  function _lastCompleteYear() {
    return Math.max(2000, (new Date()).getFullYear() - 1);
  }

  function _mmToInches(mm) {
    const n = Number(mm) || 0;
    return n / 25.4;
  }

  function _rainfallCacheKey(cityKey, year) {
    return String(cityKey) + '::' + String(year);
  }

  function _normalizeDailyRainfallInches(times, sumsMm) {
    const rows = [];
    if (!Array.isArray(times) || !Array.isArray(sumsMm)) return rows;
    const len = Math.min(times.length, sumsMm.length);
    for (let i = 0; i < len; i++) {
      const t = String(times[i] || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) continue;
      rows.push({
        date: t,
        valueIn: Math.max(0, _mmToInches(sumsMm[i]))
      });
    }
    return rows;
  }

  async function _fetchCityRainfall(cityKey) {
    const city = cityKey && CITY_DATA && CITY_DATA[cityKey] ? CITY_DATA[cityKey] : null;
    if (!city) return { ok: false, reason: 'no-city' };
    const coords = city.coords || {};
    const lat = Number(coords.lat);
    const lon = Number(coords.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok: false, reason: 'no-coords' };

    const year = _lastCompleteYear();
    const key = _rainfallCacheKey(cityKey, year);
    if (_rainfallCache.has(key)) {
      return { ok: true, data: _rainfallCache.get(key) };
    }
    if (_rainfallInflight.has(key)) {
      return _rainfallInflight.get(key);
    }

    const startDate = year + '-01-01';
    const endDate = year + '-12-31';
    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);
    url.searchParams.set('daily', 'precipitation_sum');
    url.searchParams.set('timezone', 'UTC');

    const promise = fetch(url.toString()).then(function (resp) {
      if (!resp.ok) throw new Error('Rainfall request failed (' + resp.status + ')');
      return resp.json();
    }).then(function (json) {
      const daily = json && json.daily ? json.daily : {};
      const dailyRows = _normalizeDailyRainfallInches(daily.time || [], daily.precipitation_sum || []);
      const annualIn = dailyRows.reduce(function (sum, row) { return sum + (Number(row.valueIn) || 0); }, 0);
      const out = {
        cityKey: String(cityKey),
        year: year,
        daily: dailyRows,
        annualIn: annualIn
      };
      _rainfallCache.set(key, out);
      return { ok: true, data: out };
    }).catch(function (err) {
      return { ok: false, reason: 'fetch-error', error: err && err.message ? err.message : String(err) };
    }).finally(function () {
      _rainfallInflight.delete(key);
    });

    _rainfallInflight.set(key, promise);
    return promise;
  }

  function _rainfallModuleHtml(opts) {
    const state = opts && opts.state ? String(opts.state) : 'loading';
    const open = !!(opts && opts.open);
    const openAttr = open ? ' open' : '';
    if (state === 'loading') {
      return (
        '<details class="city-rainfall-card"' + openAttr + '>' +
          '<summary class="city-rainfall-summary">Annual rainfall context <span class="city-rainfall-summary-meta">Loading...</span></summary>' +
          '<div class="city-rainfall-body"><p class="city-rainfall-status">Loading city rainfall data from Open-Meteo...</p></div>' +
        '</details>'
      );
    }
    if (state === 'error') {
      return (
        '<details class="city-rainfall-card"' + openAttr + '>' +
          '<summary class="city-rainfall-summary">Annual rainfall context</summary>' +
          '<div class="city-rainfall-body"><p class="city-rainfall-status city-rainfall-status-error">' + _escHtml(opts.message || 'Rainfall data is currently unavailable.') + '</p></div>' +
        '</details>'
      );
    }
    if (state === 'no-coords') {
      return (
        '<details class="city-rainfall-card"' + openAttr + '>' +
          '<summary class="city-rainfall-summary">Annual rainfall context</summary>' +
          '<div class="city-rainfall-body"><p class="city-rainfall-status">No city coordinates are configured for rainfall lookup.</p></div>' +
        '</details>'
      );
    }

    const d = opts.data || { daily: [], annualIn: 0, year: _lastCompleteYear() };
    const daily = Array.isArray(d.daily) ? d.daily : [];
    const maxDaily = Math.max.apply(null, daily.map(function (r) { return Number(r.valueIn) || 0; }).concat([0.01]));
    let bars = '';
    for (let i = 0; i < daily.length; i++) {
      const val = Number(daily[i].valueIn) || 0;
      const h = Math.max(1, Math.round((val / maxDaily) * 78));
      bars += '<span class="city-rainfall-day-bar" style="height:' + h + 'px" title="' + _escAttr(String(daily[i].date)) + ': ' + _escAttr(val.toFixed(2)) + ' in"></span>';
    }

    return (
      '<details class="city-rainfall-card"' + openAttr + '>' +
        '<summary class="city-rainfall-summary">' +
          'Annual rainfall context' +
          '<span class="city-rainfall-summary-meta">' + d.annualIn.toFixed(1) + '" / year (' + _escHtml(String(d.year)) + ')</span>' +
        '</summary>' +
        '<div class="city-rainfall-body">' +
          '<div class="city-rainfall-annual-badge">' + d.annualIn.toFixed(1) + '" annual precipitation</div>' +
          '<div class="city-rainfall-daily-scroll">' +
            '<div class="city-rainfall-daily-track">' + bars + '</div>' +
          '</div>' +
          '<p class="city-rainfall-caption">Live Open-Meteo daily precipitation for ' + _escHtml(String(d.year)) + ' (' + String(daily.length) + ' days).</p>' +
        '</div>' +
      '</details>'
    );
  }

  function _bindRainfallDetailsToggle(cityKey) {
    const wrap = document.getElementById('city-rainfall-module');
    if (!wrap) return;
    const details = wrap.querySelector('details.city-rainfall-card');
    if (!details) return;
    details.addEventListener('toggle', function () {
      _rainfallExpandedByCity[String(cityKey || '')] = !!details.open;
    });
  }

  function _renderCityRainfallModule(cityKey, mode) {
    const wrap = document.getElementById('city-rainfall-module');
    if (!wrap || typeof CITY_DATA === 'undefined') return;
    const city = cityKey && CITY_DATA[cityKey] ? CITY_DATA[cityKey] : null;
    if (!city) {
      wrap.hidden = true;
      wrap.innerHTML = '';
      return;
    }

    const key = String(cityKey);
    const defaultOpen = false;
    const desiredOpen = Object.prototype.hasOwnProperty.call(_rainfallExpandedByCity, key)
      ? !!_rainfallExpandedByCity[key]
      : defaultOpen;

    wrap.innerHTML = _rainfallModuleHtml({ state: 'loading', open: desiredOpen });
    wrap.hidden = false;
    _bindRainfallDetailsToggle(key);

    const token = ++_rainfallRenderToken;
    _fetchCityRainfall(key).then(function (res) {
      if (token !== _rainfallRenderToken) return;
      if (!res || !res.ok) {
        const reason = res && res.reason ? res.reason : 'fetch-error';
        if (reason === 'no-coords') {
          wrap.innerHTML = _rainfallModuleHtml({ state: 'no-coords', open: desiredOpen });
        } else {
          wrap.innerHTML = _rainfallModuleHtml({
            state: 'error',
            open: desiredOpen,
            message: 'Unable to load rainfall data right now.'
          });
        }
        _bindRainfallDetailsToggle(key);
        return;
      }
      wrap.innerHTML = _rainfallModuleHtml({ state: 'ready', open: desiredOpen, data: res.data });
      _bindRainfallDetailsToggle(key);
    }).catch(function () {
      if (token !== _rainfallRenderToken) return;
      wrap.innerHTML = _rainfallModuleHtml({
        state: 'error',
        open: desiredOpen,
        message: 'Unable to load rainfall data right now.'
      });
      _bindRainfallDetailsToggle(key);
    });
  }

  function bindCityAdminPanel() {
    const toggleBtn = document.getElementById('btn-city-admin-toggle');
    const panel = document.getElementById('section-city-admin');
    const citySelect = document.getElementById('city-admin-select');
    const profileInput = document.getElementById('city-admin-reg-profile');
    const methodInput = document.getElementById('city-admin-method');
    const regsInput = document.getElementById('city-admin-link-regs');
    const manualInput = document.getElementById('city-admin-link-manual');
    const oneLinerInput = document.getElementById('city-admin-sales-oneliner');
    const bulletsInput = document.getElementById('city-admin-reg-bullets');
    const applyBtn = document.getElementById('btn-city-admin-apply');
    const copyBtn = document.getElementById('btn-city-admin-copy');
    const status = document.getElementById('city-admin-status');
    if (!toggleBtn || !panel || !citySelect || typeof CITY_DATA === 'undefined') return;

    function flash(msg) {
      if (!status) return;
      status.textContent = msg;
      status.classList.add('visible');
      setTimeout(function () { status.classList.remove('visible'); }, 1800);
    }

    function populateAdminCities() {
      citySelect.innerHTML = '';
      Object.entries(CITY_DATA).forEach(function (pair) {
        const key = pair[0];
        const city = pair[1];
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = city.name || key;
        citySelect.appendChild(opt);
      });
    }

    function getRegSection(raw) {
      if (Array.isArray(raw)) return { items: raw, salesOneLiner: '' };
      if (raw && Array.isArray(raw.items)) return { items: raw.items, salesOneLiner: raw.salesOneLiner || '' };
      return { items: [], salesOneLiner: '' };
    }

    function loadCityAdmin(key) {
      const city = CITY_DATA[key];
      if (!city) return;
      profileInput.value = city.regulationProfileId || 'general';
      methodInput.value = city.method || '';
      regsInput.value = (city.links && city.links.stormwater) || '';
      manualInput.value = (city.links && city.links.stormwaterManual) || '';
      const overview = getRegSection(city.regSummary && city.regSummary.regulatoryOverview);
      oneLinerInput.value = overview.salesOneLiner || '';
      bulletsInput.value = (overview.items || []).join('\n');
    }

    function getSelectedAdminCityKey() {
      return citySelect.value || (V3State.getRef().site && V3State.getRef().site.cityKey) || '';
    }

    function applyCityAdmin() {
      const key = getSelectedAdminCityKey();
      const city = CITY_DATA[key];
      if (!city) {
        flash('No city selected');
        return;
      }
      city.regulationProfileId = (profileInput.value || 'general').trim();
      const method = (methodInput.value || '').trim();
      if (method) city.method = method;
      else delete city.method;

      city.links = city.links || {};
      city.links.stormwater = (regsInput.value || '').trim();
      city.links.stormwaterManual = (manualInput.value || '').trim();

      city.regSummary = city.regSummary || {};
      const lines = (bulletsInput.value || '')
        .split('\n')
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
      city.regSummary.regulatoryOverview = {
        items: lines,
        salesOneLiner: (oneLinerInput.value || '').trim()
      };

      if (window.V3RunAnalysis && typeof window.V3RunAnalysis.refreshDatabase === 'function') {
        window.V3RunAnalysis.refreshDatabase();
      }

      const mode = (V3State.getRef().settings && V3State.getRef().settings.mode) || 'sales';
      _renderCityRegulationOverview(V3State.getRef().site && V3State.getRef().site.cityKey, mode);
      flash('City updated');
    }

    function copyCityJson() {
      const key = getSelectedAdminCityKey();
      const city = CITY_DATA[key];
      if (!city) return;
      const payload = {};
      payload[key] = city;
      const text = JSON.stringify(payload, null, 2);
      navigator.clipboard.writeText(text).then(function () {
        flash('City JSON copied');
      }).catch(function () {
        flash('Copy failed');
      });
    }

    toggleBtn.addEventListener('click', function () {
      const mode = (V3State.getRef().settings && V3State.getRef().settings.mode) || 'sales';
      if (mode !== 'engineering') return;
      const open = panel.hidden;
      panel.hidden = !open;
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) {
        citySelect.value = (V3State.getRef().site && V3State.getRef().site.cityKey) || citySelect.value;
        loadCityAdmin(citySelect.value);
      }
    });

    citySelect.addEventListener('change', function () { loadCityAdmin(citySelect.value); });
    if (applyBtn) applyBtn.addEventListener('click', applyCityAdmin);
    if (copyBtn) copyBtn.addEventListener('click', copyCityJson);

    populateAdminCities();
    citySelect.value = (V3State.getRef().site && V3State.getRef().site.cityKey) || citySelect.value;
    loadCityAdmin(citySelect.value);

    bindCityAdminPanel._sync = function (project) {
      if (!project || !project.site) return;
      if (project.site.cityKey && citySelect.value !== project.site.cityKey) {
        citySelect.value = project.site.cityKey;
        loadCityAdmin(citySelect.value);
      }
    };
  }

  function _getRegSection(raw) {
    if (Array.isArray(raw)) return { items: raw, salesOneLiner: null };
    if (raw && Array.isArray(raw.items)) {
      return { items: raw.items, salesOneLiner: raw.salesOneLiner || null };
    }
    return { items: [], salesOneLiner: null };
  }

  function _renderCityRegulationOverview(cityKey, mode) {
    const wrap = document.getElementById('city-reg-overview');
    if (!wrap || typeof CITY_DATA === 'undefined') return;

    const city = cityKey && CITY_DATA[cityKey] ? CITY_DATA[cityKey] : null;
    if (!city) {
      wrap.hidden = true;
      wrap.innerHTML = '';
      return;
    }

    const isSales = mode !== 'engineering';
    const profileId = city.regulationProfileId || 'general';
    const method = city.method || 'LEGACY_BMP_ENGINE';

    const sourceLinks = [];
    if (city.links && city.links.stormwaterManual) {
      sourceLinks.push('<a href="' + _escAttr(city.links.stormwaterManual) + '" target="_blank" rel="noopener noreferrer">Stormwater Manual</a>');
    }
    if (city.links && city.links.stormwater) {
      sourceLinks.push('<a href="' + _escAttr(city.links.stormwater) + '" target="_blank" rel="noopener noreferrer">Regulations</a>');
    }

    var html = '<div class="city-reg-overview-head">';
    html += '<h3>City Regulatory Overview</h3>';
    html += '<div class="city-reg-confidence">Using ' + _escHtml(city.name || cityKey) +
      ' rules (profile: <code>' + _escHtml(profileId) + '</code>)</div>';
    if (!isSales) {
      html += '<div class="city-reg-tech">Engineering detail: method <code>' + _escHtml(method) +
        '</code>, regulation profile <code>' + _escHtml(profileId) + '</code></div>';
    }
    html += '</div>';

    const rs = city.regSummary || null;
    if (!rs) {
      html += '<div class="city-reg-fallback">No detailed city summary is loaded for this city yet. ';
      if (sourceLinks.length > 0) {
        html += 'Use official sources: ' + sourceLinks.join(' • ');
      } else {
        html += 'Add <code>regSummary</code> content to city data to enable sales/engineering regulatory notes.';
      }
      html += '</div>';
      wrap.innerHTML = html;
      wrap.hidden = false;
      return;
    }

    const sections = [
      { num: 1, cls: 's1', title: 'Regulatory Overview', shortTitle: 'Regulations', ..._getRegSection(rs.regulatoryOverview) },
      { num: 2, cls: 's2', title: 'Typical Soil Conditions', shortTitle: 'Soils', ..._getRegSection(rs.soilConditions) },
      { num: 3, cls: 's3', title: 'Green Roof Requirements', shortTitle: 'Green Roofs', ..._getRegSection(rs.greenRoofRequirements) },
      { num: 4, cls: 's4', title: 'TSS Requirements', shortTitle: 'TSS', ..._getRegSection(rs.tssRequirements) },
      { num: 5, cls: 's5', title: 'Retention Requirements', shortTitle: 'Retention', ..._getRegSection(rs.retentionRequirements) },
      { num: 6, cls: 's6', title: 'Allowable Outflow Rates', shortTitle: 'Outflow', ..._getRegSection(rs.outflowRates) },
      { num: 7, cls: 's7', title: 'Detention Requirements', shortTitle: 'Detention', ..._getRegSection(rs.detentionRequirements) },
      { num: 8, cls: 's8', title: 'Solar PV & Green Roof Synergies', shortTitle: 'Solar PV', ..._getRegSection(rs.solarPvRequirements) }
    ];

    if (isSales) {
      html += '<details class="city-reg-section city-reg-section-sales">';
      html += '<summary class="city-reg-section-header">';
      html += '<span class="city-reg-num s1">1</span>';
      html += 'Show local requirement highlights';
      html += '<span class="city-reg-expand-arrow">&#9654;</span>';
      html += '</summary>';
      html += '<div class="city-reg-sales-grid">';
      sections.forEach(function (sec) {
        if (!sec.items || sec.items.length === 0) return;
        const oneLiner = sec.salesOneLiner || sec.items[0];
        html += '<div class="city-reg-sales-item ' + sec.cls + '">';
        html += '<span class="city-reg-num ' + sec.cls + '">' + sec.num + '</span>';
        html += '<div><div class="city-reg-sales-label">' + _escHtml(sec.shortTitle) + '</div>';
        html += '<div class="city-reg-sales-text">' + _escHtml(oneLiner) + '</div></div>';
        html += '</div>';
      });
      html += '</div></details>';
    } else {
      sections.forEach(function (sec) {
        if (!sec.items || sec.items.length === 0) return;
      html += '<details class="city-reg-section">';
        html += '<summary class="city-reg-section-header">';
        html += '<span class="city-reg-num ' + sec.cls + '">' + sec.num + '</span>';
        html += _escHtml(sec.title);
        html += '<span class="city-reg-expand-arrow">&#9654;</span>';
        html += '</summary>';
        html += '<ul class="city-reg-bullets">';
        sec.items.forEach(function (itemRaw) {
          const item = String(itemRaw || '');
          const isUncertain = item.startsWith('⚠️') || item.startsWith('⚠');
          const cleanItem = item.replace(/^⚠️?\s*/, '');
          html += '<li class="' + (isUncertain ? 'uncertain' : '') + '">' + _escHtml(cleanItem) + '</li>';
        });
        html += '</ul></details>';
      });
    }

    if (sourceLinks.length > 0) {
      html += '<div class="city-reg-source">Sources: ' + sourceLinks.join(' • ') + '</div>';
    }

    wrap.innerHTML = html;
    wrap.hidden = false;
  }


  // ── Bind all [data-path] elements to state ──────────────────────────

  function bindInputsToState() {
    const elements = document.querySelectorAll('[data-path]');

    elements.forEach(el => {
      const path = el.dataset.path;
      const tag = el.tagName.toLowerCase();
      const type = el.type;

      // Determine which event to listen on
      const eventType = (type === 'checkbox') ? 'change'
                      : (tag === 'select') ? 'change'
                      : 'input';

      el.addEventListener(eventType, () => {
        let value;
        if (type === 'checkbox') {
          value = el.checked;
        } else if (type === 'number') {
          value = el.value === '' ? 0 : Number(el.value);
        } else {
          value = el.value;
        }
        V3State.set(path, value);
      });
    });
  }


  // ── Sync DOM from state (state → inputs) ────────────────────────────

  function syncDOMFromState() {
    const project = V3State.getRef();
    const elements = document.querySelectorAll('[data-path]');

    elements.forEach(el => {
      const path = el.dataset.path;
      const value = _getByPath(project, path);
      const type = el.type;

      if (type === 'checkbox') {
        el.checked = !!value;
      } else if (type === 'number') {
        el.value = (value != null) ? value : 0;
      } else {
        el.value = (value != null) ? value : '';
      }
    });

    // Sync mode toggle buttons
    const mode = (project.settings && project.settings.mode) || 'sales';
    _setModeUI(mode);
    _applyCityTheme(project.site && project.site.cityKey, mode);

    // Sync target row enabled/disabled
    _syncTargetRows();

    // Sync constraint highlight
    _syncConstraintHighlights();
    _renderCityRegulationOverview(project.site && project.site.cityKey, mode);
    _renderCityRainfallModule(project.site && project.site.cityKey, mode);
    if (bindCityAdminPanel._sync) bindCityAdminPanel._sync(project);
    _renderSiteTypeTiles((project.site && project.site.presetKey) || DEFAULT_SITE_PRESET);

    const totalSiteEl = document.getElementById('f-totalSiteAreaSF');
    const totalSiteSlider = document.getElementById('f-totalSiteAreaSF-slider');
    if (totalSiteEl) {
      const tv = _getByPath(project, 'site.designModeAreas.totalSiteAreaSF');
      const v = tv != null ? Math.max(0, Math.round(Number(tv) || 0)) : 0;
      totalSiteEl.value = v;
      if (totalSiteSlider) {
        const max = (v <= SITE_AREA_SLIDER_BASE_MAX) ? SITE_AREA_SLIDER_BASE_MAX : Math.ceil(v / 50000) * 50000;
        totalSiteSlider.max = String(max);
        totalSiteSlider.step = String(SITE_AREA_SLIDER_STEP);
        totalSiteSlider.value = String(v);
      }
    }

    _syncTargetVolumeFields(project);
  }


  // ── Mode toggle ─────────────────────────────────────────────────────

  function bindModeToggle() {
    const buttons = document.querySelectorAll('#mode-toggle .mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        V3State.set('settings.mode', mode);
        _setModeUI(mode);
      });
    });
  }

  function _setModeUI(mode) {
    // Update body attribute (CSS uses this to show/hide area sections)
    document.body.setAttribute('data-mode', mode);

    // Update button active state
    document.querySelectorAll('#mode-toggle .mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    syncDebugChrome();
    const project = V3State.getRef();
    _renderCityRegulationOverview(project.site && project.site.cityKey, mode);
    _renderCityRainfallModule(project.site && project.site.cityKey, mode);
    _applyCityTheme(project.site && project.site.cityKey, mode);
  }


  function _distributeToEngineeringAreas(presetKey, designAreas) {
    const splits = ENGINEERING_SPLITS[presetKey];
    if (!splits) return;

    const building  = designAreas.building || 0;
    const landscape = designAreas.landscape || 0;
    const parking   = designAreas.parking || 0;

    V3State.set('site.areas.slopedRoofArea',               Math.round(building * splits.slopedRoof));
    V3State.set('site.areas.flatDeckOnStructureArea',       Math.round(building * splits.flatDeck));
    V3State.set('site.areas.paversOnStructureArea',         Math.round(building * splits.pavers));
    V3State.set('site.areas.perviousLandscapingUsable',     Math.round(landscape));
    V3State.set('site.areas.imperviousVehicularPavement',   Math.round(parking * splits.vehicular));
    V3State.set('site.areas.imperviousPedestrianPavement',  Math.round(parking * splits.pedestrian));
  }


  // ── Target row enable/disable ───────────────────────────────────────

  function bindTargetToggles() {
    const retCheck = document.getElementById('f-retentionNeeded');
    const detCheck = document.getElementById('f-detentionNeeded');

    if (retCheck) retCheck.addEventListener('change', _syncTargetRows);
    if (detCheck) detCheck.addEventListener('change', _syncTargetRows);
  }

  function _syncTargetRows() {
    const retRow = document.getElementById('f-retentionNeeded');
    const detRow = document.getElementById('f-detentionNeeded');
    if (!retRow || !detRow) return;

    const retParent = retRow.closest('.target-row');
    const detParent = detRow.closest('.target-row');

    const retDis = !retRow.checked;
    const detDis = !detRow.checked;

    if (retParent) retParent.classList.toggle('disabled-target', retDis);
    if (detParent) detParent.classList.toggle('disabled-target', detDis);

    const retVol = document.getElementById('f-retentionVolume');
    const retUnit = document.getElementById('f-retentionUnit');
    const detVol = document.getElementById('f-detentionVolume');
    const detUnit = document.getElementById('f-detentionUnit');
    if (retVol) retVol.disabled = retDis;
    if (retUnit) retUnit.disabled = retDis;
    if (detVol) detVol.disabled = detDis;
    if (detUnit) detUnit.disabled = detDis;
  }

  function _syncTargetVolumeFields(project) {
    const t = (project && project.targets) || {};
    const retCF = Number(t.retentionCF) || 0;
    const detCF = Number(t.detentionCF) || 0;
    const retUnit = t.retentionVolumeUnit === 'gal' ? 'gal' : 'cf';
    const detUnit = t.detentionVolumeUnit === 'gal' ? 'gal' : 'cf';

    const rv = document.getElementById('f-retentionVolume');
    const ru = document.getElementById('f-retentionUnit');
    const dv = document.getElementById('f-detentionVolume');
    const du = document.getElementById('f-detentionUnit');

    if (ru) ru.value = retUnit;
    if (du) du.value = detUnit;
    if (rv) {
      rv.value = retUnit === 'gal' ? String(Math.round(retCF * GAL_PER_CF * 100) / 100) : String(retCF);
    }
    if (dv) {
      dv.value = detUnit === 'gal' ? String(Math.round(detCF * GAL_PER_CF * 100) / 100) : String(detCF);
    }
  }

  function bindTargetVolumeControls() {
    const rv = document.getElementById('f-retentionVolume');
    const ru = document.getElementById('f-retentionUnit');
    const dv = document.getElementById('f-detentionVolume');
    const du = document.getElementById('f-detentionUnit');
    if (!rv || !ru || !dv || !du) return;

    function readCfFromInput(volEl, unitEl) {
      const raw = volEl.value === '' ? 0 : parseFloat(volEl.value);
      const v = Number.isFinite(raw) ? raw : 0;
      return unitEl.value === 'gal' ? v / GAL_PER_CF : v;
    }

    rv.addEventListener('input', () => {
      V3State.set('targets.retentionCF', readCfFromInput(rv, ru));
    });
    dv.addEventListener('input', () => {
      V3State.set('targets.detentionCF', readCfFromInput(dv, du));
    });

    ru.addEventListener('change', () => {
      V3State.set('targets.retentionVolumeUnit', ru.value);
      _syncTargetVolumeFields(V3State.getRef());
    });
    du.addEventListener('change', () => {
      V3State.set('targets.detentionVolumeUnit', du.value);
      _syncTargetVolumeFields(V3State.getRef());
    });
  }


  // ── Constraint highlight ────────────────────────────────────────────

  function bindConstraintHighlights() {
    const checkboxes = document.querySelectorAll('#section-constraints input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', _syncConstraintHighlights);
    });
  }

  function _syncConstraintHighlights() {
    const checkboxes = document.querySelectorAll('#section-constraints .check-label');
    checkboxes.forEach(label => {
      const cb = label.querySelector('input[type="checkbox"]');
      if (cb) label.classList.toggle('checked-active', cb.checked);
    });
    _syncRoofLoadLimitField();
  }

  function _syncRoofLoadLimitField() {
    const field = document.getElementById('roof-load-limit-field');
    const check = document.getElementById('f-hasStructuralLoadLimit');
    if (!field) return;
    const project = V3State.getRef();
    const mode = (project.settings && project.settings.mode) || 'sales';
    field.hidden = mode !== 'engineering' && !(check && check.checked);
  }


  // ── Markup controls ─────────────────────────────────────────────────

  function bindMarkupControls() {
    var installerInput    = document.getElementById('f-installerPct');
    var wpEnabledCheck    = document.getElementById('f-waterprooferEnabled');
    var wpPctInput        = document.getElementById('f-waterprooferPct');
    var gcInput           = document.getElementById('f-gcPct');
    var totalDisplay      = document.getElementById('markup-total-value');
    var hintDisplay       = document.getElementById('markup-hint');
    var wpTier            = document.getElementById('tier-waterproofer');
    var arrow2            = document.getElementById('markup-arrow-2');

    if (!installerInput || !wpEnabledCheck || !wpPctInput || !gcInput) return;

    // Override the default data-path binding for markup % fields:
    // These inputs show whole numbers (25) but store decimals (0.25)
    function pctToDecimal(val) { return (parseFloat(val) || 0) / 100; }
    function decimalToPct(val) { return Math.round((val || 0) * 100); }

    // Remove data-path so the generic binder doesn't double-handle these
    installerInput.removeAttribute('data-path');
    wpPctInput.removeAttribute('data-path');
    gcInput.removeAttribute('data-path');
    wpEnabledCheck.removeAttribute('data-path');

    function updateState() {
      V3State.set('settings.markup.installerPct', pctToDecimal(installerInput.value));
      V3State.set('settings.markup.waterprooferEnabled', wpEnabledCheck.checked);
      V3State.set('settings.markup.waterprooferPct', pctToDecimal(wpPctInput.value));
      V3State.set('settings.markup.gcPct', pctToDecimal(gcInput.value));
    }

    function syncMarkupUI() {
      var project = V3State.getRef();
      var mu = (project.settings && project.settings.markup) || {};
      var wpEnabled = !!mu.waterprooferEnabled;

      installerInput.value = decimalToPct(mu.installerPct);
      wpEnabledCheck.checked = wpEnabled;
      wpPctInput.value = decimalToPct(mu.waterprooferPct);
      wpPctInput.disabled = !wpEnabled;
      gcInput.value = decimalToPct(mu.gcPct);

      if (wpTier) wpTier.classList.toggle('disabled', !wpEnabled);

      // Compute total compounding markup
      var inst = mu.installerPct || 0;
      var wp   = wpEnabled ? (mu.waterprooferPct || 0) : 0;
      var gc   = mu.gcPct || 0;
      var factor = (1 + inst) * (1 + wp) * (1 + gc);
      var totalPct = ((factor - 1) * 100).toFixed(1);

      if (totalDisplay) totalDisplay.textContent = totalPct + '%';

      // Update hint text
      if (hintDisplay) {
        if (wpEnabled) {
          hintDisplay.textContent = '3-tier: Installer → Waterproofer → GC (compounding)';
        } else {
          hintDisplay.textContent = '2-tier: Installer → GC (compounding)';
        }
      }
    }

    // Bind events
    installerInput.addEventListener('input', function () { updateState(); syncMarkupUI(); });
    wpPctInput.addEventListener('input', function () { updateState(); syncMarkupUI(); });
    gcInput.addEventListener('input', function () { updateState(); syncMarkupUI(); });
    wpEnabledCheck.addEventListener('change', function () { updateState(); syncMarkupUI(); });

    // Initial sync
    syncMarkupUI();

    // Expose sync so syncDOMFromState can call it
    bindMarkupControls._sync = syncMarkupUI;
  }


  // ── Debug panel ─────────────────────────────────────────────────────
  // Hidden by default; toggle shown in Engineering mode or when ?debug=true

  let _debugPanelOpen = false;

  function isDebugUrlParam() {
    try {
      return new URLSearchParams(window.location.search).get('debug') === 'true';
    } catch (e) {
      return false;
    }
  }

  function syncDebugChrome() {
    const btn = document.getElementById('btn-toggle-debug');
    const wrap = document.getElementById('debug-panel-container');
    if (!btn || !wrap) return;

    const mode = (V3State.getRef().settings && V3State.getRef().settings.mode) || 'sales';
    const urlDebug = isDebugUrlParam();
    const showToggle = mode === 'engineering' || urlDebug;

    if (!showToggle) {
      btn.hidden = true;
      btn.setAttribute('aria-hidden', 'true');
      wrap.hidden = true;
      wrap.setAttribute('aria-hidden', 'true');
      btn.textContent = 'Show Debug Data';
      btn.setAttribute('aria-expanded', 'false');
      _debugPanelOpen = false;
      return;
    }

    btn.hidden = false;
    btn.setAttribute('aria-hidden', 'false');

    const visible = _debugPanelOpen;
    wrap.hidden = !visible;
    wrap.setAttribute('aria-hidden', visible ? 'false' : 'true');
    btn.textContent = visible ? 'Hide Debug Data' : 'Show Debug Data';
    btn.setAttribute('aria-expanded', visible ? 'true' : 'false');
  }

  function bindDebugToggle() {
    const btn = document.getElementById('btn-toggle-debug');
    if (!btn) return;
    btn.addEventListener('click', () => {
      _debugPanelOpen = !_debugPanelOpen;
      syncDebugChrome();
    });
  }

  function updateDebugPanel() {
    const output = document.getElementById('debug-output');
    if (!output) return;

    const project = V3State.getRef();
    output.textContent = JSON.stringify(project, null, 2);
  }

  function bindCopyButton() {
    const btn = document.getElementById('btn-copy-schema');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const json = JSON.stringify(V3State.get(), null, 2);
      navigator.clipboard.writeText(json).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
    });
  }

  function bindResourcesPageButton() {
    const btn = document.getElementById('btn-open-resources');
    if (!btn) return;

    function getResourcesUrl() {
      const url = new URL('resources.html', window.location.href);
      try {
        const suggestedFamily = localStorage.getItem('v3ResourcesSuggestedFamily');
        if (suggestedFamily) url.searchParams.set('family', suggestedFamily);
      } catch (e) {
        // ignore storage read issues
      }
      return url.toString();
    }

    if (btn.tagName === 'A') btn.href = getResourcesUrl();
    btn.addEventListener('click', function () {
      const url = getResourcesUrl();
      if (btn.tagName === 'A') {
        btn.href = url;
        return;
      }
      window.location.href = url;
    });
  }


  // ── Dot-path helper (duplicate of state.js for module isolation) ────

  function _getByPath(obj, path) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }


  // ── Public init ─────────────────────────────────────────────────────

  global.V3Inputs = {

    /** Preset keys in UI order (image tiles). For tooling / tests. */
    SITE_TYPE_PRESET_ORDER: SITE_TYPE_PRESET_ORDER,

    /**
     * Initialize all input bindings. Call once after DOM is ready.
     * @param {object} [opts]
     * @param {boolean} [opts.restoredFromStorage] — if true, use compact hero layout for site types (returning user).
     */
    init(opts) {
      if (opts && opts.restoredFromStorage) {
        _siteTypeTilesPicked = true;
      }
      if (isDebugUrlParam()) {
        _debugPanelOpen = true;
      }
      populateCityDropdown();
      bindMarkupControls();      // before bindInputsToState so data-path is removed
      bindInputsToState();
      bindTargetVolumeControls();
      bindTotalSiteArea();
      bindModeToggle();
      bindSiteTypeTiles();
      bindTargetToggles();
      bindConstraintHighlights();
      bindCityAdminPanel();
      bindCopyButton();
      bindResourcesPageButton();
      bindDebugToggle();

      // Listen for state changes → update debug panel
      V3State.onChange(() => {
        updateDebugPanel();
      });

      // Initial sync: state → DOM
      ensureSitePreset();
      syncDOMFromState();
      if (bindMarkupControls._sync) bindMarkupControls._sync();
      updateDebugPanel();
      syncDebugChrome();
    },

    /**
     * Re-sync all DOM elements from current state.
     * Call after V3State.load() or V3State.reset().
     */
    sync: function () {
      ensureSitePreset();
      syncDOMFromState();
      if (bindMarkupControls._sync) bindMarkupControls._sync();
      syncDebugChrome();
    },

    /** After loading a project file — show hero layout for site type. */
    markSiteTypeLayoutPicked: function () {
      _siteTypeTilesPicked = true;
      const c = document.getElementById('site-type-tiles');
      if (c) c.classList.add('site-type-tiles--picked');
    },

    /** After clear project — six equal tiles until user picks again. */
    clearSiteTypeLayout: function () {
      _siteTypeTilesPicked = false;
      const c = document.getElementById('site-type-tiles');
      if (c) c.classList.remove('site-type-tiles--picked');
    }
  };

})(window);
