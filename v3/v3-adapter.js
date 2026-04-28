// ═══════════════════════════════════════════════════════════════════════════
// V3 ADAPTER — Maps v3 ProjectSchema to the existing engine input shape
// ═══════════════════════════════════════════════════════════════════════════
//
// PURPOSE:
//   Converts a v3 project object (defined in v3-project-schema.js) into the
//   exact { cityKey, inputs, overrides } shape expected by runModel() in
//   engine/model.js — without changing the engine.
//
// THE ENGINE EXPECTS (model.js line 420):
//   runModel(project, database)
//   where project = {
//     cityKey:   string,
//     inputs:    ProjectInputs,   // { areas, targets, constraints, assumptions, flags }
//     overrides: object           // per-BMP pricing/spec overrides keyed by bmpId
//   }
//
// THE ENGINE THEN INTERNALLY FLATTENS inputs INTO v1Inputs (model.js line 444):
//   const v1Inputs = adaptProjectInputsToEngineInputs(inputs, cityRules)
//   which produces the flat shape with:
//     - area fields (direct passthrough)
//     - targetRetentionCF / targetDetentionCF (renamed from retentionCF / detentionCF)
//     - constraint booleans
//     - assumption booleans
//     - regulationProfileId (injected from cityRules, not from project)
//
// THIS ADAPTER'S JOB:
//   v3 ProjectSchema → project arg for runModel()
//   The engine handles everything after that. We do not touch v1Inputs.
//
// ═══════════════════════════════════════════════════════════════════════════


// ─── HELPERS ─────────────────────────────────────────────────────────────

/**
 * Safely coerce a value to a non-negative number.
 * Returns 0 for null, undefined, NaN, negative, or non-numeric values.
 */
function toNonNegativeNumber(val) {
  const n = Number(val);
  return (Number.isFinite(n) && n >= 0) ? n : 0;
}

/**
 * Coerce a value to boolean. Treats null/undefined as false.
 */
function toBool(val) {
  return !!val;
}


// ─── VALIDATION ──────────────────────────────────────────────────────────

/**
 * Validates a v3 project schema before adaptation.
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 *
 * Errors are blocking — the adapter will refuse to produce output.
 * Warnings are informational — the adapter will still run.
 */
function validateV3Project(schema) {
  const errors = [];
  const warnings = [];

  if (!schema) {
    errors.push('Project schema is null or undefined.');
    return { valid: false, errors, warnings };
  }

  // ── Required: cityKey ────────────────────────────────────────────────
  const cityKey = schema.site && schema.site.cityKey;
  if (!cityKey || typeof cityKey !== 'string') {
    errors.push('site.cityKey is required and must be a non-empty string.');
  }

  // ── Required: at least one area > 0 ─────────────────────────────────
  const areas = (schema.site && schema.site.areas) || {};
  const areaKeys = [
    'perviousLandscapingUsable', 'imperviousVehicularPavement',
    'imperviousPedestrianPavement', 'flatDeckOnStructureArea',
    'slopedRoofArea', 'paversOnStructureArea'
  ];
  const totalUsableArea = areaKeys.reduce((sum, k) => sum + toNonNegativeNumber(areas[k]), 0);
  if (totalUsableArea <= 0) {
    warnings.push('All site areas are 0. No BMPs will have eligible area.');
  }

  // ── Area values must be numbers ─────────────────────────────────────
  const allAreaKeys = [
    'perviousLandscapingUsable', 'imperviousVehicularPavement',
    'imperviousPedestrianPavement', 'perviousTreeCoverNonUsable',
    'flatDeckOnStructureArea', 'slopedRoofArea',
    'paversOnStructureArea', 'imperviousCAUntreated'
  ];
  for (const key of allAreaKeys) {
    const val = areas[key];
    if (val !== undefined && val !== null && val !== 0) {
      const n = Number(val);
      if (!Number.isFinite(n) || n < 0) {
        errors.push(`site.areas.${key} must be a non-negative number. Got: ${val}`);
      }
    }
  }

  // ── Targets sanity checks ───────────────────────────────────────────
  const targets = schema.targets || {};
  if (!targets.retentionNeeded && !targets.detentionNeeded) {
    warnings.push('Neither retention nor detention is flagged as needed. Engine will run but results will be trivial.');
  }
  if (targets.retentionNeeded && toNonNegativeNumber(targets.retentionCF) === 0) {
    warnings.push('Retention is needed but retentionCF is 0. Likely a missing input.');
  }
  if (targets.detentionNeeded && toNonNegativeNumber(targets.detentionCF) === 0) {
    warnings.push('Detention is needed but detentionCF is 0. Likely a missing input.');
  }

  // ── Mode must be valid ──────────────────────────────────────────────
  const mode = schema.settings && schema.settings.mode;
  if (mode && mode !== 'sales' && mode !== 'engineering') {
    errors.push(`settings.mode must be "sales" or "engineering". Got: "${mode}"`);
  }

  return { valid: errors.length === 0, errors, warnings };
}


