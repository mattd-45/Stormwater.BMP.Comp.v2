(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('boston', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for Boston.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['boston'] = adapt;
})(window);

