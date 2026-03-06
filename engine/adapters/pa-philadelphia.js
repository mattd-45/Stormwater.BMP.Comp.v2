(function (global) {
  const base = global.CityAdapterBase;
  const registry = global.CityAdapters || (global.CityAdapters = {});

  registry.philadelphia = {
    adapt(cityUiState, cityRules) {
      return base.createProjectInputs(cityUiState, cityRules);
    }
  };
})(window);

