// ═══════════════════════════════════════════════════════════════════════
// COST ITEMS — editable database of material + install costs
// ═══════════════════════════════════════════════════════════════════════
//
// Each entry represents a priced system or component. Every entry has
// a pricingMode that determines which fields drive cost calculation:
//
//   assembly    — layer-by-layer takeoff with purchase units, waste,
//                 rounding, and install production rates.
//                 Used for: green roof, Purple-Roof, Sponge roof.
//
//   parametric  — base unit cost adjusted by project parameters.
//                 Not a full material takeoff. Price varies by depth,
//                 liner type, underdrain, site conditions, etc.
//                 Used for: bioretention, underground detention,
//                 infiltration systems.
//
//   turnkey     — flat unit price with optional adjustments.
//                 Simple systems priced per-unit or per-SF with
//                 minimal variables.
//                 Used for: anchors, small assemblies, accessories.
//
// All three modes share the same identity, tracking, and install
// fields. The pricing-specific fields differ per mode.
//
// ── SHARED FIELDS (all modes) ──────────────────────────────────────
//
//  IDENTITY
//   id              Unique string (kebab-case)
//   name            Display name
//   category        'roof-layer' | 'bmp-ground' | 'bmp-roof' | 'pv' |
//                   'fall-protect' | 'accessory' | 'labor'
//   pricingMode     'assembly' | 'parametric' | 'turnkey'
//   systemRef       Optional link to another data file:
//                     { type: 'roof-layer'|'bmp-option'|'roof-profile',
//                       refId: string|number }
//
//  INSTALLATION (all modes)
//   install         Object describing install cost logic:
//     productionRate   { measure, value, per }
//     crewBasis        'laborer'|'foreman'|'crew-2'|'crew-3'|'blended'|'subcontract'
//     laborRate        $/hr (or $/measure for subcontract)
//     derivedInstallPerSf   Computed convenience field
//     notes            Free text
//
//  TRACKING (all modes)
//   confirmed       true = real quote/data, false = placeholder
//   active          true = use in calcs, false = soft-deleted
//   effectiveDate   ISO date
//   lastUpdated     ISO date
//   source          Where data came from
//   notes           General notes
//
// ── ASSEMBLY MODE FIELDS ───────────────────────────────────────────
//
//   purchaseUnit         'roll'|'sheet'|'bag'|'each'|'sf'|'bulk-cy' etc.
//   unitCoverage         { measure, value }
//   depthRef             Reference depth in inches (null if not depth-dependent)
//   wastePct             Waste % as decimal
//   roundingRule         'unit'|'bundle'|'pallet'|'none'
//   bundleSize           Units per bundle (if roundingRule='bundle')
//   palletSize           Units per pallet (if roundingRule='pallet')
//   furnishedCostPerUnit Cost per purchase unit ($)
//                        For category roof-layer: all-in delivered + hoisted +
//                        installed (use external takeoff; install block not summed).
//   derivedCostPerSf     Computed: furnishedCostPerUnit / unitCoverage.value
//
//   Quantity calculation:
//     1. netSF = area * (depth / depthRef)     [depth-dependent]
//        netSF = area                          [not depth-dependent]
//     2. grossSF = netSF * (1 + wastePct)
//     3. rawUnits = grossSF / unitCoverage.value
//     4. purchaseQty = ceil(rawUnits)           [per roundingRule]
//     5. furnished = purchaseQty * furnishedCostPerUnit
//
// ── PARAMETRIC MODE FIELDS ─────────────────────────────────────────
//
//   baseCostPerSf        Base cost per SF at default parameters ($)
//   baseCostBasis        What the base cost includes (free text)
//   parameters           Array of adjustable parameters:
//     id                 Unique parameter key
//     name               Display name
//     type               'multiplier' | 'adder'
//     unit               Display unit (e.g., 'in', '%', '$')
//     defaultValue       Default parameter value
//     options            Array of { value, label, adjustment, notes }
//                        adjustment is:
//                          multiplier → factor applied to base (1.0 = no change)
//                          adder      → $/SF added to base
//     editable           true if admin can modify options
//   derivedCostPerSf     Computed: base cost after all default adjustments
//
//   Calculation:
//     1. Start with baseCostPerSf
//     2. For each parameter (in order):
//        if multiplier: running *= selectedOption.adjustment
//        if adder:      running += selectedOption.adjustment
//     3. adjustedCostPerSf = running
//     4. furnished = adjustedCostPerSf * area
//
//   Estimate backup shows each parameter and its effect:
//     Base: $40.00/SF (standard bioretention, 24" media)
//     Depth adjustment (36"): × 1.35 → $54.00/SF
//     Liner (required): + $3.50/SF → $57.50/SF
//     Underdrain (included): + $0.00/SF → $57.50/SF
//     Furnished subtotal: 5,000 SF × $57.50 = $287,500
//
// ── TURNKEY MODE FIELDS ────────────────────────────────────────────
//
//   unitPrice            Flat price per unit ($)
//   unitMeasure          'each' | 'sf' | 'lf'
//   adjustments          Optional array of simple adjustments:
//     id                 Unique adjustment key
//     name               Display name
//     type               'multiplier' | 'adder'
//     defaultValue       Default adjustment value
//     editable           true if admin can modify
//     notes              When to apply
//   derivedCostPerSf     Computed (null if not area-based)
//
//   Calculation:
//     1. Start with unitPrice
//     2. Apply adjustments (multipliers then adders)
//     3. total = adjustedPrice * quantity
//
// ── HOW THIS FEEDS THE TOOL ────────────────────────────────────────
//
//   BMP Cost Comparison:
//     Each BMP references cost items via systemRef. The comparison
//     engine resolves the cost per SF for each BMP by:
//       assembly   → roof-profile-calc totals.costPerSf (sum of layers)
//       parametric → baseCostPerSf after parameter adjustments
//       turnkey    → unitPrice (converted to per-SF if area-based)
//
//   Project Estimates:
//     A future estimator takes the per-SF cost, applies area, then
//     runs through cost-adjustments (locality, complexity, access,
//     waste) and cost-markups (contractor, GC, etc.) to arrive at
//     a sell price. The pricing mode determines HOW the base cost
//     is calculated, but everything downstream is the same.
//
//   Output Summaries:
//     The estimate backup/export shows different detail per mode:
//       assembly   → line-by-line material takeoff
//       parametric → base + parameter adjustments table
//       turnkey    → unit price × quantity
//     All three produce the same summary fields: furnished subtotal,
//     install subtotal, adjustments, markup, sell price.
//
// ═══════════════════════════════════════════════════════════════════════

