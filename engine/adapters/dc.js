(function (global) {
  const base = global.CityAdapterBase;
  const registry = global.CityAdapters || (global.CityAdapters = {});

  registry.dc = {
    adapt(cityUiState, cityRules) {
      return base.createProjectInputs(cityUiState, cityRules);
    }
  };
})(window);

(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('dc', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for DC.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['dc'] = adapt;
})(window);

