// ═══════════════════════════════════════════════════════════════════════
// ROOF LAYERS — library of individual roof assembly layers
// ═══════════════════════════════════════════════════════════════════════
//
// Each layer represents a single material in a roof profile stack.
// Profiles (see roof-profiles.js) reference layers by id and may
// override the default thickness within min/max bounds.
//
// This is a DATA MODEL ONLY. No calculations happen here.
// A future profile calculator will consume these values.
//
// ── Field reference ─────────────────────────────────────────────────
//
//   id              Unique string identifier (kebab-case)
//   name            Display name
//   category        One of: vegetation, media, retention, detention,
//                   drainage, protection, surfacing, waterproofing
//   unitType        'depth' (inches) or 'fixed' (single-unit, no depth)
//
//   defaultDepthIn  Default thickness (inches). 0 for fixed layers.
//   minDepthIn      Minimum allowed thickness (inches)
//   maxDepthIn      Maximum allowed thickness (inches)
//   adjustable      true if the user/profile can change the thickness
//
//   dryWeightPSF    Dry weight per SF per inch of depth (PSF/in)
//                   For fixed layers, this is total PSF (not per inch).
//   satWeightPSF    Saturated weight per SF per inch of depth (PSF/in)
//                   For fixed layers, this is total PSF.
//   costPSF         Cost per SF per inch of depth ($/SF/in)
//                   For fixed layers, this is total $/SF.
//
// ── Retention & Detention — City-Dependent ──────────────────────────
//
//   Retention and detention factors vary by regulation profile.
//   The layer stores a BASE physical property. The credited value
//   used in stormwater calcs is determined by the city's regulation
//   profile (see regulation-profiles.js).
//
//   retFactors      Object keyed by regulation profile id.
//                   Each value is the credited retention factor for
//                   that jurisdiction.
//                     { general: 0.40, nyc_dep: 0.20 }
//                   A future calculator resolves: pick the factor
//                   matching the active profile, or fall back to
//                   'general'.
//
//   detFactors      Same structure for detention.
//                     { general: 0.95, nyc_dep: 0.95 }
//                   Detention is typically the same across profiles
//                   (honeycomb void ratio doesn't change by city),
//                   but the structure supports it if needed.
//
//   retConditions   Optional. Rules that must be met for the retention
//                   credit to apply. Keyed by profile id.
//                     { nyc_dep: { requiresMinSoilCoverIn: 4 } }
//                   If conditions are not met, retention credit = 0.
//                   Mirrors engine logic: NYC DEP blocks NMW credit
//                   if soil cover is less than 4 inches.
//
// ── Why city-dependent? ─────────────────────────────────────────────
//
//   The same physical mineral wool board absorbs the same amount of
//   water everywhere. But jurisdictions credit different percentages
//   of that absorption toward stormwater compliance.
//
//   Example: mineral wool
//     Physical absorption: ~93% of volume
//     General profile credit: 80% (0.80 factor)
//     NYC DEP credit: 40% (0.40 factor)
//     NYC DEP also requires >= 4" soil cover for any NMW credit.
//
//   Example: extensive media
//     General profile credit: 40% soil retention (0.40 factor)
//     NYC DEP credit: 20% soil retention (0.20 factor)
//     The engine uses specs.soilPorosity if defined on the BMP,
//     otherwise falls back to profile.defaults.soilRetentionPct.
//
// ── Unit conventions ────────────────────────────────────────────────
//
//   All depths in inches. Weight factors in PSF per inch.
//   Cost factors in $/SF per inch.
//   Volume factors convert to CF/SF via: factor * depthIn / 12
//
//   Example: retFactors.general = 0.40 at 4" depth
//            → 0.40 * 4/12 = 0.133 CF/SF credited retention
//
// ── Value status ────────────────────────────────────────────────────
//
//   Values marked [REAL] are based on published product data,
//   regulation profile values, or established engineering assumptions.
//   Values marked [PLACEHOLDER] are reasonable estimates that need
//   to be validated with actual product specs or supplier data.
//
// ═══════════════════════════════════════════════════════════════════════

