// ═══════════════════════════════════════════════════════════════════════════
// V3 PRICING CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Calculates total cost for any cost item using its pricingMode:
//   assembly    — purchase unit takeoff (waste, rounding). category roof-layer
//                 uses furnishedCostPerUnit as all-in delivered+hoisted+installed;
//                 separate install math is skipped.
//   parametric  — base cost + parameter adjustments
//   turnkey     — flat unit price + optional adjustments
//
// After computing the direct cost, optionally applies:
//   1. Project-level adjustments (locality, complexity, access, waste)
//   2. Markup chain (2-level or 3-level compounding tiers)
//
// This is a STANDALONE MODULE. It does not touch the UI, the stormwater
// engine, or the roof profile calculator. It reads from COST_ITEMS,
// COST_ADJUSTMENTS, and COST_MARKUPS.
//
// ── Interface ───────────────────────────────────────────────────────────
//
//   V3PricingCalc.calculate(itemId, quantity, options)
//
//   Arguments:
//     itemId     String — matches COST_ITEMS[].id
//     quantity   Object describing the input quantity:
//       {
//         area:   number,    // SF (for area-based items)
//         count:  number,    // units (for count-based items like anchors)
//         depth:  number     // inches (overrides depthRef for assembly items)
//       }
//       Provide area OR count, not both. Depth is optional.
//
//     options    Optional object:
//       {
//         parameterSelections: { parameterId: selectedValue, ... },
//             — For parametric mode: overrides default parameter values.
//               Omitted parameters use defaultValue.
//
//         turnkeyAdjustments: { adjustmentId: overrideValue, ... },
//             — For turnkey mode: overrides default adjustment values.
//               Omitted adjustments use defaultValue.
//
//         adjustments: { adjustmentId: optionKey, ... },
//             — Project-level adjustments from COST_ADJUSTMENTS.
//               e.g., { locality: 'high', complexity: 'complex' }
//               Omitted adjustments use their defaultKey.
//               Pass null to skip all project adjustments.
//
//         markupId: string,
//             — Which COST_MARKUPS structure to apply.
//               If omitted, auto-selects by item category.
//               Pass null to skip markup.
//
//         markupOverrides: { tierKey: overridePct, ... },
//             — Override specific tier percentages in the markup chain.
//               e.g., { 'gc-ohp': 0.08 } to reduce GC from 10% to 8%.
//       }
//
// ── Return value ────────────────────────────────────────────────────────
//
//   {
//     valid:       boolean,
//     errors:      string[],            // non-empty if valid=false
//
//     item: {
//       id, name, category, pricingMode
//     },
//
//     input: {
//       area, count, depth             // as provided
//     },
//
//     furnished: {
//       subtotal:  number,             // total furnished cost
//       perSf:     number | null,      // $/SF (null if count-based)
//       breakdown: [                   // line-by-line backup
//         { label, detail, amount }
//       ]
//     },
//
//     install: {
//       subtotal:  number,
//       perSf:     number | null,
//       breakdown: [
//         { label, detail, amount }
//       ]
//     },
//
//     directCost: {
//       subtotal:  number,             // furnished + install
//       perSf:     number | null
//     },
//
//     adjustments: {
//       applied:   [                   // each adjustment that was applied
//         { id, name, appliesTo, optionKey, optionLabel, factor }
//       ],
//       furnishedAdjusted: number,     // furnished after adjustments
//       installAdjusted:   number,     // install after adjustments
//       subtotal:          number,     // total after adjustments
//       perSf:             number | null
//     },
//
//     markup: {
//       structureId:   string,
//       structureName: string,
//       tiers: [                       // each tier applied
//         { label, key, markupPct, inputAmount, markupAmount, outputAmount }
//       ],
//       subtotal:  number,             // final sell price
//       perSf:     number | null
//     },
//
//     summary: {
//       furnishedSubtotal:  number,
//       installSubtotal:    number,
//       directCost:         number,
//       adjustedCost:       number,
//       sellPrice:          number,
//       perSf:              number | null,
//       effectiveMarkupPct: number      // (sellPrice - directCost) / directCost
//     },
//
//     backupLines: string[]            // human-readable estimate backup
//   }
//
// ── Helper ──────────────────────────────────────────────────────────────
//
//   V3PricingCalc.getItem(itemId)      — returns the cost item or null
//   V3PricingCalc.listItems()          — returns all active items
//   V3PricingCalc.resolveMarkup(itemCategory, markupId)
//                                      — returns the markup structure
//
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Data accessors ────────────────────────────────────────────────────

  function getItems ()       { return window.COST_ITEMS       || []; }
  function getAdjustments () { return window.COST_ADJUSTMENTS || []; }
  function getMarkups ()     { return window.COST_MARKUPS     || []; }

  function getItem (id) {
    return getItems().find(function (i) { return i.id === id && i.active; }) || null;
  }

  function listItems () {
    return getItems().filter(function (i) { return i.active; });
  }


  // ── Formatting helpers ────────────────────────────────────────────────

  function $(v) { return '$' + (v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function num (v, d) { return (v || 0).toFixed(d !== undefined ? d : 2); }
  function pct (v) { return (v * 100).toFixed(1) + '%'; }


  // ── Validation ────────────────────────────────────────────────────────

  function validate (itemId, quantity) {
    var errors = [];
    if (!itemId) errors.push('itemId is required.');
    if (!quantity) errors.push('quantity is required.');
    if (quantity && !quantity.area && !quantity.count) {
      errors.push('quantity must include area (SF) or count.');
    }
    if (quantity && quantity.area && quantity.count) {
      errors.push('Provide area OR count, not both.');
    }
    if (quantity && quantity.area && quantity.area <= 0) {
      errors.push('area must be > 0.');
    }
    if (quantity && quantity.count && quantity.count <= 0) {
      errors.push('count must be > 0.');
    }
    var item = getItem(itemId);
    if (itemId && !item) {
      errors.push('Cost item "' + itemId + '" not found or inactive.');
    }
    return { errors: errors, item: item };
  }


  // ── Assembly pricing ──────────────────────────────────────────────────

  function calcAssembly (item, quantity) {
    var area = quantity.area || 0;
    var depth = quantity.depth || item.depthRef || null;
    var breakdown = [];

    // 1. Net requirement
    var netSF = area;
    if (item.depthRef && depth) {
      netSF = area * (depth / item.depthRef);
      breakdown.push({
        label:  'Net requirement',
        detail: num(area, 0) + ' SF × (' + num(depth, 1) + '" / ' + num(item.depthRef, 1) + '" ref) = ' + num(netSF, 0) + ' SF equivalent',
        amount: null
      });
    } else {
      breakdown.push({
        label:  'Net requirement',
        detail: num(area, 0) + ' SF',
        amount: null
      });
    }

    // 2. Waste
    var grossSF = netSF * (1 + item.wastePct);
    if (item.wastePct > 0) {
      breakdown.push({
        label:  'Waste (' + pct(item.wastePct) + ')',
        detail: num(netSF, 0) + ' × ' + num(1 + item.wastePct, 3) + ' = ' + num(grossSF, 0) + ' SF gross',
        amount: null
      });
    }

    // 3. Convert to purchase units
    var rawUnits = grossSF / item.unitCoverage.value;
    breakdown.push({
      label:  'Raw purchase units',
      detail: num(grossSF, 0) + ' SF / ' + num(item.unitCoverage.value, 2) + ' ' + item.unitCoverage.measure + ' per ' + item.purchaseUnit + ' = ' + num(rawUnits, 2),
      amount: null
    });

    // 4. Rounding
    var purchaseQty;
    if (item.roundingRule === 'unit') {
      purchaseQty = Math.ceil(rawUnits);
    } else if (item.roundingRule === 'bundle' && item.bundleSize) {
      purchaseQty = Math.ceil(rawUnits / item.bundleSize) * item.bundleSize;
    } else if (item.roundingRule === 'pallet' && item.palletSize) {
      purchaseQty = Math.ceil(rawUnits / item.palletSize) * item.palletSize;
    } else {
      purchaseQty = rawUnits; // 'none'
    }

    if (item.roundingRule !== 'none') {
      breakdown.push({
        label:  'Rounding (' + item.roundingRule + ')',
        detail: num(rawUnits, 2) + ' → ' + num(purchaseQty, 0) + ' ' + item.purchaseUnit + (item.purchaseUnit === 'sf' ? '' : 's'),
        amount: null
      });
    }

    // 5. Furnished / all-in subtotal
    var furnishedSubtotal = purchaseQty * item.furnishedCostPerUnit;
    var furnLabel = item.category === 'roof-layer'
      ? 'Delivered, hoisted & installed (all-in per purchase unit)'
      : 'Furnished subtotal';
    breakdown.push({
      label:  furnLabel,
      detail: num(purchaseQty, 0) + ' ' + item.purchaseUnit + (item.purchaseUnit === 'sf' ? '' : 's') + ' × ' + $(item.furnishedCostPerUnit) + ' = ' + $(furnishedSubtotal),
      amount: furnishedSubtotal
    });

    // 6. Install subtotal (roof layers: single column — put hoist/install in furnishedCostPerUnit via external takeoff)
    var installBreakdown = [];
    var installSubtotal = 0;
    var inst = item.install;

    if (item.category === 'roof-layer') {
      installBreakdown.push({
        label:  'Separate install / hoist',
        detail: 'Not used — included in all-in unit price above',
        amount: 0
      });
    } else if (inst && inst.crewBasis === 'subcontract') {
      installSubtotal = netSF * inst.laborRate;
      installBreakdown.push({
        label:  'Install (subcontract)',
        detail: num(netSF, 0) + ' ' + inst.productionRate.measure + ' × ' + $(inst.laborRate) + '/' + inst.productionRate.measure + ' = ' + $(installSubtotal),
        amount: installSubtotal
      });
    } else if (inst && inst.productionRate) {
      var installQty = (inst.productionRate.measure === 'each') ? (quantity.count || purchaseQty) : netSF;
      var installHrs = installQty / inst.productionRate.value;
      installSubtotal = installHrs * inst.laborRate;
      installBreakdown.push({
        label:  'Install (' + inst.crewBasis + ')',
        detail: num(installQty, 0) + ' ' + inst.productionRate.measure + ' / ' + num(inst.productionRate.value, 0) + ' per hr = ' + num(installHrs, 1) + ' hrs × ' + $(inst.laborRate) + '/hr = ' + $(installSubtotal),
        amount: installSubtotal
      });
    }

    return {
      furnished: {
        subtotal:  furnishedSubtotal,
        perSf:     area > 0 ? furnishedSubtotal / area : null,
        breakdown: breakdown
      },
      install: {
        subtotal:  installSubtotal,
        perSf:     area > 0 ? installSubtotal / area : null,
        breakdown: installBreakdown
      },
      purchaseQty: purchaseQty,
      adjustedQty: netSF
    };
  }


  // ── Parametric pricing ────────────────────────────────────────────────

  function calcParametric (item, quantity, parameterSelections) {
    var area = quantity.area || 0;
    var selections = parameterSelections || {};
    var breakdown = [];

    var running = item.baseCostPerSf;
    breakdown.push({
      label:  'Base cost',
      detail: $(running) + '/SF (' + item.baseCostBasis.substring(0, 80) + '...)',
      amount: null
    });

    // Separate multipliers and adders; apply multipliers first
    var multipliers = [];
    var adders = [];
    (item.parameters || []).forEach(function (p) {
      if (p.type === 'multiplier') multipliers.push(p);
      else adders.push(p);
    });

    // Apply multipliers (compound)
    multipliers.forEach(function (param) {
      var selVal = (selections[param.id] !== undefined) ? selections[param.id] : param.defaultValue;
      var opt = param.options.find(function (o) { return o.value === selVal; });
      if (!opt) {
        // Fallback to default
        opt = param.options.find(function (o) { return o.value === param.defaultValue; });
      }
      if (opt) {
        running *= opt.adjustment;
        breakdown.push({
          label:  param.name + ' (' + opt.label + ')',
          detail: '× ' + num(opt.adjustment, 2) + ' → ' + $(running) + '/SF',
          amount: null
        });
      }
    });

    // Apply adders (sequential)
    adders.forEach(function (param) {
      var selVal = (selections[param.id] !== undefined) ? selections[param.id] : param.defaultValue;
      var opt = param.options.find(function (o) { return o.value === selVal; });
      if (!opt) {
        opt = param.options.find(function (o) { return o.value === param.defaultValue; });
      }
      if (opt) {
        running += opt.adjustment;
        breakdown.push({
          label:  param.name + ' (' + opt.label + ')',
          detail: (opt.adjustment >= 0 ? '+ ' : '- ') + $(Math.abs(opt.adjustment)) + '/SF → ' + $(running) + '/SF',
          amount: null
        });
      }
    });

    var furnishedSubtotal = running * area;
    breakdown.push({
      label:  'Furnished subtotal',
      detail: num(area, 0) + ' SF × ' + $(running) + '/SF = ' + $(furnishedSubtotal),
      amount: furnishedSubtotal
    });

    // Install
    var installBreakdown = [];
    var installSubtotal = 0;
    var inst = item.install;

    if (inst && inst.productionRate) {
      if (inst.crewBasis === 'subcontract') {
        installSubtotal = area * inst.laborRate;
        installBreakdown.push({
          label:  'Install (subcontract)',
          detail: num(area, 0) + ' SF × ' + $(inst.laborRate) + '/SF = ' + $(installSubtotal),
          amount: installSubtotal
        });
      } else {
        var installHrs = area / inst.productionRate.value;
        installSubtotal = installHrs * inst.laborRate;
        installBreakdown.push({
          label:  'Install (' + inst.crewBasis + ')',
          detail: num(area, 0) + ' SF / ' + num(inst.productionRate.value, 0) + ' per hr = ' + num(installHrs, 1) + ' hrs × ' + $(inst.laborRate) + '/hr = ' + $(installSubtotal),
          amount: installSubtotal
        });
      }
    }

    return {
      furnished: {
        subtotal:  furnishedSubtotal,
        perSf:     area > 0 ? furnishedSubtotal / area : null,
        breakdown: breakdown
      },
      install: {
        subtotal:  installSubtotal,
        perSf:     area > 0 ? installSubtotal / area : null,
        breakdown: installBreakdown
      },
      purchaseQty: null,
      adjustedQty: area
    };
  }


  // ── Turnkey pricing ───────────────────────────────────────────────────

  function calcTurnkey (item, quantity, turnkeyAdjustments) {
    var count = quantity.count || 0;
    var area = quantity.area || 0;
    var overrides = turnkeyAdjustments || {};
    var breakdown = [];

    var unitPrice = item.unitPrice;
    var measure = item.unitMeasure;
    var qty = (measure === 'each') ? count : area;

    breakdown.push({
      label:  'Unit price',
      detail: $(unitPrice) + '/' + measure,
      amount: null
    });

    // Apply adjustments: multipliers first, then adders
    var adjustments = item.adjustments || [];
    var mults = adjustments.filter(function (a) { return a.type === 'multiplier'; });
    var adds  = adjustments.filter(function (a) { return a.type === 'adder'; });

    mults.forEach(function (adj) {
      var val = (overrides[adj.id] !== undefined) ? overrides[adj.id] : adj.defaultValue;
      if (val !== 1.0) {
        unitPrice *= val;
        breakdown.push({
          label:  adj.name,
          detail: '× ' + num(val, 2) + ' → ' + $(unitPrice) + '/' + measure,
          amount: null
        });
      }
    });

    adds.forEach(function (adj) {
      var val = (overrides[adj.id] !== undefined) ? overrides[adj.id] : adj.defaultValue;
      if (val !== 0) {
        unitPrice += val;
        breakdown.push({
          label:  adj.name,
          detail: '+ ' + $(val) + ' → ' + $(unitPrice) + '/' + measure,
          amount: null
        });
      }
    });

    var furnishedSubtotal = unitPrice * qty;
    breakdown.push({
      label:  'Furnished subtotal',
      detail: num(qty, 0) + ' ' + measure + ' × ' + $(unitPrice) + ' = ' + $(furnishedSubtotal),
      amount: furnishedSubtotal
    });

    // Install — for turnkey, install is typically bundled in unitPrice.
    // If the item has install fields, compute for reference/transparency,
    // but do NOT add to the total (it is already in the unit price).
    var installBreakdown = [];
    var installSubtotal = 0;
    var inst = item.install || null;

    // Only add separate install cost if the install block has a note
    // indicating it is NOT bundled. By convention, turnkey items have
    // install bundled. We include the breakdown for reference only.
    if (inst && inst.productionRate) {
      installBreakdown.push({
        label:  'Install (bundled in unit price)',
        detail: 'Included — ' + (inst.crewBasis || 'crew') + ', ' + num(inst.productionRate.value, 0) + ' ' + (inst.productionRate.measure || 'unit') + '/hr',
        amount: 0
      });
    } else {
      installBreakdown.push({
        label:  'Install (bundled in unit price)',
        detail: 'Included — no separate install breakdown provided for this item',
        amount: 0
      });
    }

    return {
      furnished: {
        subtotal:  furnishedSubtotal,
        perSf:     area > 0 ? furnishedSubtotal / area : null,
        breakdown: breakdown
      },
      install: {
        subtotal:  installSubtotal,
        perSf:     null,
        breakdown: installBreakdown
      },
      purchaseQty: qty,
      adjustedQty: qty
    };
  }


  // ── Project-level adjustments ─────────────────────────────────────────

  function applyAdjustments (furnishedSubtotal, installSubtotal, adjustmentSelections) {
    if (adjustmentSelections === null) {
      // Explicitly skipped
      return {
        applied: [],
        furnishedAdjusted: furnishedSubtotal,
        installAdjusted:   installSubtotal,
        subtotal:          furnishedSubtotal + installSubtotal,
        perSf:             null
      };
    }

    var selections = adjustmentSelections || {};
    var allAdj = getAdjustments();
    var applied = [];
    var furnAdj = furnishedSubtotal;
    var instAdj = installSubtotal;

    allAdj.forEach(function (adj) {
      var selKey = selections[adj.id] || adj.defaultKey;
      var opt = adj.options.find(function (o) { return o.key === selKey; });
      if (!opt) return;

      applied.push({
        id:          adj.id,
        name:        adj.name,
        appliesTo:   adj.appliesTo,
        optionKey:   opt.key,
        optionLabel: opt.label,
        factor:      opt.factor
      });

      if (adj.appliesTo === 'furnished') {
        furnAdj *= opt.factor;
      } else if (adj.appliesTo === 'install') {
        instAdj *= opt.factor;
      } else if (adj.appliesTo === 'both') {
        furnAdj *= opt.factor;
        instAdj *= opt.factor;
      }
    });

    return {
      applied:           applied,
      furnishedAdjusted: furnAdj,
      installAdjusted:   instAdj,
      subtotal:          furnAdj + instAdj,
      perSf:             null  // filled in by caller
    };
  }


  // ── Markup chain ──────────────────────────────────────────────────────

  function resolveMarkup (category, markupId) {
    var markups = getMarkups();

    // Explicit ID
    if (markupId) {
      return markups.find(function (m) { return m.id === markupId; }) || null;
    }

    // Auto-select by category
    for (var i = 0; i < markups.length; i++) {
      var def = markups[i].defaultForCategory || [];
      if (def.indexOf(category) >= 0) return markups[i];
    }

    // Fallback to budget
    return markups.find(function (m) { return m.id === 'budget-2tier'; }) || null;
  }

  function applyMarkup (adjustedSubtotal, markupStructure, markupOverrides) {
    if (!markupStructure) {
      return {
        structureId:   null,
        structureName: 'None',
        tiers:         [],
        subtotal:      adjustedSubtotal,
        perSf:         null
      };
    }

    var overrides = markupOverrides || {};
    var running = adjustedSubtotal;
    var tiers = [];

    (markupStructure.tiers || []).forEach(function (tier) {
      var pct = (overrides[tier.key] !== undefined) ? overrides[tier.key] : tier.markupPct;
      var markupAmt = running * pct;
      var out = running + markupAmt;

      tiers.push({
        label:        tier.label,
        key:          tier.key,
        markupPct:    pct,
        inputAmount:  running,
        markupAmount: markupAmt,
        outputAmount: out
      });

      running = out;
    });

    return {
      structureId:   markupStructure.id,
      structureName: markupStructure.name,
      tiers:         tiers,
      subtotal:      running,
      perSf:         null
    };
  }


  // ── Backup line generator ─────────────────────────────────────────────

  function buildBackupLines (result) {
    var lines = [];

    lines.push('── ' + result.item.name + ' ──');
    lines.push('Pricing mode: ' + result.item.pricingMode);
    lines.push('');

    // Furnished / all-in breakdown
    lines.push(result.item.category === 'roof-layer'
      ? 'DELIVERED + HOISTED + INSTALLED (all-in):'
      : 'FURNISHED:');
    result.furnished.breakdown.forEach(function (b) {
      lines.push('  ' + b.label + ': ' + b.detail);
    });
    lines.push('');

    lines.push(result.item.category === 'roof-layer' ? 'INSTALL / HOIST:' : 'INSTALL:');
    result.install.breakdown.forEach(function (b) {
      lines.push('  ' + b.label + ': ' + b.detail);
    });
    lines.push('');

    lines.push('DIRECT COST: ' + $(result.directCost.subtotal) +
      (result.directCost.perSf ? ' (' + $(result.directCost.perSf) + '/SF)' : ''));
    lines.push('');

    // Adjustments
    if (result.adjustments.applied.length > 0) {
      lines.push('ADJUSTMENTS:');
      result.adjustments.applied.forEach(function (a) {
        lines.push('  ' + a.name + ' (' + a.optionLabel + '): × ' + num(a.factor, 2) +
          ' [' + a.appliesTo + ']');
      });
      lines.push('  Adjusted subtotal: ' + $(result.adjustments.subtotal));
      lines.push('');
    }

    // Markup
    if (result.markup.tiers.length > 0) {
      lines.push('MARKUP (' + result.markup.structureName + '):');
      result.markup.tiers.forEach(function (t) {
        lines.push('  ' + t.label + ' (' + pct(t.markupPct) + '): ' +
          $(t.inputAmount) + ' + ' + $(t.markupAmount) + ' = ' + $(t.outputAmount));
      });
      lines.push('');
    }

    lines.push('SELL PRICE: ' + $(result.summary.sellPrice) +
      (result.summary.perSf ? ' (' + $(result.summary.perSf) + '/SF)' : ''));
    lines.push('Effective markup: ' + pct(result.summary.effectiveMarkupPct) +
      ' over direct cost');

    return lines;
  }


  // ── Main calculate function ───────────────────────────────────────────

  function calculate (itemId, quantity, options) {
    options = options || {};

    // Validate
    var v = validate(itemId, quantity);
    if (v.errors.length > 0) {
      return {
        valid:  false,
        errors: v.errors,
        item: null, input: null, furnished: null, install: null,
        directCost: null, adjustments: null, markup: null,
        summary: null, backupLines: []
      };
    }

    var item = v.item;
    var area = quantity.area || 0;

    // Route to pricing mode
    var modeResult;
    if (item.pricingMode === 'assembly') {
      modeResult = calcAssembly(item, quantity);
    } else if (item.pricingMode === 'parametric') {
      modeResult = calcParametric(item, quantity, options.parameterSelections);
    } else if (item.pricingMode === 'turnkey') {
      modeResult = calcTurnkey(item, quantity, options.turnkeyAdjustments);
    } else {
      return {
        valid: false,
        errors: ['Unknown pricingMode: ' + item.pricingMode],
        item: null, input: null, furnished: null, install: null,
        directCost: null, adjustments: null, markup: null,
        summary: null, backupLines: []
      };
    }

    var furnishedSubtotal = modeResult.furnished.subtotal;
    var installSubtotal   = modeResult.install.subtotal;
    var directCostTotal   = furnishedSubtotal + installSubtotal;

    // Project-level adjustments
    var adjResult = applyAdjustments(
      furnishedSubtotal,
      installSubtotal,
      options.adjustments !== undefined ? options.adjustments : {}
    );
    adjResult.perSf = area > 0 ? adjResult.subtotal / area : null;

    // Markup
    var markupStructure = (options.markupId !== null)
      ? resolveMarkup(item.category, options.markupId || null)
      : null;

    if (options.markupId === null) markupStructure = null;

    var mkResult = applyMarkup(adjResult.subtotal, markupStructure, options.markupOverrides);
    mkResult.perSf = area > 0 ? mkResult.subtotal / area : null;

    // Summary
    var sellPrice = mkResult.subtotal;
    var effectiveMarkupPct = directCostTotal > 0
      ? (sellPrice - directCostTotal) / directCostTotal
      : 0;

    var result = {
      valid:  true,
      errors: [],

      item: {
        id:          item.id,
        name:        item.name,
        category:    item.category,
        pricingMode: item.pricingMode
      },

      input: {
        area:  quantity.area  || null,
        count: quantity.count || null,
        depth: quantity.depth || null
      },

      furnished: modeResult.furnished,
      install:   modeResult.install,

      directCost: {
        subtotal: directCostTotal,
        perSf:    area > 0 ? directCostTotal / area : null
      },

      adjustments: adjResult,
      markup:      mkResult,

      summary: {
        furnishedSubtotal:  furnishedSubtotal,
        installSubtotal:    installSubtotal,
        directCost:         directCostTotal,
        adjustedCost:       adjResult.subtotal,
        sellPrice:          sellPrice,
        perSf:              area > 0 ? sellPrice / area : null,
        effectiveMarkupPct: effectiveMarkupPct
      },

      backupLines: []
    };

    // Generate backup lines
    result.backupLines = buildBackupLines(result);

    return result;
  }


  // ── Export ─────────────────────────────────────────────────────────────

  window.V3PricingCalc = {
    calculate:     calculate,
    getItem:       getItem,
    listItems:     listItems,
    resolveMarkup: resolveMarkup
  };

})();
