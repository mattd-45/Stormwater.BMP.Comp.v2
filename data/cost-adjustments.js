// ═══════════════════════════════════════════════════════════════════════
// COST ADJUSTMENTS — adjustment factors and markup structures
// ═══════════════════════════════════════════════════════════════════════
//
// Two sections:
//   1. COST_ADJUSTMENTS — multipliers applied to base costs before markup
//   2. COST_MARKUPS     — markup chain templates (2-level, 3-level, etc.)
//
// A future estimator applies these in sequence:
//   base cost → adjustments → subtotal → markup chain → final price
//
// Designed for admin editing. Adjustment factors and markup percentages
// are editable values that change by project, market, or client.
//
// ═══════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────
// SECTION 1: ADJUSTMENT FACTORS
// ─────────────────────────────────────────────────────────────────────
//
// Adjustment factors are multipliers applied to the base furnished
// and/or install costs BEFORE markup. They account for real-world
// conditions that shift cost up or down from the baseline.
//
// ── How they work ───────────────────────────────────────────────────
//
//   adjustedCost = baseCost * factor
//
//   factor = 1.00 means no adjustment (baseline)
//   factor = 1.15 means 15% increase
//   factor = 0.90 means 10% decrease
//
// ── Field reference ─────────────────────────────────────────────────
//
//   id              Unique string identifier
//   name            Display name
//   description     What this factor accounts for
//   appliesTo       Which cost component(s) this adjusts:
//                     'furnished' — material/product costs only
//                     'install'   — labor/install costs only
//                     'both'      — applied to total before markup
//   options         Array of named presets with factor values.
//                   The admin/user selects one per project.
//                   Each option:
//                     key:    machine key
//                     label:  display name
//                     factor: multiplier
//                     notes:  when to use this option
//   defaultKey      Which option key is selected by default
//   editable        true if admin can add/modify options
//   lastUpdated     ISO date of last edit
//
// ═══════════════════════════════════════════════════════════════════════

const COST_ADJUSTMENTS = [

  // ── Locality Factor ───────────────────────────────────────────────
  //
  // Accounts for geographic cost variation. Labor rates, material
  // delivery, and market conditions vary significantly by region.

  {
    id:          'locality',
    name:        'Job Locality',
    description: 'Regional cost adjustment for labor rates, material availability, and market conditions. NYC and SF are premium markets. Southeast and Midwest are typically below national average.',
    appliesTo:   'both',
    options: [
      { key: 'low',       label: 'Low-cost market',       factor: 0.85, notes: 'Southeast, rural, non-union markets' },
      { key: 'average',   label: 'Average / national',    factor: 1.00, notes: 'Baseline — mid-Atlantic, standard metro' },
      { key: 'high',      label: 'High-cost market',      factor: 1.20, notes: 'Boston, DC, Chicago, Seattle' },
      { key: 'premium',   label: 'Premium market',        factor: 1.40, notes: 'NYC, SF, Honolulu — union, congested, high demand' }
    ],
    defaultKey:  'average',
    editable:    true,
    lastUpdated: '2026-04-06'
  },

  // ── Complexity Factor ─────────────────────────────────────────────
  //
  // Accounts for project-specific difficulty beyond the baseline.
  // Phased construction, complicated geometry, tight schedules, etc.

  {
    id:          'complexity',
    name:        'Project Complexity',
    description: 'Adjustment for scope complexity — phasing, geometry, coordination with other trades, schedule constraints. Simple = open roof, single phase. Complex = multi-phase, irregular layout, tight schedule.',
    appliesTo:   'install',
    options: [
      { key: 'simple',    label: 'Simple',    factor: 0.90, notes: 'Open roof, single phase, straightforward access' },
      { key: 'standard',  label: 'Standard',  factor: 1.00, notes: 'Typical commercial project, normal coordination' },
      { key: 'complex',   label: 'Complex',   factor: 1.15, notes: 'Multi-phase, irregular geometry, trade congestion' },
      { key: 'difficult', label: 'Difficult',  factor: 1.30, notes: 'Occupied building, extreme schedule, high-rise logistics' }
    ],
    defaultKey:  'standard',
    editable:    true,
    lastUpdated: '2026-04-06'
  },

  // ── Access / Logistics Factor ─────────────────────────────────────
  //
  // Accounts for how materials get to the installation area.
  // Ground-floor at-grade work is baseline. Roof work with crane
  // is a significant adder.

  {
    id:          'access',
    name:        'Access / Logistics',
    description: 'Cost adjustment for material delivery to the work area. At-grade work is baseline. Rooftop work requires crane or hoist, which adds significant cost. High-rise has additional staging and safety requirements.',
    appliesTo:   'install',
    options: [
      { key: 'at-grade',    label: 'At grade',          factor: 1.00, notes: 'Ground level, forklift/loader access' },
      { key: 'low-roof',    label: 'Low roof (1-3 fl)', factor: 1.10, notes: 'Low-rise, crane or boom truck accessible' },
      { key: 'mid-roof',    label: 'Mid roof (4-8 fl)', factor: 1.20, notes: 'Mid-rise, tower crane or dedicated hoist' },
      { key: 'high-rise',   label: 'High-rise (9+ fl)', factor: 1.35, notes: 'High-rise, dedicated hoist, staging, safety' }
    ],
    defaultKey:  'at-grade',
    editable:    true,
    lastUpdated: '2026-04-06'
  },

  // ── Waste Factor ──────────────────────────────────────────────────
  //
  // Material waste / overage allowance. Applied to furnished costs
  // only. Install labor is based on designed area, not wasted material.

  {
    id:          'waste',
    name:        'Waste / Overage',
    description: 'Material waste allowance for cuts, damage, and overage ordering. Applied to furnished (material) costs only. Standard is 5% for most roof products, higher for irregular shapes.',
    appliesTo:   'furnished',
    options: [
      { key: 'minimal', label: 'Minimal (2%)',  factor: 1.02, notes: 'Simple rectangular areas, bulk materials' },
      { key: 'standard',label: 'Standard (5%)', factor: 1.05, notes: 'Typical roof with some cuts and penetrations' },
      { key: 'high',    label: 'High (10%)',     factor: 1.10, notes: 'Irregular shapes, many penetrations, sheet goods' }
    ],
    defaultKey:  'standard',
    editable:    true,
    lastUpdated: '2026-04-06'
  }

];


