(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('nashville', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for Nashville.'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['nashville'] = adapt;
})(window);

