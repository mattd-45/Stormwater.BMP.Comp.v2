// ═══════════════════════════════════════════════════════════════════════════
// V3 PROJECT SCHEMA — Canonical data model for a stormwater project
// ═══════════════════════════════════════════════════════════════════════════
//
// This file defines the project schema used by the v3 tool.
//
// Design principles:
//   1. Extends (not replaces) the existing engine ProjectInputs shape
//   2. Every field the engine needs maps directly — no translation layer
//   3. New fields for future expansion are clearly marked
//   4. Default values match current v2 behavior
//   5. Field names match existing engine conventions wherever possible
//
// Current engine interface (model.js):
//   runModel(project, database) where project = {
//     cityKey: string,
//     inputs: ProjectInputs,   // areas, targets, constraints, assumptions, flags
//     overrides: object        // per-BMP pricing/spec overrides keyed by bmpId
//   }
//
// This schema wraps that structure with metadata, settings, and system config.
// The adapter layer extracts { cityKey, inputs, overrides } from this schema
// and passes it to runModel() unchanged.
//
// ═══════════════════════════════════════════════════════════════════════════


// ─── SCHEMA VERSION ──────────────────────────────────────────────────────

const SCHEMA_VERSION = '3.0';


// ─── FIELD DEFINITIONS ───────────────────────────────────────────────────
//
// Each field is documented with:
//   type        — JS type (string, number, boolean, object, array)
//   required    — true = must be present and non-null for engine to run
//                 false = optional, uses default if absent
//   default     — value used when field is not set
//   engineMap   — where this field maps in the engine's project param
//                 "—" means UI/meta only, not passed to engine
//   status      — "active"  = used by current engine
//                 "new"     = v3 addition, wired into v3 logic
//                 "future"  = reserved for planned expansion, not yet wired
//   notes       — additional context
//


// ─── FULL SCHEMA ─────────────────────────────────────────────────────────

