(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('toronto', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for Toronto.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['toronto'] = adapt;
})(window);