// ─────────────────────────────────────────────────────────────────────
// SECTION 2: MARKUP STRUCTURES
// ─────────────────────────────────────────────────────────────────────
//
// A markup structure defines how the adjusted cost gets marked up
// through the contractual chain to arrive at a sell price.
//
// ── How it works ────────────────────────────────────────────────────
//
//   Each structure has an ordered array of markup tiers.
//   Tiers are applied sequentially (compounding):
//
//     tier1Out = adjustedCost * (1 + tier1.markupPct)
//     tier2Out = tier1Out * (1 + tier2.markupPct)
//     ...
//     finalPrice = last tier output
//
//   Example (3-level):
//     adjustedCost = $10.00
//     Distributor markup 15%  → $10.00 * 1.15 = $11.50
//     Installer markup 25%   → $11.50 * 1.25 = $14.375
//     GC OH&P 10%            → $14.375 * 1.10 = $15.81
//
// ── Field reference ─────────────────────────────────────────────────
//
//   id              Unique string identifier
//   name            Display name
//   description     When to use this structure
//   tiers           Ordered array of markup tiers:
//     label:        Tier name (e.g., 'Distributor Markup')
//     key:          Machine key for the tier
//     markupPct:    Markup percentage as decimal (0.15 = 15%)
//     editable:     true if the percentage can be changed per project
//     notes:        What this tier represents
//   defaultForCategory  Array of cost-item categories this structure
//                       applies to by default. Can be overridden per project.
//   lastUpdated     ISO date of last edit
//
// ═══════════════════════════════════════════════════════════════════════

