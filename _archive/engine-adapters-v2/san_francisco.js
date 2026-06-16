(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('san_francisco', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for San Francisco.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['san_francisco'] = adapt;
})(window);

