(function (global) {
  const base = global.CityAdapterBase;
  const registry = global.CityAdapters || (global.CityAdapters = {});

  registry.nyc = {
    adapt(cityUiState, cityRules) {
      return base.createProjectInputs(cityUiState, cityRules);
    }
  };
})(window);

(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('nyc', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for NYC.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['nyc'] = adapt;
})(window);