// ─── CORE ADAPTER ────────────────────────────────────────────────────────

/**
 * Converts a v3 ProjectSchema into the engine's { cityKey, inputs, overrides } shape.
 *
 * FIELD MAPPING:
 *
 *   v3 Schema Path                              → Engine project.inputs Path
 *   ──────────────────────────────────────────   ─────────────────────────────────────
 *   site.cityKey                                → project.cityKey
 *
 *   site.areas.perviousLandscapingUsable        → inputs.areas.perviousLandscapingUsable
 *   site.areas.imperviousVehicularPavement      → inputs.areas.imperviousVehicularPavement
 *   site.areas.imperviousPedestrianPavement     → inputs.areas.imperviousPedestrianPavement
 *   site.areas.perviousTreeCoverNonUsable       → inputs.areas.perviousTreeCoverNonUsable
 *   site.areas.flatDeckOnStructureArea          → inputs.areas.flatDeckOnStructureArea
 *   site.areas.slopedRoofArea                   → inputs.areas.slopedRoofArea
 *   site.areas.paversOnStructureArea            → inputs.areas.paversOnStructureArea
 *   site.areas.imperviousCAUntreated            → inputs.areas.imperviousCAUntreated
 *
 *   targets.retentionNeeded                     → inputs.targets.retentionNeeded
 *   targets.retentionCF                         → inputs.targets.retentionCF       ← RENAMED (engine adds "target" prefix internally)
 *   targets.detentionNeeded                     → inputs.targets.detentionNeeded
 *   targets.detentionCF                         → inputs.targets.detentionCF       ← RENAMED (engine adds "target" prefix internally)
 *
 *   constraints.hasUndergroundUtilities         → inputs.constraints.hasUndergroundUtilities
 *   constraints.hasHighWaterTable               → inputs.constraints.hasHighWaterTable
 *   constraints.hasContaminatedSoil             → inputs.constraints.hasContaminatedSoil
 *   constraints.hasSiteGradingConstraint        → inputs.constraints.hasSiteGradingConstraint
 *
 *   assumptions.greenRoofAlreadyInScope         → inputs.assumptions.greenRoofAlreadyInScope
 *   assumptions.programmableSpaceIsHighValue    → inputs.assumptions.programmableSpaceIsHighValue
 *   assumptions.allowSteepSlopeGreenRoof        → inputs.assumptions.allowSteepSlopeGreenRoof
 *
 *   settings.pricingOverrides                   → project.overrides
 *
 *   FIELDS NOT PASSED TO ENGINE (UI-only or future):
 *     projectInfo.*                               — report headers only
 *     site.presetKey                              — drives design-mode area distribution, not engine
 *     site.siteType                               — future (not wired)
 *     site.soilType                               — future (not wired)
 *     site.designModeAreas.*                      — distributed to site.areas before adapter runs
 *     targets.retentionSourceNote                 — documentation only
 *     targets.detentionSourceNote                 — documentation only
 *     constraints.hasStructuralLoadLimit           — v3 screening layer in run-analysis.js
 *     constraints.maxRoofLoadPSF                   — v3 screening layer in run-analysis.js
 *     assumptions.highValueIndoorSpace             — future (not wired into engine rules)
 *     systemCategories.*                           — controls which calc modules run, not engine args
 *     settings.mode                                — controls UI rendering, not engine
 *     settings.sortResultsBy                       — post-engine sort, not engine
 *     settings.purpleRoofPricingMode               — handled via pricingOverrides on BMP 10/10B
 *     settings.showDetailCards                     — UI rendering only
 *     settings.showCostData                        — future UI toggle
 *     settings.showWeightData                      — future UI toggle
 *     schemaVersion                                — migration metadata
 *
 * @param {object} schema — v3 ProjectSchema object
 * @returns {{ project: object, validation: object }}
 *   project    — ready to pass directly to runModel(project, database)
 *   validation — { valid, errors, warnings } from pre-adaptation checks
 */
