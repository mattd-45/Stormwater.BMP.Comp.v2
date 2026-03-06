(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('seattle', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for Seattle.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['seattle'] = adapt;
})(window);

