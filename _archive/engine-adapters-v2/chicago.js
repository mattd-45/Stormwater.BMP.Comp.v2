(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('chicago', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for Chicago.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['chicago'] = adapt;
})(window);