function adaptV3ToEngine(schema) {
  const validation = validateV3Project(schema);

  // If validation has blocking errors, return null project with the errors.
  if (!validation.valid) {
    return { project: null, validation };
  }

  const site = schema.site || {};
  const areas = site.areas || {};
  const targets = schema.targets || {};
  const constraints = schema.constraints || {};
  const assumptions = schema.assumptions || {};
  const settings = schema.settings || {};

  // ── Build engine project object ─────────────────────────────────────
  const project = {

    // ── cityKey ─────────────────────────────────────────────────────
    // Direct mapping. Engine uses this to look up cityRules in database.
    cityKey: site.cityKey,

    // ── inputs (ProjectInputs) ──────────────────────────────────────
    // This is the structured shape the engine expects.
    // The engine's own adaptProjectInputsToEngineInputs() (model.js:375)
    // will flatten this into v1Inputs internally.
    inputs: {

      // ── areas ───────────────────────────────────────────────────
      // All 8 fields pass through with identical names.
      // toNonNegativeNumber() ensures type safety without changing values.
      areas: {
        perviousLandscapingUsable:    toNonNegativeNumber(areas.perviousLandscapingUsable),
        imperviousVehicularPavement:  toNonNegativeNumber(areas.imperviousVehicularPavement),
        imperviousPedestrianPavement: toNonNegativeNumber(areas.imperviousPedestrianPavement),
        perviousTreeCoverNonUsable:   toNonNegativeNumber(areas.perviousTreeCoverNonUsable),
        flatDeckOnStructureArea:      toNonNegativeNumber(areas.flatDeckOnStructureArea),
        slopedRoofArea:               toNonNegativeNumber(areas.slopedRoofArea),
        paversOnStructureArea:        toNonNegativeNumber(areas.paversOnStructureArea),
        imperviousCAUntreated:        toNonNegativeNumber(areas.imperviousCAUntreated)
      },

      // ── targets ─────────────────────────────────────────────────
      // FIELD RENAME:
      //   v3 schema uses:  retentionCF / detentionCF
      //   Engine expects:  retentionCF / detentionCF  (at this level)
      //
      // The engine's internal adaptProjectInputsToEngineInputs() then
      // renames these to targetRetentionCF / targetDetentionCF when
      // flattening to v1Inputs (model.js:396-397). We do NOT do that
      // rename here — the engine handles it.
      //
      // We pass the v3 field names as-is because they match the
      // ProjectInputs.targets shape the engine reads at this layer.
      targets: {
        retentionNeeded: toBool(targets.retentionNeeded),
        retentionCF:     toNonNegativeNumber(targets.retentionCF),
        detentionNeeded: toBool(targets.detentionNeeded),
        detentionCF:     toNonNegativeNumber(targets.detentionCF)
      },

      // ── constraints ─────────────────────────────────────────────
      // All 4 core engine fields pass through with identical names.
      // Roof load fields are deliberately excluded because saturated roof
      // profile weights are resolved later in v3/run-analysis.js.
      constraints: {
        hasUndergroundUtilities:  toBool(constraints.hasUndergroundUtilities),
        hasHighWaterTable:        toBool(constraints.hasHighWaterTable),
        hasContaminatedSoil:     toBool(constraints.hasContaminatedSoil),
        hasSiteGradingConstraint: toBool(constraints.hasSiteGradingConstraint)
      },

      // ── assumptions ─────────────────────────────────────────────
      // 3 active fields pass through with identical names.
      // highValueIndoorSpace is excluded — UI-only in v2, not yet
      // consumed by engine.
      assumptions: {
        greenRoofAlreadyInScope:     toBool(assumptions.greenRoofAlreadyInScope),
        programmableSpaceIsHighValue: toBool(assumptions.programmableSpaceIsHighValue),
        allowSteepSlopeGreenRoof:    toBool(assumptions.allowSteepSlopeGreenRoof)
      },

      // ── flags ───────────────────────────────────────────────────
      // Reserved by engine for future booleans. Empty for now.
      flags: {}
    },

    // ── overrides ───────────────────────────────────────────────────
    // Per-BMP pricing/spec overrides, keyed by BMP ID (string).
    // Passes through directly from settings.pricingOverrides.
    // Example: { "10": { unitPrice: 38.00 } }
    overrides: (settings.pricingOverrides && typeof settings.pricingOverrides === 'object')
      ? { ...settings.pricingOverrides }
      : {}
  };

  return { project, validation };
}