const PROJECT_SCHEMA = {

  // ┌──────────────────────────────────────────────────────────────────────
  // │ SCHEMA METADATA
  // └──────────────────────────────────────────────────────────────────────

  schemaVersion: SCHEMA_VERSION,
  //  type: string | required: true | default: "3.0"
  //  engineMap: — (not passed to engine)
  //  status: new
  //  Used to detect and migrate older saved projects.


  // ┌──────────────────────────────────────────────────────────────────────
  // │ PROJECT INFO
  // │ Descriptive metadata about the project. Not used by calculation
  // │ engine. Appears on print output and report headers.
  // └──────────────────────────────────────────────────────────────────────

  projectInfo: {

    projectName: '',
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: active (exists in v2 salesModeState.projectName)

    projectAddress: '',
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: active (exists in v2 salesModeState.projectAddress)

    clientName: '',
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: active (exists in v2 salesModeState.clientName)

    clientAddress: '',
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: active (exists in v2 salesModeState.clientAddress)

    clientCompany: '',
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: new
    //  Separate from clientName so reports can show "John Doe, Acme Corp"

    preparedBy: '',
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: new
    //  For report headers: who prepared this analysis

    projectId: '',
    //  type: string | required: false | default: '' (auto-generated UUID if empty)
    //  engineMap: —
    //  status: new
    //  Unique identifier for save/load. Generated on first save if blank.

    createdDate: '',
    //  type: string (ISO 8601 date) | required: false | default: '' (set on creation)
    //  engineMap: —
    //  status: new

    modifiedDate: '',
    //  type: string (ISO 8601 date) | required: false | default: '' (set on save)
    //  engineMap: —
    //  status: new

    notes: ''
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: new
    //  Free-text field for internal notes about the project.
  },


  // ┌──────────────────────────────────────────────────────────────────────
  // │ SITE
  // │ Physical characteristics of the project site.
  // │ cityKey and areas are used directly by the engine.
  // └──────────────────────────────────────────────────────────────────────

  site: {

    cityKey: null,
    //  type: string | null | required: true (must be set before running engine)
    //  default: null
    //  engineMap: project.cityKey
    //  status: active
    //  Must match a key in cities.json (e.g. "nyc", "dc", "chicago").
    //  Determines regulation profile, climate data, and adapter selection.

    presetKey: 'balanced',
    //  type: string | required: true | default: "balanced"
    //  engineMap: — (presets distribute values into areas, then areas go to engine)
    //  status: active (exists in v2 as selectedPresetId)
    //  Valid values: "balanced", "dense-urban", "campus", "parking-dominant", "podium", "big-box-retail"
    //  Site type is chosen via image tiles; preset distributes designModeAreas to engineeringAreas.

    areaSplitPct: {
      buildingPct: 50,
      landscapePct: 25,
      pavementPct: 25
    },
    //  type: object | required: false
    //  engineMap: — (Planning UI only: B/L/P % of total site area; must sum to 100)
    //  status: new
    //  Reset to site-type template when user picks a new preset tile.
    //  Drives designModeAreas when totalSiteAreaSF changes.

    siteType: 'new_development',
    //  type: string | required: false | default: 'new_development'
    //  engineMap: — (future: may affect regulation trigger thresholds)
    //  status: future
    //  Valid values: "new_development", "major_renovation", "redevelopment"
    //  Some cities have different retention requirements by project type
    //  (e.g., DC: 1.2" for new development vs. 0.8" for major renovation).
    //  Not yet wired into engine. For now, user manually enters the correct target volumes.

    soilType: null,
    //  type: string | null | required: false | default: null
    //  engineMap: — (future: will override profile.defaults.soilRetentionPct)
    //  status: future
    //  Valid values: "clay", "silt", "sand", "loam", "rock", null
    //  Currently, soil retention factors come from regulation profiles
    //  (e.g., NYC DEP = 0.20, general = 0.40). This field will allow
    //  site-specific overrides when the engine supports it.
    //  When null, engine uses regulation profile defaults (current behavior).

    // ── Design Mode Areas ──────────────────────────────────────────────
    // Simplified inputs used in planning mode.
    // Distributed to engineering areas via preset engineeringSplits.

    designModeAreas: {

      totalSiteAreaSF: 50000,
      //  type: number (SF) | required: false | default: 50000
      //  engineMap: — (whole-site total; split into B/L/P by site-type preset percentages in UI)
      //  status: active

      totalBuildingSF: 25000,
      //  type: number (SF) | required: false | default: 0
      //  engineMap: — (distributed to slopedRoofArea + flatDeckOnStructureArea + paversOnStructureArea)
      //  status: active (exists in v2 design mode as inline input)

      totalLandscapeSF: 12500,
      //  type: number (SF) | required: false | default: 0
      //  engineMap: — (maps to perviousLandscapingUsable)
      //  status: active

      totalParkingSF: 12500
      //  type: number (SF) | required: false | default: 0
      //  engineMap: — (distributed to vehicularPavement + pedestrianPavement)
      //  status: active
    },

    // ── Engineering Areas ──────────────────────────────────────────────
    // Detailed area breakdown. These are the fields the engine reads directly.
    // In Planning mode, these are auto-filled from designModeAreas using
    // ENGINEERING_SPLITS in ui-inputs.js; Engineering mode shows a warning
    // until values differ from that template (user-measured inputs).
    //
    // FIELD NAMES MATCH ENGINE EXACTLY. Do not rename.
    // (See model.js ProjectInputs.areas and adapters/index.js)

    areas: {

      perviousLandscapingUsable: 12500,
      //  type: number (SF) | required: true | default: 500
      //  engineMap: project.inputs.areas.perviousLandscapingUsable
      //  status: active
      //  Usable pervious ground area (landscaping, bioretention candidates).
      //  Used by: BMP 1 (Bioretention), BMP 2 (Underground), BMP 4-5 (Tanks)

      imperviousVehicularPavement: 10000,
      //  type: number (SF) | required: true | default: 500
      //  engineMap: project.inputs.areas.imperviousVehicularPavement
      //  status: active
      //  Vehicular paving (driveways, parking lots, roads).
      //  Used by: BMP 2 (Underground), BMP 4-5 (Tanks)

      imperviousPedestrianPavement: 2500,
      //  type: number (SF) | required: true | default: 0
      //  engineMap: project.inputs.areas.imperviousPedestrianPavement
      //  status: active
      //  Pedestrian-only paving (sidewalks, plazas at grade).
      //  Used by: BMP 2 (Underground combined), BMP 3 (Permeable Pavers)

      perviousTreeCoverNonUsable: 0,
      //  type: number (SF) | required: true | default: 0
      //  engineMap: project.inputs.areas.perviousTreeCoverNonUsable
      //  status: active
      //  Pervious area not usable for BMPs (existing trees, protected zones).
      //  Included in site total calculations but not eligible for any BMP.

      flatDeckOnStructureArea: 10000,
      //  type: number (SF) | required: true | default: 500
      //  engineMap: project.inputs.areas.flatDeckOnStructureArea
      //  status: active
      //  Flat deck / plaza on structure (podium, parking deck top).
      //  Used by: BMP 6 (On-Structure Tank), BMP 7 (Blue Roof),
      //  BMP 10/10B/10C/10D (Purple-Roof Veg), BMP 11/11B/11C/11D (Purple-Roof Paver)

      slopedRoofArea: 15000,
      //  type: number (SF) | required: true | default: 500
      //  engineMap: project.inputs.areas.slopedRoofArea
      //  status: active
      //  Conventional sloped or low-slope roof area.
      //  Used by: BMP 8 (Traditional Green Roof), BMP 9 (Sponge Roof),
      //  BMP 10/10B/10C/10D (Purple-Roof Veg), BMP 11/11B/11C/11D (Purple-Roof Paver)

      paversOnStructureArea: 0,
      //  type: number (SF) | required: true | default: 0
      //  engineMap: project.inputs.areas.paversOnStructureArea
      //  status: active
      //  Paver deck on structure (elevated paver terrace, green roof with pavers).
      //  Used by: BMP 11/11B (Purple-Roof Paver), BMP 6 (On-Structure Tank)

      imperviousCAUntreated: 0
      //  type: number (SF) | required: true | default: 0
      //  engineMap: project.inputs.areas.imperviousCAUntreated
      //  status: active
      //  Contributing impervious area that will not receive treatment.
      //  Included in site totals but generates untreated runoff.
    }
  },


  // ┌──────────────────────────────────────────────────────────────────────
  // │ STORMWATER TARGETS
  // │ Required detention and retention volumes.
  // │ All four fields map directly to engine ProjectInputs.targets.
  // └──────────────────────────────────────────────────────────────────────

  targets: {

    retentionNeeded: true,
    //  type: boolean | required: true | default: true
    //  engineMap: project.inputs.targets.retentionNeeded
    //  status: active
    //  When false, engine skips retention calculations and
    //  does not penalize BMPs that provide zero retention.

    retentionCF: 100,
    //  type: number (cubic feet) | required: true | default: 100
    //  engineMap: project.inputs.targets.retentionCF
    //  status: active
    //  Required retention volume. Typically from civil engineer or local code.
    //  Set to 0 if retentionNeeded is false.

    detentionNeeded: true,
    //  type: boolean | required: true | default: true
    //  engineMap: project.inputs.targets.detentionNeeded
    //  status: active

    detentionCF: 100,
    //  type: number (cubic feet) | required: true | default: 100
    //  engineMap: project.inputs.targets.detentionCF
    //  status: active

    retentionVolumeUnit: 'cf',
    //  type: string | required: false | default: 'cf'
    //  engineMap: — (UI only: 'cf' | 'gal' for target volume entry)
    //  status: active (stored CF is always targets.retentionCF)

    detentionVolumeUnit: 'cf',
    //  type: string | required: false | default: 'cf'
    //  engineMap: — (UI only: 'cf' | 'gal' for target volume entry)
    //  status: active

    retentionSourceNote: '',
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: new
    //  Where the retention target came from (e.g., "NYC DEP USWR 1.5\" WQv",
    //  "civil engineer RFI #12"). Documentation field for reports.

    detentionSourceNote: ''
    //  type: string | required: false | default: ''
    //  engineMap: —
    //  status: new
  },


  // ┌──────────────────────────────────────────────────────────────────────
  // │ CONSTRAINTS
  // │ Physical site constraints that block or limit certain BMPs.
  // │ All fields map directly to engine ProjectInputs.constraints.
  // └──────────────────────────────────────────────────────────────────────

  constraints: {

    hasUndergroundUtilities: false,
    //  type: boolean | required: true | default: false
    //  engineMap: project.inputs.constraints.hasUndergroundUtilities
    //  status: active
    //  Blocks: BMP 1 (Bioretention), BMP 2-5 (Underground/Tanks)

    hasHighWaterTable: false,
    //  type: boolean | required: true | default: false
    //  engineMap: project.inputs.constraints.hasHighWaterTable
    //  status: active
    //  Blocks: BMP 1 (Bioretention), BMP 2-5 (subsurface infiltration / underground)

    hasContaminatedSoil: false,
    //  type: boolean | required: true | default: false
    //  engineMap: project.inputs.constraints.hasContaminatedSoil
    //  status: active
    //  Blocks: BMP 1 (Bioretention) only. BMP 2-5: warning (liner/handling/cost), not a hard block.

    hasSiteGradingConstraint: false,
    //  type: boolean | required: true | default: false
    //  engineMap: project.inputs.constraints.hasSiteGradingConstraint
    //  status: active
    //  Warning (not blocker): underground BMP limited to low point of site.

    hasStructuralLoadLimit: false,
    //  type: boolean | required: false | default: false
    //  engineMap: — (applied in v3/run-analysis.js after roof profile weights are resolved)
    //  status: active
    //  Flags sites where roof structure cannot support heavier saturated
    //  roof assemblies. Used with maxRoofLoadPSF as a v3 screening layer.

    maxRoofLoadPSF: null
    //  type: number (PSF) | null | required: false | default: null
    //  engineMap: — (applied in v3/run-analysis.js after roof profile weights are resolved)
    //  status: active
    //  When hasStructuralLoadLimit is true, roof assemblies exceeding this
    //  saturated PSF limit are blocked from viable recommendations.
  },


  // ┌──────────────────────────────────────────────────────────────────────
  // │ ASSUMPTIONS
  // │ Design assumptions that affect BMP evaluation.
  // │ All active fields map to engine ProjectInputs.assumptions.
  // └──────────────────────────────────────────────────────────────────────

  assumptions: {

    greenRoofAlreadyInScope: false,
    //  type: boolean | required: true | default: false
    //  engineMap: project.inputs.assumptions.greenRoofAlreadyInScope
    //  status: active
    //  When true, indicates green roof is already in the project scope
    //  (e.g., required by LL 92/94 in NYC). Affects pricing mode:
    //  Purple-Roof costs shown as upgrade delta, not full installed cost.

    programmableSpaceIsHighValue: false,
    //  type: boolean | required: true | default: false
    //  engineMap: project.inputs.assumptions.programmableSpaceIsHighValue
    //  status: active
    //  When true, warns that at-grade BMPs consume space that could be
    //  used for higher-value programming (outdoor dining, amenity space).
    //
    //  NOTE: v2 UI renamed this to "highValueOutdoorSpace" in the current
    //  index.html, but the engine still expects "programmableSpaceIsHighValue".
    //  The v3 adapter handles the mapping. Schema uses the engine name.

    allowSteepSlopeGreenRoof: false,
    //  type: boolean | required: true | default: false
    //  engineMap: project.inputs.assumptions.allowSteepSlopeGreenRoof
    //  status: active
    //  When true, allows green roof BMPs on slopes > 2:12 (with stabilization).

    highValueIndoorSpace: false
    //  type: boolean | required: false | default: false
    //  engineMap: — (v2 UI field, not yet consumed by engine)
    //  status: new
    //  When true, warns that below-grade tanks consume usable building
    //  volume (parking, storage, mechanical). Currently UI-only in v2.
    //  Will be wired into engine rules in a future phase.
  },


  // ┌──────────────────────────────────────────────────────────────────────
  // │ SYSTEM CATEGORIES
  // │ Controls which system types are included in the analysis.
  // │ Replaces the v2 checkbox toggles (as-enable-vpv, etc.).
  // └──────────────────────────────────────────────────────────────────────

  systemCategories: {

    stormwater: true,
    //  type: boolean | required: true | default: true
    //  engineMap: — (controls whether stormwater engine runs)
    //  status: new
    //  Always true in v2. In v3, allows disabling stormwater comparison
    //  to focus on PV or other systems only. Unlikely to be false in practice.

    vpv: false,
    //  type: boolean | required: false | default: false
    //  engineMap: — (controls whether VPV calc module runs)
    //  status: active (v2: as-enable-vpv checkbox)
    //  OverEasy vertical bifacial PV

    traditionalPV: false,
    //  type: boolean | required: false | default: false
    //  engineMap: — (controls whether traditional PV calc module runs)
    //  status: active (v2: as-enable-tradpv checkbox)
    //  Contec Greenlite Pro ballasted racking

    fallProtection: false,
    //  type: boolean | required: false | default: false
    //  engineMap: — (controls whether fall protection calc module runs)
    //  status: active (v2: as-enable-fp checkbox)
    //  DiaSafe Line 21

    livingWall: false,
    //  type: boolean | required: false | default: false
    //  engineMap: —
    //  status: future
    //  Placeholder for living wall system category.

    ballastedSolar: false
    //  type: boolean | required: false | default: false
    //  engineMap: —
    //  status: future
    //  Placeholder for additional ballasted solar options.
  },


  // ┌──────────────────────────────────────────────────────────────────────
  // │ SETTINGS
  // │ App behavior, display, and override configuration.
  // └──────────────────────────────────────────────────────────────────────

  settings: {

    mode: 'planning',
    //  type: string | required: true | default: 'planning'
    //  engineMap: — (controls UI rendering, not engine behavior)
    //  status: active (v2: currentMode = 'design' | 'engineering')
    //  Valid values: 'planning', 'engineering' (legacy saved files may have 'sales' → normalized on load)
    //
    //  Renamed from v2's "design"/"engineering" to planning/engineering
    //  for the two-mode system. "planning" = simplified inputs
    //  with presets. "engineering" = full area breakdown with all fields.
    //  Engine output is identical in both modes — only the input UI differs.

    sortResultsBy: 'totalCost',
    //  type: string | required: false | default: 'totalCost'
    //  engineMap: — (post-processing sort on engine results)
    //  status: new
    //  Valid values: 'totalCost', 'costPerCF', 'areaRequired', 'bmpId'
    //  v2 sorts by BMP ID order. v3 allows user to choose.

    recommendationBasis: 'closest_dual_target',
    //  type: string | required: false | default: 'closest_dual_target'
    //  engineMap: — (UI + reporting only; uses engine recommended / recommendedCombo)
    //  status: new
    //  Planning mode always applies closest_dual_target + sortResultsBy totalCost (see
    //  run-analysis getEffectiveResultsSettings); Engineering exposes toolbar controls.
    //  How the primary recommendation (hero) is chosen:
    //    'closest_dual_target' — Prefer engine single BMP that meets both targets; else
    //      two-BMP package; else when detention is met prefer Purple-Roof vegetated 4+1+2,
    //      then shallowest honeycomb that still meets detention; else capped min(ret%, det%).
    //    'cheapest_package' — Same first two steps; fallback is lowest-cost viable single.
    //    'cheapest_single' — Lowest-cost viable single BMP by cost, ignoring combo package.
    //    'full_compliance_single' — Lowest-cost single BMP that meets retention + detention within
    //      tolerance (engine meetsBoth). Empty state if none.
    //    'roof_focused' — Restrict to roof/on-structure BMP IDs (see run-analysis ROOF_VIEW_BMP_IDS);
    //      pick lowest-cost viable single in that pool (planning default sub-mode).

    pricingOverrides: {},
    //  type: object | required: false | default: {}
    //  engineMap: project.overrides
    //  status: active (v2: localStorage admin panel overrides)
    //  Keyed by BMP ID (string). Each value can override:
    //    { unitPrice: number, specs: { ...partial spec overrides } }
    //  Example: { "10": { unitPrice: 38.00 }, "1": { specs: { soilDepth: 30 } } }
    //  Passed directly to runModel() as project.overrides.

    purpleRoofPricingMode: 'black',
    //  type: string | required: false | default: 'black'
    //  engineMap: passed via overrides for BMP 10/10B
    //  status: active (v2: extra.pricingMode on BMP 10/10B)
    //  Valid values: 'black', 'green'
    //  'black' = full installed Purple-Roof cost (standalone comparison)
    //  'green' = upgrade cost only (when green roof is already in scope)
    //  Tied to assumptions.greenRoofAlreadyInScope — when that is true,
    //  this should typically be 'green'.

    purpleRoofHandoff: null,
    //  type: object | null | required: false | default: null
    //  engineMap: —
    //  status: new
    //  Last-confirmed Purple Roof Simulator handoff (lat/lon, areas, layers, drains).
    //  Set when user launches the simulator from results; pre-fills the next handoff form.

    showDetailCards: true,
    //  type: boolean | required: false | default: true
    //  engineMap: —
    //  status: new
    //  Whether to show expandable per-BMP detail cards in results.
    //  Planning mode may default to false for a cleaner presentation.

    showCostData: true,
    //  type: boolean | required: false | default: true
    //  engineMap: —
    //  status: future
    //  Toggle cost columns in results table. Some early-stage conversations
    //  focus on feasibility only, not cost.

    showWeightData: false,
    //  type: boolean | required: false | default: false
    //  engineMap: —
    //  status: future
    //  Toggle structural weight column. Requires adding weight data to
    //  BMP definitions (saturated weight PSF).

    markup: {
      //  type: object | required: false
      //  engineMap: — (passed to pricing calc, not engine)
      //  status: active
      //
      //  Controls the markup chain applied to all BMP pricing.
      //  Step 4 (Site Conditions): Planning = "single-source warranty" toggle;
      //  Engineering = edit installer / waterproofer / GC percentages.
      //  The pricing calc's applyMarkup() receives these as overrides.
      //
      //  Tier order: installer → waterproofer → GC (compounding)
      //  2-tier: installer + GC (waterproofer disabled)
      //  3-tier: installer + waterproofer + GC

      installerPct:       0.25,
      //  Installer / specialty sub markup. Default 25%.

      waterprooferEnabled: false,
      //  Planning UI: "Add for single-source warranty". Inserts waterproofer tier.

      waterprooferPct:    0.10,
      //  Waterproofer markup. Default 10%. Only applied when enabled.

      gcPct:              0.10
      //  GC overhead and profit. Default 10%.
    }
  }
};


