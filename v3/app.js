// ═══════════════════════════════════════════════════════════════════════════
// V3 APP — Entry point
// ═══════════════════════════════════════════════════════════════════════════
//
// Wires together: V3State (state.js) + V3Inputs (ui-inputs.js)
// Handles: save, reset, export, auto-save, restore from localStorage
//
// ═══════════════════════════════════════════════════════════════════════════

(function () {

  // ── Button wiring ──────────────────────────────────────────────────

  function bindActions() {
    const btnRun    = document.getElementById('btn-run');
    const btnReport = document.getElementById('btn-report');
    const btnAdmin  = document.getElementById('btn-admin');
    const btnSave   = document.getElementById('btn-save');
    const btnLoad   = document.getElementById('btn-load');
    const btnClear  = document.getElementById('btn-clear');
    const btnExport = document.getElementById('btn-export');
    const fileInput = document.getElementById('file-import');
    const status    = document.getElementById('save-status');

    if (btnRun) {
      btnRun.addEventListener('click', () => {
        try {
          console.log('[V3] Run Analysis clicked');
          V3RunAnalysis.run();
        } catch (e) {
          console.error('[V3] Run Analysis error:', e);
          alert('Analysis error: ' + e.message);
        }
      });
    }

    if (btnReport) {
      btnReport.addEventListener('click', () => {
        try {
          console.log('[V3] Generate Report clicked');
          V3ReportView.open();
        } catch (e) {
          console.error('[V3] Report generation error:', e);
          alert('Report error: ' + e.message);
        }
      });
    }

    if (btnAdmin) {
      btnAdmin.addEventListener('click', () => {
        // In standalone builds the admin editor is a sibling file;
        // in dev mode it's in the same directory.
        var href = 'admin-editor-standalone.html';
        window.open(href, '_blank');
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        V3State.save();
        _flashStatus(status, 'Saved');
      });
    }

    // Load Project — triggers hidden file input to import a .json file
    if (btnLoad && fileInput) {
      btnLoad.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const ok = V3State.importJSON(ev.target.result);
          if (ok) {
            V3Inputs.markSiteTypeLayoutPicked();
            V3Inputs.sync();
            V3State.save();
            _flashStatus(status, 'Loaded: ' + file.name);
          } else {
            alert('Could not load project file. The file may be corrupted or in an unsupported format.');
          }
        };
        reader.onerror = () => {
          alert('Error reading file.');
        };
        reader.readAsText(file);

        // Reset file input so the same file can be loaded again
        fileInput.value = '';
      });
    }

    // Clear Project — removes localStorage and resets to defaults
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Clear all project data and reset to defaults? Saved data in the browser will be removed.')) {
          V3State.clear();
          V3Inputs.clearSiteTypeLayout();
          V3Inputs.sync();
          _flashStatus(status, 'Project cleared');
        }
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        V3State.exportJSON();
        _flashStatus(status, 'Exported');
      });
    }
  }

  function _flashStatus(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    setTimeout(() => { el.classList.remove('visible'); }, 2000);
  }


  // ── Auto-save on change ────────────────────────────────────────────

  let _saveTimer = null;

  function setupAutoSave() {
    V3State.onChange(() => {
      // Debounce: save 500ms after last change
      clearTimeout(_saveTimer);
      _saveTimer = setTimeout(() => { V3State.save(); }, 500);
    });
  }


  // ── Init ───────────────────────────────────────────────────────────

  function init() {
    // Try to restore saved state
    const restored = V3State.load();

    // Initialize UI bindings (populates dropdowns, binds events)
    V3Inputs.init({ restoredFromStorage: restored });

    // If state was restored, sync DOM again (init already syncs, but
    // load() may have happened before init populated the dropdowns)
    if (restored) {
      V3Inputs.sync();
    }

    // Ensure created date is set on first use
    const project = V3State.getRef();
    if (!project.projectInfo.createdDate) {
      V3State.set('projectInfo.createdDate', new Date().toISOString().slice(0, 10));
    }

    // Wire action buttons
    bindActions();

    // Start auto-save
    setupAutoSave();

    console.log('[V3] App initialized.' + (restored ? ' State restored from localStorage.' : ' Using defaults.'));
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