// ─── REVERSE ADAPTER (engine results → v3 display context) ───────────────

/**
 * Attaches v3 metadata to engine results for rendering.
 * Does not modify engine output — wraps it with additional context
 * from the v3 schema that the UI needs but the engine doesn't produce.
 *
 * @param {object} engineOutput — return value from runModel()
 * @param {object} schema — original v3 ProjectSchema
 * @returns {object} — enriched output for UI consumption
 */
function enrichEngineOutput(engineOutput, schema) {
  const settings = schema.settings || {};

  return {
    // ── Engine output (untouched) ───────────────────────────────────
    ...engineOutput,

    // ── v3 display context ──────────────────────────────────────────
    v3: {
      projectInfo:      schema.projectInfo || {},
      mode:             settings.mode || 'sales',
      sortResultsBy:    settings.sortResultsBy || 'totalCost',
      showDetailCards:  settings.showDetailCards !== false,
      systemCategories: schema.systemCategories || {},
      cityKey:          (schema.site && schema.site.cityKey) || null,
      presetKey:        (schema.site && schema.site.presetKey) || null
    }
  };
}


// ─── SORTED RESULTS HELPER ───────────────────────────────────────────────

/**
 * Sorts stormwater results array by the specified criteria.
 * Applied AFTER the engine runs — does not affect engine logic.
 *
 * @param {Array} results — engine stormwater.results array
 * @param {string} sortBy — 'totalCost' | 'costPerCF' | 'areaRequired' | 'bmpId'
 * @returns {Array} — new sorted array (does not mutate original)
 */
function sortResults(results, sortBy) {
  if (!Array.isArray(results) || results.length === 0) return results;

  const sorted = [...results];

  switch (sortBy) {
    case 'totalCost':
      // Lowest total designed cost first. Non-viable BMPs sort to bottom.
      sorted.sort((a, b) => {
        if (a.isViable !== b.isViable) return a.isViable ? -1 : 1;
        return (a.costDesigned || Infinity) - (b.costDesigned || Infinity);
      });
      break;

    case 'costPerCF':
      // Lowest cost per cubic foot first. Zero/Infinity sort to bottom.
      sorted.sort((a, b) => {
        if (a.isViable !== b.isViable) return a.isViable ? -1 : 1;
        const aCpf = a.costPerCf > 0 ? a.costPerCf : Infinity;
        const bCpf = b.costPerCf > 0 ? b.costPerCf : Infinity;
        return aCpf - bCpf;
      });
      break;

    case 'areaRequired':
      // Least area required first (most area-efficient).
      sorted.sort((a, b) => {
        if (a.isViable !== b.isViable) return a.isViable ? -1 : 1;
        const aArea = Number.isFinite(a.grossAreaNeeded) ? a.grossAreaNeeded : Infinity;
        const bArea = Number.isFinite(b.grossAreaNeeded) ? b.grossAreaNeeded : Infinity;
        return aArea - bArea;
      });
      break;

    case 'bmpId':
    default:
      // Original BMP definition order (matches v2 behavior).
      // results are already in this order from the engine.
      break;
  }

  return sorted;
}


// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE DATA — for testing and verification
// ═══════════════════════════════════════════════════════════════════════════


// ─── SAMPLE V3 PROJECT ───────────────────────────────────────────────────
//
// Represents a typical NYC project with:
//   - 2,000 SF site (500 each: landscape, vehicular, flat deck, sloped roof)
//   - 100 CF retention + 100 CF detention targets
//   - Underground utilities present (blocks subsurface BMPs)
//   - Green roof already in scope (switches Purple-Roof to upgrade pricing)
//   - Engineering mode

const SAMPLE_V3_PROJECT = {
  schemaVersion: '3.0',

  projectInfo: {
    projectName:   'Sample Mixed-Use Development',
    projectAddress: '123 Main Street, New York, NY 10001',
    clientName:     'Jane Smith',
    clientAddress:  '456 Park Avenue, New York, NY 10022',
    clientCompany:  'Acme Development Corp',
    preparedBy:     'Matt Draus',
    projectId:      'proj-001',
    createdDate:    '2026-04-06',
    modifiedDate:   '2026-04-06',
    notes:          'Initial screening for stormwater compliance under USWR.'
  },

  site: {
    cityKey:   'nyc',
    presetKey: 'balanced',
    siteType:  'new_development',
    soilType:  null,

    designModeAreas: {
      totalSiteAreaSF:  50000,
      totalBuildingSF:  25000,
      totalLandscapeSF: 12500,
      totalParkingSF:   12500
    },

    areas: {
      perviousLandscapingUsable:    500,
      imperviousVehicularPavement:  500,
      imperviousPedestrianPavement: 0,
      perviousTreeCoverNonUsable:   0,
      flatDeckOnStructureArea:      500,
      slopedRoofArea:               500,
      paversOnStructureArea:        0,
      imperviousCAUntreated:        0
    }
  },

  targets: {
    retentionNeeded:     true,
    retentionCF:         100,
    detentionNeeded:     true,
    detentionCF:         100,
    retentionSourceNote: 'NYC DEP USWR 1.5" WQv in MS4 area',
    detentionSourceNote: 'Civil engineer calc per USWR CSS release rate'
  },

  constraints: {
    hasUndergroundUtilities:  true,
    hasHighWaterTable:        false,
    hasContaminatedSoil:      false,
    hasSiteGradingConstraint: false,
    hasStructuralLoadLimit:   false,
    maxRoofLoadPSF:           null
  },

  assumptions: {
    greenRoofAlreadyInScope:     true,
    programmableSpaceIsHighValue: false,
    allowSteepSlopeGreenRoof:    false,
    highValueIndoorSpace:        false
  },

  systemCategories: {
    stormwater:     true,
    vpv:            false,
    traditionalPV:  false,
    fallProtection: false,
    livingWall:     false,
    ballastedSolar: false
  },

  settings: {
    mode:                    'engineering',
    sortResultsBy:           'totalCost',
    pricingOverrides:        {},
    purpleRoofPricingMode:   'green',
    showDetailCards:          true,
    showCostData:             true,
    showWeightData:           false
  }
};


// ─── EXPECTED ADAPTED OUTPUT ─────────────────────────────────────────────
//
// This is what adaptV3ToEngine(SAMPLE_V3_PROJECT) should produce
// in the .project field. This is the exact shape passed to runModel().

const EXPECTED_ENGINE_PROJECT = {
  cityKey: 'nyc',

  inputs: {
    areas: {
      perviousLandscapingUsable:    500,
      imperviousVehicularPavement:  500,
      imperviousPedestrianPavement: 0,
      perviousTreeCoverNonUsable:   0,
      flatDeckOnStructureArea:      500,
      slopedRoofArea:               500,
      paversOnStructureArea:        0,
      imperviousCAUntreated:        0
    },
    targets: {
      retentionNeeded: true,
      retentionCF:     100,
      detentionNeeded: true,
      detentionCF:     100
    },
    constraints: {
      hasUndergroundUtilities:  true,
      hasHighWaterTable:        false,
      hasContaminatedSoil:      false,
      hasSiteGradingConstraint: false
    },
    assumptions: {
      greenRoofAlreadyInScope:     true,
      programmableSpaceIsHighValue: false,
      allowSteepSlopeGreenRoof:    false
    },
    flags: {}
  },

  overrides: {}
};