const COST_MARKUPS = [

  // ── 2-Level: Direct + Profit ──────────────────────────────────────
  //
  // Simplest structure. Used when Sempergreen sells directly to the
  // installing contractor. No distributor in the chain.
  //
  //   adjusted cost → installer markup → sell price

  {
    id:          'direct-2tier',
    name:        'Direct + Installer Markup',
    description: 'Direct sale to installing contractor. No distributor. Used for direct relationships where Sempergreen furnishes and the contractor installs.',
    tiers: [
      {
        label:     'Contractor Markup',
        key:       'contractor',
        markupPct: 0.30,
        editable:  true,
        notes:     'Installing contractor overhead + profit. Typical 25-35% on specialty subcontract work.'
      },
      {
        label:     'GC OH&P',
        key:       'gc-ohp',
        markupPct: 0.10,
        editable:  true,
        notes:     'General contractor overhead and profit on subcontract line item. Typical 8-12%.'
      }
    ],
    defaultForCategory: ['roof-layer', 'bmp-roof'],
    lastUpdated: '2026-04-06'
  },

  // ── 3-Level: Distributor + Installer + GC ─────────────────────────
  //
  // Full chain. Product goes through a distributor, then to the
  // installer, then marked up by the GC.
  //
  //   adjusted cost → distributor → installer → GC → sell price

  {
    id:          'dist-3tier',
    name:        'Distributor + Installer + GC',
    description: 'Full distribution chain. Product flows from manufacturer through distributor to installer, with GC markup on top. Used for markets where a distributor handles fulfillment.',
    tiers: [
      {
        label:     'Distributor Markup',
        key:       'distributor',
        markupPct: 0.15,
        editable:  true,
        notes:     'Distribution / warehousing / delivery margin. Typical 10-20%.'
      },
      {
        label:     'Installer Markup',
        key:       'installer',
        markupPct: 0.25,
        editable:  true,
        notes:     'Installing contractor overhead + profit. Typical 20-30% when buying through distribution.'
      },
      {
        label:     'GC OH&P',
        key:       'gc-ohp',
        markupPct: 0.10,
        editable:  true,
        notes:     'General contractor overhead and profit. Typical 8-12%.'
      }
    ],
    defaultForCategory: ['bmp-ground', 'pv', 'fall-protect'],
    lastUpdated: '2026-04-06'
  },

  // ── 2-Level: Furnished + Install (budget) ─────────────────────────
  //
  // Simple budget-level structure. No distribution. Used for quick
  // planning estimates where the breakout is just material + labor
  // with a single combined overhead/profit.
  //
  //   adjusted cost → OH&P → budget price

  {
    id:          'budget-2tier',
    name:        'Budget Estimate (Furnished + Install + OH&P)',
    description: 'Planning-level estimate with a single combined overhead and profit markup. Used for early budgets and screening-level comparisons. No distribution chain.',
    tiers: [
      {
        label:     'OH&P',
        key:       'ohp',
        markupPct: 0.20,
        editable:  true,
        notes:     'Combined overhead and profit for budget-level estimating. Typical 15-25%.'
      }
    ],
    defaultForCategory: ['accessory', 'labor'],
    lastUpdated: '2026-04-06'
  },

  // ── Design-Assist / Turnkey ───────────────────────────────────────
  //
  // Sempergreen acts as specialty sub, furnishing and installing.
  // Single markup for the specialty scope, then GC markup on top.

  {
    id:          'turnkey-2tier',
    name:        'Turnkey Sub + GC',
    description: 'Sempergreen or specialty sub provides full turnkey scope (furnish + install). GC marks up the specialty sub number. Used when we carry the install scope directly.',
    tiers: [
      {
        label:     'Specialty Sub Margin',
        key:       'sub-margin',
        markupPct: 0.20,
        editable:  true,
        notes:     'Specialty subcontractor margin on turnkey scope. Covers risk, management, warranty. Typical 15-25%.'
      },
      {
        label:     'GC OH&P',
        key:       'gc-ohp',
        markupPct: 0.10,
        editable:  true,
        notes:     'General contractor overhead and profit. Typical 8-12%.'
      }
    ],
    defaultForCategory: ['roof-layer', 'bmp-roof'],
    lastUpdated: '2026-04-06'
  }

];


// ── Schemas (for future validation / admin UI) ──────────────────────

const COST_ADJUSTMENT_SCHEMA = {
  id:          { type: 'string',  required: true,  editable: false },
  name:        { type: 'string',  required: true,  editable: true  },
  description: { type: 'string',  required: true,  editable: true  },
  appliesTo:   { type: 'string',  required: true,  editable: true,
                 enum: ['furnished', 'install', 'both'] },
  options:     { type: 'array',   required: true,  editable: true,
                 items: {
                   key:    { type: 'string', required: true  },
                   label:  { type: 'string', required: true  },
                   factor: { type: 'number', required: true  },
                   notes:  { type: 'string', required: false }
                 }},
  defaultKey:  { type: 'string',  required: true,  editable: true  },
  editable:    { type: 'boolean', required: true,  editable: false },
  lastUpdated: { type: 'string',  required: true,  editable: false, autoSet: true }
};

const COST_MARKUP_SCHEMA = {
  id:                  { type: 'string',  required: true,  editable: false },
  name:                { type: 'string',  required: true,  editable: true  },
  description:         { type: 'string',  required: true,  editable: true  },
  tiers:               { type: 'array',   required: true,  editable: true,
                         items: {
                           label:     { type: 'string',  required: true  },
                           key:       { type: 'string',  required: true  },
                           markupPct: { type: 'number',  required: true  },
                           editable:  { type: 'boolean', required: true  },
                           notes:     { type: 'string',  required: false }
                         }},
  defaultForCategory:  { type: 'array',   required: false, editable: true  },
  lastUpdated:         { type: 'string',  required: true,  editable: false, autoSet: true }
};