const ROOF_LAYERS = [

  // ── Vegetation ────────────────────────────────────────────────────

  {
    id:             'sedum-mat',
    name:           'Sedum Vegetation Mat',
    category:       'vegetation',
    unitType:       'fixed',
    defaultDepthIn: 0,
    minDepthIn:     0,
    maxDepthIn:     0,
    adjustable:     false,
    dryWeightPSF:   2.0,         // [PLACEHOLDER] typical pre-grown mat
    satWeightPSF:   3.5,         // [PLACEHOLDER]
    costPSF:        6.50,        // [PLACEHOLDER] installed sedum mat — calibrated to match trad GR engine price
    retFactors:     { general: 0, nyc_dep: 0 },
    detFactors:     { general: 0, nyc_dep: 0 },
    retConditions:  null,
    notes:          'Pre-grown sedum mat. Weight is total, not per inch. Retention is credited to the soil media layer, not the vegetation.'
  },

  // ── Growing Media ─────────────────────────────────────────────────

  {
    id:             'extensive-media',
    name:           'Extensive Green Roof Media',
    category:       'media',
    unitType:       'depth',
    defaultDepthIn: 4,
    minDepthIn:     3,
    maxDepthIn:     6,
    adjustable:     true,
    dryWeightPSF:   6.5,         // [REAL] ~6-7 PSF/in for engineered media
    satWeightPSF:   10.0,        // [REAL] ~9-11 PSF/in saturated
    costPSF:        4.50,        // [PLACEHOLDER] media + placement per inch
    retFactors: {
      general: 0.40,             // [REAL] profile.defaults.soilRetentionPct
      nyc_dep: 0.20              // [REAL] NYC DEP profile soilRetentionPct
    },
    detFactors:     { general: 0, nyc_dep: 0 },
    retConditions:  null,        // media retention has no conditional rules
    notes:          'FLL-compliant engineered extensive media. Retention factor is the credited soil porosity — varies by jurisdiction. General profile credits 40%, NYC DEP credits 20%. Weight varies by blend — validate with supplier.'
  },

  // ── Retention (Mineral Wool) ──────────────────────────────────────

  {
    id:             'mineral-wool',
    name:           'Mineral Wool Retention Board',
    category:       'retention',
    unitType:       'depth',
    defaultDepthIn: 1,
    minDepthIn:     1,
    maxDepthIn:     2,
    adjustable:     true,
    dryWeightPSF:   0.8,         // [REAL] mineral wool is lightweight dry
    satWeightPSF:   5.5,         // [REAL] absorbs significant water
    costPSF:        2.50,        // [PLACEHOLDER] NMW board per inch — calibrated to improve paver profile alignment
    retFactors: {
      general: 0.80,             // [REAL] profile.defaults.nmwRetentionPct
      nyc_dep: 0.40              // [REAL] NYC DEP nmwRetentionPct
    },
    detFactors:     { general: 0, nyc_dep: 0 },
    retConditions: {
      nyc_dep: {
        requiresMinSoilCoverIn: 4  // [REAL] NMW credit blocked if soil < 4"
      }
    },
    notes:          'Rockwool / mineral wool retention board. Absorbs and holds water. General profile credits 80%, NYC DEP credits 40% — and NYC requires >= 4" soil cover or NMW credit is zero. Does not provide detention.'
  },

  // ── Detention (Honeycomb / Geocellular) ───────────────────────────

  {
    id:             'honeycomb-detention',
    name:           'Honeycomb Detention Layer',
    category:       'detention',
    unitType:       'depth',
    defaultDepthIn: 2,
    minDepthIn:     2,
    maxDepthIn:     4,
    adjustable:     true,
    dryWeightPSF:   0.3,         // [PLACEHOLDER] lightweight HDPE
    satWeightPSF:   5.0,         // [PLACEHOLDER] filled with water
    costPSF:        2.75,        // [PLACEHOLDER] per inch — calibrated to improve paver profile alignment
    retFactors:     { general: 0, nyc_dep: 0 },
    detFactors: {
      general: 0.95,             // [REAL] profile.defaults.honeycombVoidPct
      nyc_dep: 0.95              // [REAL] same across profiles currently
    },
    retConditions:  null,
    notes:          'HDPE honeycomb geocellular detention layer. Temporarily stores water before controlled release. Void ratio is 0.95 across all current profiles. Available in 2" and 4" depths.'
  },

  // ── Drainage Layer ────────────────────────────────────────────────

  {
    id:             'drainage-layer',
    name:           'Drainage / Filter Layer',
    category:       'drainage',
    unitType:       'fixed',
    defaultDepthIn: 0.2,
    minDepthIn:     0.2,
    maxDepthIn:     0.2,
    adjustable:     false,
    dryWeightPSF:   0.5,         // [PLACEHOLDER] thin composite
    satWeightPSF:   0.8,         // [PLACEHOLDER]
    costPSF:        1.50,        // [PLACEHOLDER] DL sheet + filter fabric
    retFactors:     { general: 0, nyc_dep: 0 },
    detFactors: {
      general: 0.93,             // [REAL] dlPorosity from engine specs
      nyc_dep: 0.93              // [REAL] same across profiles
    },
    retConditions:  null,
    notes:          'Composite drainage layer with integrated filter fabric. Sits between detention and membrane. Fixed depth ~0.2 inches. Minimal weight and detention contribution.'
  },

  // ── Protection / Separation ───────────────────────────────────────

  {
    id:             'protection-mat',
    name:           'Root Barrier / Protection Mat',
    category:       'protection',
    unitType:       'fixed',
    defaultDepthIn: 0,
    minDepthIn:     0,
    maxDepthIn:     0,
    adjustable:     false,
    dryWeightPSF:   0.3,         // [PLACEHOLDER]
    satWeightPSF:   0.4,         // [PLACEHOLDER]
    costPSF:        1.00,        // [PLACEHOLDER]
    retFactors:     { general: 0, nyc_dep: 0 },
    detFactors:     { general: 0, nyc_dep: 0 },
    retConditions:  null,
    notes:          'Root barrier and protection layer over waterproofing membrane. Always included. Negligible depth — accounted as fixed weight.'
  },

  // ── Surfacing (Pavers) ────────────────────────────────────────────

  {
    id:             'concrete-pavers',
    name:           'Concrete Pavers on Pedestals',
    category:       'surfacing',
    unitType:       'fixed',
    defaultDepthIn: 2,
    minDepthIn:     2,
    maxDepthIn:     2,
    adjustable:     false,
    dryWeightPSF:   22.0,        // [PLACEHOLDER] 2" concrete paver
    satWeightPSF:   22.0,        // pavers do not absorb meaningfully
    costPSF:        22.00,       // [PLACEHOLDER] paver + pedestal installed
    retFactors:     { general: 0, nyc_dep: 0 },
    detFactors:     { general: 0, nyc_dep: 0 },
    retConditions:  null,
    notes:          'Concrete pavers on adjustable-height pedestals. Used in paver-over-Purple profiles. Weight is significant (~22 PSF). Does not contribute to retention or detention.'
  }

];


// ── Field schema (for future validation / UI generation) ───────────

const ROOF_LAYER_SCHEMA = {
  id:             { type: 'string',  required: true  },
  name:           { type: 'string',  required: true  },
  category:       { type: 'string',  required: true, enum: ['vegetation', 'media', 'retention', 'detention', 'drainage', 'protection', 'surfacing', 'waterproofing'] },
  unitType:       { type: 'string',  required: true, enum: ['depth', 'fixed'] },
  defaultDepthIn: { type: 'number',  required: true  },
  minDepthIn:     { type: 'number',  required: true  },
  maxDepthIn:     { type: 'number',  required: true  },
  adjustable:     { type: 'boolean', required: true  },
  dryWeightPSF:   { type: 'number',  required: true  },
  satWeightPSF:   { type: 'number',  required: true  },
  costPSF:        { type: 'number',  required: true  },
  retFactors:     { type: 'object',  required: true  },
  detFactors:     { type: 'object',  required: true  },
  retConditions:  { type: 'object',  required: false },
  notes:          { type: 'string',  required: false }
};