// ─── ENGINE MAPPING SUMMARY ──────────────────────────────────────────────
//
// This table shows exactly how the v3 schema maps to the runModel() call.
// The adapter function converts a v3 project into these arguments.
//
// ┌─────────────────────────────────────────┬────────────────────────────────────────┐
// │ v3 Schema Path                          │ Engine Param (runModel)                │
// ├─────────────────────────────────────────┼────────────────────────────────────────┤
// │ site.cityKey                            │ project.cityKey                        │
// │                                         │                                        │
// │ site.areas.perviousLandscapingUsable    │ project.inputs.areas.perviousLandscap… │
// │ site.areas.imperviousVehicularPavement  │ project.inputs.areas.imperviousVehicu… │
// │ site.areas.imperviousPedestrianPavement │ project.inputs.areas.imperviousPedest… │
// │ site.areas.perviousTreeCoverNonUsable   │ project.inputs.areas.perviousTreeCove… │
// │ site.areas.flatDeckOnStructureArea      │ project.inputs.areas.flatDeckOnStruct… │
// │ site.areas.slopedRoofArea               │ project.inputs.areas.slopedRoofArea    │
// │ site.areas.paversOnStructureArea        │ project.inputs.areas.paversOnStructur… │
// │ site.areas.imperviousCAUntreated        │ project.inputs.areas.imperviousCAUntr… │
// │                                         │                                        │
// │ targets.retentionNeeded                 │ project.inputs.targets.retentionNeeded │
// │ targets.retentionCF                     │ project.inputs.targets.retentionCF     │
// │ targets.detentionNeeded                 │ project.inputs.targets.detentionNeeded │
// │ targets.detentionCF                     │ project.inputs.targets.detentionCF     │
// │                                         │                                        │
// │ constraints.hasUndergroundUtilities     │ project.inputs.constraints.hasUndergr… │
// │ constraints.hasHighWaterTable           │ project.inputs.constraints.hasHighWat… │
// │ constraints.hasContaminatedSoil         │ project.inputs.constraints.hasContami… │
// │ constraints.hasSiteGradingConstraint    │ project.inputs.constraints.hasSiteGra… │
// │                                         │                                        │
// │ assumptions.greenRoofAlreadyInScope     │ project.inputs.assumptions.greenRoofA… │
// │ assumptions.programmableSpaceIsHighVal… │ project.inputs.assumptions.programmabl…│
// │ assumptions.allowSteepSlopeGreenRoof    │ project.inputs.assumptions.allowSteep… │
// │                                         │                                        │
// │ settings.pricingOverrides               │ project.overrides                      │
// └─────────────────────────────────────────┴────────────────────────────────────────┘
//
// All other fields (projectInfo.*, site.designModeAreas.*, site.presetKey,
// site.siteType, site.soilType, systemCategories.*, settings.mode,
// settings.sortResultsBy, etc.) are consumed by the UI layer only
// and are NOT passed to the engine.


