// ═══════════════════════════════════════════════════════════════════════════
// V3 STATE MANAGER
// ═══════════════════════════════════════════════════════════════════════════
//
// Single source of truth for the v3 project object.
// Reads/writes to the ProjectSchema defined in v3-project-schema.js.
// Persists to localStorage. Notifies listeners on change.
//
// API:
//   V3State.get()                        → current project (deep copy)
//   V3State.getRef()                     → current project (live reference, read-only use)
//   V3State.set(path, value)             → update a field by dot-path
//   V3State.reset()                      → reset to defaults
//   V3State.save()                       → persist to localStorage
//   V3State.load()                       → restore from localStorage
//   V3State.exportJSON()                 → download project as .json file
//   V3State.onChange(callback)           → register listener
//
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {

  const STORAGE_KEY = 'v3-current-project';
  const LEGACY_KEY  = 'v3_project_state';   // old key — migrated on first load

  // Current project state — initialized from schema defaults
  let _project = createDefaultProject();

  // Change listeners
  const _listeners = [];

  /** Legacy project files used settings.mode "sales"; canonical value is "planning". */
  function normalizeLegacyMode(project) {
    if (project && project.settings && project.settings.mode === 'sales') {
      project.settings.mode = 'planning';
    }
  }


  // ── Deep helpers ────────────────────────────────────────────────────

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Get a nested value by dot-path string.
   * e.g. getByPath(obj, 'site.areas.slopedRoofArea')
   */
  function getByPath(obj, path) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }

  /**
   * Set a nested value by dot-path string.
   * Creates intermediate objects if needed.
   * e.g. setByPath(obj, 'site.areas.slopedRoofArea', 750)
   */
  function setByPath(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] == null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }


  // ── Public API ─────────────────────────────────────────────────────

  const V3State = {

    /**
     * Returns a deep copy of the current project state.
     * Safe to modify — changes won't affect internal state.
     */
    get() {
      return deepCopy(_project);
    },

    /**
     * Returns a live reference to the current project.
     * For read-only use (e.g. debug display). Do not mutate directly.
     */
    getRef() {
      return _project;
    },

    /**
     * Update a single field by dot-path.
     * Coerces types based on current value:
     *   - if current value is number → Number(value)
     *   - if current value is boolean → Boolean(value)
     *   - if current value is string → String(value)
     *   - null → accepts any type
     *
     * @param {string} path — dot-separated path (e.g. 'site.areas.slopedRoofArea')
     * @param {*} value — new value
     */
    set(path, value) {
      const current = getByPath(_project, path);

      // Type coercion based on existing field type
      let coerced = value;
      if (typeof current === 'number') {
        coerced = Number(value) || 0;
        if (coerced < 0 && path.includes('areas.')) coerced = 0;
        if (coerced < 0 && path.includes('CF')) coerced = 0;
      } else if (typeof current === 'boolean') {
        coerced = (value === true || value === 'true' || value === 1);
      } else if (typeof current === 'string') {
        coerced = String(value || '');
      }
      // Nullable fields: cityKey, presetKey, soilType, maxRoofLoadPSF
      // These default to null in the schema. Convert empty string → null
      // so selects that reset to "" store null (not "").
      const NULLABLE_PATHS = [
        'site.cityKey', 'site.presetKey', 'site.soilType',
        'constraints.maxRoofLoadPSF'
      ];
      if (NULLABLE_PATHS.includes(path) && (coerced === '' || coerced === null)) {
        coerced = null;
      }

      setByPath(_project, path, coerced);

      // Update modified date
      _project.projectInfo.modifiedDate = new Date().toISOString().slice(0, 10);

      // Notify listeners
      _notify(path, coerced);
    },

    /**
     * Reset project to schema defaults.
     */
    reset() {
      _project = createDefaultProject();
      _notify('*', null);
    },

    /**
     * Persist current state to localStorage.
     */
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_project));
        return true;
      } catch (e) {
        console.warn('V3State.save() failed:', e);
        return false;
      }
    },

    /**
     * Restore state from localStorage.
     * Returns true if state was restored, false if no saved state exists.
     * Validates schema version and falls back to defaults on corruption.
     */
    load() {
      try {
        let raw = localStorage.getItem(STORAGE_KEY);

        // Migrate from legacy key if new key is empty
        if (!raw) {
          raw = localStorage.getItem(LEGACY_KEY);
          if (raw) {
            localStorage.setItem(STORAGE_KEY, raw);
            localStorage.removeItem(LEGACY_KEY);
            console.log('[V3State] Migrated saved project from legacy key.');
          }
        }

        if (!raw) return false;

        const saved = JSON.parse(raw);
        if (!saved || typeof saved !== 'object') return false;

        // Version check — if saved version is newer than current schema,
        // warn but still attempt to load (forward compat).
        // If saved version is older, migration stubs can be added here.
        const savedVersion = saved.schemaVersion || '0';
        const currentVersion = SCHEMA_VERSION || '3.0';
        if (savedVersion !== currentVersion) {
          console.warn('[V3State] Schema version mismatch: saved=' + savedVersion +
            ', current=' + currentVersion + '. Merging with defaults.');
          // Future: add migration logic here per version
        }

        // Merge saved data onto fresh defaults (ensures new schema fields get defaults)
        const fresh = createDefaultProject();
        _mergeDeep(fresh, saved);
        normalizeLegacyMode(fresh);
        // Always stamp current schema version
        fresh.schemaVersion = currentVersion;
        _project = fresh;

        _notify('*', null);
        return true;
      } catch (e) {
        console.warn('[V3State] load() failed — corrupted data, using defaults:', e);
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
    },

    /**
     * Import a project from a JSON string (e.g. from file upload).
     * Merges onto defaults like load(). Returns true on success.
     */
    importJSON(jsonString) {
      try {
        const saved = JSON.parse(jsonString);
        if (!saved || typeof saved !== 'object') {
          console.warn('[V3State] importJSON: invalid JSON object');
          return false;
        }

        const fresh = createDefaultProject();
        _mergeDeep(fresh, saved);
        normalizeLegacyMode(fresh);
        fresh.schemaVersion = SCHEMA_VERSION || '3.0';
        fresh.projectInfo.modifiedDate = new Date().toISOString().slice(0, 10);
        _project = fresh;

        _notify('*', null);
        return true;
      } catch (e) {
        console.warn('[V3State] importJSON failed:', e);
        return false;
      }
    },

    /**
     * Clear saved project from localStorage and reset to defaults.
     */
    clear() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      _project = createDefaultProject();
      _notify('*', null);
    },

    /**
     * Export current project as a downloadable .json file.
     */
    exportJSON() {
      const json = JSON.stringify(_project, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (_project.projectInfo.projectName || 'v3-project')
        .replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      a.href = url;
      a.download = name + '.json';
      a.click();
      URL.revokeObjectURL(url);
    },

    /**
     * Register a change listener.
     * Called with (path, value) after every set() or reset().
     * path is '*' on reset or load.
     */
    onChange(callback) {
      if (typeof callback === 'function') {
        _listeners.push(callback);
      }
    }
  };


  // ── Internal helpers ────────────────────────────────────────────────

  function _notify(path, value) {
    for (const fn of _listeners) {
      try { fn(path, value); } catch (e) { console.error('V3State listener error:', e); }
    }
  }

  /**
   * Deep merge source into target. Only overwrites leaves.
   * Does not add keys that don't exist in target (schema-safe).
   */
  function _mergeDeep(target, source) {
    for (const key of Object.keys(target)) {
      if (!(key in source)) continue;
      const tVal = target[key];
      const sVal = source[key];
      if (tVal !== null && typeof tVal === 'object' && !Array.isArray(tVal) &&
          sVal !== null && typeof sVal === 'object' && !Array.isArray(sVal)) {
        _mergeDeep(tVal, sVal);
      } else {
        target[key] = sVal;
      }
    }
  }


  // ── Export ──────────────────────────────────────────────────────────

  global.V3State = V3State;

})(window);