// Fields from v3 schema that are correctly EXCLUDED from engine project:
//
//   projectInfo.*                    → not in engine project (UI-only)
//   site.presetKey                   → not in engine project (UI-only)
//   site.siteType                    → not in engine project (future)
//   site.soilType                    → not in engine project (future)
//   site.designModeAreas.*           → not in engine project (UI-only)
//   targets.retentionSourceNote      → not in engine project (documentation)
//   targets.detentionSourceNote      → not in engine project (documentation)
//   constraints.hasStructuralLoadLimit → not in engine project (future)
//   constraints.maxRoofLoadPSF       → not in engine project (future)
//   assumptions.highValueIndoorSpace → not in engine project (future)
//   systemCategories.*               → not in engine project (module selection)
//   settings.mode                    → not in engine project (UI rendering)
//   settings.sortResultsBy           → not in engine project (post-engine sort)
//   settings.purpleRoofPricingMode   → not in engine project (handled separately)
//   settings.showDetailCards         → not in engine project (UI rendering)
//   settings.showCostData            → not in engine project (future UI)
//   settings.showWeightData          → not in engine project (future UI)
//   schemaVersion                    → not in engine project (migration metadata)


// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION TEST
// ═══════════════════════════════════════════════════════════════════════════
//
// Run this in Node.js or browser console to verify the adapter is correct.
// Requires no dependencies — pure object comparison.