// ─── ADAPTER FUNCTION (pseudocode) ───────────────────────────────────────
//
// function projectSchemaToEngineProject(schema) {
//   return {
//     cityKey: schema.site.cityKey,
//     inputs: {
//       areas: { ...schema.site.areas },
//       targets: {
//         retentionCF:     schema.targets.retentionNeeded ? schema.targets.retentionCF : 0,
//         detentionCF:     schema.targets.detentionNeeded ? schema.targets.detentionCF : 0,
//         retentionNeeded: schema.targets.retentionNeeded,
//         detentionNeeded: schema.targets.detentionNeeded
//       },
//       constraints: {
//         hasUndergroundUtilities:  schema.constraints.hasUndergroundUtilities,
//         hasHighWaterTable:        schema.constraints.hasHighWaterTable,
//         hasContaminatedSoil:      schema.constraints.hasContaminatedSoil,
//         hasSiteGradingConstraint: schema.constraints.hasSiteGradingConstraint
//       },
//       assumptions: {
//         greenRoofAlreadyInScope:     schema.assumptions.greenRoofAlreadyInScope,
//         programmableSpaceIsHighValue: schema.assumptions.programmableSpaceIsHighValue,
//         allowSteepSlopeGreenRoof:    schema.assumptions.allowSteepSlopeGreenRoof
//       },
//       flags: {}
//     },
//     overrides: schema.settings.pricingOverrides || {}
//   };
// }


