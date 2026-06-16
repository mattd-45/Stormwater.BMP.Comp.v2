(function (global) {
  const STEPS = [
    { id: 'home', label: 'Home' },
    { id: 'city', label: 'Project information' },
    { id: 'city-context', label: 'Local Requirements', requiresCity: true },
    { id: 'site', label: 'Site', requiresCity: true },
    { id: 'conditions', label: 'Conditions', requiresCity: true },
    { id: 'targets', label: 'Targets', requiresCity: true },
    { id: 'results', label: 'Recommendation', requiresCity: true }
  ];

  let activeStep = 'home';
  let alertTimer = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function getProject() {
    return global.V3State && typeof global.V3State.getRef === 'function'
      ? global.V3State.getRef()
      : {};
  }

  function getCityKey() {
    const project = getProject();
    return project.site && project.site.cityKey ? project.site.cityKey : '';
  }

  function stepIndex(stepId) {
    return STEPS.findIndex(function (step) { return step.id === stepId; });
  }

  function getStep(stepId) {
    return STEPS.find(function (step) { return step.id === stepId; }) || STEPS[0];
  }

  function showAlert(message) {
    const alert = byId('flow-alert');
    if (!alert) return;
    alert.textContent = message;
    alert.hidden = false;
    clearTimeout(alertTimer);
    alertTimer = setTimeout(function () {
      alert.hidden = true;
    }, 3600);
  }

  function canEnter(stepId, options) {
    const opts = options || {};
    const step = getStep(stepId);
    if (step.requiresCity && !getCityKey()) {
      if (!opts.silent) showAlert('Choose a city first so local requirements can load.');
      return false;
    }
    return true;
  }

  function updateProgress() {
    const currentIndex = stepIndex(activeStep);
    document.querySelectorAll('[data-flow-goto]').forEach(function (btn) {
      const target = btn.getAttribute('data-flow-goto');
      const targetIndex = stepIndex(target);
      const isProgress = btn.classList.contains('flow-progress-step');
      btn.classList.toggle('is-active', target === activeStep);
      if (isProgress) {
        btn.classList.toggle('is-complete', targetIndex >= 0 && targetIndex < currentIndex);
        if (target === activeStep) {
          btn.setAttribute('aria-current', 'step');
        } else {
          btn.removeAttribute('aria-current');
        }
      }
    });
  }

  function updateStepNav() {
    const currentIndex = stepIndex(activeStep);
    document.querySelectorAll('[data-flow-prev]').forEach(function (btn) {
      btn.disabled = currentIndex <= 0;
    });
  }

  /** Engineering-only utility bar: inside Step 6 card on results, below other steps otherwise. */
  function mountUtilityActionsBar(stepId) {
    const bar = byId('section-actions');
    const engSlot = byId('engineering-actions-slot');
    const resSlot = byId('results-actions-slot');
    if (!bar) return;

    const mode = document.body.getAttribute('data-mode') || 'planning';
    if (mode === 'planning') {
      if (engSlot) {
        engSlot.hidden = true;
        engSlot.setAttribute('aria-hidden', 'true');
      }
      return;
    }

    if (stepId === 'results' && resSlot) {
      if (engSlot) {
        engSlot.hidden = true;
        engSlot.setAttribute('aria-hidden', 'true');
      }
      resSlot.appendChild(bar);
      return;
    }

    if (engSlot) {
      engSlot.hidden = false;
      engSlot.removeAttribute('aria-hidden');
      engSlot.appendChild(bar);
    }
  }

  function showStep(stepId, options) {
    const opts = options || {};
    const target = getStep(stepId).id;
    if (!canEnter(target, opts)) {
      if (!opts.silent) showStep('city', { silent: true, replaceHash: true });
      return false;
    }

    activeStep = target;
    document.body.setAttribute('data-flow-step', target);

    let activeSection = null;
    document.querySelectorAll('[data-flow-step]').forEach(function (section) {
      const isActive = section.getAttribute('data-flow-step') === target;
      section.classList.toggle('is-active', isActive);
      section.hidden = !isActive;
      if (isActive) activeSection = section;
      if (section.id === 'section-results') {
        section.style.removeProperty('display');
      }
    });

    updateProgress();
    updateStepNav();
    updateCityStory();
    mountUtilityActionsBar(target);

    if (!opts.preserveScroll) {
      const scrollTarget = activeSection || byId('app-main');
      if (scrollTarget) scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (!opts.skipHash) {
      const hash = '#' + target;
      if (opts.replaceHash) {
        history.replaceState(null, '', hash);
      } else if (window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
    }

    return true;
  }

  function showRelative(direction) {
    const currentIndex = stepIndex(activeStep);
    const nextIndex = Math.max(0, Math.min(STEPS.length - 1, currentIndex + direction));
    showStep(STEPS[nextIndex].id);
  }

  function sectionToSalesLine(summarySection) {
    if (!summarySection) return '';
    if (Array.isArray(summarySection)) return summarySection[0] || '';
    if (summarySection.salesOneLiner) return summarySection.salesOneLiner;
    if (Array.isArray(summarySection.items)) return summarySection.items[0] || '';
    return '';
  }

  function escHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(value) {
    return escHtml(value).replace(/'/g, '&#39;');
  }

  function cityImageSrc(iconPath) {
    if (!iconPath) return '';
    const raw = String(iconPath);
    if (/^(https?:|data:|\/|\.\/|\.\.\/)/i.test(raw)) return raw;
    return '../' + raw;
  }

  function updateCityContextTitle(city, cityKey) {
    const titleCity = byId('city-context-title-city');
    const imageWrap = byId('city-context-image');
    if (titleCity) {
      const label = city ? String(city.name || cityKey || '').trim() : '';
      titleCity.textContent = label;
      if (label) titleCity.setAttribute('title', label);
      else titleCity.removeAttribute('title');
    }
    if (!imageWrap) return;

    const cityName = city ? (city.name || cityKey || '') : '';
    const imageSrc = city ? cityImageSrc(city.icon) : '';
    if (!imageSrc) {
      imageWrap.hidden = true;
      imageWrap.innerHTML = '';
      imageWrap.classList.remove('is-missing');
      return;
    }

    imageWrap.hidden = false;
    imageWrap.classList.remove('is-missing');
    imageWrap.innerHTML = '<img src="' + escAttr(imageSrc) + '" alt="' + escAttr(cityName + ' local requirements image') + '" onerror="this.closest(\'.flow-city-image\').classList.add(\'is-missing\'); this.remove();">';
  }

  function updateCityStory() {
    const wrap = byId('city-story-summary');
    if (!wrap) return;

    const cityKey = getCityKey();
    const city = cityKey && typeof CITY_DATA !== 'undefined' ? CITY_DATA[cityKey] : null;
    updateCityContextTitle(city, cityKey);
    if (!city) {
      wrap.innerHTML = '<p class="city-story-empty">Select a city or jurisdiction to load this quick profile.</p>';
      return;
    }

    const summary = typeof CITY_REG_SUMMARIES !== 'undefined' && CITY_REG_SUMMARIES[cityKey]
      ? CITY_REG_SUMMARIES[cityKey]
      : {};
    const lines = [
      sectionToSalesLine(summary.regulatoryOverview),
      sectionToSalesLine(summary.soilConditions),
      sectionToSalesLine(summary.greenRoofRequirements || summary.retentionRequirements)
    ].filter(Boolean).slice(0, 3);

    let html = '<div class="city-story-card">';
    html += '<div class="city-story-main">';
    if (lines.length) {
      html += '<ul>';
      lines.forEach(function (line) {
        html += '<li>' + escHtml(line) + '</li>';
      });
      html += '</ul>';
    } else {
      html += '<p>Use the regulatory overview below to walk the client through the local requirements.</p>';
    }
    html += '</div>';
    html += '</div>';
    wrap.innerHTML = html;
  }

  function bindNav() {
    document.addEventListener('click', function (event) {
      const goto = event.target.closest('[data-flow-goto]');
      if (goto) {
        event.preventDefault();
        showStep(goto.getAttribute('data-flow-goto'));
        return;
      }

      if (event.target.closest('[data-flow-next]')) {
        event.preventDefault();
        showRelative(1);
        return;
      }

      if (event.target.closest('[data-flow-prev]')) {
        event.preventDefault();
        showRelative(-1);
      }
    });
  }

  function bindActions() {
    const flowRun = byId('flow-run-analysis');
    if (flowRun) {
      flowRun.addEventListener('click', function () {
        if (!canEnter('targets')) return;
        if (global.V3RunAnalysis && typeof global.V3RunAnalysis.run === 'function') {
          global.V3RunAnalysis.run();
        }
      });
    }

    const flowReport = byId('flow-generate-report');
    if (flowReport) {
      flowReport.addEventListener('click', function () {
        if (global.V3ReportView && typeof global.V3ReportView.open === 'function') {
          global.V3ReportView.open();
        }
      });
    }

    document.addEventListener('v3:analysis-complete', function () {
      showStep('results', { replaceHash: true });
    });

    window.addEventListener('hashchange', function () {
      const hashStep = window.location.hash.replace(/^#/, '');
      if (hashStep) showStep(hashStep, { skipHash: true });
    });
  }

  function ensurePlanningModeDefault() {
    const project = getProject();
    const currentMode = project.settings && project.settings.mode;
    if (currentMode === 'sales' && global.V3State && typeof global.V3State.set === 'function') {
      global.V3State.set('settings.mode', 'planning');
      if (global.V3Inputs && typeof global.V3Inputs.sync === 'function') {
        global.V3Inputs.sync();
      }
      return;
    }
    if (currentMode !== 'planning' && currentMode !== 'engineering' && global.V3State && typeof global.V3State.set === 'function') {
      global.V3State.set('settings.mode', 'planning');
      if (global.V3Inputs && typeof global.V3Inputs.sync === 'function') {
        global.V3Inputs.sync();
      }
    }
  }

  function init() {
    ensurePlanningModeDefault();
    bindNav();
    bindActions();

    if (global.V3State && typeof global.V3State.onChange === 'function') {
      global.V3State.onChange(updateCityStory);
    }

    const hashStep = window.location.hash.replace(/^#/, '');
    const initialStep = stepIndex(hashStep) >= 0 ? hashStep : 'home';
    showStep(initialStep, { replaceHash: true, preserveScroll: true });
    updateCityStory();
  }

  global.V3Flow = {
    init: init,
    showStep: showStep,
    updateCityStory: updateCityStory,
    mountUtilityActionsBar: mountUtilityActionsBar
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