const COST_ITEMS = [

  // ═════════════════════════════════════════════════════════════════════
  // ASSEMBLY MODE — roof layer items
  // ═════════════════════════════════════════════════════════════════════
  //
  // These are individual material layers with real purchase units.
  // A roof profile (e.g., Purple-Roof 4+1+2) is costed by summing
  // its constituent assembly-mode layers.

  {
    id:             'roof-sedum-mat',
    name:           'Sedum Vegetation Mat (pre-grown)',
    category:       'roof-layer',
    pricingMode:    'assembly',
    systemRef:      { type: 'roof-layer', refId: 'sedum-mat' },

    // Assembly fields
    purchaseUnit:   'roll',
    unitCoverage:   { measure: 'sf', value: 10.75 },
    depthRef:       null,
    wastePct:       0.05,
    roundingRule:   'unit',
    bundleSize:     null,
    palletSize:     null,
    furnishedCostPerUnit: 59.00,
    derivedCostPerSf:     5.49,

    install: {
      productionRate: { measure: 'sf', value: 250, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       145,
      derivedInstallPerSf: 0.58,
      notes:          'Roll-out and placement. Assumes crane/hoist delivers material to roof level separately.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'Pre-grown sedum mat in rolls. Coverage per roll is product-specific — verify with supplier.'
  },

  {
    id:             'roof-media-extensive',
    name:           'Extensive Green Roof Media (engineered)',
    category:       'roof-layer',
    pricingMode:    'assembly',
    systemRef:      { type: 'roof-layer', refId: 'extensive-media' },

    purchaseUnit:   'bulk-cy',
    unitCoverage:   { measure: 'sf', value: 324 },
    depthRef:       1,
    wastePct:       0.08,
    roundingRule:   'none',
    bundleSize:     null,
    palletSize:     null,
    furnishedCostPerUnit: 95.00,
    derivedCostPerSf:     0.29,

    install: {
      productionRate: { measure: 'sf', value: 200, per: 'hour' },
      crewBasis:      'crew-3',
      laborRate:       195,
      derivedInstallPerSf: 0.975,
      notes:          'Media blown onto roof via pneumatic blower. Rate includes spreading and grading. Depth affects coverage, not production rate per SF.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'FLL-compliant engineered media. Ordered by CY. 1 CY covers 324 SF at 1" or 81 SF at 4". Blower access required.'
  },

  {
    id:             'roof-mineral-wool',
    name:           'Mineral Wool Retention Board',
    category:       'roof-layer',
    pricingMode:    'assembly',
    systemRef:      { type: 'roof-layer', refId: 'mineral-wool' },

    purchaseUnit:   'sheet',
    unitCoverage:   { measure: 'sf', value: 24 },
    depthRef:       1,
    wastePct:       0.05,
    roundingRule:   'unit',
    bundleSize:     null,
    palletSize:     null,
    furnishedCostPerUnit: 48.00,
    derivedCostPerSf:     2.00,

    install: {
      productionRate: { measure: 'sf', value: 300, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       145,
      derivedInstallPerSf: 0.48,
      notes:          'Dry-lay boards, butt joints. Simple placement — high production rate.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'Rockwool retention board. Sheets are typically 2\'x4\' or 4\'x6\' — confirm coverage with actual product. At 2" depth, effective coverage per sheet halves.'
  },

  {
    id:             'roof-honeycomb',
    name:           'Honeycomb Detention Layer (HDPE)',
    category:       'roof-layer',
    pricingMode:    'assembly',
    systemRef:      { type: 'roof-layer', refId: 'honeycomb-detention' },

    purchaseUnit:   'sheet',
    unitCoverage:   { measure: 'sf', value: 16 },
    depthRef:       2,
    wastePct:       0.03,
    roundingRule:   'unit',
    bundleSize:     null,
    palletSize:     null,
    furnishedCostPerUnit: 72.00,
    derivedCostPerSf:     4.50,

    install: {
      productionRate: { measure: 'sf', value: 350, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       145,
      derivedInstallPerSf: 0.41,
      notes:          'Snap-together sheets. Fast install. Same labor rate regardless of 2" vs 4" depth — production rate may slow slightly for 4".'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'HDPE honeycomb. Available in 2" and 4" sheets. At 4" depth, need different product sheet (same purchase unit type, different coverage and cost — add as separate cost item or use depth override).'
  },

  {
    id:             'roof-drainage-layer',
    name:           'Drainage / Filter Layer (composite)',
    category:       'roof-layer',
    pricingMode:    'assembly',
    systemRef:      { type: 'roof-layer', refId: 'drainage-layer' },

    purchaseUnit:   'roll',
    unitCoverage:   { measure: 'sf', value: 215 },
    depthRef:       null,
    wastePct:       0.10,
    roundingRule:   'unit',
    bundleSize:     null,
    palletSize:     null,
    furnishedCostPerUnit: 215.00,
    derivedCostPerSf:     1.00,

    install: {
      productionRate: { measure: 'sf', value: 500, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       145,
      derivedInstallPerSf: 0.29,
      notes:          'Roll-out and overlap. Very fast. Higher waste due to overlaps and cuts around penetrations.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'Composite drainage + filter fabric roll. 10% waste accounts for lap requirements and cuts.'
  },

  {
    id:             'roof-protection-mat',
    name:           'Root Barrier / Protection Mat',
    category:       'roof-layer',
    pricingMode:    'assembly',
    systemRef:      { type: 'roof-layer', refId: 'protection-mat' },

    purchaseUnit:   'roll',
    unitCoverage:   { measure: 'sf', value: 300 },
    depthRef:       null,
    wastePct:       0.08,
    roundingRule:   'unit',
    bundleSize:     null,
    palletSize:     null,
    furnishedCostPerUnit: 195.00,
    derivedCostPerSf:     0.65,

    install: {
      productionRate: { measure: 'sf', value: 600, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       145,
      derivedInstallPerSf: 0.24,
      notes:          'Roll-out over membrane. Fastest layer to install.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'Root barrier and protection layer. Applied directly over waterproofing membrane.'
  },

  {
    id:             'roof-concrete-pavers',
    name:           'Concrete Pavers on Pedestals (2")',
    category:       'roof-layer',
    pricingMode:    'assembly',
    systemRef:      { type: 'roof-layer', refId: 'concrete-pavers' },

    purchaseUnit:   'sf',
    unitCoverage:   { measure: 'sf', value: 1 },
    depthRef:       null,
    wastePct:       0.07,
    roundingRule:   'none',
    bundleSize:     null,
    palletSize:     null,
    furnishedCostPerUnit: 14.00,
    derivedCostPerSf:     14.00,

    install: {
      productionRate: { measure: 'sf', value: 80, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       155,
      derivedInstallPerSf: 1.94,
      notes:          'Set and level each paver on pedestal. Slower than other layers — precision work. Does not include pedestal height adjustment at edges.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          '2" concrete pavers on adjustable-height pedestals. Furnished cost includes both paver and pedestal. 7% waste for cuts at edges and penetrations.'
  },


  // ═════════════════════════════════════════════════════════════════════
  // PARAMETRIC MODE — ground-level BMPs
  // ═════════════════════════════════════════════════════════════════════
  //
  // These systems are not broken into individual material takeoffs.
  // Instead, a base cost per SF is adjusted by project-specific
  // parameters (depth, liner, underdrain, soil type, etc.).
  //
  // Each parameter has a set of options. The estimator (or user)
  // selects one option per parameter. Multipliers compound; adders
  // add sequentially after multipliers.
  //
  // Calculation order:
  //   1. Start with baseCostPerSf
  //   2. Apply all 'multiplier' parameters (compound)
  //   3. Apply all 'adder' parameters (sequential)
  //   4. Result = adjustedCostPerSf
  //   5. Furnished subtotal = adjustedCostPerSf * area
  //
  // For estimate backup, each parameter is shown as a line:
  //   Base: $40.00/SF
  //   Media depth (36"): × 1.35 → $54.00
  //   Liner (HDPE required): + $3.50 → $57.50
  //   Underdrain (included): + $2.00 → $59.50
  //   Outlet structure (standard): + $0.50 → $60.00
  //   → Adjusted furnished: $60.00/SF × 5,000 SF = $300,000

  {
    id:             'bmp-bioretention',
    name:           'Bioretention Cell (at grade)',
    category:       'bmp-ground',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 1 },

    // Parametric fields
    baseCostPerSf:  40.00,                              // [PLACEHOLDER] base at default params
    baseCostBasis:  'Standard bioretention cell: 24" engineered media, no liner, includes underdrain, standard inlet/outlet. Excludes excavation support and dewatering.',

    parameters: [
      {
        id:           'media-depth',
        name:         'Media Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 24,
        options: [
          { value: 18, label: '18" (min)',    adjustment: 0.85, notes: 'Minimum depth for most jurisdictions. Lower retention capacity.' },
          { value: 24, label: '24" (standard)', adjustment: 1.00, notes: 'Standard design depth. Baseline cost.' },
          { value: 30, label: '30"',          adjustment: 1.20, notes: 'Deeper media for higher retention or pollutant removal.' },
          { value: 36, label: '36" (deep)',   adjustment: 1.35, notes: 'Maximum typical depth. Significant excavation cost increase.' }
        ],
        editable: true
      },
      {
        id:           'liner',
        name:         'Liner',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'none',
        options: [
          { value: 'none',   label: 'No liner',        adjustment: 0.00, notes: 'Infiltration to native soil allowed. Most common.' },
          { value: 'hdpe',   label: 'HDPE liner',      adjustment: 3.50, notes: 'Required when infiltration restricted (contaminated soil, high groundwater, proximity to structures).' },
          { value: 'clay',   label: 'Clay liner',      adjustment: 2.00, notes: 'Compacted clay alternative. Lower cost, less reliable.' }
        ],
        editable: true
      },
      {
        id:           'underdrain',
        name:         'Underdrain',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'standard',
        options: [
          { value: 'none',     label: 'No underdrain',   adjustment: -2.00, notes: 'Full infiltration design. Only viable with good native soils.' },
          { value: 'standard', label: 'Standard',        adjustment: 0.00,  notes: 'Perforated pipe in gravel bed. Included in base cost.' },
          { value: 'upturned', label: 'Upturned elbow',  adjustment: 1.50,  notes: 'Creates internal water storage zone for retention credit. Common in NC, MD.' }
        ],
        editable: true
      },
      {
        id:           'outlet',
        name:         'Outlet Structure',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'standard',
        options: [
          { value: 'standard', label: 'Standard',       adjustment: 0.00,  notes: 'Simple outlet pipe to storm system. Included in base.' },
          { value: 'control',  label: 'Flow control',   adjustment: 1.25,  notes: 'Orifice plate or weir for detention rate control. Required by some jurisdictions.' },
          { value: 'overflow', label: 'Overflow + control', adjustment: 2.00, notes: 'Flow control plus emergency overflow structure.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 40.00,                           // at all defaults

    install: {
      productionRate: { measure: 'sf', value: 40, per: 'hour' },
      crewBasis:      'crew-3',
      laborRate:       210,
      derivedInstallPerSf: 5.25,
      notes:          'Includes excavation, gravel, soil, underdrain, plantings. Production rate is for the complete system. Actual install is typically subcontract — rate is placeholder for all-in sub price.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate — roughly matches bmp-options.js unitPrice of $75/SF after adjustments and markup',
    notes:          'At-grade bioretention. Parametric base of $40/SF is the direct cost at standard parameters. After adjustments, markup chain gets it to the $65-85/SF range seen in the engine.'
  },

  {
    id:             'bmp-underground-det',
    name:           'Underground Detention System',
    category:       'bmp-ground',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 5 },

    baseCostPerSf:  55.00,                              // [PLACEHOLDER] base at default params
    baseCostBasis:  'Standard underground detention: modular chamber system at 36" depth, standard backfill, includes outlet control. Excludes dewatering and traffic-rated loading.',

    parameters: [
      {
        id:           'system-depth',
        name:         'System Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 36,
        options: [
          { value: 24, label: '24" (shallow)',  adjustment: 0.80, notes: 'Single-layer chambers. Lower storage per SF.' },
          { value: 36, label: '36" (standard)', adjustment: 1.00, notes: 'Standard single-layer. Baseline cost.' },
          { value: 48, label: '48" (deep)',     adjustment: 1.30, notes: 'Stacked or deep chambers. More excavation and backfill.' },
          { value: 72, label: '72" (double)',   adjustment: 1.75, notes: 'Double-stacked chambers. Major excavation. Shoring likely required.' }
        ],
        editable: true
      },
      {
        id:           'loading',
        name:         'Surface Loading',
        type:         'multiplier',
        unit:         '',
        defaultValue: 'landscape',
        options: [
          { value: 'landscape', label: 'Landscape (HS-10)', adjustment: 1.00, notes: 'Light loading. Standard backfill depth.' },
          { value: 'parking',   label: 'Parking (HS-20)',   adjustment: 1.15, notes: 'Passenger vehicle loading. Additional cover depth.' },
          { value: 'traffic',   label: 'Traffic (HS-25)',   adjustment: 1.35, notes: 'Heavy vehicle loading. Reinforced chambers, deeper cover.' }
        ],
        editable: true
      },
      {
        id:           'liner',
        name:         'Liner',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'none',
        options: [
          { value: 'none', label: 'No liner',   adjustment: 0.00, notes: 'Allows infiltration. Common where soils permit.' },
          { value: 'hdpe', label: 'HDPE liner',  adjustment: 4.50, notes: 'Watertight system. Required for detention-only credit in many jurisdictions.' }
        ],
        editable: true
      },
      {
        id:           'outlet',
        name:         'Outlet Control',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'orifice',
        options: [
          { value: 'orifice',  label: 'Orifice plate',     adjustment: 0.00, notes: 'Simple flow control. Included in base.' },
          { value: 'vortex',   label: 'Vortex separator',  adjustment: 2.50, notes: 'Higher-performance outlet with water quality treatment.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 55.00,

    install: {
      productionRate: { measure: 'sf', value: 25, per: 'hour' },
      crewBasis:      'crew-3',
      laborRate:       250,
      derivedInstallPerSf: 10.00,
      notes:          'Excavation, chamber placement, pipe connections, backfill, compaction. Typically subcontract scope. Rate varies significantly with depth and access.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'Underground modular detention. Parametric base of $55/SF is direct cost at standard parameters. Depth and loading are the biggest cost drivers.'
  },

  {
    id:             'bmp-underground-cells',
    name:           'Underground Cells / Crates',
    category:       'bmp-ground',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 2 },

    baseCostPerSf:  53.00,                              // [PLACEHOLDER] modular cell system — calibrated to $100/SF engine sell
    baseCostBasis:  'Standard modular stormwater cell system: 36" depth, 0.95 void ratio, standard backfill and connections. Excludes dewatering.',

    parameters: [
      {
        id:           'storage-depth',
        name:         'Storage Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 36,
        options: [
          { value: 24, label: '24" (single)',   adjustment: 0.75, notes: 'Single-height cells. Lower volume per SF.' },
          { value: 36, label: '36" (standard)',  adjustment: 1.00, notes: 'Standard modular cell depth.' },
          { value: 48, label: '48" (deep)',      adjustment: 1.35, notes: 'Deeper excavation, may need shoring.' },
          { value: 72, label: '72" (stacked)',   adjustment: 1.80, notes: 'Double-stacked cells. Major excavation.' }
        ],
        editable: true
      },
      {
        id:           'loading',
        name:         'Surface Loading',
        type:         'multiplier',
        unit:         '',
        defaultValue: 'landscape',
        options: [
          { value: 'landscape', label: 'Landscape',     adjustment: 1.00, notes: 'Light loading, standard cover.' },
          { value: 'parking',   label: 'Parking (HS-20)', adjustment: 1.15, notes: 'Passenger vehicles.' },
          { value: 'traffic',   label: 'Traffic (HS-25)', adjustment: 1.35, notes: 'Heavy vehicles, deeper cover.' }
        ],
        editable: true
      },
      {
        id:           'geotextile',
        name:         'Geotextile Wrap',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'standard',
        options: [
          { value: 'standard', label: 'Standard wrap',   adjustment: 0.00, notes: 'Included in base.' },
          { value: 'heavy',    label: 'Heavy-duty wrap',  adjustment: 1.50, notes: 'For contaminated or aggressive soils.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 53.00,

    install: {
      productionRate: { measure: 'sf', value: 30, per: 'hour' },
      crewBasis:      'crew-3',
      laborRate:       230,
      derivedInstallPerSf: 7.67,
      notes:          'Excavation, cell assembly, connections, backfill. Typically subcontract.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-07',
    source:         'estimate — calibrated to bmp-options unitPrice of $100/SF',
    notes:          'Modular underground stormwater cells. Parametric base of $53/SF + install $7.67 + waste 5% + dist-3tier markup = $100/SF sell.'
  },

  {
    id:             'bmp-permeable-pavers',
    name:           'Permeable Pavers (at grade)',
    category:       'bmp-ground',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 3 },

    baseCostPerSf:  85.00,                              // [PLACEHOLDER] paver + base + reservoir
    baseCostBasis:  'Permeable interlocking concrete pavers with 18" aggregate reservoir base, geotextile, and underdrain. Excludes subgrade preparation beyond standard.',

    parameters: [
      {
        id:           'reservoir-depth',
        name:         'Reservoir Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 18,
        options: [
          { value: 12, label: '12" (min)',      adjustment: 0.85, notes: 'Minimum reservoir for most applications.' },
          { value: 18, label: '18" (standard)',  adjustment: 1.00, notes: 'Standard open-graded aggregate base.' },
          { value: 24, label: '24" (deep)',      adjustment: 1.20, notes: 'Deeper reservoir for higher storage.' }
        ],
        editable: true
      },
      {
        id:           'paver-type',
        name:         'Paver Type',
        type:         'multiplier',
        unit:         '',
        defaultValue: 'standard',
        options: [
          { value: 'standard',   label: 'Standard PICP',  adjustment: 1.00, notes: 'Standard permeable interlocking concrete paver.' },
          { value: 'architectural', label: 'Architectural', adjustment: 1.25, notes: 'Premium finish, colors, patterns.' }
        ],
        editable: true
      },
      {
        id:           'underdrain',
        name:         'Underdrain',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'standard',
        options: [
          { value: 'none',     label: 'No underdrain',  adjustment: -3.00, notes: 'Full infiltration. Only for good native soils.' },
          { value: 'standard', label: 'Standard',       adjustment: 0.00,  notes: 'Perforated pipe in aggregate. Included in base.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 85.00,

    install: {
      productionRate: { measure: 'sf', value: 25, per: 'hour' },
      crewBasis:      'crew-3',
      laborRate:       230,
      derivedInstallPerSf: 9.20,
      notes:          'Subgrade prep, geotextile, aggregate placement and compaction, paver setting, joint fill. Typically specialty sub.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-07',
    source:         'estimate — calibrated to bmp-options unitPrice of $155/SF',
    notes:          'At-grade permeable pavers. Labor-intensive install drives high cost. Parametric base of $85/SF direct targets the $155/SF engine range after markup.'
  },

  {
    id:             'bmp-below-grade-tank',
    name:           'Below Grade Tank (Dead Storage)',
    category:       'bmp-ground',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 4 },

    baseCostPerSf:  610.00,                             // [PLACEHOLDER] concrete vault — calibrated to $1200/SF engine sell
    baseCostBasis:  'Cast-in-place or precast concrete underground vault. 72" detention depth, 24" freeboard. Includes excavation, structure, pump, controls. Dead storage — not usable space.',

    parameters: [
      {
        id:           'tank-depth',
        name:         'Tank Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 72,
        options: [
          { value: 48, label: '48" (shallow)',  adjustment: 0.75, notes: 'Reduced depth, less excavation.' },
          { value: 72, label: '72" (standard)', adjustment: 1.00, notes: 'Standard design depth.' },
          { value: 96, label: '96" (deep)',     adjustment: 1.30, notes: 'Deep tank, shoring likely required.' }
        ],
        editable: true
      },
      {
        id:           'construction',
        name:         'Construction Type',
        type:         'multiplier',
        unit:         '',
        defaultValue: 'precast',
        options: [
          { value: 'precast', label: 'Precast concrete', adjustment: 1.00, notes: 'Standard precast vault sections.' },
          { value: 'cip',     label: 'Cast-in-place',    adjustment: 1.20, notes: 'Custom CIP vault. Higher cost, more flexibility.' }
        ],
        editable: true
      },
      {
        id:           'pump',
        name:         'Pump System',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'standard',
        options: [
          { value: 'gravity',  label: 'Gravity drain',    adjustment: -50.00, notes: 'Gravity outlet possible. Removes pump cost.' },
          { value: 'standard', label: 'Standard pump',    adjustment: 0.00,   notes: 'Submersible pump and controls. Included in base.' },
          { value: 'duplex',   label: 'Duplex pump',      adjustment: 75.00,  notes: 'Redundant pump system for reliability.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 610.00,

    install: {
      productionRate: { measure: 'sf', value: 5, per: 'hour' },
      crewBasis:      'subcontract',
      laborRate:       120,
      derivedInstallPerSf: 120.00,
      notes:          'Subcontract price per SF of tank footprint. Includes excavation, forming, placement, backfill. Rate reflects high-cost specialty work.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-07',
    source:         'estimate — calibrated to bmp-options unitPrice of $1200/SF',
    notes:          'Underground detention vault. Parametric base $610/SF + install $120 + waste 5% + dist-3tier markup = $1200/SF sell.'
  },

  {
    id:             'bmp-below-grade-tank-usable',
    name:           'Below Grade Tank (Usable Space)',
    category:       'bmp-ground',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 5 },

    baseCostPerSf:  760.00,                             // [PLACEHOLDER] usable vault — calibrated to $1500/SF engine sell
    baseCostBasis:  'Below-grade vault with usable interior space above the detention volume. 72" detention depth, finished interior. Includes structure, MEP rough-in, pump, controls.',

    parameters: [
      {
        id:           'tank-depth',
        name:         'Tank Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 72,
        options: [
          { value: 48, label: '48" (shallow)',  adjustment: 0.80, notes: 'Reduced depth.' },
          { value: 72, label: '72" (standard)', adjustment: 1.00, notes: 'Standard depth.' },
          { value: 96, label: '96" (deep)',     adjustment: 1.25, notes: 'Deep vault.' }
        ],
        editable: true
      },
      {
        id:           'finish-level',
        name:         'Interior Finish',
        type:         'multiplier',
        unit:         '',
        defaultValue: 'basic',
        options: [
          { value: 'basic',    label: 'Basic (utility)',   adjustment: 1.00, notes: 'Unfinished interior, utility use only.' },
          { value: 'finished', label: 'Finished (parking)', adjustment: 1.15, notes: 'Finished for parking or storage.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 760.00,

    install: {
      productionRate: { measure: 'sf', value: 4, per: 'hour' },
      crewBasis:      'subcontract',
      laborRate:       150,
      derivedInstallPerSf: 150.00,
      notes:          'Subcontract price per SF. Higher than dead storage due to interior finish and MEP coordination.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-07',
    source:         'estimate — calibrated to bmp-options unitPrice of $1500/SF',
    notes:          'Usable underground vault. Parametric base $760/SF + install $150 + waste 5% + dist-3tier markup = $1500/SF sell.'
  },

  {
    id:             'bmp-on-structure-tank',
    name:           'On-Structure Tank (Usable Space)',
    category:       'bmp-roof',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 6 },

    baseCostPerSf:  850.00,                             // [PLACEHOLDER] on-structure vault — calibrated to $1500/SF engine sell
    baseCostBasis:  'On-structure detention vault within the building envelope. Typically at podium or basement level. 72" detention depth, finished interior. Includes waterproofing, structure, MEP.',

    parameters: [
      {
        id:           'tank-depth',
        name:         'Tank Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 72,
        options: [
          { value: 48, label: '48" (shallow)',  adjustment: 0.80, notes: 'Reduced depth.' },
          { value: 72, label: '72" (standard)', adjustment: 1.00, notes: 'Standard depth.' },
          { value: 96, label: '96" (deep)',     adjustment: 1.25, notes: 'Deep vault.' }
        ],
        editable: true
      },
      {
        id:           'waterproofing',
        name:         'Waterproofing',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'standard',
        options: [
          { value: 'standard', label: 'Standard',  adjustment: 0.00,  notes: 'Single-ply membrane. Included in base.' },
          { value: 'premium',  label: 'Premium',    adjustment: 15.00, notes: 'Redundant membrane with leak detection.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 850.00,

    install: {
      productionRate: { measure: 'sf', value: 4, per: 'hour' },
      crewBasis:      'subcontract',
      laborRate:       160,
      derivedInstallPerSf: 160.00,
      notes:          'Subcontract price per SF. On-structure adds waterproofing and structural coordination costs.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-07',
    source:         'estimate — calibrated to bmp-options unitPrice of $1500/SF',
    notes:          'On-structure detention tank. Parametric base $850/SF + install $160 + waste 5% + direct-2tier markup = ~$1500/SF sell.'
  },

  {
    id:             'bmp-blue-roof',
    name:           'Blue Roof Cells 6"',
    category:       'bmp-roof',
    pricingMode:    'parametric',
    systemRef:      { type: 'bmp-option', refId: 7 },

    baseCostPerSf:  48.50,                              // [PLACEHOLDER] tray system on roof — calibrated to $75/SF engine sell
    baseCostBasis:  'Blue roof detention tray system: 6" total depth, 3" usable storage, check dams and flow restrictors, roof drain modifications. Applied over existing waterproofing.',

    parameters: [
      {
        id:           'storage-depth',
        name:         'Storage Depth',
        type:         'multiplier',
        unit:         'in',
        defaultValue: 3,
        options: [
          { value: 2, label: '2" (shallow)',   adjustment: 0.80, notes: 'Minimal storage depth. Lower detention.' },
          { value: 3, label: '3" (standard)',  adjustment: 1.00, notes: 'Standard blue roof storage.' },
          { value: 4, label: '4" (deep)',      adjustment: 1.25, notes: 'Deeper storage. Higher structural load.' }
        ],
        editable: true
      },
      {
        id:           'flow-control',
        name:         'Flow Control',
        type:         'adder',
        unit:         '$/SF',
        defaultValue: 'standard',
        options: [
          { value: 'standard',  label: 'Standard restrictors', adjustment: 0.00,  notes: 'Basic flow restrictors at roof drains. Included.' },
          { value: 'smart',     label: 'Smart controls',       adjustment: 8.00,  notes: 'Active valve system with weather-based controls.' }
        ],
        editable: true
      }
    ],

    derivedCostPerSf: 48.50,

    install: {
      productionRate: { measure: 'sf', value: 100, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       155,
      derivedInstallPerSf: 1.55,
      notes:          'Tray/check dam placement and roof drain modification. Moderate production rate — layout work required.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-07',
    source:         'estimate — calibrated to bmp-options unitPrice of $75/SF',
    notes:          'Blue roof detention. Parametric base $48.50/SF + install $1.55 + waste 5% + direct-2tier markup = $75/SF sell.'
  },


  // ═════════════════════════════════════════════════════════════════════
  // TURNKEY MODE — flat unit price systems
  // ═════════════════════════════════════════════════════════════════════
  //
  // Simple systems priced per unit with optional adjustments.
  // No material takeoff, no parameter matrix. Just a unit price
  // that may be tweaked for project conditions.
  //
  // Adjustments are applied in order:
  //   1. All multipliers (compound)
  //   2. All adders (sequential)
  //   adjustedPrice = unitPrice * mult1 * mult2 + add1 + add2
  //
  // For estimate backup:
  //   Unit price: $600.00/each
  //   High-rise adjustment: × 1.15 → $690.00
  //   Certification: + $75.00 → $765.00
  //   Quantity: 24 anchors
  //   Total: $765.00 × 24 = $18,360

  {
    id:             'fp-diadem-anchor',
    name:           'Diadem Line 21 Fall Protection Anchor',
    category:       'fall-protect',
    pricingMode:    'turnkey',
    systemRef:      { type: 'bmp-option', refId: 16 },

    // Turnkey fields
    unitPrice:      600.00,                             // [PLACEHOLDER] per anchor, furnished + install
    unitMeasure:    'each',

    adjustments: [
      {
        id:           'access-height',
        name:         'Access / Height',
        type:         'multiplier',
        defaultValue: 1.00,
        editable:     true,
        notes:        'Increase for high-rise logistics. 1.00 = standard, 1.15 = high-rise, 1.25 = extreme access.'
      },
      {
        id:           'certification',
        name:         'Third-Party Certification',
        type:         'adder',
        defaultValue: 75.00,
        editable:     true,
        notes:        'Per-anchor certification/pull-test cost. $0 if self-certified, $75-150 for third-party.'
      }
    ],

    derivedCostPerSf: null,                             // not area-based

    install: {
      productionRate: { measure: 'each', value: 2, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       175,
      derivedInstallPerSf: null,
      notes:          'Structural attachment + certification. Lifeline / cable not included. Install included in unitPrice for turnkey mode — install fields here are for reference only.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'estimate',
    notes:          'Per-anchor turnkey price. Install is bundled into unitPrice. The install block is retained for transparency (shows crew basis and production rate) but is not used for separate calculation. Adjustments handle project-specific variation.'
  },

  {
    id:             'pv-overeasy-xm3',
    name:           'OverEasy xM3-256 Ballasted Solar',
    category:       'pv',
    pricingMode:    'turnkey',
    systemRef:      { type: 'bmp-option', refId: 12 },

    unitPrice:      402.00,                             // [PLACEHOLDER] direct cost — after dist-3tier markup + waste = ~$667 sell (engine pricePerUnit)
    unitMeasure:    'each',

    adjustments: [
      {
        id:           'electrical',
        name:         'Electrical Connection',
        type:         'adder',
        defaultValue: 0.00,
        editable:     true,
        notes:        'Per-unit electrical scope. $0 if excluded (typical — separate sub). $150-250 if bundled.'
      },
      {
        id:           'access-height',
        name:         'Access / Height',
        type:         'multiplier',
        defaultValue: 1.00,
        editable:     true,
        notes:        'Logistics adjustment for roof height. 1.00 = low-rise, 1.10 = mid-rise, 1.20 = high-rise.'
      }
    ],

    derivedCostPerSf: 8.93,                            // 402 / 45 SF per unit (direct cost; sell ≈ $14.82/SF after markup)

    install: {
      productionRate: { measure: 'each', value: 4, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       155,
      derivedInstallPerSf: 0.86,
      notes:          'Ballasted PV tray placement. Electrical connection separate scope. Install included in unitPrice for turnkey — install fields here are for reference/breakdown only.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-06',
    source:         'back-calculated from bmp-options pricePerUnit of $667 (sell target)',
    notes:          'Ballasted PV. Direct cost $402/unit × dist-3tier markup = ~$667/unit sell ($14.82/SF). 45 SF footprint per unit. Electrical not included.'
  },

  {
    id:             'pv-contec-greenlite',
    name:           'Contec Greenlite Pro 4mm + Rails',
    category:       'pv',
    pricingMode:    'turnkey',
    systemRef:      { type: 'bmp-option', refId: 15 },

    unitPrice:      223.00,                             // [PLACEHOLDER] direct cost — after dist-3tier markup + waste = ~$370 sell (engine unitPrice)
    unitMeasure:    'each',

    adjustments: [
      {
        id:           'electrical',
        name:         'Electrical Connection',
        type:         'adder',
        defaultValue: 0.00,
        editable:     true,
        notes:        'Per-unit electrical scope. $0 if excluded. $200-350 if bundled.'
      },
      {
        id:           'access-height',
        name:         'Access / Height',
        type:         'multiplier',
        defaultValue: 1.00,
        editable:     true,
        notes:        'Logistics adjustment. 1.00 = low-rise, 1.10 = mid-rise, 1.20 = high-rise.'
      }
    ],

    derivedCostPerSf: 8.98,                            // 370 / 41.21 SF per unit

    install: {
      productionRate: { measure: 'each', value: 3, per: 'hour' },
      crewBasis:      'crew-2',
      laborRate:       155,
      derivedInstallPerSf: 1.25,
      notes:          'Base plate + rail placement. Electrical separate. Install included in unitPrice for turnkey.'
    },

    confirmed:      false,
    active:         true,
    effectiveDate:  '2025-01-01',
    lastUpdated:    '2026-04-07',
    source:         'bmp-options.js pricePerUnit (furnished), estimate (install)',
    notes:          'Landscape-oriented PV on green roof base. 41.21 SF per unit. Electrical not included in base price.'
  }

];


// ── Schema (for future validation / admin UI generation) ────────────

const COST_ITEM_SCHEMA = {

  // ── Shared fields (all modes) ─────────────────────────────────────

  id:             { type: 'string',  required: true,  editable: false },
  name:           { type: 'string',  required: true,  editable: true  },
  category:       { type: 'string',  required: true,  editable: true,
                    enum: ['roof-layer', 'bmp-ground', 'bmp-roof', 'pv', 'fall-protect', 'accessory', 'labor'] },
  pricingMode:    { type: 'string',  required: true,  editable: false,
                    enum: ['assembly', 'parametric', 'turnkey'] },
  systemRef:      { type: 'object',  required: false, editable: true  },

  // Installation (all modes — may be reference-only for turnkey)
  install: { type: 'object', required: true, editable: true,
    fields: {
      productionRate:     { type: 'object', fields: {
        measure: { type: 'string', enum: ['sf', 'lf', 'each', 'unit'] },
        value:   { type: 'number' },
        per:     { type: 'string', enum: ['hour'] }
      }},
      crewBasis:          { type: 'string', enum: ['laborer', 'foreman', 'crew-2', 'crew-3', 'blended', 'subcontract'] },
      laborRate:          { type: 'number' },
      derivedInstallPerSf:{ type: 'number', computed: true },
      notes:              { type: 'string' }
    }},

  // Tracking (all modes)
  confirmed:      { type: 'boolean', required: true,  editable: true  },
  active:         { type: 'boolean', required: true,  editable: true  },
  effectiveDate:  { type: 'string',  required: true,  editable: true  },
  lastUpdated:    { type: 'string',  required: true,  editable: false, autoSet: true },
  source:         { type: 'string',  required: false, editable: true  },
  notes:          { type: 'string',  required: false, editable: true  },

  // ── Assembly mode fields ──────────────────────────────────────────

  purchaseUnit:   { type: 'string',  requiredIf: 'assembly', editable: true,
                    enum: ['roll', 'sheet', 'bag', 'pallet', 'each', 'assembly', 'sf', 'lf', 'bulk-cy', 'bulk-sf', 'bulk-lf'] },
  unitCoverage:   { type: 'object',  requiredIf: 'assembly', editable: true,
                    fields: {
                      measure: { type: 'string', enum: ['sf', 'lf', 'each', 'cy'] },
                      value:   { type: 'number' }
                    }},
  depthRef:       { type: 'number',  requiredIf: null, editable: true  },
  wastePct:       { type: 'number',  requiredIf: 'assembly', editable: true  },
  roundingRule:   { type: 'string',  requiredIf: 'assembly', editable: true,
                    enum: ['unit', 'bundle', 'pallet', 'none'] },
  bundleSize:     { type: 'number',  requiredIf: null, editable: true  },
  palletSize:     { type: 'number',  requiredIf: null, editable: true  },
  furnishedCostPerUnit: { type: 'number', requiredIf: 'assembly', editable: true },
  derivedCostPerSf:     { type: 'number', required: false, editable: false, computed: true },

  // ── Parametric mode fields ────────────────────────────────────────

  baseCostPerSf:  { type: 'number',  requiredIf: 'parametric', editable: true },
  baseCostBasis:  { type: 'string',  requiredIf: 'parametric', editable: true },
  parameters:     { type: 'array',   requiredIf: 'parametric', editable: true,
                    items: {
                      id:           { type: 'string',  required: true  },
                      name:         { type: 'string',  required: true  },
                      type:         { type: 'string',  required: true, enum: ['multiplier', 'adder'] },
                      unit:         { type: 'string',  required: false },
                      defaultValue: { required: true },
                      options:      { type: 'array',   required: true,
                                      items: {
                                        value:      { required: true },
                                        label:      { type: 'string', required: true },
                                        adjustment: { type: 'number', required: true },
                                        notes:      { type: 'string', required: false }
                                      }},
                      editable:     { type: 'boolean', required: true }
                    }},

  // ── Turnkey mode fields ───────────────────────────────────────────

  unitPrice:      { type: 'number',  requiredIf: 'turnkey', editable: true },
  unitMeasure:    { type: 'string',  requiredIf: 'turnkey', editable: true,
                    enum: ['each', 'sf', 'lf'] },
  adjustments:    { type: 'array',   requiredIf: null, editable: true,
                    items: {
                      id:           { type: 'string',  required: true  },
                      name:         { type: 'string',  required: true  },
                      type:         { type: 'string',  required: true, enum: ['multiplier', 'adder'] },
                      defaultValue: { type: 'number',  required: true  },
                      editable:     { type: 'boolean', required: true  },
                      notes:        { type: 'string',  required: false }
                    }}
};