// ─── DEFAULT PROJECT FACTORY ─────────────────────────────────────────────
//
// Creates a new project with all defaults applied.
// Deep-copies to avoid shared references between projects.

function createDefaultProject() {
  return JSON.parse(JSON.stringify(PROJECT_SCHEMA));
}


// ─── FIELD NAMING ISSUES RESOLVED ────────────────────────────────────────
//
// The v2 codebase has three naming inconsistencies that this schema resolves:
//
// 1. programmableSpaceIsHighValue vs highValueOutdoorSpace
//    - Engine (model.js) uses: programmableSpaceIsHighValue
//    - V2 UI (index.html siteConditions) uses: highValueOutdoorSpace
//    - V3 schema uses: programmableSpaceIsHighValue (engine name wins)
//    - V3 adapter maps UI label "High-value outdoor space" to this field
//
// 2. targetDetentionCF vs detentionCF
//    - V2 salesModeState uses: targetDetentionCF, targetRetentionCF
//    - Engine adapter normalizes to: detentionCF, retentionCF
//    - V3 schema uses: detentionCF, retentionCF (engine name wins)
//    - The "target" prefix was redundant since these live under "targets"
//
// 3. BMP IDs as numbers vs strings
//    - V2 bmp-options.js mixes: 1, 2, ... 10 (number) and '10B', '11B' (string)
//    - Engine uses loose equality: bmp.id == bmpId
//    - V3 data files: ALL IDs are strings ("1", "2", "10B", "11B")
//    - Engine comparison updated to strict: bmp.id === String(bmpId)