function runAdapterValidation() {
  const result = adaptV3ToEngine(SAMPLE_V3_PROJECT);
  const project = result.project;
  const checks = [];

  // ── 1. Adapter produced a project ───────────────────────────────────
  checks.push({
    name: 'Adapter returns non-null project',
    pass: project !== null
  });

  // ── 2. Validation passed ────────────────────────────────────────────
  checks.push({
    name: 'Validation has no errors',
    pass: result.validation.valid === true && result.validation.errors.length === 0
  });

  // ── 3. cityKey correct ──────────────────────────────────────────────
  checks.push({
    name: 'cityKey is "nyc"',
    pass: project.cityKey === 'nyc'
  });

  // ── 4. All 8 area fields present and correct ────────────────────────
  const expectedAreas = EXPECTED_ENGINE_PROJECT.inputs.areas;
  for (const [key, val] of Object.entries(expectedAreas)) {
    checks.push({
      name: `areas.${key} = ${val}`,
      pass: project.inputs.areas[key] === val
    });
  }

  // ── 5. No extra area fields leaked in ───────────────────────────────
  const engineAreaKeys = Object.keys(EXPECTED_ENGINE_PROJECT.inputs.areas).sort();
  const actualAreaKeys = Object.keys(project.inputs.areas).sort();
  checks.push({
    name: 'areas has exactly 8 fields (no extras)',
    pass: JSON.stringify(engineAreaKeys) === JSON.stringify(actualAreaKeys)
  });

  // ── 6. Target fields correct (name alignment check) ─────────────────
  checks.push({
    name: 'targets.retentionCF = 100 (not targetRetentionCF)',
    pass: project.inputs.targets.retentionCF === 100
  });
  checks.push({
    name: 'targets.detentionCF = 100 (not targetDetentionCF)',
    pass: project.inputs.targets.detentionCF === 100
  });
  checks.push({
    name: 'targets.retentionNeeded = true',
    pass: project.inputs.targets.retentionNeeded === true
  });
  checks.push({
    name: 'targets.detentionNeeded = true',
    pass: project.inputs.targets.detentionNeeded === true
  });

  // ── 7. No target "source note" fields leaked ────────────────────────
  checks.push({
    name: 'targets does not contain retentionSourceNote',
    pass: !('retentionSourceNote' in project.inputs.targets)
  });
  checks.push({
    name: 'targets does not contain detentionSourceNote',
    pass: !('detentionSourceNote' in project.inputs.targets)
  });

  // ── 8. Constraint fields correct ────────────────────────────────────
  checks.push({
    name: 'constraints.hasUndergroundUtilities = true',
    pass: project.inputs.constraints.hasUndergroundUtilities === true
  });
  checks.push({
    name: 'constraints.hasHighWaterTable = false',
    pass: project.inputs.constraints.hasHighWaterTable === false
  });
  checks.push({
    name: 'constraints.hasContaminatedSoil = false',
    pass: project.inputs.constraints.hasContaminatedSoil === false
  });
  checks.push({
    name: 'constraints.hasSiteGradingConstraint = false',
    pass: project.inputs.constraints.hasSiteGradingConstraint === false
  });

  // ── 9. Future constraint fields excluded ────────────────────────────
  checks.push({
    name: 'constraints does not contain hasStructuralLoadLimit',
    pass: !('hasStructuralLoadLimit' in project.inputs.constraints)
  });
  checks.push({
    name: 'constraints does not contain maxRoofLoadPSF',
    pass: !('maxRoofLoadPSF' in project.inputs.constraints)
  });

  // ── 10. Assumption fields correct ───────────────────────────────────
  checks.push({
    name: 'assumptions.greenRoofAlreadyInScope = true',
    pass: project.inputs.assumptions.greenRoofAlreadyInScope === true
  });
  checks.push({
    name: 'assumptions.programmableSpaceIsHighValue = false',
    pass: project.inputs.assumptions.programmableSpaceIsHighValue === false
  });
  checks.push({
    name: 'assumptions.allowSteepSlopeGreenRoof = false',
    pass: project.inputs.assumptions.allowSteepSlopeGreenRoof === false
  });

  // ── 11. Future assumption fields excluded ───────────────────────────
  checks.push({
    name: 'assumptions does not contain highValueIndoorSpace',
    pass: !('highValueIndoorSpace' in project.inputs.assumptions)
  });

  // ── 12. flags is empty object ───────────────────────────────────────
  checks.push({
    name: 'flags is empty object',
    pass: JSON.stringify(project.inputs.flags) === '{}'
  });

  // ── 13. overrides is empty object (no pricing overrides in sample) ──
  checks.push({
    name: 'overrides is empty object',
    pass: JSON.stringify(project.overrides) === '{}'
  });

  // ── 14. No UI-only fields leaked into engine project ────────────────
  checks.push({
    name: 'No projectInfo in engine project',
    pass: !('projectInfo' in project)
  });
  checks.push({
    name: 'No settings in engine project',
    pass: !('settings' in project)
  });
  checks.push({
    name: 'No systemCategories in engine project',
    pass: !('systemCategories' in project)
  });
  checks.push({
    name: 'No schemaVersion in engine project',
    pass: !('schemaVersion' in project)
  });
  checks.push({
    name: 'No site in engine project (areas are under inputs.areas)',
    pass: !('site' in project)
  });

  // ── 15. Deep equality with expected output ──────────────────────────
  checks.push({
    name: 'Full deep equality with EXPECTED_ENGINE_PROJECT',
    pass: JSON.stringify(project) === JSON.stringify(EXPECTED_ENGINE_PROJECT)
  });

  // ── Report ──────────────────────────────────────────────────────────
  const passed = checks.filter(c => c.pass).length;
  const failed = checks.filter(c => !c.pass);

  console.log(`\nV3 Adapter Validation: ${passed}/${checks.length} passed\n`);
  if (failed.length > 0) {
    console.log('FAILURES:');
    failed.forEach(c => console.log(`  ✗ ${c.name}`));
  } else {
    console.log('All checks passed.');
  }

  return { passed, total: checks.length, failed };
}


// ─── EDGE CASE TESTS ─────────────────────────────────────────────────────

