// Central modeling entrypoint for stormwater + additional systems.
// Exposed globally as window.runModel(project, database).
//
// project: {
//   cityKey: string,
//   inputs: ProjectInputs,   // normalized engine-facing shape
//   overrides?: object       // per-BMP overrides (pricing/specs) keyed by bmpId
// }
//
// ProjectInputs: {
//   areas: {
//     perviousLandscapingUsable: number,
//     imperviousVehicularPavement: number,
//     imperviousPedestrianPavement: number,
//     perviousTreeCoverNonUsable: number,
//     flatDeckOnStructureArea: number,
//     slopedRoofArea: number,
//     paversOnStructureArea: number,
//     imperviousCAUntreated: number
//   },
//   targets: {
//     detentionCF: number,
//     retentionCF: number,
//     detentionNeeded: boolean,
//     retentionNeeded: boolean
//   },
//   constraints: {
//     hasUndergroundUtilities: boolean,
//     hasHighWaterTable: boolean,
//     hasContaminatedSoil: boolean,
//     hasSiteGradingConstraint: boolean
//   },
//   assumptions: {
//     greenRoofAlreadyInScope: boolean,
//     programmableSpaceIsHighValue: boolean,
//     allowSteepSlopeGreenRoof: boolean
//   },
//   flags: {
//     // reserved for additional booleans / switches
//   }
// }
//
// database: {
//   bmpOptions: BMP_OPTIONS,
//   cityRulesByCityKey: {
//     [cityKey]: {
//       regulationProfileId: string,
//       profile: object   // regulation profile with defaults + rules
//     }
//   }
// }