// ─── VALIDATION RULES ────────────────────────────────────────────────────
//
// Minimum validation before the engine can run:
//
// 1. site.cityKey must be a non-null string matching a key in cities.json
// 2. All site.areas values must be numbers >= 0
// 3. At least one area must be > 0 (otherwise no BMPs can be evaluated)
// 4. targets.retentionCF must be >= 0 (and > 0 if retentionNeeded is true)
// 5. targets.detentionCF must be >= 0 (and > 0 if detentionNeeded is true)
// 6. At least one of retentionNeeded or detentionNeeded should be true
//    (warning if both false — engine will run but results will be trivial)
// 7. settings.mode must be 'planning', 'engineering', or legacy 'sales' (normalized on load)
//
// Validation that produces warnings (non-blocking):
//
// 8. (Removed) presetKey always set via site-type tiles; legacy null migrates to balanced
// 9. If sum of all areas is 0, warn that no BMPs will have eligible area
// 10. If retentionNeeded but retentionCF is 0, warn (probably a mistake)
// 11. If detentionNeeded but detentionCF is 0, warn (probably a mistake)


// ─── EXPORT ──────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROJECT_SCHEMA, SCHEMA_VERSION, createDefaultProject };
}
if (typeof window !== 'undefined') {
  window.PROJECT_SCHEMA = PROJECT_SCHEMA;
  window.SCHEMA_VERSION = SCHEMA_VERSION;
  window.createDefaultProject = createDefaultProject;
}