function runEdgeCaseTests() {
  const checks = [];

  // ── Null schema ─────────────────────────────────────────────────────
  const r1 = adaptV3ToEngine(null);
  checks.push({
    name: 'Null schema returns null project with errors',
    pass: r1.project === null && r1.validation.errors.length > 0
  });

  // ── Missing cityKey ─────────────────────────────────────────────────
  const r2 = adaptV3ToEngine({ site: { areas: {} }, targets: {}, constraints: {}, assumptions: {}, settings: {} });
  checks.push({
    name: 'Missing cityKey returns null project',
    pass: r2.project === null && r2.validation.errors.some(e => e.includes('cityKey'))
  });

  // ── Negative area values coerced to 0 ───────────────────────────────
  const r3 = adaptV3ToEngine({
    site: { cityKey: 'nyc', areas: { slopedRoofArea: -100, flatDeckOnStructureArea: 500 } },
    targets: { retentionNeeded: true, retentionCF: 50 },
    constraints: {},
    assumptions: {},
    settings: {}
  });
  // Negative area should trigger validation error
  checks.push({
    name: 'Negative area value triggers validation error',
    pass: r3.project === null && r3.validation.errors.some(e => e.includes('slopedRoofArea'))
  });

  // ── String numbers coerced correctly ────────────────────────────────
  const r4 = adaptV3ToEngine({
    site: { cityKey: 'dc', areas: { slopedRoofArea: '750', flatDeckOnStructureArea: '250' } },
    targets: { retentionNeeded: true, retentionCF: '50', detentionNeeded: false, detentionCF: 0 },
    constraints: {},
    assumptions: {},
    settings: {}
  });
  checks.push({
    name: 'String numbers coerced to numbers',
    pass: r4.project !== null &&
          r4.project.inputs.areas.slopedRoofArea === 750 &&
          r4.project.inputs.targets.retentionCF === 50
  });

  // ── Empty overrides vs no overrides ─────────────────────────────────
  const r5 = adaptV3ToEngine({
    site: { cityKey: 'dc', areas: { slopedRoofArea: 500 } },
    targets: { retentionNeeded: true, retentionCF: 50 },
    constraints: {},
    assumptions: {},
    settings: { pricingOverrides: null }
  });
  checks.push({
    name: 'Null pricingOverrides becomes empty object',
    pass: r5.project !== null && JSON.stringify(r5.project.overrides) === '{}'
  });

  // ── Pricing overrides pass through ──────────────────────────────────
  const r6 = adaptV3ToEngine({
    site: { cityKey: 'nyc', areas: { slopedRoofArea: 500 } },
    targets: { retentionNeeded: true, retentionCF: 50 },
    constraints: {},
    assumptions: {},
    settings: { pricingOverrides: { '10': { unitPrice: 38.00 }, '1': { specs: { soilDepth: 30 } } } }
  });
  checks.push({
    name: 'Pricing overrides pass through to project.overrides',
    pass: r6.project !== null &&
          r6.project.overrides['10'].unitPrice === 38 &&
          r6.project.overrides['1'].specs.soilDepth === 30
  });

  // ── Report ──────────────────────────────────────────────────────────
  const passed = checks.filter(c => c.pass).length;
  const failed = checks.filter(c => !c.pass);

  console.log(`\nEdge Case Tests: ${passed}/${checks.length} passed\n`);
  if (failed.length > 0) {
    console.log('FAILURES:');
    failed.forEach(c => console.log(`  ✗ ${c.name}`));
  } else {
    console.log('All edge case checks passed.');
  }

  return { passed, total: checks.length, failed };
}


// ─── EXPORT ──────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    adaptV3ToEngine,
    enrichEngineOutput,
    sortResults,
    validateV3Project,
    toNonNegativeNumber,
    toBool,
    SAMPLE_V3_PROJECT,
    EXPECTED_ENGINE_PROJECT,
    runAdapterValidation,
    runEdgeCaseTests
  };
}
if (typeof window !== 'undefined') {
  window.adaptV3ToEngine = adaptV3ToEngine;
  window.enrichEngineOutput = enrichEngineOutput;
  window.sortResults = sortResults;
  window.validateV3Project = validateV3Project;
  window.SAMPLE_V3_PROJECT = SAMPLE_V3_PROJECT;
  window.EXPECTED_ENGINE_PROJECT = EXPECTED_ENGINE_PROJECT;
  window.runAdapterValidation = runAdapterValidation;
  window.runEdgeCaseTests = runEdgeCaseTests;
}
