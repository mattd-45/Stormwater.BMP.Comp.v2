(function (global) {
  const base = global.CityAdapterBase;
  const registry = global.CityAdapters || (global.CityAdapters = {});

  registry.san_francisco = {
    adapt(cityUiState, cityRules) {
      return base.createProjectInputs(cityUiState, cityRules);
    }
  };
})(window);