(function (global) {
  // Local defaults for BMP specs (kept in sync with index.html)
  const BMP_SPEC_DEFAULTS = {
    packingFactor: 1,
    minAreaSF: 0,
    deadDepthIn: 0,
    retentionFactorPct: 0.10
  };

  function isPurpleVegBmpId(id) {
    const s = String(id);
    return s === '10' || s === '10B' || s === '10C' || s === '10D';
  }

  function isPurplePavBmpId(id) {
    const s = String(id);
    return s === '11' || s === '11B' || s === '11C' || s === '11D';
  }

  // Optional method-based engines (e.g. NYC DEP RRV/Vv/outflow)
  const METHOD_MAP = {
    NYC_DEP_RRV_VV_OUTFLOW: global.NYC_DEP_RRV_VV_OUTFLOW || null
  };

  function getRegulationProfile(regulationProfiles, profileId) {
    return regulationProfiles[profileId] || regulationProfiles.general;
  }

  function getSpec(bmpOptions, bmpId, overrides) {
    const defaults = bmpOptions.find(b => b.id == bmpId);
    const override = (overrides && overrides[bmpId]) || {};
    if (!defaults) throw new Error('Unknown BMP id: ' + bmpId);
    const mergedSpecs = { ...(defaults.specs || {}), ...(override.specs || {}) };
    const specs = { ...BMP_SPEC_DEFAULTS, ...mergedSpecs };
    const unitPrice = override.unitPrice !== undefined ? override.unitPrice : defaults.unitPrice;
    const extra = { ...(defaults.extra || {}), ...(override.extra || {}) };
    return { specs, unitPrice, extra };
  }

  function getEligibleArea(bmp, inputs) {
    const flatDeckPlaza = inputs.flatDeckOnStructureArea;
    const slopedRoof = inputs.slopedRoofArea;
    const paversOnStructure = inputs.paversOnStructureArea;

    switch (bmp.areaType) {
      case 'atGrade_pervious': return inputs.perviousLandscapingUsable;
      case 'atGrade_combined': return inputs.perviousLandscapingUsable + inputs.imperviousVehicularPavement + inputs.imperviousPedestrianPavement;
      case 'atGrade_ped': return inputs.imperviousPedestrianPavement;
      case 'atGrade_landscape_veh': return inputs.perviousLandscapingUsable + inputs.imperviousVehicularPavement;
      case 'on_structure_tank': return flatDeckPlaza + slopedRoof + paversOnStructure;
      case 'flatDeck_strict': return flatDeckPlaza;
      case 'sloped_roof': return slopedRoof;
      case 'sloped_roof_or_flat_deck': return slopedRoof + flatDeckPlaza;
      case 'pavers_or_sloped_or_flat_deck': return paversOnStructure + slopedRoof + flatDeckPlaza;
      default: return 0;
    }
  }

  function calculateCapacity(bmpId, fullSpec, profile) {
    const specs = fullSpec.specs || {};
    const spaceLoss = specs.spaceLoss != null ? specs.spaceLoss : 0;
    const lossFactor = 1 - spaceLoss;

    const soilDepth = specs.soilDepth != null ? specs.soilDepth : (specs.mediaDepth || 0);
    const soilPorosity = specs.soilPorosity != null ? specs.soilPorosity : (profile.defaults.soilPorosityPct || 0);
    const retentionFactor = specs.retentionFactorPct != null ? specs.retentionFactorPct : 0.10;

    const nmwDepth = specs.nmwDepth || 0;
    const baseNmwRet = specs.nmwRetentionPct != null ? specs.nmwRetentionPct : (profile.defaults.nmwRetentionPct || 0);
    const honeycombVoidDefault = profile.defaults.honeycombVoidPct || 0;

    const nycMinSoil = profile.rules.nmwRetentionRequiresMinSoilCoverIn || 0;
    const usesNmw = nmwDepth > 0;
    const soilCoverIn = soilDepth;
    let nmwReductionFactor = 1;
    let nmwRestricted = false;
    if (usesNmw && nycMinSoil > 0 && soilCoverIn < nycMinSoil) {
      nmwReductionFactor = 0;
      nmwRestricted = true;
    }

    let retCap = 0;
    let detCap = 0;

    // Logic mirrors index.html calculateCapacity (bioretention, tanks, green roofs, etc.)
    if (bmpId === 1) {
      const gravelDepth = specs.gravelDepth || 0;
      const gravelPorosity = specs.gravelPorosity || 0;
      const voidDepthIn = (gravelDepth * gravelPorosity) + (soilDepth * soilPorosity);
      const voidDepthRetIn = soilDepth * retentionFactor;
      detCap = (voidDepthIn / 12) * lossFactor;
      retCap = (voidDepthRetIn / 12) * lossFactor;
    } else if (bmpId === 2 || bmpId === 3) {
      const storageDepth = bmpId === 2 ? (specs.storageDepth || 0) : (specs.reservoirDepth || 0);
      const freeboard = specs.freeboard || 0;
      const deadDepth = specs.deadDepthIn || 0;
      const voidRatio = specs.voidRatio || 0;
      const usableDepthIn = Math.max(storageDepth - freeboard - deadDepth, 0);
      detCap = (usableDepthIn / 12) * voidRatio * lossFactor;
    } else if ([4, 5, 6].includes(bmpId)) {
      const detentionDepth = specs.detentionDepth || 0;
      const freeboard = specs.freeboard || 0;
      const deadDepth = specs.deadDepthIn || 0;
      const usableDepthIn = Math.max(detentionDepth - freeboard - deadDepth, 0);
      detCap = (usableDepthIn / 12) * lossFactor;
    } else if (bmpId === 7) {
      const storageDepth = specs.storageDepth || 0;
      const freeboard = specs.freeboard || 0;
      const deadDepth = specs.deadDepthIn || 0;
      const voidRatio = specs.voidRatio || 0;
      const usableDepthIn = Math.max(storageDepth - freeboard - deadDepth, 0);
      detCap = (usableDepthIn / 12) * voidRatio * lossFactor;
    } else if (bmpId === 8) {
      // Traditional green roof: treat as retention-only (no detention credit).
      const retentionVoidDepthIn = soilDepth * retentionFactor;
      retCap = (retentionVoidDepthIn / 12) * lossFactor;
      detCap = 0;
    } else if (bmpId === 9) {
      const nmwRet = baseNmwRet * nmwReductionFactor;
      const retentionVoidDepthIn = (soilDepth * retentionFactor) + (nmwDepth * nmwRet);
      retCap = (retentionVoidDepthIn / 12) * lossFactor;
      detCap = 0;
    } else if (isPurpleVegBmpId(bmpId)) {
      const nmwRet = baseNmwRet * nmwReductionFactor;
      const hcDepth = specs.hcDepth || 0;
      const hcVoid = specs.hcVoidRatio != null ? specs.hcVoidRatio : honeycombVoidDefault;
      const dlDepth = specs.dlDepth || 0;
      const dlPorosity = specs.dlPorosity || 0;
      const retentionVoidDepthIn = (soilDepth * retentionFactor) + (nmwDepth * nmwRet);
      const detentionVoidDepthIn = (soilDepth * soilPorosity) + (hcDepth * hcVoid) + (dlDepth * dlPorosity);
      retCap = (retentionVoidDepthIn / 12) * lossFactor;
      detCap = (detentionVoidDepthIn / 12) * lossFactor;
    } else if (isPurplePavBmpId(bmpId)) {
      const nmwRet = baseNmwRet * nmwReductionFactor;
      const hcDepth = specs.hcDepth || 0;
      const hcVoid = specs.hcVoidRatio != null ? specs.hcVoidRatio : honeycombVoidDefault;
      const retentionVoidDepthIn = nmwDepth * nmwRet;
      const detentionVoidDepthIn = hcDepth * hcVoid;
      retCap = (retentionVoidDepthIn / 12) * lossFactor;
      detCap = (detentionVoidDepthIn / 12) * lossFactor;
    } else if (bmpId === 12) {
      retCap = 0;
      detCap = 0;
    }

    return { cfRetPerSf: retCap, cfDetPerSf: detCap, nmwRestricted };
  }

  function runStormwaterCalculations(v1Inputs, bmpOptions, profile, overrides) {
    const BMPs = (bmpOptions || []).filter(b => !b.pvOnly);

    const R_target = v1Inputs.targetRetentionCF || 0;
    const D_target = v1Inputs.targetDetentionCF || 0;

    const results = BMPs.map(bmp => {
      const fullSpec = getSpec(bmpOptions, bmp.id, overrides || {});
      const capacity = calculateCapacity(bmp.id, fullSpec, profile);
      const eligibleArea = getEligibleArea(bmp, v1Inputs);
      const specs = fullSpec.specs || {};

      const packingFactor = specs.packingFactor != null ? specs.packingFactor : 1;
      const minAreaSF = specs.minAreaSF != null ? specs.minAreaSF : 0;

      const retCap = capacity.cfRetPerSf || 0;
      const detCap = capacity.cfDetPerSf || 0;

      let A_ret = 0;
      let A_det = 0;
      if (R_target > 0) A_ret = retCap > 0 ? R_target / retCap : Infinity;
      if (D_target > 0) A_det = detCap > 0 ? D_target / detCap : Infinity;

      const finiteReqs = [A_ret, A_det].filter(v => Number.isFinite(v) && v > 0);
      const designRequired = finiteReqs.length ? Math.max(...finiteReqs) : Infinity;
      let A_required = designRequired;

      const A_effectiveEligible = eligibleArea * packingFactor;

      let A_used = 0;
      if (A_effectiveEligible > 0 && Number.isFinite(A_required)) {
        const baseArea = Math.max(A_required || 0, minAreaSF || 0);
        A_used = Math.min(Math.ceil(baseArea), Math.ceil(A_effectiveEligible));
      }

      const blockers = [];
      const warnings = [];

      if (eligibleArea === 0) {
        blockers.push('No eligible area available');
      }

      if (A_used > 0 && A_effectiveEligible > 0 && Number.isFinite(A_required) && A_used < A_required - 1e-6) {
        warnings.push(`Cannot meet full Retention/Detention targets with eligible area (using ${Math.ceil(A_used).toLocaleString()} SF of ${Math.ceil(A_effectiveEligible).toLocaleString()} SF)`);
      }

      const R_provided = A_used * retCap;
      const D_provided = A_used * detCap;

      const R_credit = R_target > 0 ? Math.min(R_provided, R_target) : 0;
      const D_credit = D_target > 0 ? Math.min(D_provided, D_target) : 0;

      const R_pct = R_target > 0 ? Math.round((R_provided / R_target) * 100) : (retCap > 0 ? 100 : 0);
      const D_pct = D_target > 0 ? Math.round((D_provided / D_target) * 100) : (detCap > 0 ? 100 : 0);

      let unitPrice = fullSpec.unitPrice;
      if (isPurpleVegBmpId(bmp.id)) {
        unitPrice = fullSpec.extra.pricingMode === 'green' ? fullSpec.extra.pricingUpgrade : fullSpec.extra.pricingBase;
      }

      const costDesigned = A_used * unitPrice;
      const creditVolumeTotal = R_credit + D_credit;
      const costPerCf = creditVolumeTotal > 0 && costDesigned > 0 ? costDesigned / creditVolumeTotal : 0;

      const isUnderground = [2, 3, 4, 5].includes(bmp.id);
      const isAtGradePond = bmp.id === 1;
      if (isUnderground || isAtGradePond) {
        if (v1Inputs.hasUndergroundUtilities) blockers.push('Blocked by Underground Utilities');
        if (v1Inputs.hasHighWaterTable) blockers.push('Blocked by High Water Table');
        if (v1Inputs.hasContaminatedSoil && isAtGradePond) blockers.push('Blocked by Contaminated Soil');
        if (v1Inputs.hasSiteGradingConstraint) warnings.push('Site grading constraint — underground BMP limited to low point of site');
      }
      if (isUnderground && v1Inputs.hasContaminatedSoil) {
        warnings.push('Contaminated soil — underground systems may require additional handling, liner, or disposal costs');
      }

      // At-grade or underground BMPs consume programmable space
      if (v1Inputs.programmableSpaceIsHighValue && (isUnderground || isAtGradePond)) {
        warnings.push('At-grade footprint could be reprogrammed for higher-value use — consider rooftop alternatives');
      }

      if (detCap === 0 && R_target === 0 && D_target > 0) {
        blockers.push('Cannot provide detention - retention-only product');
      }

      if ((bmp.id === 8 || bmp.id === 9) && !v1Inputs.retentionNeeded) {
        blockers.push('Requires retention target to be needed');
      }

      if ((bmp.id === 8 || bmp.id === 9) && v1Inputs.slopedRoofArea === 0) {
        blockers.push('Requires Sloped Roof area');
      }

      if (isPurpleVegBmpId(bmp.id) && v1Inputs.slopedRoofArea === 0 && v1Inputs.flatDeckOnStructureArea === 0) {
        blockers.push('Requires Sloped Roof or Flat Deck/Plaza area');
      }

      if (isPurplePavBmpId(bmp.id) && v1Inputs.paversOnStructureArea === 0 && v1Inputs.slopedRoofArea === 0 && v1Inputs.flatDeckOnStructureArea === 0) {
        blockers.push('Requires Pavers on Structure, Sloped Roof, or Flat Deck/Plaza area');
      }

      if (bmp.id === 6 && v1Inputs.flatDeckOnStructureArea === 0 && v1Inputs.slopedRoofArea === 0 && v1Inputs.paversOnStructureArea === 0) {
        blockers.push('Requires Flat Deck/Plaza, Sloped Roof, or Pavers on Structure area');
      }

      if (bmp.id === 7 && v1Inputs.flatDeckOnStructureArea === 0) {
        blockers.push('Requires Flat Deck / Plaza area');
      }

      if (bmp.id === 1 && v1Inputs.perviousLandscapingUsable === 0) {
        blockers.push('Requires Usable Landscape area');
      }

      if (bmp.id === 4 && v1Inputs.perviousLandscapingUsable === 0 && v1Inputs.imperviousVehicularPavement === 0) {
        blockers.push('Requires Usable Landscape or Vehicular Pavement area');
      }

      if (bmp.id === 5 && v1Inputs.perviousLandscapingUsable === 0 && v1Inputs.imperviousVehicularPavement === 0) {
        blockers.push('Requires Usable Landscape or Vehicular Pavement area for interior usable space');
      }

      if (capacity.nmwRestricted && (bmp.id === 9 || isPurpleVegBmpId(bmp.id) || isPurplePavBmpId(bmp.id))) {
        warnings.push('NYC DEP: NMW credit reduced (requires ≥4" soil)');
      }

      if (R_target > 0 && R_credit < R_target * 0.99) {
        if (!warnings.some(w => w.includes('Retention target'))) {
          warnings.push('Does not meet full Retention target (can be used in combination)');
        }
      }
      if (D_target > 0 && D_credit < D_target * 0.99) {
        if (!warnings.some(w => w.includes('Detention target'))) {
          warnings.push('Does not meet full Detention target (can be used in combination)');
        }
      }

      const isViable = blockers.length === 0;

      return {
        ...bmp,
        fullSpec,
        capacity,
        eligibleArea,
        areaForRetention: A_ret,
        areaForDetention: A_det,
        grossAreaNeeded: A_required,
        grossDesignedArea: A_used,
        retProvided: R_provided,
        detProvided: D_provided,
        retCredit: R_credit,
        detCredit: D_credit,
        retDesigned: R_credit,
        detDesigned: D_credit,
        retPct: R_pct,
        detPct: D_pct,
        costDesigned,
        costPerCf,
        isViable,
        blockers,
        warnings,
        unitPrice
      };
    });

    const meetsBoth = results.filter(r => {
      const meetsRet = R_target === 0 || Math.abs(r.retCredit - R_target) <= R_target * 0.01;
      const meetsDet = D_target === 0 || Math.abs(r.detCredit - D_target) <= D_target * 0.01;
      const hasArea = r.grossDesignedArea > 0 && r.grossDesignedArea >= r.grossAreaNeeded;
      return r.isViable && meetsRet && meetsDet && hasArea;
    });

    // Sales-first fallback: if no single system meets both targets,
    // evaluate 2-system combinations and choose the lowest total cost package.
    const comboCandidates = [];
    const viableForCombos = results.filter(r => {
      const hasArea = r.grossDesignedArea > 0 && r.grossDesignedArea >= r.grossAreaNeeded;
      return r.isViable && hasArea;
    });
    for (let i = 0; i < viableForCombos.length; i++) {
      for (let j = i + 1; j < viableForCombos.length; j++) {
        const a = viableForCombos[i];
        const b = viableForCombos[j];
        const retCreditRaw = (a.retCredit || 0) + (b.retCredit || 0);
        const detCreditRaw = (a.detCredit || 0) + (b.detCredit || 0);
        const retCredit = R_target > 0 ? Math.min(retCreditRaw, R_target) : retCreditRaw;
        const detCredit = D_target > 0 ? Math.min(detCreditRaw, D_target) : detCreditRaw;
        const meetsRet = R_target === 0 || retCredit >= R_target * 0.99;
        const meetsDet = D_target === 0 || detCredit >= D_target * 0.99;
        if (!meetsRet || !meetsDet) continue;
        const costDesigned = (a.costDesigned || 0) + (b.costDesigned || 0);
        const totalCredit = retCredit + detCredit;
        const costPerCf = totalCredit > 0 ? costDesigned / totalCredit : 0;
        comboCandidates.push({
          id: `combo-${String(a.id)}+${String(b.id)}`,
          members: [
            { id: a.id, name: a.name, retPct: a.retPct, detPct: a.detPct, costDesigned: a.costDesigned, grossDesignedArea: a.grossDesignedArea },
            { id: b.id, name: b.name, retPct: b.retPct, detPct: b.detPct, costDesigned: b.costDesigned, grossDesignedArea: b.grossDesignedArea }
          ],
          retCredit,
          detCredit,
          retPct: R_target > 0 ? Math.round((retCredit / R_target) * 100) : 100,
          detPct: D_target > 0 ? Math.round((detCredit / D_target) * 100) : 100,
          costDesigned,
          costPerCf
        });
      }
    }
    comboCandidates.sort((a, b) => {
      if (a.costDesigned !== b.costDesigned) return a.costDesigned - b.costDesigned;
      return a.costPerCf - b.costPerCf;
    });

    let recommended = null;
    let bestValue = null;
    let recommendedCombo = null;
    if (meetsBoth.length > 0) {
      recommended = [...meetsBoth].sort((a, b) => a.costDesigned - b.costDesigned)[0];
      bestValue = meetsBoth.reduce((best, cur) => {
        const bestC = best.costPerCf || Infinity;
        const curC = cur.costPerCf || Infinity;
        return curC < bestC ? cur : best;
      }, recommended);
    } else if (comboCandidates.length > 0) {
      recommendedCombo = comboCandidates[0];
    }

    return {
      results,
      recommended,
      bestValue,
      recommendedCombo,
      comboCandidates: comboCandidates.slice(0, 25),
      profile
    };
  }

  // Flatten normalized ProjectInputs into the legacy engine input shape
  // expected by runStormwaterCalculations (v1Inputs).
  function adaptProjectInputsToEngineInputs(projectInputs, cityRules) {
    const pi = projectInputs || {};
    const areas = pi.areas || {};
    const targets = pi.targets || {};
    const constraints = pi.constraints || {};
    const assumptions = pi.assumptions || {};

    return {
      // Areas
      perviousLandscapingUsable: Number(areas.perviousLandscapingUsable) || 0,
      imperviousVehicularPavement: Number(areas.imperviousVehicularPavement) || 0,
      imperviousPedestrianPavement: Number(areas.imperviousPedestrianPavement) || 0,
      perviousTreeCoverNonUsable: Number(areas.perviousTreeCoverNonUsable) || 0,
      flatDeckOnStructureArea: Number(areas.flatDeckOnStructureArea) || 0,
      slopedRoofArea: Number(areas.slopedRoofArea) || 0,
      paversOnStructureArea: Number(areas.paversOnStructureArea) || 0,
      imperviousCAUntreated: Number(areas.imperviousCAUntreated) || 0,

      // Targets
      detentionNeeded: !!targets.detentionNeeded,
      retentionNeeded: !!targets.retentionNeeded,
      targetRetentionCF: targets.retentionNeeded ? (Number(targets.retentionCF) || 0) : 0,
      targetDetentionCF: targets.detentionNeeded ? (Number(targets.detentionCF) || 0) : 0,

      // Constraints
      hasUndergroundUtilities: !!constraints.hasUndergroundUtilities,
      hasHighWaterTable: !!constraints.hasHighWaterTable,
      hasContaminatedSoil: !!constraints.hasContaminatedSoil,
      hasSiteGradingConstraint: !!constraints.hasSiteGradingConstraint,

      // Assumptions
      greenRoofAlreadyInScope: !!assumptions.greenRoofAlreadyInScope,
      programmableSpaceIsHighValue: !!assumptions.programmableSpaceIsHighValue,
      allowSteepSlopeGreenRoof: !!assumptions.allowSteepSlopeGreenRoof,

      // City rules linkage
      regulationProfileId: cityRules.regulationProfileId
    };
  }

  function runModel(project, database) {
    if (!project || !database) {
      throw new Error('runModel(project, database) requires both arguments.');
    }

    const { cityKey, inputs, overrides = {} } = project;
    const cityRules = database.cityRulesByCityKey && database.cityRulesByCityKey[cityKey];
    const cityConfig = database.cityConfigs && database.cityConfigs[cityKey];
    const methodKey = (cityConfig && cityConfig.method) || 'LEGACY_BMP_ENGINE';
    const methodEngine = METHOD_MAP[methodKey] || null;
    if (!cityRules) {
      return {
        meta: {
          schemaVersion: '1.0',
          cityKey,
          regulationProfileId: null,
          method: methodKey
        },
        stormwater: {
          results: [],
          recommended: null,
          bestValue: null,
          profile: null,
          inputs: inputs || {},
          warnings: [`No city rules found for key "${cityKey}".`]
        }
      };
    }

    const v1Inputs = adaptProjectInputsToEngineInputs(inputs || {}, cityRules);
    const profile = cityRules.profile;
    if (!profile) {
      return {
        meta: {
          schemaVersion: '1.0',
          cityKey,
          regulationProfileId: cityRules.regulationProfileId || null,
          method: methodKey
        },
        stormwater: {
          results: [],
          recommended: null,
          bestValue: null,
          profile: null,
          inputs: v1Inputs,
          warnings: [`No regulation profile available for city key "${cityKey}".`]
        }
      };
    }

    // Engine-level validation warnings
    const engineWarnings = [];
    const roofAreaTotal = (v1Inputs.flatDeckOnStructureArea || 0) + (v1Inputs.slopedRoofArea || 0);
    if (roofAreaTotal <= 0) {
      engineWarnings.push('No roof area entered; rooftop systems may show as unavailable.');
    }
    const siteAreaTotal =
      (v1Inputs.perviousLandscapingUsable || 0) +
      (v1Inputs.imperviousVehicularPavement || 0) +
      (v1Inputs.imperviousPedestrianPavement || 0) +
      (v1Inputs.flatDeckOnStructureArea || 0) +
      (v1Inputs.slopedRoofArea || 0) +
      (v1Inputs.paversOnStructureArea || 0);
    if ((v1Inputs.targetRetentionCF || v1Inputs.targetDetentionCF) && siteAreaTotal <= 0) {
      engineWarnings.push('No site areas entered; detention/retention results will be zero.');
    }

    const stormwaterCore = runStormwaterCalculations(v1Inputs, database.bmpOptions, profile, overrides);

    // Optional method-based overlay (e.g. NYC DEP volumetric checks)
    let methodResults = null;
    if (methodEngine && typeof methodEngine.run === 'function') {
      try {
        methodResults = methodEngine.run(inputs || {}, database, cityConfig || {});
      } catch (e) {
        methodResults = {
          WQv: 0,
          RRvProvided: 0,
          VvRequired: 0,
          detentionStorage: 0,
          QDRR: 0,
          orificeWidth: 0,
          warnings: ['Method engine error: ' + (e && e.message ? e.message : String(e))]
        };
      }
    }

    return {
      meta: {
        schemaVersion: '1.0',
        cityKey,
        regulationProfileId: cityRules.regulationProfileId,
        method: methodKey
      },
      stormwater: {
        ...stormwaterCore,
        inputs: v1Inputs,
        warnings: [
          ...engineWarnings,
          ...(stormwaterCore.results || []).flatMap(r => r.warnings || []),
          ...(methodResults && Array.isArray(methodResults.warnings) ? methodResults.warnings : [])
        ],
        method: methodKey,
        methodResults
      }
    };
  }

  global.runModel = runModel;
  global.EngineStormwater = {
    calculateCapacity: calculateCapacity,
    getSpec: getSpec,
    getEligibleArea: getEligibleArea,
    isPurpleVegBmpId: isPurpleVegBmpId,
    isPurplePavBmpId: isPurplePavBmpId
  };
})(window);

