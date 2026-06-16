// City input adapters registry + base normalization to ProjectInputs.
// Exposed globally as window.adaptCityInputs(cityKey, cityUiState, cityRules).

(function (global) {
  const registry = global.CityAdapters || (global.CityAdapters = {});

  // Shared normalization from raw per-city UI state to ProjectInputs.
  function baseNormalize(cityKey, cityUiState, cityRules) {
    const ui = cityUiState || {};

    const inputs = {
      areas: {
        perviousLandscapingUsable: Number(ui.perviousLandscapingUsable) || 0,
        imperviousVehicularPavement: Number(ui.imperviousVehicularPavement) || 0,
        imperviousPedestrianPavement: Number(ui.imperviousPedestrianPavement) || 0,
        perviousTreeCoverNonUsable: Number(ui.perviousTreeCoverNonUsable) || 0,
        flatDeckOnStructureArea: Number(ui.flatDeckOnStructureArea) || 0,
        slopedRoofArea: Number(ui.slopedRoofArea) || 0,
        paversOnStructureArea: Number(ui.paversOnStructureArea) || 0,
        imperviousCAUntreated: Number(ui.imperviousCAUntreated) || 0
      },
      targets: {
        detentionCF: Number(ui.targetDetentionCF) || 0,
        retentionCF: Number(ui.targetRetentionCF) || 0,
        detentionNeeded: !!ui.detentionNeeded,
        retentionNeeded: !!ui.retentionNeeded
      },
      constraints: {
        hasUndergroundUtilities: !!ui.hasUndergroundUtilities,
        hasHighWaterTable: !!ui.hasHighWaterTable,
        hasContaminatedSoil: !!ui.hasContaminatedSoil
      },
      assumptions: {
        greenRoofAlreadyInScope: !!ui.greenRoofAlreadyInScope,
        programmableSpaceIsHighValue: !!ui.programmableSpaceIsHighValue,
        allowSteepSlopeGreenRoof: !!ui.allowSteepSlopeGreenRoof
      },
      flags: {}
    };

    const warnings = [];

    // Basic validation so missing required areas don't crash downstream logic.
    const roofAreaTotal =
      inputs.areas.flatDeckOnStructureArea +
      inputs.areas.slopedRoofArea;
    if (roofAreaTotal <= 0) {
      warnings.push('No roof area entered; rooftop BMPs may not be applicable.');
    }

    const siteAreaTotal =
      inputs.areas.perviousLandscapingUsable +
      inputs.areas.imperviousVehicularPavement +
      inputs.areas.imperviousPedestrianPavement +
      inputs.areas.flatDeckOnStructureArea +
      inputs.areas.slopedRoofArea +
      inputs.areas.paversOnStructureArea;
    if ((inputs.targets.detentionNeeded || inputs.targets.retentionNeeded) && siteAreaTotal <= 0) {
      warnings.push('No contributing areas entered; detention/retention targets may not be achievable.');
    }

    return { inputs, warnings };
  }

  // Expose base normalizer so per-city adapters can delegate to it.
  global.__baseAdaptCityInputs = baseNormalize;

  function adaptCityInputs(cityKey, cityUiState, cityRules) {
    const adapter = registry[cityKey];
    if (typeof adapter === 'function') {
      return adapter(cityUiState, cityRules);
    }
    // Fallback: generic mapping when no per-city adapter is registered.
    return baseNormalize(cityKey, cityUiState, cityRules);
  }

  global.adaptCityInputs = adaptCityInputs;
})(window);

