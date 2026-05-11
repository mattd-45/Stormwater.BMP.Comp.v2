// ═══════════════════════════════════════════════════════════════════════════
// V3 RUN-ANALYSIS — Wires ProjectSchema to the existing calculation engine
// ═══════════════════════════════════════════════════════════════════════════
//
// Pipeline:
//   1. Read current state from V3State
//   2. Validate via validateV3Project()
//   3. Adapt via adaptV3ToEngine()
//   4. Assemble database (merge CITY_DATA + REGULATION_PROFILES)
//   5. Run engine via runModel(project, database)
//   6. Classify strategy via V3Strategy
//   7. Render Project Summary to #results-content
//
// Output sections (mode-dependent — see renderProjectSummary):
//   Planning: Strategy → Recommended options (pricing: client all-in delivered + installed only) →
//             Key takeaways → Notes (brief disclaimer + critical engine warnings)
//   Engineering: Full project summary, area breakdown, constraints, strategy, top options
//             (direct + sell, profile cards, pricing breakdown accordions), observations,
//             warnings & blocked BMPs, All BMPs table
//
// Dependencies (loaded before this file):
//   - BMP_OPTIONS_DEFAULT          (data/bmp-options.js)
//   - REGULATION_PROFILES_DEFAULT  (data/regulation-profiles.js)
//   - CITY_DATA                    (data/city-data.js)
//   - COST_ITEMS                   (data/cost-items.js)
//   - COST_ADJUSTMENTS             (data/cost-adjustments.js)
//   - COST_MARKUPS                 (data/cost-adjustments.js)
//   - ROOF_LAYERS                  (data/roof-layers.js)
//   - ROOF_PROFILES                (data/roof-profiles.js)
//   - runModel                     (engine/model.js)
//   - validateV3Project            (v3-adapter.js)
//   - adaptV3ToEngine              (v3-adapter.js)
//   - V3State                      (state.js)
//   - V3Strategy                   (strategy.js)
//   - V3RoofProfileCalc            (v3/roof-profile-calc.js)
//   - V3PricingCalc                (v3/pricing-calc.js)
//
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {

  // ── Purple Roof Simulator integration ─────────────────────────────

  var _PURPLE_ROOF_BMP_IDS = ['10', '10B', '11', '11B'];

  function _isPurpleRoofId(id) {
    return _PURPLE_ROOF_BMP_IDS.indexOf(String(id)) !== -1;
  }

  function renderPurpleRoofSimulatorCta(viable, project, meta) {
    if (!viable || viable.length === 0) return '';
    var prViable = viable.filter(function (r) { return _isPurpleRoofId(r.id); });
    if (prViable.length === 0) return '';

    var site = (project && project.site) || {};
    var cityKey = site.cityKey || (meta && meta.cityKey) || '';
    var city = cityKey && CITY_DATA && CITY_DATA[cityKey] ? CITY_DATA[cityKey] : null;
    var lat = city && city.coords ? city.coords.lat : '';
    var lon = city && city.coords ? city.coords.lon : '';
    var cityName = city ? (city.name || cityKey) : (cityKey || 'Not selected');

    var areas = site.areas || {};
    var roofArea = Math.round(
      (areas.flatDeckOnStructureArea || 0) +
      (areas.slopedRoofArea || 0) +
      (areas.paversOnStructureArea || 0)
    ) || '';

    var assemblyName = prViable[0] ? (prViable[0].name || '') : '';
    var locDisplay = escHtml(cityName) + (lat ? ' (' + lat + '\u00b0, ' + lon + '\u00b0)' : '');

    var html = '<div class="pr-simulator-cta" id="pr-simulator-cta">';
    html += '<div class="pr-cta-kicker">Next step \u2014 final design &amp; permitting</div>';
    html += '<div class="pr-cta-title">Ready for the Purple Roof Simulator?</div>';
    html += '<p class="pr-cta-desc">A Purple Roof assembly is viable for this site. The Purple Roof Simulator can model detention performance, generate a permit-ready hydrograph, and export an .hcp file for use in HydroCAD or SWMM.</p>';

    html += '<div class="pr-cta-method">';
    html += '<p class="pr-cta-section-label">Choose a simulation method:</p>';
    html += '<div class="pr-cta-radios">';
    html += '<label class="pr-cta-radio"><input type="radio" name="pr-sim-method" value="tr20" checked> ';
    html += '<span><strong>TR-20 (HydroCAD-style)</strong> \u2014 single design storm, peak flow and volume, .hcp export</span></label>';
    html += '<label class="pr-cta-radio"><input type="radio" name="pr-sim-method" value="swmm"> ';
    html += '<span><strong>SWMM continuous simulation</strong> \u2014 multi-year hourly climate data, long-period performance metrics</span></label>';
    html += '<span class="pr-cta-radio-disabled">More methods coming soon\u2026</span>';
    html += '</div></div>';

    html += '<div class="pr-cta-values">';
    html += '<p class="pr-cta-section-label">Values that will be passed to the simulator:</p>';
    html += '<div class="pr-cta-fields">';

    html += '<div class="pr-cta-field">';
    html += '<span class="pr-cta-field-label">Location</span>';
    html += '<span class="pr-cta-field-display" id="pr-loc-display">' + locDisplay + '</span>';
    html += '<div class="pr-cta-field-edit" id="pr-loc-edit" style="display:none">';
    html += '<input type="number" id="pr-lat-input" class="pr-cta-input" placeholder="Lat" value="' + escHtml(String(lat)) + '" step="0.0001">';
    html += '<input type="number" id="pr-lon-input" class="pr-cta-input" placeholder="Lon" value="' + escHtml(String(lon)) + '" step="0.0001">';
    html += '</div>';
    html += '<button type="button" class="pr-cta-edit-btn" onclick="(function(b){';
    html += 'var d=document.getElementById(\'pr-loc-display\'),e=document.getElementById(\'pr-loc-edit\');';
    html += 'if(e.style.display===\'none\'){e.style.display=\'flex\';d.style.display=\'none\';b.textContent=\'Done\';}';
    html += 'else{e.style.display=\'none\';d.style.display=\'\';b.textContent=\'Edit\';}})(this)">Edit</button>';
    html += '</div>';

    html += '<div class="pr-cta-field">';
    html += '<span class="pr-cta-field-label">Roof area (SF)</span>';
    html += '<span class="pr-cta-field-display" id="pr-area-display">' + escHtml(roofArea ? Number(roofArea).toLocaleString() : '\u2014') + '</span>';
    html += '<div class="pr-cta-field-edit" id="pr-area-edit" style="display:none">';
    html += '<input type="number" id="pr-area-input" class="pr-cta-input" placeholder="SF" value="' + escHtml(String(roofArea)) + '" step="100">';
    html += '</div>';
    html += '<button type="button" class="pr-cta-edit-btn" onclick="(function(b){';
    html += 'var d=document.getElementById(\'pr-area-display\'),e=document.getElementById(\'pr-area-edit\');';
    html += 'if(e.style.display===\'none\'){e.style.display=\'flex\';d.style.display=\'none\';b.textContent=\'Done\';}';
    html += 'else{e.style.display=\'none\';d.style.display=\'\';b.textContent=\'Edit\';}})(this)">Edit</button>';
    html += '</div>';

    if (assemblyName) {
      html += '<div class="pr-cta-field pr-cta-field-readonly">';
      html += '<span class="pr-cta-field-label">Assembly</span>';
      html += '<span class="pr-cta-field-display">' + escHtml(assemblyName) + '</span>';
      html += '</div>';
    }

    html += '</div></div>';
    html += '<button type="button" class="pr-cta-launch-btn" onclick="window.V3RunAnalysis.launchPurpleRoofSimulator()">Open Purple Roof Simulator \u2192</button>';
    html += '</div>';
    return html;
  }

  function launchPurpleRoofSimulator() {
    var methodEl = document.querySelector('#pr-simulator-cta input[name="pr-sim-method"]:checked');
    var method = methodEl ? methodEl.value : 'tr20';

    var latEl = document.getElementById('pr-lat-input');
    var lonEl = document.getElementById('pr-lon-input');
    var areaEl = document.getElementById('pr-area-input');

    var lat = latEl ? latEl.value.trim() : '';
    var lon = lonEl ? lonEl.value.trim() : '';
    var area = areaEl ? areaEl.value.trim() : '';

    var base = method === 'swmm'
      ? 'https://purple-roof-simulator.com/swmm-dashboard'
      : 'https://purple-roof-simulator.com/roof-simulator';

    var params = [];
    if (lat) params.push('lat=' + encodeURIComponent(lat));
    if (lon) params.push('lon=' + encodeURIComponent(lon));
    if (area) params.push('area=' + encodeURIComponent(area));
    params.push('ref=bmp-tool');

    window.open(base + '?' + params.join('&'), '_blank', 'noopener,noreferrer');
  }


  // ── Database assembly ──────────────────────────────────────────────

  let _database = null;
  var _planningTopOptionsRoofOnlyView = false;

  function getDatabase() {
    if (_database) return _database;

    _database = {
      bmpOptions: BMP_OPTIONS_DEFAULT,
      cityRulesByCityKey: {},
      cityConfigs: CITY_DATA
    };

    for (const [key, city] of Object.entries(CITY_DATA)) {
      const profileId = city.regulationProfileId || 'general';
      const profile = REGULATION_PROFILES_DEFAULT[profileId]
                   || REGULATION_PROFILES_DEFAULT.general;
      _database.cityRulesByCityKey[key] = {
        regulationProfileId: profileId,
        profile: profile
      };
    }

    return _database;
  }

  function refreshDatabase() {
    _database = null;
    return getDatabase();
  }


  // ── Format helpers ─────────────────────────────────────────────────

  function $(val) {
    if (val == null || !Number.isFinite(val)) return '$0';
    return '$' + Math.round(val).toLocaleString();
  }

  function pct(val) {
    if (val == null || !Number.isFinite(val)) return '0%';
    return val + '%';
  }

  function num(val) {
    if (val == null || !Number.isFinite(val)) return '0';
    return Math.round(val).toLocaleString();
  }

  /** US liquid gallons per cubic foot — for target summary display only. */
  var GAL_PER_CF = 7.480519480519481;

  function formatTargetVolumeSummary(cf) {
    var n = Number(cf) || 0;
    var gal = n * GAL_PER_CF;
    return num(n) + ' CF (' + num(gal) + ' gal) required';
  }

  function getTechnicalAssets() {
    if (typeof TECHNICAL_ASSETS === 'undefined' || !Array.isArray(TECHNICAL_ASSETS)) return [];
    return TECHNICAL_ASSETS.filter(function (a) { return a && a.active !== false; });
  }

  function findTechnicalAsset(result, pricing) {
    var assets = getTechnicalAssets();
    if (assets.length === 0 || !result) return null;

    var bmpId = String(result.id);
    var profileId = pricing && pricing.roofProfile && pricing.roofProfile.profileId
      ? String(pricing.roofProfile.profileId)
      : null;

    for (var i = 0; i < assets.length; i++) {
      var rel = assets[i].related || {};
      if (profileId && rel.profileId && String(rel.profileId) === profileId) return assets[i];
    }
    for (var j = 0; j < assets.length; j++) {
      var rel2 = assets[j].related || {};
      if (rel2.bmpId != null && String(rel2.bmpId) === bmpId) return assets[j];
    }
    return null;
  }

  function findSiteTypeAsset(project) {
    var assets = getTechnicalAssets();
    if (assets.length === 0) return null;
    var presetKey = (project && project.site && project.site.presetKey) ? String(project.site.presetKey) : 'balanced';
    for (var i = 0; i < assets.length; i++) {
      if (assets[i].category !== 'site-type') continue;
      var rel = assets[i].related || {};
      if (String(rel.presetKey || '') === presetKey) return assets[i];
    }
    return null;
  }

  function renderSelectedSiteTypeGraphic(project) {
    var asset = findSiteTypeAsset(project);
    if (!asset || !asset.filePath) return '';
    var src = resolveAssetUrl(asset.filePath);
    var html = '<div class="ps-site-type-graphic">';
    html += '<img src="' + escHtml(src) + '" alt="' + escHtml(asset.title || 'Site type graphic') + '">';
    html += '<div class="ps-site-type-caption">Selected site type: ' + escHtml(asset.title || 'Custom Site') + '</div>';
    html += '</div>';
    return html;
  }

  function renderAssetThumb(asset, captionOverride) {
    if (!asset || !asset.filePath) return '';
    var src = resolveAssetUrl(asset.filePath);
    var title = asset.hoverDescription || asset.caption || asset.title || 'Technical image';
    var caption = captionOverride !== undefined
      ? captionOverride
      : (asset.caption || asset.title || '');
    var html = '<div class="ps-asset-thumb">';
    html += '<img src="' + escHtml(src) + '" alt="' + escHtml(asset.title || 'Technical image') + '" title="' + escHtml(title) + '">';
    if (caption) html += '<div class="ps-asset-caption">' + escHtml(caption) + '</div>';
    html += '</div>';
    return html;
  }

  function renderAssetHero(asset, captionOverride) {
    if (!asset || !asset.filePath) return '';
    var src = resolveAssetUrl(asset.filePath);
    var title = asset.hoverDescription || asset.caption || asset.title || 'Technical image';
    var caption = captionOverride !== undefined
      ? captionOverride
      : (asset.caption || asset.title || '');
    var html = '<div class="ps-asset-hero">';
    html += '<img src="' + escHtml(src) + '" alt="' + escHtml(asset.title || 'Technical image') + '" title="' + escHtml(title) + '">';
    if (caption) html += '<div class="ps-asset-caption">' + escHtml(caption) + '</div>';
    html += '</div>';
    return html;
  }

  function renderSystemCell(result, pricing) {
    var html = '<div class="ps-system-cell">';
    html += '<div class="ps-system-name">' + escHtml(result.name) + '</div>';
    html += renderAssetThumb(findTechnicalAsset(result, pricing), 'Representative system profile');
    html += '</div>';
    return html;
  }

  /** Client-facing copy for the Top System Options "System Role" column (display only). */
  function formatSystemRoleNote(r, targets) {
    if (r.retPct >= 100 && r.detPct >= 100) {
      return 'Provides both retention and detention';
    }
    if (targets.retentionNeeded && r.retPct >= 100 && targets.detentionNeeded && r.detPct < 100) {
      return 'Provides retention only (no detention benefit)';
    }
    if (targets.detentionNeeded && r.detPct >= 100 && targets.retentionNeeded && r.retPct < 100) {
      return 'Provides detention only (no retention benefit)';
    }
    if (r.retPct < 100 && r.detPct < 100) {
      return 'Partially meets retention and/or detention targets';
    }
    return '';
  }

  // Roof Opportunity Check comparator set:
  // prioritize preferred roof solutions only (Sponge + Purple variants).
  var ROOF_OPP_BMP_IDS = ['9', '10', '10B', '11', '11B'];
  // Broader roof-forward set used for optional Planning view filtering.
  var ROOF_VIEW_BMP_IDS = ['6', '7', '8', '9', '10', '10B', '11', '11B'];
  var GROUND_OPP_BMP_IDS = ['1', '2', '3', '4', '5'];

  function isRoofOpportunityBmpId(id) {
    return ROOF_OPP_BMP_IDS.indexOf(String(id)) !== -1;
  }

  function isRoofViewBmpId(id) {
    return ROOF_VIEW_BMP_IDS.indexOf(String(id)) !== -1;
  }

  function inferResourceFamilyFromBmpId(id) {
    var key = String(id || '');
    if (['12', '15'].indexOf(key) !== -1) return 'pv';
    if (['16'].indexOf(key) !== -1) return 'fall-pro';
    if (['8', '9', '10', '10B', '11', '11B'].indexOf(key) !== -1) return 'green-roof';
    return 'green-roof';
  }

  function isGroundOpportunityBmpId(id) {
    return GROUND_OPP_BMP_IDS.indexOf(String(id)) !== -1;
  }

  function displayTotalForOpportunity(result, pricing) {
    if (pricing && Number.isFinite(pricing.sellTotal)) return pricing.sellTotal;
    if (result && Number.isFinite(result.costDesigned)) return result.costDesigned;
    return null;
  }

  function evaluateRoofOpportunity(project, viable, regProfileId, sortBy) {
    var sorted = sortResultsForDisplay(viable, sortBy || 'totalCost');
    if (!sorted.length) return null;

    var baseline = sorted[0];
    var baselinePricing = resolvePricing(baseline, regProfileId);
    var baselineTotal = displayTotalForOpportunity(baseline, baselinePricing);
    if (!Number.isFinite(baselineTotal)) return null;

    var roofBest = null;
    var roofBestPricing = null;
    var roofBestTotal = null;
    for (var i = 0; i < sorted.length; i++) {
      var candidate = sorted[i];
      if (!isRoofOpportunityBmpId(candidate.id)) continue;
      var cp = resolvePricing(candidate, regProfileId);
      var ct = displayTotalForOpportunity(candidate, cp);
      if (!Number.isFinite(ct)) continue;
      if (roofBest == null || ct < roofBestTotal) {
        roofBest = candidate;
        roofBestPricing = cp;
        roofBestTotal = ct;
      }
    }

    var assumptions = (project && project.assumptions) || {};
    var areas = (project && project.site && project.site.areas) || {};
    var constraints = (project && project.constraints) || {};

    var spaceHighValue =
      !!assumptions.programmableSpaceIsHighValue ||
      !!assumptions.highValueIndoorSpace;
    var vehicularArea = Number(areas.imperviousVehicularPavement) || 0;
    var baselineIsGround = isGroundOpportunityBmpId(baseline.id);
    var constraintCount = 0;
    if (constraints.hasUndergroundUtilities) constraintCount++;
    if (constraints.hasHighWaterTable) constraintCount++;
    if (constraints.hasContaminatedSoil) constraintCount++;
    if (constraints.hasSiteGradingConstraint) constraintCount++;

    var summary = {
      baseline: baseline,
      baselinePricing: baselinePricing,
      baselineTotal: baselineTotal,
      roofBest: roofBest,
      roofBestPricing: roofBestPricing,
      roofBestTotal: roofBestTotal,
      delta: null,
      deltaPct: null,
      baselineIsGround: baselineIsGround,
      spaceHighValue: spaceHighValue,
      valueContext: '',
      verdictKey: 'neutral',
      verdictTitle: 'Roof Opportunity: Neutral',
      verdictText: ''
    };

    if (spaceHighValue) {
      summary.valueContext = 'High usable space value at grade/in-building';
    } else if (vehicularArea > 0) {
      summary.valueContext = 'Lower space-value pressure (below-grade under parking may be acceptable)';
    } else {
      summary.valueContext = 'Moderate space-value pressure';
    }

    if (!roofBest) {
      summary.verdictKey = 'defer';
      summary.verdictTitle = 'Roof Opportunity: Not currently viable';
      summary.verdictText = 'No roof-forward system is currently in the viable set. Continue with baseline or adjust constraints/areas.';
      return summary;
    }

    summary.delta = roofBestTotal - baselineTotal;
    summary.deltaPct = baselineTotal > 0 ? (summary.delta / baselineTotal) : null;

    if (!baselineIsGround) {
      summary.verdictKey = 'neutral';
      summary.verdictTitle = 'Roof Opportunity: Already captured';
      summary.verdictText = 'The baseline recommendation is already a roof/on-structure system.';
      return summary;
    }

    if (summary.delta <= 0) {
      summary.verdictKey = 'promote';
      summary.verdictTitle = 'Roof Opportunity: Promote';
      summary.verdictText = 'Best roof-forward option is cost-neutral or cheaper than baseline while potentially freeing ground/indoor area.';
      return summary;
    }

    if (spaceHighValue && summary.deltaPct != null && summary.deltaPct <= 0.20) {
      summary.verdictKey = 'consider';
      summary.verdictTitle = 'Roof Opportunity: Consider strongly';
      summary.verdictText = 'Roof option premium is moderate and may be justified by preserving valuable at-grade/indoor square footage.';
      return summary;
    }

    if (constraintCount >= 2 && summary.deltaPct != null && summary.deltaPct <= 0.25) {
      summary.verdictKey = 'consider';
      summary.verdictTitle = 'Roof Opportunity: Consider';
      summary.verdictText = 'Ground constraints are high; roof-forward option may reduce execution risk and ground-system dependence.';
      return summary;
    }

    summary.verdictKey = 'defer';
    summary.verdictTitle = 'Roof Opportunity: Defer';
    summary.verdictText = 'Baseline remains more cost-effective for this site context. Keep roof-forward option as alternate if project priorities shift.';
    return summary;
  }

  function renderSectionRoofOpportunity(project, viable, regProfileId, mode, sortBy) {
    var opp = evaluateRoofOpportunity(project, viable, regProfileId, sortBy);
    if (!opp) return '';
    var isPlanning = (mode !== 'engineering');

    var html = '<div class="ps-section ps-roof-opportunity ps-roof-opportunity-' + opp.verdictKey + '">';
    html += '<h3 class="ps-heading">Roof Opportunity Check</h3>';
    html += '<div class="ps-roof-opportunity-card">';
    html += '<div class="ps-roof-opportunity-title">' + escHtml(opp.verdictTitle) + '</div>';
    html += '<p class="ps-roof-opportunity-text">' + escHtml(opp.verdictText) + '</p>';

    html += '<div class="ps-grid ps-grid-3">';
    html += psItem('Baseline (cost-first)', escHtml(opp.baseline.name) + ' — ' + $(opp.baselineTotal));
    if (opp.roofBest) {
      html += psItem('Best roof-forward option', escHtml(opp.roofBest.name) + ' — ' + $(opp.roofBestTotal));
    } else {
      html += psItem('Best roof-forward option', 'None viable');
    }
    if (opp.delta == null) {
      html += psItem('Net delta vs baseline', '—');
    } else {
      var dp = (opp.deltaPct != null) ? (' (' + (opp.deltaPct * 100).toFixed(1) + '%)') : '';
      html += psItem('Net delta vs baseline', (opp.delta >= 0 ? '+' : '-') + $(Math.abs(opp.delta)) + dp);
    }
    html += '</div>';

    html += '<p class="ps-roof-opportunity-footnote">';
    html += 'Space-value context: ' + escHtml(opp.valueContext) + '. ';
    html += (opp.baselineIsGround
      ? 'A roof-forward path may reduce at-grade or in-building BMP footprint.'
      : 'Baseline is already roof-forward; this confirms the roof strategy.');
    html += '</p>';

    if (!isPlanning) {
      html += '<p class="ps-roof-opportunity-footnote">Decision aid only: this overlay does not change compliance math or baseline ranking.</p>';
    }

    html += '</div>';
    html += '</div>';
    return html;
  }

  function sortTierForDisplay(r) {
    if (!r || !r.isViable) return 2;
    if (r.warnings && r.warnings.length > 0) return 1;
    return 0;
  }

  function sortResultsForDisplay(list, sortBy) {
    var arr = Array.isArray(list) ? list.slice() : [];
    var mode = sortBy || 'totalCost';

    function cmpPrimary(a, b) {
      var ta = sortTierForDisplay(a);
      var tb = sortTierForDisplay(b);
      if (ta !== tb) return ta - tb;

      switch (mode) {
        case 'costPerCF':
          var aCpf = (Number.isFinite(a.costPerCf) && a.costPerCf > 0) ? a.costPerCf : Infinity;
          var bCpf = (Number.isFinite(b.costPerCf) && b.costPerCf > 0) ? b.costPerCf : Infinity;
          return aCpf - bCpf;
        case 'areaRequired':
          var aArea = Number.isFinite(a.grossAreaNeeded) ? a.grossAreaNeeded : Infinity;
          var bArea = Number.isFinite(b.grossAreaNeeded) ? b.grossAreaNeeded : Infinity;
          return aArea - bArea;
        case 'bmpId':
          return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
        case 'totalCost':
        default:
          var aCost = Number.isFinite(a.costDesigned) ? a.costDesigned : Infinity;
          var bCost = Number.isFinite(b.costDesigned) ? b.costDesigned : Infinity;
          return aCost - bCost;
      }
    }

    arr.sort(cmpPrimary);
    return arr;
  }

  function findRowById(rows, id) {
    var s = String(id);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === s) return rows[i];
    }
    return null;
  }

  function rowMeetsBothEngine(r, targets) {
    if (!r || !r.isViable) return false;
    var R = targets.retentionNeeded ? (Number(targets.retentionCF) || 0) : 0;
    var D = targets.detentionNeeded ? (Number(targets.detentionCF) || 0) : 0;
    var meetsRet = R === 0 || Math.abs((r.retCredit || 0) - R) <= R * 0.01;
    var meetsDet = D === 0 || Math.abs((r.detCredit || 0) - D) <= D * 0.01;
    var need = r.grossAreaNeeded || 0;
    var designed = r.grossDesignedArea || 0;
    var hasArea = designed > 0 && designed >= need;
    return meetsRet && meetsDet && hasArea;
  }

  function cheapestViableSingle(rows, poolFilterFn) {
    var best = null;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r.isViable) continue;
      if (poolFilterFn && !poolFilterFn(r)) continue;
      var c = Number.isFinite(r.costDesigned) ? r.costDesigned : Infinity;
      var bc = best && Number.isFinite(best.costDesigned) ? best.costDesigned : Infinity;
      if (!best || c < bc) best = r;
    }
    return best;
  }

  function comboStillValid(combo, rows) {
    if (!combo || !combo.members || combo.members.length < 2) return null;
    var a = findRowById(rows, combo.members[0].id);
    var b = findRowById(rows, combo.members[1].id);
    if (!a || !b || !a.isViable || !b.isViable) return null;
    return combo;
  }

  function firstRoofOnlyCombo(comboCandidates, rows) {
    if (!Array.isArray(comboCandidates)) return null;
    for (var i = 0; i < comboCandidates.length; i++) {
      var c = comboCandidates[i];
      if (!c.members || c.members.length < 2) continue;
      var a = findRowById(rows, c.members[0].id);
      var b = findRowById(rows, c.members[1].id);
      if (!a || !b || !a.isViable || !b.isViable) continue;
      if (isRoofViewBmpId(a.id) && isRoofViewBmpId(b.id)) return c;
    }
    return null;
  }

  var RECOMMENDATION_BASIS_LABELS = {
    cheapest_package: 'Lowest-cost package (single or two-BMP)',
    cheapest_single: 'Lowest-cost viable single system',
    full_compliance_single: 'Single system — full retention + detention compliance',
    roof_focused: 'Roof / on-structure only'
  };

  /** Planning mode: cap ranked table rows; engineering shows full list. */
  var PLANNING_RANKED_TABLE_ROW_CAP = 4;

  function recommendationBasisLabel(basis) {
    return RECOMMENDATION_BASIS_LABELS[basis] || String(basis || '');
  }

  /**
   * Chooses hero recommendation from engine output + display rows (after roof-load screening).
   * @returns {{ kind: 'single'|'combo'|'none', single: object|null, combo: object|null, basis: string, emptyMessage: string|null }}
   */
  function pickRecommended(project, engineOutput, sortedResults, basis) {
    var sw = engineOutput.stormwater || {};
    var targets = project.targets || {};
    var recommended = sw.recommended;
    var recommendedCombo = sw.recommendedCombo;
    var comboCandidates = sw.comboCandidates || [];
    var rows = sortedResults;

    var pick = {
      kind: 'none',
      single: null,
      combo: null,
      basis: basis,
      emptyMessage: null
    };

    function roofFilter(r) {
      return isRoofViewBmpId(r.id);
    }

    if (basis === 'roof_focused') {
      var roofViable = cheapestViableSingle(rows, roofFilter);
      if (roofViable) {
        pick.kind = 'single';
        pick.single = roofViable;
        return pick;
      }
      var roofCombo = firstRoofOnlyCombo(comboCandidates, rows);
      if (roofCombo) {
        pick.kind = 'combo';
        pick.combo = roofCombo;
        return pick;
      }
      pick.emptyMessage = 'No roof or on-structure BMP is viable for this scenario. Turn off “Roof / on-structure only”, relax constraints, or use “Lowest-cost package” to allow ground-based combinations.';
      return pick;
    }

    if (basis === 'full_compliance_single') {
      var compliant = [];
      for (var i = 0; i < rows.length; i++) {
        if (rowMeetsBothEngine(rows[i], targets)) compliant.push(rows[i]);
      }
      compliant.sort(function (a, b) {
        var ca = Number.isFinite(a.costDesigned) ? a.costDesigned : Infinity;
        var cb = Number.isFinite(b.costDesigned) ? b.costDesigned : Infinity;
        return ca - cb;
      });
      if (compliant.length > 0) {
        pick.kind = 'single';
        pick.single = compliant[0];
        return pick;
      }
      pick.emptyMessage = 'No single BMP meets full retention and detention within tolerance. Try “Lowest-cost package” for a two-system combination, or adjust targets and areas.';
      return pick;
    }

    if (basis === 'cheapest_single') {
      var best = cheapestViableSingle(rows, null);
      if (best) {
        pick.kind = 'single';
        pick.single = best;
        return pick;
      }
      pick.emptyMessage = 'No viable BMPs for the current inputs.';
      return pick;
    }

    // cheapest_package
    if (recommended) {
      var rowRec = findRowById(rows, recommended.id);
      if (rowRec && rowRec.isViable && rowMeetsBothEngine(rowRec, targets)) {
        pick.kind = 'single';
        pick.single = rowRec;
        return pick;
      }
    }
    var validCombo = comboStillValid(recommendedCombo, rows);
    if (validCombo) {
      pick.kind = 'combo';
      pick.combo = validCombo;
      return pick;
    }
    var fallback = cheapestViableSingle(rows, null);
    if (fallback) {
      pick.kind = 'single';
      pick.single = fallback;
      return pick;
    }
    pick.emptyMessage = 'No viable BMPs for the current inputs.';
    return pick;
  }

  function formatPickOneLine(pick, sortedResults, regProfileId) {
    if (!pick || pick.kind === 'none') {
      return pick && pick.emptyMessage ? pick.emptyMessage : 'None';
    }
    if (pick.kind === 'combo' && pick.combo && pick.combo.members) {
      var ids = pick.combo.members.map(function (m) { return m.name || m.id; }).join(' + ');
      var t = 0;
      var has = false;
      for (var i = 0; i < pick.combo.members.length; i++) {
        var row = findRowById(sortedResults || [], pick.combo.members[i].id);
        if (!row && pick.combo.members[i]) {
          row = { id: pick.combo.members[i].id, name: pick.combo.members[i].name, grossDesignedArea: pick.combo.members[i].grossDesignedArea, costDesigned: pick.combo.members[i].costDesigned };
        }
        if (row) {
          var pr = resolvePricing(row, regProfileId);
          var d = displayTotalForOpportunity(row, pr);
          if (Number.isFinite(d)) {
            t += d;
            has = true;
          }
        }
      }
      var costPart = has ? $(t) : $(pick.combo.costDesigned);
      return 'Package: ' + ids + ' — combined indicative total ' + costPart;
    }
    if (pick.single) return pick.single.name + ' — ' + $(displayTotalForOpportunity(pick.single, resolvePricing(pick.single, regProfileId)));
    return '—';
  }

  function comboSellTotal(pick, sortedResults, regProfileId) {
    if (!pick || pick.kind !== 'combo' || !pick.combo || !pick.combo.members) return null;
    var t = 0;
    var ok = false;
    for (var i = 0; i < pick.combo.members.length; i++) {
      var row = findRowById(sortedResults, pick.combo.members[i].id);
      if (!row) continue;
      var pr = resolvePricing(row, regProfileId);
      var d = displayTotalForOpportunity(row, pr);
      if (Number.isFinite(d)) {
        t += d;
        ok = true;
      }
    }
    return ok ? t : (Number.isFinite(pick.combo.costDesigned) ? pick.combo.costDesigned : null);
  }

  function bmpStatusMeta(r) {
    if (!r.isViable) return { label: 'Blocked', cls: 'bmp-status-blocked' };
    if (r.warnings && r.warnings.length) return { label: 'Viable (warnings)', cls: 'bmp-status-warn' };
    return { label: 'Viable', cls: 'bmp-status-ok' };
  }

  /** Ranked stormwater table — full list in engineering; top rows in planning. */
  function renderRankedBmpTable(sortedResults, targets, regProfileId, mode, layout, pick) {
    var isPlanning = (mode !== 'engineering');
    var isCompact = isPlanning;
    var cappedPlanning = isPlanning && sortedResults.length > PLANNING_RANKED_TABLE_ROW_CAP;
    var rowsForTable = isPlanning
      ? sortedResults.slice(0, PLANNING_RANKED_TABLE_ROW_CAP)
      : sortedResults;

    var innerHtml = '';
    innerHtml += '<h3 class="ps-heading">' + (isPlanning ? 'All systems ranked' : 'All stormwater BMPs (ranked)') + '</h3>';
    if (cappedPlanning) {
      innerHtml += '<p class="ps-table-note ps-table-note-planning-cap">Showing the top ' + PLANNING_RANKED_TABLE_ROW_CAP + ' rows for the current sort. Switch to <strong>Engineering</strong> mode for the full ranked table.</p>';
    }
    innerHtml += '<p class="ps-table-note">Viable options appear first, then systems with warnings, then blocked rows. Estimates may still show for blocked systems when a notional layout was evaluated before rule screens.</p>';
    innerHtml += '<div class="results-table-scroll">';
    innerHtml += '<table class="results-table">';
    innerHtml += '<thead><tr>';
    innerHtml += '<th class="rank-cell">#</th><th>Status</th><th>System</th>';
    innerHtml += '<th>Area (SF)</th><th>Ret.</th><th>Det.</th><th class="col-num">Est. total</th>';
    if (!isCompact) {
      innerHtml += '<th class="col-num">$/SF direct</th><th class="col-num">$/SF sell</th><th>Role</th>';
    }
    innerHtml += '<th>Notes</th>';
    innerHtml += '</tr></thead><tbody>';

    var pickIds = {};
    if (pick && pick.kind === 'single' && pick.single) pickIds[String(pick.single.id)] = true;
    if (pick && pick.kind === 'combo' && pick.combo && pick.combo.members) {
      for (var pi = 0; pi < pick.combo.members.length; pi++) {
        pickIds[String(pick.combo.members[pi].id)] = true;
      }
    }

    for (var i = 0; i < rowsForTable.length; i++) {
      var r = rowsForTable[i];
      var st = bmpStatusMeta(r);
      var rowCls = (!r.isViable ? 'blocked' : '') + (pickIds[String(r.id)] ? ' ps-row-pick' : '');
      var pr = resolvePricing(r, regProfileId);
      var retSt = targets.retentionNeeded ? pct(r.retPct) : '—';
      var detSt = targets.detentionNeeded ? pct(r.detPct) : '—';
      var costStr = Number.isFinite(r.costDesigned) ? $(r.costDesigned) : '—';
      var noteParts = [];
      if (!r.isViable && r.blockers && r.blockers.length) {
        for (var bi = 0; bi < r.blockers.length; bi++) {
          noteParts.push('Blocked: ' + r.blockers[bi]);
        }
      }
      if (r.warnings && r.warnings.length) {
        for (var wi = 0; wi < r.warnings.length; wi++) {
          noteParts.push(r.warnings[wi]);
        }
      }

      var notesCellHtml;
      if (noteParts.length === 0) {
        notesCellHtml = '—';
      } else if (noteParts.length === 1) {
        notesCellHtml = escHtml(noteParts[0]);
      } else {
        notesCellHtml = '<ul class="note-bullets">';
        for (var ni = 0; ni < noteParts.length; ni++) {
          notesCellHtml += '<li>' + escHtml(noteParts[ni]) + '</li>';
        }
        notesCellHtml += '</ul>';
      }

      innerHtml += '<tr class="' + escHtml(rowCls.trim()) + '">';
      innerHtml += '<td class="rank-cell">' + (i + 1) + '</td>';
      innerHtml += '<td><span class="' + escHtml(st.cls) + '">' + escHtml(st.label) + '</span></td>';
      if (isCompact) {
        innerHtml += '<td>' + escHtml(r.name) + '</td>';
      } else {
        innerHtml += '<td>' + renderSystemCell(r, pr) + '</td>';
      }
      innerHtml += '<td>' + num(r.grossDesignedArea) + '</td>';
      innerHtml += '<td>' + retSt + '</td>';
      innerHtml += '<td>' + detSt + '</td>';
      innerHtml += '<td class="col-num">' + costStr + '</td>';
      if (!isCompact) {
        var directStr = '—';
        var sellStr = '—';
        if (pr && pr.directPerSf != null) directStr = '$' + pr.directPerSf.toFixed(2);
        if (pr && pr.sellPerSf != null) sellStr = '$' + pr.sellPerSf.toFixed(2);
        if (!pr) {
          directStr = '<span class="ps-unmapped">not mapped</span>';
          sellStr = '<span class="ps-unmapped">not mapped</span>';
        }
        innerHtml += '<td class="col-num">' + directStr + '</td>';
        innerHtml += '<td class="col-num">' + sellStr + '</td>';
        innerHtml += '<td>' + escHtml(formatSystemRoleNote(r, targets)) + '</td>';
      }
      innerHtml += '<td class="note-cell bmp-notes-cell">' + notesCellHtml + '</td>';
      innerHtml += '</tr>';
    }

    innerHtml += '</tbody></table></div>';

    var html = '<div class="ps-section ps-ranked-table-section">';
    if (isPlanning) {
      html += '<details class="ps-ranked-table-details">';
      html += '<summary class="ps-ranked-table-toggle">Show ranked comparison table</summary>';
      html += '<div class="ps-ranked-table-inner">' + innerHtml + '</div>';
      html += '</details>';
    } else {
      html += innerHtml;
    }
    html += '</div>';
    return html;
  }

  function shouldApplyRoofLoadLimit(project) {
    var constraints = (project && project.constraints) || {};
    var maxLoad = Number(constraints.maxRoofLoadPSF);
    return !!constraints.hasStructuralLoadLimit && Number.isFinite(maxLoad) && maxLoad > 0;
  }

  function applyRoofLoadScreening(project, results, regulationProfileId) {
    var list = Array.isArray(results) ? results : [];
    if (!shouldApplyRoofLoadLimit(project)) {
      return { results: list, warnings: [] };
    }

    var maxLoad = Number(project.constraints.maxRoofLoadPSF);
    var warnings = [];
    var screened = list.map(function (r) {
      var out = Object.assign({}, r);
      var pricing = resolvePricing(out, regulationProfileId);
      if (!pricing || !pricing.roofProfile || !Number.isFinite(pricing.roofProfile.satWeightPSF)) {
        return out;
      }

      var satWeight = pricing.roofProfile.satWeightPSF;
      if (satWeight <= maxLoad) return out;

      var note = 'Blocked by roof load limit: ' + out.name + ' saturated weight ' +
        satWeight.toFixed(1) + ' PSF exceeds project limit ' + maxLoad.toFixed(1) + ' PSF.';
      out.isViable = false;
      out.blockers = (out.blockers || []).concat([note]);
      out.warnings = (out.warnings || []).concat([note]);
      out.roofLoadScreen = {
        maxRoofLoadPSF: maxLoad,
        satWeightPSF: satWeight,
        roofProfileId: pricing.roofProfile.profileId
      };
      warnings.push(note);
      return out;
    });

    return { results: screened, warnings: warnings };
  }


  // ── BMP → pricing/profile mapping ──────────────────────────────────
  //
  // Maps engine BMP ids to:
  //   roofProfileId  — for roof-profile-calc (weight, ret/det, layer cost)
  //   costItemId     — for pricing-calc (parametric/turnkey items)
  //   pricingMode    — how this BMP is priced
  //
  // All 16 BMPs are now mapped. Roof-based BMPs use roof-profile-calc
  // (assembly). Ground-based use parametric pricing. PV/accessories
  // use turnkey.

  var BMP_PRICING_MAP = {
    // Ground BMPs — parametric
    1:    { costItemId: 'bmp-bioretention',        roofProfileId: null,         pricingMode: 'parametric' },
    2:    { costItemId: 'bmp-underground-cells',    roofProfileId: null,         pricingMode: 'parametric' },
    3:    { costItemId: 'bmp-permeable-pavers',     roofProfileId: null,         pricingMode: 'parametric' },
    4:    { costItemId: 'bmp-below-grade-tank',     roofProfileId: null,         pricingMode: 'parametric' },
    5:    { costItemId: 'bmp-below-grade-tank-usable', roofProfileId: null,      pricingMode: 'parametric' },
    6:    { costItemId: 'bmp-on-structure-tank',    roofProfileId: null,         pricingMode: 'parametric' },
    7:    { costItemId: 'bmp-blue-roof',            roofProfileId: null,         pricingMode: 'parametric' },
    // Roof BMPs — assembly (roof profiles)
    8:    { costItemId: null,                       roofProfileId: 'trad-gr-6',  pricingMode: 'assembly'   },
    9:    { costItemId: null,                       roofProfileId: 'sponge-42',  pricingMode: 'assembly'   },
    10:   { costItemId: null,                       roofProfileId: 'pr-veg-412', pricingMode: 'assembly'   },
    '10B':{ costItemId: null,                       roofProfileId: 'pr-veg-414', pricingMode: 'assembly'   },
    11:   { costItemId: null,                       roofProfileId: 'pr-pav-p12', pricingMode: 'assembly'   },
    '11B':{ costItemId: null,                       roofProfileId: 'pr-pav-p14', pricingMode: 'assembly'   },
    // PV / fall protection — turnkey
    12:   { costItemId: 'pv-overeasy-xm3',         roofProfileId: null,         pricingMode: 'turnkey'    },
    15:   { costItemId: 'pv-contec-greenlite',      roofProfileId: null,         pricingMode: 'turnkey'    },
    16:   { costItemId: 'fp-diadem-anchor',         roofProfileId: null,         pricingMode: 'turnkey'    }
  };

  // ── Build markup structure from project settings ─────────────────
  //
  // Reads settings.markup from the project state and builds a
  // markup structure compatible with applyMarkup().
  // Returns { tiers: [...], factor: number }

  function buildMarkupFromSettings() {
    var project = V3State.getRef();
    var mu = (project.settings && project.settings.markup) || {};

    var instPct = (mu.installerPct != null) ? mu.installerPct : 0.25;
    var wpEnabled = !!mu.waterprooferEnabled;
    var wpPct   = wpEnabled ? ((mu.waterprooferPct != null) ? mu.waterprooferPct : 0.10) : 0;
    var gcPct   = (mu.gcPct != null) ? mu.gcPct : 0.10;

    var tiers = [
      { label: 'Installer',       key: 'installer',     markupPct: instPct, editable: true }
    ];

    if (wpEnabled) {
      tiers.push(
        { label: 'Waterproofer', key: 'waterproofer',  markupPct: wpPct,   editable: true }
      );
    }

    tiers.push(
      { label: 'GC OH&P',       key: 'gc-ohp',        markupPct: gcPct,   editable: true }
    );

    var factor = 1;
    tiers.forEach(function (t) { factor *= (1 + t.markupPct); });

    return {
      id:          wpEnabled ? 'project-3tier' : 'project-2tier',
      name:        wpEnabled ? 'Installer → Waterproofer → GC' : 'Installer → GC',
      tiers:       tiers,
      factor:      factor
    };
  }


  // ── Roof: sum COST_ITEMS assembly rows (delivered + install labor) ─
  //
  // Roof profile calculator still uses roof-layers.js costPSF for stormwater
  // comparison consistency; pricing for estimates uses cost-items assembly
  // takeoffs when every profile layer maps to an active assembly cost item.

  function findRoofLayerCostItem(layerId) {
    var items = (typeof window !== 'undefined' && window.COST_ITEMS) ? window.COST_ITEMS : [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.active || it.pricingMode !== 'assembly') continue;
      var sr = it.systemRef;
      if (sr && sr.type === 'roof-layer' && String(sr.refId) === String(layerId)) {
        return it;
      }
    }
    return null;
  }

  function aggregateRoofAssemblyFromCostItems(profileCalc, areaSF) {
    if (!profileCalc || !profileCalc.valid || !profileCalc.layers ||
        typeof V3PricingCalc === 'undefined' || !areaSF || areaSF <= 0) {
      return null;
    }
    var furnishedSum = 0;
    var installSum = 0;
    var layerLines = [];
    for (var i = 0; i < profileCalc.layers.length; i++) {
      var L = profileCalc.layers[i];
      var lid = L.layerId;
      var item = findRoofLayerCostItem(lid);
      if (!item) return null;

      var qty = { area: areaSF };
      if (item.depthRef != null && item.depthRef > 0 && L.depthIn > 0) {
        qty.depth = L.depthIn;
      }

      var pr = V3PricingCalc.calculate(item.id, qty, {
        markupId: null,
        adjustments: null
      });
      if (!pr || !pr.valid) return null;

      furnishedSum += pr.furnished.subtotal;
      installSum += pr.install.subtotal;
      layerLines.push({
        layerId:   lid,
        layerName: L.layerName || lid,
        allIn:     pr.directCost.subtotal
      });
    }

    var directTotal = furnishedSum + installSum;
    return {
      allInTotal:     directTotal,
      allInPerSf:     directTotal / areaSF,
      furnishedTotal: furnishedSum,
      installTotal:   installSum,
      directTotal:    directTotal,
      furnishedPerSf: furnishedSum / areaSF,
      installPerSf:   installSum / areaSF,
      directPerSf:    directTotal / areaSF,
      layerLines:     layerLines
    };
  }


  // ── Pricing resolution ────────────────────────────────────────────
  //
  // For a given engine result, resolve pricing using the appropriate
  // calculator(s). Returns a pricing info object or null if unmapped.

  function resolvePricing(engineResult, regulationProfileId) {
    var bmpId = engineResult.id;
    var mapping = BMP_PRICING_MAP[bmpId] || BMP_PRICING_MAP[String(bmpId)] || null;
    if (!mapping) return null;

    var area = engineResult.grossDesignedArea || 0;
    if (area <= 0) return null;

    // Build markup from project settings
    var projectMarkup = buildMarkupFromSettings();

    var info = {
      mapped:                 true,
      pricingMode:            mapping.pricingMode,
      roofProfile:            null,
      roofAssemblyAggregate:  null,
      pricingResult:          null,
      directPerSf:            null,
      sellPerSf:              null,
      directTotal:            null,
      sellTotal:              null,
      markupDetail:           null,
      backupLines:            []
    };

    // ── Assembly mode (roof profiles) ──────────────────────────────
    if (mapping.roofProfileId && typeof V3RoofProfileCalc !== 'undefined') {
      var regId = regulationProfileId || 'general';
      var profileCalc = V3RoofProfileCalc.calculate(mapping.roofProfileId, area, regId);

      if (profileCalc && profileCalc.valid) {
        var roofAgg = aggregateRoofAssemblyFromCostItems(profileCalc, area);

        info.roofProfile = {
          profileId:    mapping.roofProfileId,
          name:         profileCalc.profile.name,
          thicknessIn:  profileCalc.totals.thicknessIn,
          dryWeightPSF: profileCalc.totals.dryWeightPSF,
          satWeightPSF: profileCalc.totals.satWeightPSF,
          retCfPerSf:   profileCalc.totals.retCfPerSf,
          detCfPerSf:   profileCalc.totals.detCfPerSf,
          costPerSf:    profileCalc.totals.costPerSf,
          allInPerSf:   roofAgg ? roofAgg.allInPerSf : null
        };

        var directPerSf;
        var directTotalVal;
        if (roofAgg) {
          info.roofAssemblyAggregate = roofAgg;
          directPerSf = roofAgg.directPerSf;
          directTotalVal = roofAgg.directTotal;
        } else {
          directPerSf = profileCalc.totals.costPerSf;
          directTotalVal = directPerSf * area;
        }

        info.directPerSf = directPerSf;
        info.directTotal = directTotalVal;

        var markupFactor = projectMarkup.factor;
        info.sellPerSf = directPerSf * markupFactor;
        info.sellTotal = info.sellPerSf * area;

        var tierDetail = [];
        var running = info.directTotal;
        for (var ti = 0; ti < projectMarkup.tiers.length; ti++) {
          var t = projectMarkup.tiers[ti];
          var tierOut = running * (1 + t.markupPct);
          tierDetail.push({
            label:        t.label,
            key:          t.key,
            markupPct:    t.markupPct,
            inputAmount:  running,
            markupAmount: running * t.markupPct,
            outputAmount: tierOut
          });
          running = tierOut;
        }
        info.markupDetail = {
          structureName: projectMarkup.name,
          tiers:         tierDetail,
          factor:        markupFactor
        };

        info.backupLines = [
          '── ' + profileCalc.profile.name + ' ──',
          'Profile: ' + profileCalc.profile.name,
          'Area: ' + num(area) + ' SF',
          'Thickness: ' + profileCalc.totals.thicknessIn.toFixed(1) + '"',
          'Dry weight: ' + profileCalc.totals.dryWeightPSF.toFixed(1) + ' PSF',
          'Sat weight: ' + profileCalc.totals.satWeightPSF.toFixed(1) + ' PSF',
          'Retention: ' + profileCalc.totals.retCfPerSf.toFixed(4) + ' CF/SF',
          'Detention: ' + profileCalc.totals.detCfPerSf.toFixed(4) + ' CF/SF',
          ''
        ];

        if (roofAgg) {
          info.backupLines.push('PRICING (cost-items — one all-in line per layer: delivered, hoisted & installed):');
          info.backupLines.push('  Subtotal before markups: $' + num(roofAgg.allInTotal));
          info.backupLines.push('');
          roofAgg.layerLines.forEach(function (row) {
            info.backupLines.push('  ' + row.layerName + ': $' + num(row.allIn) + ' (all-in)');
          });
          info.backupLines.push('');
          info.backupLines.push('SUBTOTAL BEFORE MARKUP: $' + directPerSf.toFixed(2) + '/SF × ' +
            num(area) + ' SF = $' + num(info.directTotal));
        } else {
          info.backupLines.push('LAYER $/SF (roof-layers.js — fallback; map all layers to cost-items for all-in pricing):');
          (profileCalc.layers || []).forEach(function (l) {
            info.backupLines.push('  ' + (l.layerName || l.layerId) + ' (' + l.depthIn.toFixed(1) + '"): $' +
              l.costPerSf.toFixed(2) + '/SF');
          });
          info.backupLines.push('');
          info.backupLines.push('SUBTOTAL BEFORE MARKUP: $' + directPerSf.toFixed(2) + '/SF × ' +
            num(area) + ' SF = $' + num(info.directTotal));
        }

        info.backupLines.push('MARKUP (' + projectMarkup.name + ', ×' + markupFactor.toFixed(4) + '):');
        for (var tl = 0; tl < tierDetail.length; tl++) {
          var td = tierDetail[tl];
          info.backupLines.push('  ' + td.label + ' (' + (td.markupPct * 100).toFixed(0) + '%): $' +
            num(td.inputAmount) + ' → $' + num(td.outputAmount));
        }
        info.backupLines.push('SELL PRICE: $' +
          info.sellPerSf.toFixed(2) + '/SF = $' + num(info.sellTotal));
      }
    }

    // ── Parametric / Turnkey mode (pricing calc) ───────────────────
    if (mapping.costItemId && typeof V3PricingCalc !== 'undefined') {
      var quantity = {};
      if (mapping.pricingMode === 'turnkey' && !area) {
        quantity.count = 1;
      } else {
        quantity.area = area;
      }

      // For turnkey count-based items, derive count from area using
      // the BMP's sfPerUnit spec if available.
      if (mapping.pricingMode === 'turnkey') {
        var costItem = V3PricingCalc.getItem(mapping.costItemId);
        if (costItem && costItem.unitMeasure === 'each') {
          // Look up sfPerUnit from bmp-options specs
          var bmpDef = BMP_OPTIONS_DEFAULT.find(function (b) {
            return b.id === bmpId || String(b.id) === String(bmpId);
          });
          var sfPerUnit = (bmpDef && bmpDef.specs && bmpDef.specs.sfPerUnit)
            ? bmpDef.specs.sfPerUnit : null;

          if (sfPerUnit && area > 0) {
            quantity = { count: Math.ceil(area / sfPerUnit) };
          } else if (bmpDef && bmpDef.specs && bmpDef.specs.lfPerAnchor) {
            // Fall protection: estimate from perimeter. Use area as rough proxy.
            var perimeterEst = Math.sqrt(area) * 4;
            quantity = { count: Math.max(4, Math.ceil(perimeterEst / bmpDef.specs.lfPerAnchor)) };
          } else {
            quantity = { count: 1 };
          }
        }
      }

      // Pass markupId: null to skip auto-selected markup from the pricing
      // engine. We apply the project markup chain from settings instead.
      var pResult = V3PricingCalc.calculate(mapping.costItemId, quantity, {
        adjustments: {},
        markupId: null
      });

      if (pResult && pResult.valid) {
        info.pricingResult = pResult;

        // Direct cost comes from the pricing calc (no markup applied)
        var pDirectTotal = pResult.directCost.subtotal;
        var pDirectPerSf = pResult.directCost.perSf;
        info.directPerSf = pDirectPerSf;
        info.directTotal = pDirectTotal;

        // Apply project markup chain (compounding tiers)
        var pRunning = pDirectTotal;
        var pTierDetail = [];
        for (var pi = 0; pi < projectMarkup.tiers.length; pi++) {
          var pt = projectMarkup.tiers[pi];
          var ptOut = pRunning * (1 + pt.markupPct);
          pTierDetail.push({
            label:        pt.label,
            key:          pt.key,
            markupPct:    pt.markupPct,
            inputAmount:  pRunning,
            markupAmount: pRunning * pt.markupPct,
            outputAmount: ptOut
          });
          pRunning = ptOut;
        }
        info.sellTotal   = pRunning;
        info.sellPerSf   = area > 0 ? pRunning / area : null;

        info.markupDetail = {
          structureName: projectMarkup.name,
          tiers:         pTierDetail,
          factor:        projectMarkup.factor
        };

        // Rebuild backupLines to reflect project markup instead of engine markup
        info.backupLines = pResult.backupLines.slice(0);
        // Append project markup info
        info.backupLines.push('');
        info.backupLines.push('PROJECT MARKUP (' + projectMarkup.name + ', ×' + projectMarkup.factor.toFixed(4) + '):');
        for (var pl = 0; pl < pTierDetail.length; pl++) {
          var pd = pTierDetail[pl];
          info.backupLines.push('  ' + pd.label + ' (' + (pd.markupPct * 100).toFixed(0) + '%): $' +
            num(pd.inputAmount) + ' → $' + num(pd.outputAmount));
        }
        info.backupLines.push('SELL PRICE: $' + num(info.sellTotal) +
          (info.sellPerSf != null ? ' ($' + info.sellPerSf.toFixed(2) + '/SF)' : ''));
      }
    }

    return info;
  }

  function revealResultsPanel(panel) {
    if (!panel) return;
    panel.hidden = false;
    panel.style.removeProperty('display');
  }

  // ── Run analysis ───────────────────────────────────────────────────

  function runAnalysis() {
    const panel = document.getElementById('section-results');
    const content = document.getElementById('results-content');
    if (!panel || !content) return false;

    // Step 1: Get current project from state
    const project = V3State.get();

    // Step 2: Validate
    const validation = validateV3Project(project);

    if (!validation.valid) {
      content.innerHTML = renderErrors(validation.errors, validation.warnings);
      if (global.V3Flow && typeof global.V3Flow.showStep === 'function') {
        global.V3Flow.showStep('results', { replaceHash: true });
      } else {
        revealResultsPanel(panel);
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return false;
    }

    // Step 3: Adapt to engine shape
    const adapted = adaptV3ToEngine(project);
    if (!adapted.project) {
      content.innerHTML = renderErrors(
        ['Adapter returned null project — check schema.'],
        adapted.validation.warnings
      );
      if (global.V3Flow && typeof global.V3Flow.showStep === 'function') {
        global.V3Flow.showStep('results', { replaceHash: true });
      } else {
        revealResultsPanel(panel);
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return false;
    }

    // Step 4: Assemble database and run engine
    const database = getDatabase();
    let engineOutput;
    try {
      engineOutput = runModel(adapted.project, database);
    } catch (err) {
      content.innerHTML = renderErrors(
        ['Engine error: ' + (err.message || String(err))],
        []
      );
      if (global.V3Flow && typeof global.V3Flow.showStep === 'function') {
        global.V3Flow.showStep('results', { replaceHash: true });
      } else {
        revealResultsPanel(panel);
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return false;
    }

    // Step 5: Classify strategy
    const sw = engineOutput.stormwater || {};
    const results = sw.results || [];
    const sortBy = (project.settings && project.settings.sortResultsBy) || 'totalCost';
    const regProfileId = (engineOutput.meta && engineOutput.meta.regulationProfileId) || 'general';
    const roofLoadScreen = applyRoofLoadScreening(project, results, regProfileId);
    const displayResults = roofLoadScreen.results;
    const sortedResults = sortResultsForDisplay(displayResults, sortBy);
    const viable = sortedResults.filter(function (r) { return r.isViable; });
    const strategy = V3Strategy.classify(project, viable);
    try {
      var recBasis = (project.settings && project.settings.recommendationBasis) || 'cheapest_package';
      var recPick = pickRecommended(project, engineOutput, sortedResults, recBasis);
      var suggestedFamily = 'green-roof';
      if (recPick.kind === 'single' && recPick.single) {
        suggestedFamily = inferResourceFamilyFromBmpId(recPick.single.id);
      } else if (recPick.kind === 'combo' && recPick.combo && recPick.combo.members && recPick.combo.members[0]) {
        suggestedFamily = inferResourceFamilyFromBmpId(recPick.combo.members[0].id);
      } else if (viable.length > 0) {
        suggestedFamily = inferResourceFamilyFromBmpId(viable[0].id);
      }
      localStorage.setItem('v3ResourcesSuggestedFamily', suggestedFamily);
    } catch (e) {
      // non-blocking: storage may be unavailable
    }

    // Step 6: Collect warnings
    const warnings = [
      ...(adapted.validation.warnings || []),
      ...(sw.warnings || []),
      ...(roofLoadScreen.warnings || [])
    ];

    // Step 7: Resolve display mode
    var mode = (project.settings && project.settings.mode) || 'planning';

    // Step 8: Render project summary (mode-aware)
    content.innerHTML = renderProjectSummary(project, engineOutput, strategy, sortedResults, viable, warnings, mode, sortBy);
    document.dispatchEvent(new CustomEvent('v3:analysis-complete', {
      detail: { viableCount: viable.length, resultCount: sortedResults.length }
    }));
    if (!global.V3Flow || typeof global.V3Flow.showStep !== 'function') {
      revealResultsPanel(panel);
    }
    return true;
  }


  // ═══════════════════════════════════════════════════════════════════
  // SECTION RENDERERS
  // ═══════════════════════════════════════════════════════════════════


  // ── Section 1: Project Summary (core) + Area Breakdown (split for reordering) ──

  function renderSectionProjectSummaryCore(project, meta, mode) {
    var isPlanning     = (mode !== 'engineering');
    var site        = project.site || {};
    var areas       = site.areas || {};
    var constraints = project.constraints || {};
    var targets     = project.targets || {};

    var cityName = (meta.cityKey && CITY_DATA[meta.cityKey])
                 ? CITY_DATA[meta.cityKey].name
                 : (meta.cityKey || 'Not selected');

    var html = '<div class="ps-section">';
    html += '<h3 class="ps-heading">Project Summary</h3>';

    // Row 1: City + Profile
    html += '<div class="ps-grid">';
    html += psItem('City', cityName);
    html += psItem('Regulation', meta.regulationProfileId || 'general');
    html += '</div>';

    // Row 2: Targets
    html += '<div class="ps-grid">';
    html += psItem('Retention',
      targets.retentionNeeded ? formatTargetVolumeSummary(targets.retentionCF) : 'Not required');
    html += psItem('Detention',
      targets.detentionNeeded ? formatTargetVolumeSummary(targets.detentionCF) : 'Not required');
    html += '</div>';
    html += renderSelectedSiteTypeGraphic(project);

    // Row 3: Key area totals (both modes)
    var groundArea = (areas.perviousLandscapingUsable || 0)
                   + (areas.imperviousVehicularPavement || 0)
                   + (areas.imperviousPedestrianPavement || 0);
    var roofArea   = (areas.flatDeckOnStructureArea || 0)
                   + (areas.slopedRoofArea || 0)
                   + (areas.paversOnStructureArea || 0);

    html += '<div class="ps-grid ps-grid-3">';
    html += psItem('Ground Area', num(groundArea) + ' SF');
    html += psItem('Roof / Structure', num(roofArea) + ' SF');

    var soilLabel = site.soilType
      ? site.soilType.charAt(0).toUpperCase() + site.soilType.slice(1)
      : 'Not specified';
    html += psItem('Soil', soilLabel);
    html += '</div>';

    // Constraints
    var activeConstraints = [];
    if (constraints.hasUndergroundUtilities)  activeConstraints.push('Underground utilities');
    if (constraints.hasHighWaterTable)        activeConstraints.push('High water table');
    if (constraints.hasContaminatedSoil)      activeConstraints.push('Contaminated soil');
    if (constraints.hasSiteGradingConstraint) activeConstraints.push('Site grading constraint');

    if (activeConstraints.length > 0) {
      html += '<div class="ps-constraints">';
      html += '<span class="ps-constraints-label">Active Constraints:</span> ';
      html += escHtml(activeConstraints.join(', '));
      html += '</div>';
    }

    // Engineering: show roof load whenever present
    if (constraints.hasStructuralLoadLimit && constraints.maxRoofLoadPSF != null && Number(constraints.maxRoofLoadPSF) > 0) {
      html += '<div class="ps-constraints">';
      html += '<span class="ps-constraints-label">Max saturated roof load:</span> ';
      html += num(constraints.maxRoofLoadPSF) + ' PSF';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderSectionAreaBreakdown(project, mode) {
    var isPlanning = (mode !== 'engineering');
    if (isPlanning) return '';

    var areas = (project.site && project.site.areas) || {};

    var html = '<div class="ps-section ps-section-area-breakdown">';
    html += '<div class="ps-detail-block">';
    html += '<div class="ps-detail-header">Area Breakdown</div>';
    html += '<div class="ps-grid ps-grid-3">';
    html += psItem('Flat Deck / Structure', num(areas.flatDeckOnStructureArea || 0) + ' SF');
    html += psItem('Sloped Roof',           num(areas.slopedRoofArea || 0) + ' SF');
    html += psItem('Pavers on Structure',    num(areas.paversOnStructureArea || 0) + ' SF');
    html += psItem('Pervious Landscaping',   num(areas.perviousLandscapingUsable || 0) + ' SF');
    html += psItem('Vehicular Pavement',     num(areas.imperviousVehicularPavement || 0) + ' SF');
    html += psItem('Pedestrian Pavement',    num(areas.imperviousPedestrianPavement || 0) + ' SF');
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  /** Full project summary block (core + area) — same content as before refactor. */
  function renderSectionProjectSummary(project, meta, mode) {
    return renderSectionProjectSummaryCore(project, meta, mode) + renderSectionAreaBreakdown(project, mode);
  }

  function _titleCaseWords(str) {
    return String(str || '')
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
  }

  function renderSectionSalesCityContext(meta, project) {
    var cityKey = (meta && meta.cityKey)
      ? String(meta.cityKey)
      : ((project && project.site && project.site.cityKey) ? String(project.site.cityKey) : '');
    var city = cityKey && CITY_DATA && CITY_DATA[cityKey] ? CITY_DATA[cityKey] : null;
    var cityName = city && city.name ? city.name : (cityKey || 'Not selected');
    var profileId = (meta && meta.regulationProfileId) ? String(meta.regulationProfileId) : 'general';
    var method = city && city.method ? String(city.method) : '';
    var oneLiner = city && city.salesOneLiner ? String(city.salesOneLiner) : '';

    var html = '<div class="ps-section ps-story-section ps-story-city">';
    html += '<h3 class="ps-heading">City context</h3>';
    html += '<p class="ps-story-line"><strong>City:</strong> ' + escHtml(cityName) + '</p>';
    html += '<p class="ps-story-line"><strong>Regulation profile:</strong> ' + escHtml(profileId) + (method ? (' (' + escHtml(method) + ')') : '') + '</p>';
    if (oneLiner) html += '<p class="ps-story-line">' + escHtml(oneLiner) + '</p>';
    html += '</div>';
    return html;
  }

  function renderSectionSalesSiteInputs(project) {
    var site = (project && project.site) || {};
    var areas = site.areas || {};
    var targets = (project && project.targets) || {};
    var constraints = (project && project.constraints) || {};

    var groundArea = (areas.perviousLandscapingUsable || 0)
      + (areas.imperviousVehicularPavement || 0)
      + (areas.imperviousPedestrianPavement || 0);
    var roofArea = (areas.flatDeckOnStructureArea || 0)
      + (areas.slopedRoofArea || 0)
      + (areas.paversOnStructureArea || 0);
    var totalArea = (site.designModeAreas && Number.isFinite(site.designModeAreas.totalSiteAreaSF))
      ? Number(site.designModeAreas.totalSiteAreaSF)
      : (groundArea + roofArea);

    var activeConditions = [];
    if (constraints.hasUndergroundUtilities) activeConditions.push('Underground utilities');
    if (constraints.hasHighWaterTable) activeConditions.push('High water table');
    if (constraints.hasContaminatedSoil) activeConditions.push('Contaminated soil');
    if (constraints.hasSiteGradingConstraint) activeConditions.push('Site grading constraint');
    if (constraints.hasStructuralLoadLimit && Number(constraints.maxRoofLoadPSF) > 0) {
      activeConditions.push('Max saturated roof load: ' + num(constraints.maxRoofLoadPSF) + ' PSF');
    }
    var conditionsText = activeConditions.length > 0 ? activeConditions.join(', ') : 'None selected';

    var presetLabel = _titleCaseWords(site.presetKey || 'balanced');

    var html = '<div class="ps-section ps-story-section ps-story-site">';
    html += '<h3 class="ps-heading">Site inputs recap</h3>';
    html += '<div class="ps-story-grid">';
    html += psItem('Site Type', presetLabel);
    html += psItem('Total Site', num(totalArea) + ' SF');
    html += psItem('Ground Area', num(groundArea) + ' SF');
    html += psItem('Roof / Structure', num(roofArea) + ' SF');
    html += '</div>';
    html += '<details class="ps-story-details">';
    html += '<summary>Show target volumes and active conditions</summary>';
    html += '<div class="ps-story-details-body">';
    html += '<p class="ps-story-line"><strong>Retention target:</strong> '
      + (targets.retentionNeeded ? escHtml(formatTargetVolumeSummary(targets.retentionCF)) : 'Not required') + '</p>';
    html += '<p class="ps-story-line"><strong>Detention target:</strong> '
      + (targets.detentionNeeded ? escHtml(formatTargetVolumeSummary(targets.detentionCF)) : 'Not required') + '</p>';
    html += '<p class="ps-story-line"><strong>Active conditions:</strong> ' + escHtml(conditionsText) + '</p>';
    html += '</div>';
    html += '</details>';
    html += '</div>';
    return html;
  }

  function renderSectionSalesPlanningSummary(strategy, project, viable, regProfileId, sortBy) {
    var opp = evaluateRoofOpportunity(project, viable, regProfileId, sortBy);
    var html = '<div class="ps-section ps-story-section ps-story-planning">';
    html += '<h3 class="ps-heading">Planning summary</h3>';

    if (strategy) {
      html += '<p class="ps-story-lead"><strong>Primary direction:</strong> '
        + escHtml(strategy.strategyType) + ' — ' + escHtml(strategy.explanation) + '</p>';
    }

    if (opp) {
      var verdict = String(opp.verdictTitle || '').replace(/^Roof Opportunity:\s*/i, '');
      html += '<p class="ps-story-line"><strong>Roof check:</strong> ' + escHtml(verdict) + '. '
        + escHtml(opp.verdictText || '') + '</p>';
      if (opp.delta != null && opp.baseline && opp.roofBest) {
        var deltaPct = (opp.deltaPct != null) ? (' (' + (opp.deltaPct * 100).toFixed(1) + '%)') : '';
        html += '<p class="ps-story-line"><strong>Cost context:</strong> Baseline '
          + escHtml(opp.baseline.name) + ' ' + $(opp.baselineTotal)
          + ' vs roof-forward ' + escHtml(opp.roofBest.name) + ' ' + $(opp.roofBestTotal)
          + ' (delta ' + (opp.delta >= 0 ? '+' : '-') + $(Math.abs(opp.delta)) + deltaPct + ').</p>';
      }
    }

    var hasDrivers = strategy && Array.isArray(strategy.drivers) && strategy.drivers.length > 0;
    var showDetails = hasDrivers || !!opp;
    if (showDetails) {
      html += '<details class="ps-story-details">';
      html += '<summary>Show supporting factors</summary>';
      html += '<div class="ps-story-details-body">';
      if (hasDrivers) {
        html += '<p class="ps-story-line"><strong>Drivers:</strong> '
          + escHtml(strategy.drivers.join(', ')) + '</p>';
      }
      if (opp) {
        html += '<p class="ps-story-line"><strong>Space-value context:</strong> '
          + escHtml(opp.valueContext || '') + '</p>';
        html += '<p class="ps-story-line">Decision aid only: this overlay does not change compliance math or baseline ranking.</p>';
      }
      html += '</div>';
      html += '</details>';
    }

    html += '</div>';
    return html;
  }


  // ── Section 2: Strategy Recommendation ─────────────────────────────

  function renderSectionStrategy(strategy) {
    if (!strategy) return '';

    var typeClass = strategy.strategyType.toLowerCase().replace(/[^a-z]/g, '-');
    var html = '<div class="strategy-panel strategy-' + typeClass + '">';
    html += '<div class="strategy-header">';
    html += '<span class="strategy-label">Strategy</span>';
    html += '<span class="strategy-type">' + escHtml(strategy.strategyType) + '</span>';
    html += '</div>';
    html += '<p class="strategy-explanation">' + escHtml(strategy.explanation) + '</p>';

    if (strategy.drivers.length > 0) {
      html += '<div class="strategy-drivers">';
      for (var i = 0; i < strategy.drivers.length; i++) {
        html += '<span class="strategy-driver">' + escHtml(strategy.drivers[i]) + '</span>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }


  // ── Section 3: Top System Options ──────────────────────────────────

  function pickIdsSet(pick) {
    var o = {};
    if (pick && pick.kind === 'single' && pick.single) o[String(pick.single.id)] = true;
    if (pick && pick.kind === 'combo' && pick.combo && pick.combo.members) {
      for (var pi = 0; pi < pick.combo.members.length; pi++) {
        o[String(pick.combo.members[pi].id)] = true;
      }
    }
    return o;
  }

  function renderSectionTopOptions(viable, targets, regProfileId, mode, sortBy, layout, sortedAll, pick, basis) {
    var isPlanning = (mode !== 'engineering');
    var isReport = (layout === 'report');
    var rankedViable = sortResultsForDisplay(viable, sortBy || 'totalCost');
    var viewPool = rankedViable;
    if (isPlanning && _planningTopOptionsRoofOnlyView) {
      viewPool = rankedViable.filter(function (r) { return isRoofViewBmpId(r.id); });
    }

    var html = '<div class="ps-section' + (isPlanning ? ' ps-section-planning-options' : '') + '">';
    html += '<h3 class="ps-heading">' + (isPlanning ? 'Recommended options' : 'Top system options & ranking') + '</h3>';

    html += '<p class="ps-basis-note">Highlighted recommendation uses <strong>' + escHtml(recommendationBasisLabel(basis)) + '</strong>. ';
    html += 'Under <em>Lowest-cost package</em>, a two-BMP combination may be promoted when no single system meets both retention and detention.</p>';

    if (isPlanning && !isReport) {
      html += '<div class="ps-top-options-toolbar">';
      html += '<label class="ps-view-toggle">';
      html += '<input type="checkbox" id="results-roof-only-toggle"'
        + (_planningTopOptionsRoofOnlyView ? ' checked' : '')
        + ' onchange="window.V3RunAnalysis.setPlanningRoofOnlyView(this.checked); window.V3RunAnalysis.run();">';
      html += '<span>Highlight roof-based options only</span>';
      html += '</label>';
      html += '<span class="ps-view-toggle-note">View filter for secondary cards and the ranked table — does not change compliance math.</span>';
      html += '</div>';
    }

    var pickIdObj = pickIdsSet(pick);
    var hasAnyViable = viable.length > 0;

    if (isPlanning) {
      html += '<p class="ps-planning-pricing-note">Planning mode shows one all-in delivered + installed total per system (packages use the sum of member totals).</p>';
      html += '<p class="ps-planning-pricing-footnote">Switch to Engineering for detailed estimating inputs and technical breakdowns.</p>';

      if (pick.kind === 'none' || !hasAnyViable) {
        html += '<div class="results-empty">';
        html += '<p>' + escHtml(pick.emptyMessage || 'No viable BMPs for the current inputs. See the ranked table for blocked systems and notes.') + '</p>';
        html += '</div>';
      } else if (pick.kind === 'combo' && pick.combo) {
        var comboTot = comboSellTotal(pick, sortedAll, regProfileId);
        var comboTotalStr = Number.isFinite(comboTot) ? $(comboTot) : '—';
        var m0 = pick.combo.members[0];
        var m1 = pick.combo.members[1];
        var row0 = m0 ? findRowById(sortedAll, m0.id) : null;
        var row1 = m1 ? findRowById(sortedAll, m1.id) : null;
        var pr0 = row0 ? resolvePricing(row0, regProfileId) : null;
        var asset0 = row0 ? findTechnicalAsset(row0, pr0) : null;

        html += '<article class="ps-top-pick ps-rank-tier-1 ps-top-pick-combo">';
        html += '<div class="ps-top-pick-layout">';
        html += '<div class="ps-top-pick-main">';
        html += '<div class="ps-top-pick-head">';
        html += '<div class="ps-top-pick-kicker">Recommended two-BMP package</div>';
        html += '<div class="ps-top-pick-total">' + comboTotalStr + '</div>';
        html += '</div>';
        html += '<div class="ps-top-pick-system-name">' + escHtml((m0 && m0.name) || '') + ' + ' + escHtml((m1 && m1.name) || '') + '</div>';
        html += '<div class="ps-top-pick-metrics">';
        html += '<span class="ps-metric-chip">Combined retention / detention to target</span>';
        if (row0) {
          html += '<span class="ps-metric-chip">' + escHtml(row0.name) + ': ' + $(displayTotalForOpportunity(row0, pr0)) + '</span>';
        }
        if (row1) {
          var pr1 = resolvePricing(row1, regProfileId);
          html += '<span class="ps-metric-chip">' + escHtml(row1.name) + ': ' + $(displayTotalForOpportunity(row1, pr1)) + '</span>';
        }
        html += '</div>';
        html += '<div class="ps-top-pick-role">Each system contributes part of the required retention and/or detention volume. Confirm routing and credited performance with the civil engineer.</div>';
        html += '</div>';
        html += '<div class="ps-top-pick-visual">' + renderAssetHero(asset0, 'Representative system profile') + '</div>';
        html += '</div>';
        html += '</article>';
      } else if (pick.kind === 'single' && pick.single) {
        var topPick = pick.single;
        var topPickPricing = resolvePricing(topPick, regProfileId);
        var topPickRet = targets.retentionNeeded ? pct(topPick.retPct) : '—';
        var topPickDet = targets.detentionNeeded ? pct(topPick.detPct) : '—';
        var topPickTotal = $(displayTotalForOpportunity(topPick, topPickPricing));
        var topPickRole = formatSystemRoleNote(topPick, targets);
        var topPickAsset = findTechnicalAsset(topPick, topPickPricing);

        html += '<article class="ps-top-pick ps-rank-tier-1">';
        html += '<div class="ps-top-pick-layout">';
        html += '<div class="ps-top-pick-main">';
        html += '<div class="ps-top-pick-head">';
        html += '<div class="ps-top-pick-kicker">Highlighted recommendation</div>';
        html += '<div class="ps-top-pick-total">' + topPickTotal + '</div>';
        html += '</div>';
        html += '<div class="ps-top-pick-system-name">' + escHtml(topPick.name) + '</div>';
        html += '<div class="ps-top-pick-metrics">';
        html += '<span class="ps-metric-chip">Area: ' + num(topPick.grossDesignedArea) + ' SF</span>';
        html += '<span class="ps-metric-chip">Retention: ' + topPickRet + '</span>';
        html += '<span class="ps-metric-chip">Detention: ' + topPickDet + '</span>';
        html += '</div>';
        html += '<div class="ps-top-pick-role">' + escHtml(topPickRole) + '</div>';
        html += '</div>';
        html += '<div class="ps-top-pick-visual">' + renderAssetHero(topPickAsset, 'Representative system profile') + '</div>';
        html += '</div>';
        html += '</article>';
      }

      if (hasAnyViable) {
        var VISIBLE_ALT = 3;
        var altCards = [];
        var maxNext = PLANNING_RANKED_TABLE_ROW_CAP;
        for (var ni = 0; ni < viewPool.length && altCards.length < maxNext; ni++) {
          var rs = viewPool[ni];
          if (pickIdObj[String(rs.id)]) continue;
          var ps = resolvePricing(rs, regProfileId);
          var retS = targets.retentionNeeded ? pct(rs.retPct) : '—';
          var detS = targets.detentionNeeded ? pct(rs.detPct) : '—';
          var noteS = formatSystemRoleNote(rs, targets);
          var sellTotS = $(displayTotalForOpportunity(rs, ps));
          var assetS = findTechnicalAsset(rs, ps);
          var cardHtml = '<article class="ps-alt-pick ps-ranked-row">';
          cardHtml += '<div class="ps-alt-pick-layout">';
          cardHtml += '<div class="ps-alt-pick-main">';
          cardHtml += '<div class="ps-alt-pick-head">';
          cardHtml += '<div class="ps-alt-pick-rank">Option</div>';
          cardHtml += '<div class="ps-alt-pick-total">' + sellTotS + '</div>';
          cardHtml += '</div>';
          cardHtml += '<div class="ps-alt-pick-system-name">' + escHtml(rs.name) + '</div>';
          cardHtml += '<div class="ps-top-pick-metrics">';
          cardHtml += '<span class="ps-metric-chip">Area: ' + num(rs.grossDesignedArea) + ' SF</span>';
          cardHtml += '<span class="ps-metric-chip">Retention: ' + retS + '</span>';
          cardHtml += '<span class="ps-metric-chip">Detention: ' + detS + '</span>';
          cardHtml += '</div>';
          cardHtml += '<div class="ps-top-pick-role">' + escHtml(noteS) + '</div>';
          cardHtml += '</div>';
          cardHtml += '<div class="ps-alt-pick-visual">' + renderAssetHero(assetS, 'Representative system profile') + '</div>';
          cardHtml += '</div>';
          cardHtml += '</article>';
          altCards.push(cardHtml);
        }

        if (altCards.length === 0) {
          html += '<p class="results-empty">No additional viable options in this filtered view.</p>';
        } else {
          html += '<div class="ps-secondary-options-label">Other options (by table sort)</div>';
          html += '<div class="ps-alt-list">';
          var visibleCards = altCards.slice(0, VISIBLE_ALT);
          var hiddenCards = altCards.slice(VISIBLE_ALT);
          for (var vi2 = 0; vi2 < visibleCards.length; vi2++) {
            html += visibleCards[vi2];
          }
          if (hiddenCards.length > 0) {
            var overflowId = 'ps-alt-overflow-' + Math.floor(Math.random() * 999999);
            html += '<div class="ps-alt-overflow" id="' + overflowId + '" hidden>';
            for (var hi = 0; hi < hiddenCards.length; hi++) {
              html += hiddenCards[hi];
            }
            html += '</div>';
            html += '<button type="button" class="ps-alt-overflow-btn" onclick="var el=document.getElementById(\'' + overflowId + '\');el.hidden=false;this.hidden=true;">'
              + 'Show ' + hiddenCards.length + ' more option' + (hiddenCards.length === 1 ? '' : 's') + '</button>';
          }
          html += '</div>';
        }
      }

      html += '</div>';
      return html;
    }

    if (pick.kind === 'single' && pick.single) {
      html += '<p class="ps-eng-pick-line"><strong>Highlighted (basis):</strong> ' + escHtml(pick.single.name) + '</p>';
    } else if (pick.kind === 'combo' && pick.combo) {
      html += '<p class="ps-eng-pick-line"><strong>Highlighted package:</strong> ' + escHtml(formatPickOneLine(pick, sortedAll, regProfileId)) + '</p>';
    } else if (pick.emptyMessage) {
      html += '<div class="results-empty"><p>' + escHtml(pick.emptyMessage) + '</p></div>';
    }

    html += renderRankedBmpTable(sortedAll, targets, regProfileId, mode, layout, pick);

    var detailIds = [];
    if (pick.kind === 'single' && pick.single) detailIds.push(String(pick.single.id));
    if (pick.kind === 'combo' && pick.combo && pick.combo.members) {
      for (var di = 0; di < pick.combo.members.length; di++) {
        detailIds.push(String(pick.combo.members[di].id));
      }
    }
    for (var vi = 0; vi < rankedViable.length && detailIds.length < 5; vi++) {
      var vid = String(rankedViable[vi].id);
      if (detailIds.indexOf(vid) === -1) detailIds.push(vid);
    }

    for (var dj = 0; dj < detailIds.length; dj++) {
      var dr = findRowById(sortedAll, detailIds[dj]);
      if (!dr || !dr.isViable) continue;
      var dp = resolvePricing(dr, regProfileId);
      if (dp && dp.roofProfile) html += renderProfileCard(dr, dp);
    }
    for (var dk = 0; dk < detailIds.length; dk++) {
      var dr2 = findRowById(sortedAll, detailIds[dk]);
      if (!dr2 || !dr2.isViable) continue;
      var dp2 = resolvePricing(dr2, regProfileId);
      if (dp2 && dp2.backupLines && dp2.backupLines.length > 0) html += renderPricingBreakdown(dr2, dp2);
    }

    html += '</div>';
    return html;
  }


  // ── Roof profile detail card ──────────────────────────────────────

  function renderProfileCard(result, pricing) {
    var rp = pricing.roofProfile;
    if (!rp) return '';
    var asset = findTechnicalAsset(result, pricing);

    var html = '<div class="ps-profile-card">';
    html += '<div class="ps-profile-header">' + escHtml(result.name) + '</div>';
    html += renderAssetThumb(asset);
    html += '<div class="ps-grid ps-grid-3">';
    html += psItem('Profile', rp.name);
    html += psItem('Thickness', rp.thicknessIn.toFixed(1) + '"');
    html += psItem('Dry Weight', rp.dryWeightPSF.toFixed(1) + ' PSF');
    html += psItem('Sat Weight', rp.satWeightPSF.toFixed(1) + ' PSF');
    html += psItem('Retention', rp.retCfPerSf.toFixed(4) + ' CF/SF');
    html += psItem('Detention', rp.detCfPerSf.toFixed(4) + ' CF/SF');
    if (pricing.roofAssemblyAggregate && rp.allInPerSf != null) {
      html += psItem('Delivered, hoisted &amp; installed (before markups)', '$' + rp.allInPerSf.toFixed(2) + '/SF');
    } else {
      html += psItem('Before markups (roof-layers est.)', '$' + rp.costPerSf.toFixed(2) + '/SF');
    }
    html += psItem('After project markups', '$' + pricing.sellPerSf.toFixed(2) + '/SF');
    html += psItem('Pricing Mode', pricing.pricingMode);
    html += '</div>';
    html += '</div>';
    return html;
  }


  // ── Expandable pricing breakdown ──────────────────────────────────

  function renderPricingBreakdown(result, pricing) {
    var html = '<details class="ps-pricing-detail">';
    html += '<summary class="ps-pricing-toggle">Pricing Breakdown: ' +
      escHtml(result.name) + ' (' + escHtml(pricing.pricingMode) + ')</summary>';
    html += '<div class="ps-pricing-body">';

    // Summary row
    html += '<div class="ps-grid">';
    if (pricing.directTotal != null) {
      html += psItem('Subtotal before markups', $(pricing.directTotal));
    }
    if (pricing.sellTotal != null) {
      html += psItem('After project markups', $(pricing.sellTotal));
    }
    html += '</div>';

    if (pricing.roofAssemblyAggregate) {
      var ra = pricing.roofAssemblyAggregate;
      html += '<div class="ps-grid">';
      html += psItem('Delivered, hoisted &amp; installed (project total)', $(ra.allInTotal));
      html += '</div>';
      html += '<p class="ps-pricing-footnote">Use an outside takeoff to set each roof layer&apos;s all-in delivered, hoisted &amp; installed cost per purchase unit in Cost Data.</p>';
    }

    // Parametric/turnkey: show furnished + install + adjustments
    if (pricing.pricingResult) {
      var pr = pricing.pricingResult;
      var turnkey = pr.item.pricingMode === 'turnkey';

      html += '<div class="ps-grid">';
      if (turnkey) {
        html += psItem('Delivered list price (furnish &amp; install in unit)', $(pr.summary.furnishedSubtotal));
        html += psItem('Separate install line', pr.summary.installSubtotal > 0
          ? $(pr.summary.installSubtotal)
          : '$0 (included in list price)');
      } else {
        html += psItem('Delivered / furnished', $(pr.summary.furnishedSubtotal));
        html += psItem('Install labor', $(pr.summary.installSubtotal));
      }
      html += '</div>';

      // Adjustments
      if (pr.adjustments.applied.length > 0) {
        html += '<div class="ps-adj-list">';
        html += '<span class="ps-adj-label">Adjustments:</span>';
        for (var a = 0; a < pr.adjustments.applied.length; a++) {
          var adj = pr.adjustments.applied[a];
          html += '<span class="ps-adj-item">' + escHtml(adj.name) +
            ' (' + escHtml(adj.optionLabel) + '): ×' + adj.factor.toFixed(2) +
            '</span>';
        }
        html += '</div>';
      }
    }

    // Project markup tiers (used for all pricing modes now)
    if (pricing.markupDetail && pricing.markupDetail.tiers.length > 0) {
      var md = pricing.markupDetail;
      html += '<div class="ps-adj-list">';
      html += '<span class="ps-adj-label">Markup (' + escHtml(md.structureName) +
        ', ×' + md.factor.toFixed(2) + '):</span>';
      for (var m = 0; m < md.tiers.length; m++) {
        var tier = md.tiers[m];
        html += '<span class="ps-adj-item">' + escHtml(tier.label) +
          ' (' + (tier.markupPct * 100).toFixed(0) + '%): ' +
          $(tier.inputAmount) + ' → ' + $(tier.outputAmount) + '</span>';
      }
      html += '</div>';
    }

    // Full backup lines
    html += '<pre class="ps-backup">';
    for (var b = 0; b < pricing.backupLines.length; b++) {
      html += escHtml(pricing.backupLines[b]) + '\n';
    }
    html += '</pre>';

    html += '</div>';
    html += '</details>';
    return html;
  }

  function renderSectionRecommendationExplanation(project, viable, results, targets, regProfileId, mode, sortBy, pick, basis) {
    if (!global.V3Strategy || typeof global.V3Strategy.buildRecommendationExplanation !== 'function') return '';

    var isPlanning = (mode !== 'engineering');
    var topPick = null;
    if (pick) {
      if (pick.kind === 'single' && pick.single) topPick = pick.single;
      else if (pick.kind === 'combo' && pick.combo && pick.combo.members && pick.combo.members[0]) {
        topPick = findRowById(results, pick.combo.members[0].id);
      }
    }
    if (!topPick) {
      var ranked = sortResultsForDisplay(viable, sortBy || 'totalCost');
      var viewPool = ranked;
      if (isPlanning && _planningTopOptionsRoofOnlyView) {
        viewPool = ranked.filter(function (r) { return isRoofViewBmpId(r.id); });
      }
      topPick = viewPool[0] || ranked[0] || null;
    }
    var topPickPricing = topPick ? resolvePricing(topPick, regProfileId) : null;
    var basisVal = basis || (project.settings && project.settings.recommendationBasis) || 'cheapest_package';
    var explanation = global.V3Strategy.buildRecommendationExplanation(project, topPick, viable, results, {
      pricing: topPickPricing,
      regProfileId: regProfileId,
      mode: mode,
      sortBy: sortBy,
      recommendationBasis: basisVal
    });
    if (!explanation) return '';

    var drivers = Array.isArray(explanation.drivers) ? explanation.drivers : [];
    var cautions = Array.isArray(explanation.cautions) ? explanation.cautions : [];
    var html = '<div class="ps-section ps-story-section ps-explanation-section">';
    html += '<h3 class="ps-heading">' + escHtml(explanation.title || 'Why this recommendation?') + '</h3>';
    if (explanation.summary) {
      html += '<p class="ps-story-lead">' + escHtml(explanation.summary) + '</p>';
    }

    if (drivers.length > 0) {
      html += '<div class="ps-explanation-grid">';
      for (var i = 0; i < drivers.length; i++) {
        html += '<article class="ps-explanation-driver">';
        html += '<h4>' + escHtml(drivers[i].label || 'Planning driver') + '</h4>';
        html += '<p>' + escHtml(drivers[i].phrase || '') + '</p>';
        html += '</article>';
      }
      html += '</div>';
    }

    if (cautions.length > 0) {
      html += '<details class="ps-explanation-cautions">';
      html += '<summary>Confirmation items for civil/AHJ review</summary>';
      html += '<ul>';
      for (var c = 0; c < cautions.length; c++) {
        html += '<li><strong>' + escHtml(cautions[c].label || 'Confirm') + ':</strong> ' + escHtml(cautions[c].phrase || '') + '</li>';
      }
      html += '</ul>';
      html += '</details>';
    }

    html += '</div>';
    return html;
  }


  // ── Section 4: Key Observations ────────────────────────────────────

  function renderSectionObservations(project, strategy, viable, results, targets, mode) {
    var isPlanning = (mode !== 'engineering');
    var observations = [];
    // Tag each observation with a priority: 'high' shown in both modes,
    // 'detail' shown only in engineering mode.

    // What's driving the solution (always high priority)
    if (strategy) {
      if (strategy.strategyType === 'Roof-driven') {
        observations.push({ text: 'Roof and on-structure systems are the primary path. Ground-based options are limited by site constraints or available area.', priority: 'high' });
      } else if (strategy.strategyType === 'Ground-driven') {
        observations.push({ text: 'At-grade systems offer the most area and lowest cost per CF. Ground-based BMPs should be evaluated first.', priority: 'high' });
      } else {
        observations.push({ text: 'Both ground and roof areas contribute viable options. Combinations may provide the best cost-performance balance.', priority: 'high' });
      }
    }

    // Constraint-driven observations (detail — engineering only)
    var constraints = project.constraints || {};
    var constraintList = [];
    if (constraints.hasUndergroundUtilities)  constraintList.push('underground utilities');
    if (constraints.hasHighWaterTable)        constraintList.push('high water table');
    if (constraints.hasContaminatedSoil)      constraintList.push('contaminated soil');
    if (constraints.hasSiteGradingConstraint) constraintList.push('site grading');

    if (constraintList.length > 0) {
      observations.push({ text: 'Active constraints (' + constraintList.join(', ') + ') are blocking or limiting ground-based systems.', priority: 'detail' });
    }

    // Soil observation (detail — engineering only)
    var soilType = (project.site || {}).soilType || null;
    if (soilType === 'clay' || soilType === 'rock') {
      observations.push({ text: 'Soil type (' + soilType + ') limits infiltration. Lined systems or on-structure options may be required.', priority: 'detail' });
    }

    // Roof value observation
    var roofViable = viable.filter(function (r) {
      var id = r.id;
      return [6, 7, 8, 9, 10, '10B', 11, '11B'].indexOf(id) !== -1
          || [6, 7, 8, 9, 10, '10B', 11, '11B'].indexOf(String(id)) !== -1;
    });
    var groundViable = viable.filter(function (r) {
      return [1, 2, 3, 4, 5].indexOf(r.id) !== -1;
    });

    if (roofViable.length > 0 && groundViable.length > 0) {
      var cheapGround = groundViable
        .filter(function (r) { return r.costDesigned > 0; })
        .sort(function (a, b) { return a.costDesigned - b.costDesigned; })[0];
      var cheapRoof = roofViable
        .filter(function (r) { return r.costDesigned > 0; })
        .sort(function (a, b) { return a.costDesigned - b.costDesigned; })[0];

      if (cheapGround && cheapRoof) {
        if (cheapGround.costDesigned < cheapRoof.costDesigned * 0.7) {
          observations.push({ text: 'Ground systems are significantly lower cost than roof systems for this site.', priority: 'detail' });
        } else if (cheapRoof.costDesigned < cheapGround.costDesigned * 0.7) {
          observations.push({ text: 'Roof systems are more cost-effective than ground options here — likely due to area or constraint limitations on the ground.', priority: 'detail' });
        }
      }
    } else if (roofViable.length > 0 && groundViable.length === 0) {
      observations.push({ text: 'No ground-based BMPs are viable. Roof and on-structure systems are the only path.', priority: 'high' });
    }

    // Target coverage observation (high priority — always shown)
    var meetsBoth = viable.filter(function (r) {
      var retOk = !targets.retentionNeeded || r.retPct >= 100;
      var detOk = !targets.detentionNeeded || r.detPct >= 100;
      return retOk && detOk;
    });

    if (meetsBoth.length === 0 && viable.length > 0) {
      observations.push({ text: 'No single system meets both detention and retention targets. A combined approach may be needed.', priority: 'high' });
    } else if (meetsBoth.length > 0) {
      observations.push({ text: meetsBoth.length + ' system(s) can meet both targets independently.', priority: 'high' });
    }

    // Filter by mode: planning = high priority only (max 3), engineering = all
    var filtered;
    if (isPlanning) {
      filtered = observations.filter(function (o) { return o.priority === 'high'; });
      if (filtered.length > 3) filtered = filtered.slice(0, 3);
    } else {
      filtered = observations;
    }

    if (filtered.length === 0) return '';

    var html = '<div class="ps-section">';
    html += '<h3 class="ps-heading">' + (isPlanning ? 'Key takeaways' : 'Key Observations') + '</h3>';
    html += '<ul class="ps-observations">';
    for (var i = 0; i < filtered.length; i++) {
      html += '<li>' + escHtml(filtered[i].text) + '</li>';
    }
    html += '</ul>';
    html += '</div>';
    return html;
  }


  // ── Section 5: Warnings / Assumptions ──────────────────────────────

  /** Planning mode: short disclaimer + up to five unique engine/adapter warnings (no blocked BMP list). */
  function renderSectionWarningsPlanning(warnings) {
    var uniqueWarnings = [];
    var seen = {};
    for (var i = 0; i < warnings.length; i++) {
      if (!seen[warnings[i]]) {
        seen[warnings[i]] = true;
        uniqueWarnings.push(warnings[i]);
      }
    }

    var html = '<div class="ps-section ps-section-warnings-planning">';
    html += '<h3 class="ps-heading">Notes</h3>';
    html += '<p class="ps-assumptions ps-assumptions-compact">Planning-level screening only. Not a substitute for stamped engineering or site-specific design.</p>';
    if (uniqueWarnings.length > 0) {
      html += '<ul class="ps-warning-list">';
      var maxW = 5;
      for (var k = 0; k < uniqueWarnings.length && k < maxW; k++) {
        html += '<li>' + escHtml(uniqueWarnings[k]) + '</li>';
      }
      html += '</ul>';
    }
    html += '</div>';
    return html;
  }

  function renderSectionWarnings(warnings, results, mode) {
    var isPlanning = (mode !== 'engineering');

    // Collect blocked BMP names
    var blocked = results.filter(function (r) { return !r.isViable; });
    var uniqueWarnings = [];
    var seen = {};
    for (var i = 0; i < warnings.length; i++) {
      if (!seen[warnings[i]]) {
        seen[warnings[i]] = true;
        uniqueWarnings.push(warnings[i]);
      }
    }

    // Planning uses renderSectionWarningsPlanning — this function is engineering-only paths.

    if (isPlanning) {
      return '';
    }

    // Engineering mode — full detail
    if (uniqueWarnings.length === 0 && blocked.length === 0) {
      // Still show assumptions even with no warnings
      var html2 = '<div class="ps-section">';
      html2 += '<h3 class="ps-heading">Warnings &amp; Assumptions</h3>';
      html2 += '<p class="ps-assumptions">This is a planning-level screening tool. Results use standardized assumptions and do not replace project-specific engineering (HydroCAD, civil calcs, etc.).</p>';
      html2 += '</div>';
      return html2;
    }

    var html3 = '<div class="ps-section">';
    html3 += '<h3 class="ps-heading">Warnings &amp; Assumptions</h3>';

    // Standing assumptions (always shown)
    html3 += '<p class="ps-assumptions">This is a planning-level screening tool. Results use standardized assumptions and do not replace project-specific engineering (HydroCAD, civil calcs, etc.).</p>';

    // Blocked BMPs
    if (blocked.length > 0) {
      html3 += '<div class="ps-blocked">';
      html3 += '<span class="ps-blocked-label">Blocked Systems (' + blocked.length + '):</span> ';
      var names = [];
      for (var j = 0; j < blocked.length; j++) {
        names.push(blocked[j].name);
      }
      html3 += escHtml(names.join(', '));
      html3 += '</div>';
    }

    // Engine / adapter warnings
    if (uniqueWarnings.length > 0) {
      html3 += '<ul class="ps-warning-list">';
      for (var k = 0; k < uniqueWarnings.length; k++) {
        html3 += '<li>' + escHtml(uniqueWarnings[k]) + '</li>';
      }
      html3 += '</ul>';
    }

    html3 += '</div>';
    return html3;
  }



  // ── Master renderer ────────────────────────────────────────────────

  /**
   * @param {string} [layout] — 'screen' (default) or 'report' — section order (engineering only)
   */
  function renderProjectSummary(project, engineOutput, strategy, results, viable, warnings, mode, sortBy, layout) {
    var meta    = engineOutput.meta || {};
    var targets = project.targets || {};
    var regProfileId = meta.regulationProfileId || 'general';
    var isPlanning = (mode !== 'engineering');
    layout = layout || 'screen';
    var basis = (project.settings && project.settings.recommendationBasis) || 'cheapest_package';
    var pick = pickRecommended(project, engineOutput, results, basis);

    var badge = '<div class="mode-badge mode-badge-' + (isPlanning ? 'planning' : 'eng') + '">'
      + (isPlanning ? 'Planning Mode' : 'Engineering Mode') + '</div>';

    var zoneDivider = '<div class="ps-zone-divider"><span>Reference data</span></div>';

    // ── Planning mode: city -> site inputs -> planning summary -> options
    if (isPlanning) {
      var planningExplanationHtml = renderSectionRecommendationExplanation(project, viable, results, targets, regProfileId, mode, sortBy, pick, basis);
      var rankedTableSales = renderRankedBmpTable(results, targets, regProfileId, mode, layout, pick);
      var prCtaPlanning = layout !== 'report' ? renderPurpleRoofSimulatorCta(viable, project, meta) : '';
      return badge
        + renderSectionSalesCityContext(meta, project)
        + renderSectionSalesSiteInputs(project)
        + renderSectionSalesPlanningSummary(strategy, project, viable, regProfileId, sortBy)
        + renderSectionTopOptions(viable, targets, regProfileId, mode, sortBy, layout, results, pick, basis)
        + prCtaPlanning
        + planningExplanationHtml
        + renderSectionObservations(project, strategy, viable, results, targets, mode)
        + renderSectionWarningsPlanning(warnings)
        + zoneDivider
        + rankedTableSales;
    }

    // ── Engineering: full technical stack
    var summaryCore = renderSectionProjectSummaryCore(project, meta, mode);
    var areaBreakdown = renderSectionAreaBreakdown(project, mode);
    var strategyHtml = renderSectionStrategy(strategy);
    var roofOpportunityHtml = renderSectionRoofOpportunity(project, viable, regProfileId, mode, sortBy);
    var topOptionsHtml = renderSectionTopOptions(viable, targets, regProfileId, mode, sortBy, layout, results, pick, basis);
    var explanationHtml = renderSectionRecommendationExplanation(project, viable, results, targets, regProfileId, mode, sortBy, pick, basis);
    var observationsHtml = renderSectionObservations(project, strategy, viable, results, targets, mode);
    var warningsHtml = renderSectionWarnings(warnings, results, mode);

    var html = badge;
    var prCtaEng = layout !== 'report' ? renderPurpleRoofSimulatorCta(viable, project, meta) : '';

    if (layout === 'report') {
      html += summaryCore;
      html += areaBreakdown;
      html += strategyHtml;
      html += roofOpportunityHtml;
      html += topOptionsHtml;
      html += explanationHtml;
      html += observationsHtml;
      html += warningsHtml;
    } else {
      html += strategyHtml;
      html += roofOpportunityHtml;
      html += topOptionsHtml;
      html += prCtaEng;
      html += zoneDivider;
      html += explanationHtml;
      html += observationsHtml;
      html += warningsHtml;
      html += '<p class="ps-inputs-ref-label">Project Inputs (for reference)</p>';
      html += summaryCore;
      html += areaBreakdown;
    }

    return html;
  }


  // ── Error renderer (unchanged) ─────────────────────────────────────

  function renderErrors(errors, warnings) {
    var html = '<div class="results-errors">';
    html += '<h3>Validation Errors</h3>';
    html += '<ul>';
    for (var i = 0; i < errors.length; i++) {
      html += '<li class="error-item">' + escHtml(errors[i]) + '</li>';
    }
    html += '</ul>';
    if (warnings.length > 0) {
      html += '<h3>Warnings</h3><ul>';
      for (var j = 0; j < warnings.length; j++) {
        html += '<li class="warning-item">' + escHtml(warnings[j]) + '</li>';
      }
      html += '</ul>';
    }
    html += '</div>';
    return html;
  }


  // ── Utilities ──────────────────────────────────────────────────────

  function psItem(label, value) {
    return '<div class="ps-item">'
      + '<span class="ps-item-label">' + escHtml(label) + '</span>'
      + '<span class="ps-item-value">' + escHtml(value) + '</span>'
      + '</div>';
  }

  function escHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  // ── Export ─────────────────────────────────────────────────────────

  // ── Report HTML generator ──────────────────────────────────────────
  //
  // Runs the same analysis pipeline as runAnalysis() but instead of
  // injecting into the DOM, returns a full standalone HTML document
  // string suitable for window.open() or print-to-PDF.
  //
  // Returns { ok: true, html: string } on success,
  //         { ok: false, error: string } on failure.

  function resolveAssetUrl(relPath) {
    if (!relPath) return '';
    try {
      return new URL(relPath, window.location.href).href;
    } catch (e) {
      return relPath;
    }
  }

  function getReportBranding(isPlanning) {
    var primaryColor = isPlanning ? '#2d7a3a' : '#2563eb';
    var secondaryColor = isPlanning ? '#1e5c2b' : '#1d4ed8';

    return {
      primaryBrandName: 'Sempergreen USA',
      legalCompanyLine: 'Living Building Group, Inc. dba Sempergreen USA',
      primaryLogoPath: resolveAssetUrl('../images/logo-sempergreen.png'),
      secondaryLogoPath: resolveAssetUrl('../images/logo-lbg-transparent.png'),
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      footerText: 'Stormwater BMP Comparison Report',
      contactBlock: {
        company: 'Sempergreen USA',
        email: 'info@sempergreen.com',
        web: 'www.sempergreen.com'
      },
      disclaimerText: 'Planning-level screening only. Results use standardized assumptions and do not replace project-specific engineering analysis (HydroCAD, civil calculations, and stamped design documentation).'
    };
  }

  function reportConstraintText(project) {
    var constraints = (project && project.constraints) || {};
    var active = [];
    if (constraints.hasUndergroundUtilities) active.push('underground utilities');
    if (constraints.hasHighWaterTable) active.push('high water table');
    if (constraints.hasContaminatedSoil) active.push('contaminated soil');
    if (constraints.hasSiteGradingConstraint) active.push('site grading constraint');
    if (constraints.hasStructuralLoadLimit && Number(constraints.maxRoofLoadPSF) > 0) {
      active.push('max saturated roof load ' + num(constraints.maxRoofLoadPSF) + ' PSF');
    }
    return active.length ? active.join(', ') : 'none selected';
  }

  function renderReportPlanningMemo(project, engineOutput, viable, mode, sortedResults) {
    var meta = (engineOutput && engineOutput.meta) || {};
    var site = (project && project.site) || {};
    var targets = (project && project.targets) || {};
    var cityName = (site.cityKey && CITY_DATA && CITY_DATA[site.cityKey] && CITY_DATA[site.cityKey].name)
      ? CITY_DATA[site.cityKey].name
      : (site.cityKey || 'Not selected');
    var isPlanning = (mode !== 'engineering');
    var basis = (project.settings && project.settings.recommendationBasis) || 'cheapest_package';
    var pick = pickRecommended(project, engineOutput, sortedResults || [], basis);
    var reg = meta.regulationProfileId || 'general';

    var html = '<div class="ps-section report-memo-section">';
    html += '<h3 class="ps-heading">Planning memo</h3>';
    html += '<p class="report-memo-lead">This report summarizes a planning-level BMP screening for jurisdiction context, site assumptions, stormwater targets, ranked BMP options (including blocked systems), and recommended confirmation steps.</p>';
    html += '<div class="ps-grid ps-grid-3">';
    html += psItem('Jurisdiction', cityName);
    html += psItem('Regulation Profile', meta.regulationProfileId || 'general');
    html += psItem('Report Detail', isPlanning ? 'Client-facing summary' : 'Engineering detail');
    html += psItem('Retention Target', targets.retentionNeeded ? formatTargetVolumeSummary(targets.retentionCF) : 'Not required');
    html += psItem('Detention Target', targets.detentionNeeded ? formatTargetVolumeSummary(targets.detentionCF) : 'Not required');
    html += psItem('Viable BMPs', String((viable || []).length));
    html += psItem('Recommendation basis', recommendationBasisLabel(basis));
    html += psItem('Highlighted recommendation', formatPickOneLine(pick, sortedResults || [], reg));
    html += '</div>';
    html += '<p class="report-memo-note"><strong>Constraints noted:</strong> ' + escHtml(reportConstraintText(project)) + '.</p>';
    html += '<p class="report-memo-note">The ranked BMP appendix in this report lists every stormwater option evaluated, with viability status, warnings, and blockers.</p>';
    html += '</div>';
    return html;
  }

  function renderReportTargetSourceNotes(project) {
    var targets = (project && project.targets) || {};
    var hasRetentionNote = targets.retentionSourceNote && String(targets.retentionSourceNote).trim();
    var hasDetentionNote = targets.detentionSourceNote && String(targets.detentionSourceNote).trim();
    if (!hasRetentionNote && !hasDetentionNote) return '';

    var html = '<div class="ps-section report-target-notes">';
    html += '<h3 class="ps-heading">Target source notes</h3>';
    if (hasRetentionNote) {
      html += '<p><strong>Retention:</strong> ' + escHtml(targets.retentionSourceNote) + '</p>';
    }
    if (hasDetentionNote) {
      html += '<p><strong>Detention:</strong> ' + escHtml(targets.detentionSourceNote) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderReportNextSteps(mode) {
    var isPlanning = (mode !== 'engineering');
    var html = '<div class="ps-section report-next-steps">';
    html += '<h3 class="ps-heading">Recommended next steps</h3>';
    html += '<ol>';
    html += '<li>Confirm final retention and detention requirements with the civil engineer and authority having jurisdiction.</li>';
    html += '<li>Verify site constraints, utility locations, grading, soil assumptions, and groundwater conditions against project-specific survey and geotechnical information.</li>';
    html += '<li>Coordinate structural loading, waterproofing, overflow routing, access, and maintenance assumptions for any roof or on-structure BMP.</li>';
    html += '<li>Use civil calculations and AHJ review comments to confirm final storage volume, release rate, and credited BMP performance.</li>';
    if (!isPlanning) {
      html += '<li>Review detailed cost inputs, markup settings, and unit pricing before using Engineering-mode estimates for budgeting.</li>';
    }
    html += '</ol>';
    html += '</div>';
    return html;
  }

  function generateReportHTML() {
    var project = V3State.get();
    var validation = validateV3Project(project);

    if (!validation.valid) {
      return { ok: false, error: 'Validation errors: ' + validation.errors.join('; ') };
    }

    var adapted = adaptV3ToEngine(project);
    if (!adapted.project) {
      return { ok: false, error: 'Adapter returned null project.' };
    }

    var database = getDatabase();
    var engineOutput;
    try {
      engineOutput = runModel(adapted.project, database);
    } catch (err) {
      return { ok: false, error: 'Engine error: ' + (err.message || String(err)) };
    }

    var sw       = engineOutput.stormwater || {};
    var results  = sw.results || [];
    var sortBy   = (project.settings && project.settings.sortResultsBy) || 'totalCost';
    var regProfileId = (engineOutput.meta && engineOutput.meta.regulationProfileId) || 'general';
    var roofLoadScreen = applyRoofLoadScreening(project, results, regProfileId);
    var displayResults = roofLoadScreen.results;
    var sortedResults = sortResultsForDisplay(displayResults, sortBy);
    var viable   = sortedResults.filter(function (r) { return r.isViable; });
    var strategy = V3Strategy.classify(project, viable);
    var warnings = [].concat(adapted.validation.warnings || [], sw.warnings || [], roofLoadScreen.warnings || []);
    var mode     = (project.settings && project.settings.mode) || 'planning';
    var isPlanning  = (mode !== 'engineering');
    var branding = getReportBranding(isPlanning);

    // Build report body using existing renderers plus report-only memo sections
    var body = renderReportPlanningMemo(project, engineOutput, viable, mode, sortedResults)
      + renderReportTargetSourceNotes(project)
      + renderProjectSummary(project, engineOutput, strategy, sortedResults, viable, warnings, mode, sortBy, 'report')
      + renderReportNextSteps(mode);

    // Markup summary — engineering reports only (planning reports stay client-safe)
    var markupHtml = '';
    if (!isPlanning) {
      var markupInfo = buildMarkupFromSettings();
      markupHtml = '<div class="ps-section">';
      markupHtml += '<h3 class="ps-heading">Markup Summary</h3>';
      markupHtml += '<div class="ps-grid">';
      markupHtml += psItem('Structure', markupInfo.name);
      markupHtml += psItem('Combined Factor', markupInfo.factor.toFixed(4) + 'x');
      markupHtml += '</div>';
      markupHtml += '<table class="results-table compact">';
      markupHtml += '<thead><tr><th>Tier</th><th>Markup %</th></tr></thead>';
      markupHtml += '<tbody>';
      for (var ti = 0; ti < markupInfo.tiers.length; ti++) {
        var t = markupInfo.tiers[ti];
        markupHtml += '<tr>';
        markupHtml += '<td>' + escHtml(t.label) + '</td>';
        markupHtml += '<td>' + (t.markupPct * 100).toFixed(1) + '%</td>';
        markupHtml += '</tr>';
      }
      markupHtml += '</tbody></table>';
      markupHtml += '</div>';
    }

    // Project metadata
    var info = project.projectInfo || {};
    var now  = new Date();
    var dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    var titleText = (info.projectName || 'BMP Comparison') + ' — ' + (isPlanning ? 'Planning' : 'Engineering') + ' Report';

    // Assemble full HTML document
    var doc = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    doc += '<meta charset="utf-8">\n';
    doc += '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
    doc += '<title>' + escHtml(titleText) + '</title>\n';
    doc += '<style>\n' + _reportCSS(isPlanning) + '\n</style>\n';
    doc += '</head>\n<body class="report-body ' + (isPlanning ? 'report-mode-planning' : 'report-mode-engineering') + '">\n';

    // Report header
    doc += '<div class="report-header">\n';
    doc += '<div class="report-brand-row">\n';
    doc += '<div class="report-logo-wrap">\n';
    if (branding.primaryLogoPath) {
      doc += '<img class="report-logo report-logo-primary" src="' + branding.primaryLogoPath + '" alt="' + escHtml(branding.primaryBrandName) + ' logo">\n';
    }
    if (branding.secondaryLogoPath) {
      doc += '<img class="report-logo report-logo-secondary" src="' + branding.secondaryLogoPath + '" alt="Secondary company logo">\n';
    }
    doc += '</div>\n';
    doc += '<div class="report-brand-text">\n';
    doc += '<div class="report-brand-name">' + escHtml(branding.primaryBrandName) + '</div>\n';
    doc += '<div class="report-legal-line">' + escHtml(branding.legalCompanyLine) + '</div>\n';
    doc += '</div>\n';
    doc += '</div>\n';
    doc += '<h1 class="report-title">' + escHtml(info.projectName || 'Stormwater BMP Comparison') + '</h1>\n';
    doc += '<div class="report-subtitle">' + escHtml(branding.footerText) + '</div>\n';
    doc += '<div class="report-meta">\n';
    if (info.clientName) doc += '<span>Client: ' + escHtml(info.clientName) + '</span>\n';
    if (info.projectAddress || info.location) doc += '<span>Location: ' + escHtml(info.projectAddress || info.location) + '</span>\n';
    doc += '<span>Generated: ' + escHtml(dateStr + ' at ' + timeStr) + '</span>\n';
    doc += '<span class="report-mode-label">' + (isPlanning ? 'Planning Mode' : 'Engineering Mode') + '</span>\n';
    doc += '</div>\n';
    doc += '</div>\n';

    // Print button (hidden in print)
    doc += '<div class="report-actions no-print">\n';
    doc += '<button onclick="window.print()">Print / Save as PDF</button>\n';
    doc += '<button onclick="window.close()">Close</button>\n';
    doc += '</div>\n';

    // Main content
    doc += '<div class="report-content">\n';
    doc += body + '\n';
    if (markupHtml) doc += markupHtml + '\n';
    doc += '</div>\n';

    // Footer
    doc += '<div class="report-footer">\n';
    doc += '<div class="report-footer-grid">\n';
    doc += '<div class="report-footer-company">\n';
    doc += '<div class="report-footer-company-name">' + escHtml(branding.contactBlock.company) + '</div>\n';
    doc += '<div>' + escHtml(branding.legalCompanyLine) + '</div>\n';
    doc += '<div>' + escHtml(branding.contactBlock.email) + ' | ' + escHtml(branding.contactBlock.web) + '</div>\n';
    doc += '</div>\n';
    doc += '<div class="report-footer-disclaimer">' + escHtml(branding.disclaimerText) + '</div>\n';
    doc += '</div>\n';
    doc += '<p class="report-generated-by">Generated by Stormwater BMP Comparison Tool v3</p>\n';
    doc += '</div>\n';

    doc += '</body>\n</html>';

    return { ok: true, html: doc };
  }


  // ── Report CSS (embedded in report document) ──────────────────────
  //
  // Self-contained styles for the report page. Mirrors the theme
  // tokens from style.css but is fully self-contained.
  // To update brand colors: change the values here AND in style.css :root.

  function _reportCSS(isPlanning) {
    // Resolve accent colors based on mode — same values as style.css
    var accent, accentDark, accentBg, accentBorder, accentText;
    if (isPlanning) {
      accent       = '#2d7a3a';  // --brand-primary
      accentDark   = '#1e5c2b';  // --brand-primary-dark
      accentBg     = '#e8f5ec';  // --brand-primary-light
      accentBorder = '#a3d9ad';  // --brand-primary-mid
      accentText   = '#1e5c2b';  // --brand-primary-dark
    } else {
      accent       = '#2563eb';
      accentDark   = '#1d4ed8';
      accentBg     = '#eff6ff';
      accentBorder = '#93c5fd';
      accentText   = '#1e40af';
    }

    return [
      '/* ── Theme tokens (mirrored from style.css) ── */',
      ':root {',
      '  --brand-primary: #2d7a3a;',
      '  --brand-primary-dark: #1e5c2b;',
      '  --brand-primary-light: #e8f5ec;',
      '  --brand-primary-mid: #a3d9ad;',
      '  --n-900: #0f172a;',
      '  --n-800: #1e293b;',
      '  --n-700: #334155;',
      '  --n-600: #475569;',
      '  --n-500: #64748b;',
      '  --n-400: #94a3b8;',
      '  --n-300: #cbd5e1;',
      '  --n-200: #e2e8f0;',
      '  --n-100: #f1f5f9;',
      '  --n-50:  #f8fafc;',
      '  --n-0:   #ffffff;',
      '  --warning-text: #92400e;',
      '  --warning-bg: #fffbeb;',
      '  --warning-border: #fde68a;',
      '  --warning-icon: #d97706;',
      '  --error-text: #b91c1c;',
      '  --mode-accent: ' + accent + ';',
      '  --mode-accent-dark: ' + accentDark + ';',
      '  --mode-accent-bg: ' + accentBg + ';',
      '  --mode-accent-border: ' + accentBorder + ';',
      '  --mode-accent-text: ' + accentText + ';',
      '  --editorial-rule: color-mix(in srgb, var(--mode-accent-border) 38%, var(--n-200));',
      '  --editorial-cell-border: color-mix(in srgb, var(--mode-accent-border) 22%, var(--n-200));',
      '  --editorial-table-frame: color-mix(in srgb, var(--mode-accent-border) 28%, var(--n-200));',
      '  --strat-ground: #2d7a3a;',
      '  --strat-ground-bg: #f0fdf4;',
      '  --strat-roof: #2563eb;',
      '  --strat-roof-bg: #eff6ff;',
      '  --strat-hybrid: #d97706;',
      '  --strat-hybrid-bg: #fffbeb;',
      '}',
      '',
      '/* ── Base ─────────────────────────────────── */',
      '* { box-sizing: border-box; margin: 0; padding: 0; }',
      'body.report-body {',
      '  font-family: Inter, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;',
      '  font-size: 14px;',
      '  line-height: 1.5;',
      '  color: var(--n-800);',
      '  background: linear-gradient(180deg, #ffffff 0%, var(--n-50) 52%, var(--n-100) 100%);',
      '  max-width: 980px;',
      '  margin: 0 auto;',
      '  padding: 28px 34px;',
      '}',
      '',
      '/* ── Report header ────────────────────────── */',
      '.report-header {',
      '  background: linear-gradient(135deg, rgba(255,255,255,0.98), var(--mode-accent-bg));',
      '  border: 1px solid var(--mode-accent-border);',
      '  border-radius: 18px;',
      '  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);',
      '  margin-bottom: 20px;',
      '  overflow: hidden;',
      '  padding: 22px 24px;',
      '  position: relative;',
      '}',
      '.report-header:before {',
      '  content: "";',
      '  position: absolute;',
      '  inset: 0 0 auto;',
      '  height: 6px;',
      '  background: linear-gradient(90deg, var(--mode-accent), var(--mode-accent-border));',
      '}',
      '.report-brand-row {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  align-items: center;',
      '  gap: 16px;',
      '  margin-bottom: 18px;',
      '}',
      '.report-logo-wrap { display: flex; align-items: center; gap: 10px; }',
      '.report-logo { object-fit: contain; }',
      '.report-logo-primary { height: 40px; }',
      '.report-logo-secondary { height: 30px; }',
      '.report-brand-text { text-align: right; }',
      '.report-brand-name { font-size: 0.9rem; font-weight: 700; color: var(--mode-accent-dark); }',
      '.report-legal-line { font-size: 0.75rem; color: var(--n-500); }',
      '.report-title {',
      '  font-size: clamp(1.8rem, 4vw, 3rem);',
      '  font-weight: 800;',
      '  letter-spacing: -0.04em;',
      '  line-height: 1;',
      '  color: var(--n-900);',
      '  margin-bottom: 8px;',
      '  position: relative;',
      '  padding-bottom: 4px;',
      '}',
      '.report-title::after {',
      '  content: "";',
      '  display: block;',
      '  width: min(4.5rem, 22vw);',
      '  height: 3px;',
      '  margin-top: 10px;',
      '  border-radius: 2px;',
      '  background: linear-gradient(90deg, var(--mode-accent), color-mix(in srgb, var(--mode-accent-border) 55%, transparent));',
      '}',
      '.report-subtitle { font-size: 0.95rem; color: var(--n-600); margin-bottom: 14px; max-width: 70ch; }',
      '.report-meta {',
      '  display: flex;',
      '  flex-wrap: wrap;',
      '  gap: 16px;',
      '  font-size: 0.85rem;',
      '  color: var(--n-500);',
      '}',
      '.report-mode-label {',
      '  font-weight: 700;',
      '  padding: 3px 10px;',
      '  border-radius: 999px;',
      '  font-size: 0.78rem;',
      '  color: var(--mode-accent-text);',
      '  border: 1px solid var(--mode-accent-border);',
      '  background: var(--mode-accent-bg);',
      '}',
      '',
      '/* ── Actions bar (screen only) ────────────── */',
      '.report-actions { display: flex; gap: 8px; margin-bottom: 20px; }',
      '.report-actions button {',
      '  padding: 8px 16px;',
      '  font-size: 0.85rem;',
      '  border: 1px solid var(--n-300);',
      '  border-radius: 999px;',
      '  background: var(--n-0);',
      '  cursor: pointer;',
      '}',
      '.report-actions button:hover { background: var(--n-100); }',
      '',
      '/* ── Content sections ─────────────────────── */',
      '.ps-section { margin-bottom: 22px; page-break-inside: avoid; }',
      '.ps-heading {',
      '  font-size: 12px;',
      '  font-weight: 800;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.08em;',
      '  color: color-mix(in srgb, var(--mode-accent-text) 22%, var(--n-700));',
      '  border-bottom: 1px solid var(--editorial-rule);',
      '  padding-bottom: 8px;',
      '  margin-bottom: 12px;',
      '}',
      '.ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 8px; }',
      '.ps-grid-3 { grid-template-columns: 1fr 1fr 1fr; }',
      '.ps-story-section { background: rgba(255,255,255,0.9); border: 1px solid var(--n-200); border-radius: 12px; margin-bottom: 14px; padding: 14px; }',
      '.ps-story-section .ps-heading { font-size: 0.75rem; letter-spacing: 0.08em; border-bottom-width: 1px; margin-bottom: 10px; }',
      '.ps-story-line, .ps-story-lead { margin: 0 0 6px; color: var(--n-700); line-height: 1.45; }',
      '.ps-story-lead { font-size: 0.88rem; color: var(--n-800); }',
      '.ps-story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; margin-bottom: 8px; }',
      '.ps-story-details { border: 1px solid var(--n-200); border-radius: 6px; background: var(--n-50); }',
      '.ps-story-details summary { cursor: pointer; list-style: none; padding: 8px 10px; font-size: 0.78rem; font-weight: 600; color: var(--n-700); }',
      '.ps-story-details summary::-webkit-details-marker { display: none; }',
      '.ps-story-details-body { border-top: 1px solid var(--n-200); padding: 8px 10px; }',
      '.report-memo-section, .report-next-steps, .report-target-notes { background: rgba(255,255,255,0.92); border: 1px solid var(--n-200); border-radius: 14px; padding: 14px; }',
      '.report-memo-lead { color: var(--n-700); font-size: 0.92rem; line-height: 1.5; margin-bottom: 12px; }',
      '.report-memo-note { color: var(--n-700); font-size: 0.85rem; line-height: 1.45; margin-top: 8px; }',
      '.report-target-notes p { color: var(--n-700); font-size: 0.88rem; line-height: 1.45; margin-bottom: 6px; }',
      '.report-next-steps ol { margin: 0; padding-left: 20px; }',
      '.report-next-steps li { color: var(--n-700); font-size: 0.88rem; line-height: 1.45; margin-bottom: 6px; }',
      '.ps-explanation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }',
      '.ps-explanation-driver { background: rgba(255,255,255,0.82); border: 1px solid var(--n-200); border-radius: 10px; padding: 10px; }',
      '.ps-explanation-driver h4 { color: var(--n-900); font-size: 0.86rem; line-height: 1.25; margin: 0 0 4px; }',
      '.ps-explanation-driver p { color: var(--n-700); font-size: 0.82rem; line-height: 1.42; margin: 0; }',
      '.ps-explanation-cautions { background: var(--n-50); border: 1px solid var(--n-200); border-radius: 10px; margin-top: 10px; }',
      '.ps-explanation-cautions summary { color: var(--n-700); cursor: pointer; font-size: 0.82rem; font-weight: 700; padding: 8px 10px; }',
      '.ps-explanation-cautions ul { border-top: 1px solid var(--n-200); margin: 0; padding: 8px 14px 10px 26px; }',
      '.ps-explanation-cautions li { color: var(--n-700); font-size: 0.8rem; line-height: 1.4; margin-bottom: 5px; }',
      '.ps-site-type-graphic { margin: 6px 0 8px; max-width: 220px; }',
      '.ps-site-type-graphic img { width: 100%; max-width: 220px; max-height: 110px; object-fit: cover; border-radius: 6px; border: 1px solid var(--n-200); }',
      '.ps-site-type-caption { font-size: 0.72rem; color: var(--n-500); margin-top: 4px; }',
      '.ps-system-cell { display: flex; flex-direction: column; gap: 4px; }',
      '.ps-system-name { font-weight: 500; }',
      '.ps-asset-thumb { display: inline-flex; flex-direction: column; gap: 2px; max-width: 130px; }',
      '.ps-asset-thumb img { width: 100%; max-width: 130px; max-height: 64px; object-fit: cover; border: 1px solid var(--n-200); border-radius: 4px; }',
      '.ps-asset-caption { font-size: 0.7rem; color: var(--n-500); line-height: 1.25; }',
      '.ps-item { display: flex; flex-direction: column; background: var(--n-0); border: 1px solid var(--n-200); border-radius: 10px; padding: 9px 12px; }',
      '.ps-item-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--n-500); margin-bottom: 1px; }',
      '.ps-item-value { font-size: 0.95rem; font-weight: 600; color: var(--n-800); }',
      '',
      '/* ── Strategy panel ────────────────────────── */',
      '.strategy-panel { border: 1px solid var(--n-200); border-left: 5px solid var(--n-400); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; background: var(--n-0); page-break-inside: avoid; }',
      '.strategy-panel.strategy-ground-driven { border-left-color: var(--strat-ground); background: var(--strat-ground-bg); }',
      '.strategy-panel.strategy-roof-driven { border-left-color: var(--strat-roof); background: var(--strat-roof-bg); }',
      '.strategy-panel.strategy-hybrid { border-left-color: var(--strat-hybrid); background: var(--strat-hybrid-bg); }',
      '.strategy-header { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }',
      '.strategy-label { font-size: 0.8rem; color: var(--n-500); }',
      '.strategy-type { font-weight: 600; font-size: 0.95rem; color: var(--n-800); }',
      '.strategy-explanation { font-size: 0.9rem; color: var(--n-600); }',
      '.strategy-drivers { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }',
      '.strategy-driver { background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 3px; font-size: 0.8rem; color: var(--n-600); }',
      '.ps-roof-opportunity-card { border: 1px solid var(--n-200); background: var(--n-0); border-left: 4px solid var(--n-300); border-radius: 6px; padding: 10px 12px; }',
      '.ps-roof-opportunity-promote .ps-roof-opportunity-card { border-left-color: var(--strat-ground); }',
      '.ps-roof-opportunity-consider .ps-roof-opportunity-card { border-left-color: var(--strat-hybrid); }',
      '.ps-roof-opportunity-neutral .ps-roof-opportunity-card { border-left-color: var(--strat-roof); }',
      '.ps-roof-opportunity-defer .ps-roof-opportunity-card { border-left-color: var(--n-400); }',
      '.ps-roof-opportunity-title { font-size: 0.88rem; font-weight: 700; color: var(--n-800); margin-bottom: 4px; }',
      '.ps-roof-opportunity-text { font-size: 0.86rem; color: var(--n-600); margin-bottom: 8px; line-height: 1.45; }',
      '.ps-roof-opportunity-footnote { font-size: 0.78rem; color: var(--n-500); margin-top: 8px; line-height: 1.4; }',
      '',
      '/* ── Tables ────────────────────────────────── */',
      '.results-table-scroll { overflow-x: auto; max-width: 100%; -webkit-overflow-scrolling: touch; border: 1px solid var(--editorial-table-frame); border-radius: 10px; background: var(--n-0); }',
      '.results-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 12px; table-layout: auto; }',
      '.results-table th, .results-table td { padding: 6px 8px; text-align: left; vertical-align: top; }',
      '.results-table td { border-bottom: 1px solid var(--editorial-cell-border); }',
      '.results-table tbody tr:hover td { box-shadow: inset 0 0 0 9999px color-mix(in srgb, var(--mode-accent-bg) 24%, transparent); }',
      '.results-table th { background: var(--mode-accent-bg); border-bottom: 2px solid var(--mode-accent-border); font-weight: 600; font-size: 0.8rem; color: var(--mode-accent-text); text-transform: uppercase; letter-spacing: 0.03em; }',
      '.results-table th.col-num, .results-table td.col-num { text-align: right; font-variant-numeric: tabular-nums; }',
      '.results-table .required-area-cell { white-space: nowrap; font-variant-numeric: tabular-nums; }',
      '.results-table .ps-ranked-row td:first-child { border-left: 3px solid transparent; }',
      '.results-table .ps-ranked-row.ps-rank-tier-1 td { background: #f2f8f4; }',
      '.results-table .ps-ranked-row.ps-rank-tier-1 td:first-child { border-left-color: #75a98d; }',
      '.results-table .ps-ranked-row.ps-rank-tier-2 td { background: #f7fbf8; }',
      '.results-table .ps-ranked-row.ps-rank-tier-2 td:first-child { border-left-color: #a7c8b4; }',
      '.results-table .ps-ranked-row.ps-rank-tier-3 td { background: #fbfdfb; }',
      '.results-table .ps-ranked-row.ps-rank-tier-3 td:first-child { border-left-color: #c7ddcf; }',
      '.results-table.compact td, .results-table.compact th { padding: 4px 6px; font-size: 0.8rem; }',
      '.rank-cell { font-weight: 700; color: var(--mode-accent); width: 2.75rem; text-align: center; }',
      '.note-cell { color: var(--n-500); font-size: 0.8rem; }',
      'tr.blocked { opacity: 0.5; }',
      '.ps-unmapped { color: var(--n-400); font-style: italic; }',
      '',
      '/* ── Observations ──────────────────────────── */',
      '.ps-observations { list-style: disc; padding-left: 20px; }',
      '.ps-observations li { font-size: 0.9rem; margin-bottom: 4px; color: var(--n-700); }',
      '',
      '/* ── Warnings ──────────────────────────────── */',
      '.ps-assumptions { font-size: 0.85rem; color: var(--n-500); font-style: italic; margin-bottom: 8px; }',
      '.ps-assumptions-compact { font-size: 0.85rem; color: var(--n-600); margin-bottom: 6px; line-height: 1.45; font-style: normal; }',
      '.ps-planning-pricing-note { font-size: 0.85rem; color: var(--n-600); margin: 0 0 2px; line-height: 1.4; }',
      '.ps-planning-pricing-footnote { font-size: 0.78rem; color: var(--n-500); margin: 0 0 8px; line-height: 1.35; }',
      '.ps-top-options-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 8px; }',
      '.ps-view-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--n-700); }',
      '.ps-view-toggle-note { font-size: 0.75rem; color: var(--n-500); }',
      '.ps-top-pick { border: 1px solid var(--mode-accent-border); background: linear-gradient(135deg, #ffffff, #f2f8f4); border-radius: 16px; box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08); padding: 16px 18px; margin: 12px 0 14px; }',
      '.ps-top-pick-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 18px; align-items: center; }',
      '.ps-top-pick-main { min-width: 0; }',
      '.ps-top-pick-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 5px; }',
      '.ps-top-pick-kicker { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mode-accent-text); font-weight: 800; }',
      '.ps-top-pick-total { font-size: 1.35rem; font-weight: 800; color: var(--mode-accent-text); }',
      '.ps-top-pick-system-name { font-size: 1.35rem; font-weight: 800; color: var(--n-900); letter-spacing: -0.025em; line-height: 1.12; }',
      '.ps-top-pick-metrics { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }',
      '.ps-metric-chip { display: inline-flex; align-items: center; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--n-300); background: rgba(255,255,255,0.82); color: var(--n-700); font-size: 0.74rem; font-weight: 600; }',
      '.ps-top-pick-role { margin-top: 10px; font-size: 0.9rem; color: var(--n-600); line-height: 1.45; }',
      '.ps-top-pick-visual { justify-self: end; }',
      '.ps-asset-hero { display: inline-flex; flex-direction: column; gap: 4px; width: 100%; max-width: 280px; }',
      '.ps-asset-hero img { width: 100%; height: 170px; object-fit: cover; border: 1px solid var(--n-200); border-radius: 12px; }',
      '.ps-secondary-options-label { font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--n-500); font-weight: 700; margin-bottom: 2px; }',
      '.ps-alt-list { display: grid; gap: 8px; }',
      '.ps-alt-pick { border: 1px solid var(--n-200); border-radius: 12px; background: var(--n-0); padding: 10px 12px; }',
      '.ps-alt-pick-layout { display: grid; grid-template-columns: minmax(0, 1fr) 230px; gap: 12px; align-items: center; }',
      '.ps-alt-pick-main { min-width: 0; }',
      '.ps-alt-pick-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }',
      '.ps-alt-pick-rank { font-size: 0.75rem; font-weight: 700; color: var(--mode-accent-text); text-transform: uppercase; letter-spacing: 0.04em; }',
      '.ps-alt-pick-total { font-size: 0.98rem; font-weight: 700; color: var(--mode-accent-text); }',
      '.ps-alt-pick-system-name { font-size: 0.92rem; font-weight: 700; color: var(--n-800); margin-top: 2px; }',
      '.ps-alt-pick-visual { justify-self: end; }',
      '.ps-alt-pick .ps-asset-hero { max-width: 250px; }',
      '.ps-alt-pick .ps-asset-hero img { height: 140px; }',
      '.ps-blocked { font-size: 0.85rem; margin-bottom: 6px; color: var(--warning-text); background: var(--warning-bg); padding: 6px 10px; border-radius: 4px; }',
      '.ps-blocked-label { font-weight: 600; }',
      '.ps-warning-list { list-style: none; padding-left: 0; }',
      '.ps-warning-list li { font-size: 0.85rem; padding: 3px 0; color: var(--warning-text); }',
      '.ps-warning-list li:before { content: "\\26A0  "; }',
      '',
      '/* ── Constraints ──────────────────────────── */',
      '.ps-constraints { font-size: 0.85rem; color: var(--warning-text); background: var(--warning-bg); border: 1px solid var(--warning-border); border-radius: 5px; padding: 8px 12px; margin-top: 4px; }',
      '.ps-constraints-label { font-weight: 600; }',
      '',
      '/* ── Detail blocks ─────────────────────────── */',
      '.ps-detail-block { background: var(--mode-accent-bg); border: 1px solid var(--mode-accent-border); border-radius: 6px; padding: 12px 16px; margin-top: 8px; margin-bottom: 8px; }',
      '.ps-detail-header { font-size: 0.85rem; font-weight: 600; color: var(--mode-accent-text); margin-bottom: 6px; }',
      '',
      '/* ── Profile cards ─────────────────────────── */',
      '.ps-profile-card { background: var(--mode-accent-bg); border: 1px solid var(--mode-accent-border); border-radius: 6px; padding: 10px 14px; margin-top: 10px; page-break-inside: avoid; }',
      '.ps-profile-header { font-weight: 600; font-size: 0.85rem; margin-bottom: 6px; color: var(--mode-accent-text); }',
      '',
      '/* ── Pricing breakdown ─────────────────────── */',
      '.ps-pricing-detail { margin-top: 8px; border: 1px solid var(--n-200); border-radius: 4px; page-break-inside: avoid; }',
      '.ps-pricing-toggle { font-weight: 600; font-size: 0.85rem; padding: 6px 10px; cursor: pointer; background: var(--n-50); }',
      '.ps-pricing-body { padding: 8px 12px; }',
      '.ps-pricing-footnote { font-size: 0.75rem; color: var(--n-500); margin: 6px 0 0; line-height: 1.35; }',
      '.ps-adj-list { font-size: 0.82rem; margin: 6px 0; }',
      '.ps-adj-label { font-weight: 600; display: block; margin-bottom: 2px; }',
      '.ps-adj-item { display: block; padding-left: 12px; color: var(--n-600); }',
      '.ps-backup { font-family: "Cascadia Code", "SF Mono", Consolas, ui-monospace, monospace; font-size: 0.75rem; background: var(--n-50); padding: 8px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }',
      '',
      '/* ── Mode badge ────────────────────────────── */',
      '.mode-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; margin-bottom: 12px; }',
      '.mode-badge-planning { background: var(--brand-primary-light); color: var(--brand-primary-dark); border: 1px solid var(--brand-primary-mid); }',
      '.mode-badge-eng { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }',
      '',
      '/* ── All BMPs / ranked table ──────────────── */',
      '.ps-all-bmps { margin-top: 16px; }',
      '.ps-toggle { cursor: pointer; }',
      '.ps-basis-note { font-size: 0.85rem; color: var(--n-600); line-height: 1.45; margin: 8px 0 10px; }',
      '.ps-basis-note em { font-style: normal; font-weight: 600; color: var(--n-700); }',
      '.ps-table-note { font-size: 0.78rem; color: var(--n-500); margin: 0 0 8px; line-height: 1.35; }',
      '.bmp-status-ok { font-weight: 600; color: #166534; }',
      '.bmp-status-warn { font-weight: 600; color: #a16207; }',
      '.bmp-status-blocked { font-weight: 600; color: #b91c1c; }',
      'table.results-table tr.ps-row-pick { background: var(--mode-accent-bg); }',
      '.bmp-notes-cell { font-size: 0.78rem; max-width: 240px; }',
      '.ps-eng-pick-line { font-size: 0.9rem; margin: 8px 0; }',
      '',
      '/* ── Report footer ─────────────────────────── */',
      '.report-footer {',
      '  margin-top: 32px;',
      '  padding-top: 12px;',
      '  border-top: 2px solid var(--mode-accent);',
      '  font-size: 0.8rem;',
      '  color: var(--n-500);',
      '}',
      '.report-footer-grid { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 8px; }',
      '.report-footer-company-name { font-weight: 600; color: var(--n-700); }',
      '.report-footer-disclaimer { font-style: italic; max-width: 50%; }',
      '.report-generated-by { margin-top: 4px; font-size: 0.75rem; }',
      '',
      '/* ── Empty / error states ───────────────────── */',
      '.results-empty { color: var(--n-500); font-style: italic; }',
      '.results-errors { color: var(--error-text); }',
      '.error-item { color: var(--error-text); }',
      '.warning-item { color: var(--warning-text); }',
      '',
      '/* ── Print styles ──────────────────────────── */',
      '@media print {',
      '  .no-print { display: none !important; }',
      '  body.report-body { max-width: 100%; padding: 0; font-size: 11pt; }',
      '  .report-header { border-bottom: 2px solid #000; }',
      '  .ps-section { page-break-inside: avoid; }',
      '  .strategy-panel { page-break-inside: avoid; }',
      '  .ps-explanation-grid { grid-template-columns: 1fr; }',
      '  .ps-profile-card { page-break-inside: avoid; }',
      '  .ps-pricing-detail { page-break-inside: avoid; }',
      '  .ps-pricing-detail[open] .ps-pricing-body { display: block; }',
      '  details[open] summary { margin-bottom: 4px; }',
      '  .results-table th { background: #eee; }',
      '  .ps-site-type-graphic img { max-height: 90px; }',
      '  .ps-asset-thumb img { max-height: 56px; max-width: 120px; }',
      '  a { text-decoration: none; color: inherit; }',
      '  .report-footer { position: running(footer); }',
      '}'
    ].join('\n');
  }


  // ── Export ─────────────────────────────────────────────────────────

  global.V3RunAnalysis = {
    run: runAnalysis,
    setPlanningRoofOnlyView: function (enabled) { _planningTopOptionsRoofOnlyView = !!enabled; },
    pickRecommended: pickRecommended,
    getDatabase: getDatabase,
    refreshDatabase: refreshDatabase,
    generateReportHTML: generateReportHTML,
    launchPurpleRoofSimulator: launchPurpleRoofSimulator
  };

})(window);