// ═══════════════════════════════════════════════════════════════════════════
// V3 STRATEGY — Lightweight site strategy classification
// ═══════════════════════════════════════════════════════════════════════════
//
// Classifies a project into one of three strategy types:
//   1. Ground-driven  — at-grade opportunities are strong, constraints are low
//   2. Roof-driven    — constraints push work to roof/on-structure systems
//   3. Hybrid         — both ground and roof contribute meaningfully
//
// Inputs:
//   - project: v3 ProjectSchema (from V3State.get())
//   - viableBmps: engine results filtered to isViable (from runModel())
//
// This runs AFTER the engine, using both input conditions and BMP viability.
// It does NOT change calculations or filter results. It provides a
// one-line recommendation shown above the BMP results table.
//
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {

  // BMP IDs grouped by where they install.
  // Used to check which viable BMPs survived the engine's blocker logic.
  var GROUND_BMP_IDS  = [1, 2, 3, 4, 5];     // at-grade / underground
  var ROOF_BMP_IDS    = [6, 7, 8, 9, 10, '10B', 11, '11B']; // on-structure

  // Controlled language dictionary for future "Why this recommendation?"
  // rendering. Phase 4A defines reviewable wording only; the app does not
  // render these phrases until the language is approved in Phase 4B.
  var RECOMMENDATION_DRIVER_DICTIONARY = Object.freeze({
    undergroundUtilities: {
      label: 'Underground utilities',
      trigger: 'project.constraints.hasUndergroundUtilities === true',
      phrase: 'Known or suspected underground utilities may limit excavation-heavy BMPs and should be confirmed during civil/site coordination.',
      caution: 'Confirm utility locations, offsets, and conflicts before treating subsurface storage or excavation-based BMPs as feasible.'
    },
    highWaterTable: {
      label: 'High water table',
      trigger: 'project.constraints.hasHighWaterTable === true',
      phrase: 'A high water table can reduce feasibility for subsurface storage or infiltration-based systems.',
      caution: 'Confirm seasonal groundwater elevation and allowable separation before final BMP selection.'
    },
    contaminatedSoil: {
      label: 'Contaminated soil',
      trigger: 'project.constraints.hasContaminatedSoil === true',
      phrase: 'Contaminated soils may increase handling, lining, or disposal requirements and can reduce suitability for infiltration-based BMPs.',
      caution: 'Coordinate soil management assumptions with the environmental consultant and civil engineer.'
    },
    gradingConstraint: {
      label: 'Grading constraint',
      trigger: 'project.constraints.hasSiteGradingConstraint === true',
      phrase: 'Site grading constraints may limit where surface BMPs, overflow paths, or low-point collection systems can be placed.',
      caution: 'Confirm grading, overflow routing, and accessible maintenance paths during civil design.'
    },
    poorInfiltrationSoil: {
      label: 'Poor infiltration soil',
      trigger: "project.site.soilType === 'clay' || project.site.soilType === 'rock'",
      phrase: 'Mapped or assumed low-infiltration soils can make lined, controlled-release, or on-structure strategies more practical than infiltration-dependent BMPs.',
      caution: 'Confirm infiltration assumptions with project-specific geotechnical or civil testing.'
    },
    highValueGroundSpace: {
      label: 'High-value ground or programmable space',
      trigger: 'project.assumptions.programmableSpaceIsHighValue === true',
      phrase: 'High-value ground-level or programmable space may make roof, deck, or compact BMP strategies more attractive than large surface BMP footprints.',
      caution: 'Confirm owner priorities for outdoor programming, circulation, and maintainable BMP footprint.'
    },
    greenRoofInScope: {
      label: 'Green roof already in scope',
      trigger: 'project.assumptions.greenRoofAlreadyInScope === true',
      phrase: 'If a green roof is already in scope, incremental detention or retention upgrades may be more efficient than treating the roof as an entirely new scope item.',
      caution: 'Confirm whether pricing should be evaluated as an upgrade scope or a full installed assembly.'
    },
    roofOpportunity: {
      label: 'Available roof or on-structure area',
      trigger: 'roof/on-structure area is a meaningful share of total eligible area',
      phrase: 'Available roof or on-structure area can provide a practical location for stormwater controls without consuming ground-level space.',
      caution: 'Confirm structural loading, waterproofing, access, and maintenance assumptions before final selection.'
    },
    groundOpportunity: {
      label: 'Available ground area',
      trigger: 'ground area is a meaningful share of total eligible area and ground BMPs remain viable',
      phrase: 'Available ground area can support surface or subsurface BMPs where utilities, grading, soils, and programming constraints allow.',
      caution: 'Confirm civil layout, maintenance access, and owner tolerance for surface or subsurface disruption.'
    },
    retentionTarget: {
      label: 'Retention target',
      trigger: 'project.targets.retentionNeeded === true && project.targets.retentionCF > 0',
      phrase: 'The retention target influences whether the strategy needs storage, evapotranspiration, reuse, or other credited retention volume.',
      caution: 'Confirm the credited retention method and target volume with the civil engineer and authority having jurisdiction.'
    },
    detentionTarget: {
      label: 'Detention target',
      trigger: 'project.targets.detentionNeeded === true && project.targets.detentionCF > 0',
      phrase: 'The detention target influences whether the strategy needs controlled release storage in addition to any retention benefit.',
      caution: 'Confirm allowable release rate, routing, and outlet control assumptions during civil design.'
    },
    jurisdictionContext: {
      label: 'Jurisdiction context',
      trigger: 'city/regulation profile is selected',
      phrase: 'Local stormwater rules and credited BMP assumptions should guide which systems are treated as viable planning options.',
      caution: 'Confirm final requirements against current published guidance and AHJ review comments.'
    },
    costConstructability: {
      label: 'Cost and constructability',
      trigger: 'top recommendation and pricing data are available',
      phrase: 'Cost and constructability should be reviewed alongside stormwater performance because the lowest planning-cost option may not be the easiest option to permit or build.',
      caution: 'Confirm installed cost, access, phasing, and constructability with the project team before procurement.'
    }
  });

  function getRecommendationDriverDictionary() {
    return RECOMMENDATION_DRIVER_DICTIONARY;
  }

  function siteAreas(project) {
    var site = (project && project.site) || {};
    var areas = site.areas || {};
    var groundArea = (areas.perviousLandscapingUsable || 0)
                   + (areas.imperviousVehicularPavement || 0)
                   + (areas.imperviousPedestrianPavement || 0);
    var roofArea = (areas.flatDeckOnStructureArea || 0)
                 + (areas.slopedRoofArea || 0)
                 + (areas.paversOnStructureArea || 0);
    var totalArea = groundArea + roofArea;
    return {
      groundArea: groundArea,
      roofArea: roofArea,
      totalArea: totalArea,
      groundPct: totalArea > 0 ? groundArea / totalArea : 0,
      roofPct: totalArea > 0 ? roofArea / totalArea : 0
    };
  }

  function hasBmpGroup(list, group) {
    if (!Array.isArray(list)) return false;
    for (var i = 0; i < list.length; i++) {
      var id = list[i] && list[i].id;
      if (group.indexOf(id) !== -1 || group.indexOf(String(id)) !== -1) return true;
    }
    return false;
  }

  function addDriver(out, key) {
    var row = RECOMMENDATION_DRIVER_DICTIONARY[key];
    if (!row) return;
    out.drivers.push({
      key: key,
      label: row.label,
      phrase: row.phrase
    });
    if (row.caution) {
      out.cautions.push({
        key: key,
        label: row.label,
        phrase: row.caution
      });
    }
  }

  function buildRecommendationExplanation(project, topPick, viableBmps, results, context) {
    var ctx = context || {};
    var constraints = (project && project.constraints) || {};
    var assumptions = (project && project.assumptions) || {};
    var site = (project && project.site) || {};
    var targets = (project && project.targets) || {};
    var area = siteAreas(project);
    var out = {
      title: 'Why this recommendation?',
      summary: '',
      drivers: [],
      cautions: [],
      _debug: {
        topPickId: topPick && topPick.id,
        groundPct: Math.round(area.groundPct * 100),
        roofPct: Math.round(area.roofPct * 100),
        driverCount: 0
      }
    };

    if (!topPick) {
      out.summary = 'No recommendation explanation is available because no viable top recommendation was found for the current inputs.';
      return out;
    }

    if (constraints.hasUndergroundUtilities) addDriver(out, 'undergroundUtilities');
    if (constraints.hasHighWaterTable) addDriver(out, 'highWaterTable');
    if (constraints.hasContaminatedSoil) addDriver(out, 'contaminatedSoil');
    if (constraints.hasSiteGradingConstraint) addDriver(out, 'gradingConstraint');
    if (site.soilType === 'clay' || site.soilType === 'rock') addDriver(out, 'poorInfiltrationSoil');
    if (assumptions.programmableSpaceIsHighValue) addDriver(out, 'highValueGroundSpace');
    if (assumptions.greenRoofAlreadyInScope) addDriver(out, 'greenRoofInScope');
    if (area.roofPct >= 0.35 || hasBmpGroup(viableBmps, ROOF_BMP_IDS)) addDriver(out, 'roofOpportunity');
    if (area.groundPct >= 0.35 && hasBmpGroup(viableBmps, GROUND_BMP_IDS)) addDriver(out, 'groundOpportunity');
    if (targets.retentionNeeded && Number(targets.retentionCF) > 0) addDriver(out, 'retentionTarget');
    if (targets.detentionNeeded && Number(targets.detentionCF) > 0) addDriver(out, 'detentionTarget');
    if (site.cityKey || ctx.regProfileId) addDriver(out, 'jurisdictionContext');
    if (ctx.pricing || Number.isFinite(topPick.costDesigned)) addDriver(out, 'costConstructability');

    out._debug.driverCount = out.drivers.length;
    out.summary = 'This planning explanation is based on selected site inputs, constraints, targets, and the current ranked BMP results. It does not change the calculation, ranking, or pricing.';
    return out;
  }


  // ── Main classification function ───────────────────────────────────

  function classifyStrategy(project, viableBmps) {
    var site        = project.site || {};
    var areas       = site.areas || {};
    var constraints = project.constraints || {};

    // ── Step 1: Measure available area by zone ──────────────────────

    var groundArea = (areas.perviousLandscapingUsable || 0)
                   + (areas.imperviousVehicularPavement || 0)
                   + (areas.imperviousPedestrianPavement || 0);

    var roofArea   = (areas.flatDeckOnStructureArea || 0)
                   + (areas.slopedRoofArea || 0)
                   + (areas.paversOnStructureArea || 0);

    var totalArea  = groundArea + roofArea;

    var groundPct  = totalArea > 0 ? groundArea / totalArea : 0;
    var roofPct    = totalArea > 0 ? roofArea / totalArea : 0;


    // ── Step 2: Count ground constraints ────────────────────────────
    //
    // Each active constraint reduces the viability of at-grade systems.
    // The engine already blocks specific BMPs, but we also use the
    // constraint count as a signal of overall ground difficulty.

    var constraintCount = 0;
    if (constraints.hasUndergroundUtilities)  constraintCount++;
    if (constraints.hasHighWaterTable)        constraintCount++;
    if (constraints.hasContaminatedSoil)      constraintCount++;
    if (constraints.hasSiteGradingConstraint) constraintCount++;

    var highConstraints = constraintCount >= 2;


    // ── Step 3: Check viable BMP distribution ───────────────────────
    //
    // After the engine runs, some BMPs are blocked. Checking which
    // viable BMPs remain tells us what the site can actually support.

    var viableGroundCount = 0;
    var viableRoofCount   = 0;

    for (var i = 0; i < viableBmps.length; i++) {
      var bmp = viableBmps[i];
      var id  = bmp.id;
      if (GROUND_BMP_IDS.indexOf(id) !== -1)                           viableGroundCount++;
      if (ROOF_BMP_IDS.indexOf(id) !== -1 || ROOF_BMP_IDS.indexOf(String(id)) !== -1) viableRoofCount++;
    }

    var hasViableGround = viableGroundCount > 0;
    var hasViableRoof   = viableRoofCount > 0;


    // ── Step 4: Classify ────────────────────────────────────────────
    //
    // Decision tree:
    //
    //   1. If ground area is dominant (>60%), constraints are low,
    //      and ground BMPs survived → Ground-driven
    //
    //   2. If roof area is dominant (>60%), OR ground constraints
    //      are high, OR no ground BMPs survived → Roof-driven
    //
    //   3. Otherwise → Hybrid
    //
    // The thresholds are intentionally simple. This is a screening
    // tool, not a design recommendation.

    var strategyType;
    var explanation;
    var drivers = [];

    // Ground-driven
    if (groundPct > 0.60 && !highConstraints && hasViableGround) {
      strategyType = 'Ground-driven';
      explanation  = 'At-grade area is the primary opportunity. Ground-based BMPs '
                   + '(bioretention, underground cells, pavers) are viable and cost-effective.';
      drivers.push('Ground area is ' + Math.round(groundPct * 100) + '% of site');
      if (constraintCount === 0) drivers.push('No ground constraints');
      else drivers.push('Low ground constraints (' + constraintCount + ')');
      drivers.push(viableGroundCount + ' ground BMP(s) viable');
    }

    // Roof-driven
    else if (roofPct > 0.60 || highConstraints || !hasViableGround) {
      strategyType = 'Roof-driven';
      explanation  = 'Site conditions favor roof and on-structure systems. ';
      if (highConstraints) {
        explanation += 'Ground constraints limit at-grade options.';
        drivers.push(constraintCount + ' ground constraints active');
      }
      if (!hasViableGround) {
        explanation += 'No at-grade BMPs passed viability checks.';
        drivers.push('All ground BMPs blocked');
      }
      if (roofPct > 0.60) {
        drivers.push('Roof/structure area is ' + Math.round(roofPct * 100) + '% of site');
      }
      drivers.push(viableRoofCount + ' roof BMP(s) viable');
    }

    // Hybrid
    else {
      strategyType = 'Hybrid';
      explanation  = 'Both ground and roof areas contribute meaningfully. '
                   + 'Consider combinations for best cost and coverage.';
      drivers.push('Ground: ' + Math.round(groundPct * 100) + '% / Roof: ' + Math.round(roofPct * 100) + '%');
      drivers.push(viableGroundCount + ' ground + ' + viableRoofCount + ' roof BMP(s) viable');
      if (constraintCount > 0) {
        drivers.push(constraintCount + ' ground constraint(s) — partial limitation');
      }
    }


    // ── Step 5: Add soil flag if relevant ───────────────────────────

    var soilType = site.soilType || null;
    if (soilType === 'clay' || soilType === 'rock') {
      drivers.push('Soil (' + soilType + ') limits infiltration — favors lined or on-structure systems');
    }


    return {
      strategyType: strategyType,
      explanation:  explanation,
      drivers:      drivers,
      _debug: {
        groundArea: groundArea,
        roofArea: roofArea,
        groundPct: Math.round(groundPct * 100),
        roofPct: Math.round(roofPct * 100),
        constraintCount: constraintCount,
        viableGroundCount: viableGroundCount,
        viableRoofCount: viableRoofCount
      }
    };
  }


  // ── Export ─────────────────────────────────────────────────────────

  global.V3Strategy = {
    classify: classifyStrategy,
    buildRecommendationExplanation: buildRecommendationExplanation,
    recommendationDriverDictionary: RECOMMENDATION_DRIVER_DICTIONARY,
    getRecommendationDriverDictionary: getRecommendationDriverDictionary
  };

})(window);
