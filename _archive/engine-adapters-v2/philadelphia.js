(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('philadelphia', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for Philadelphia.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['philadelphia'] = adapt;
})(window);

