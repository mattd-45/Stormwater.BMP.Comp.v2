(function (global) {
  function adapt(cityUiState, cityRules) {
    if (typeof global.__baseAdaptCityInputs === 'function') {
      return global.__baseAdaptCityInputs('ohio_statewide', cityUiState, cityRules);
    }
    return { inputs: {}, warnings: ['Base adapter not initialized for Ohio (statewide).'] };
  }

  global.CityAdapters = global.CityAdapters || {};
  global.CityAdapters['ohio_statewide'] = adapt;
})(window);

