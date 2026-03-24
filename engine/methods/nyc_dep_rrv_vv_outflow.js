// NYC DEP RRV / Vv / outflow method implementation.
// Pure numeric helpers plus a single run(inputs, database, cityConfig) function.
//
// Attached to window.NYC_DEP_RRV_VV_OUTFLOW = { run } so the core
// engine can reference it without using ES modules.

(function (global) {
  function calculateWQv(areaSF, rainfallIn, imperviousPct) {
    const A = Number(areaSF) || 0;
    const P = Number(rainfallIn) || 0;
    const imp = Math.min(Math.max(Number(imperviousPct) || 0, 0), 100);
    if (A <= 0 || P <= 0 || imp <= 0) return 0;

    const Rv = 0.05 + 0.009 * imp;
    return (P / 12) * A * Rv;
  }

  function calculateLayerStorage(areaSF, depthIn, porosity) {
    const A = Number(areaSF) || 0;
    const d = Number(depthIn) || 0;
    const p = Number(porosity) || 0;
    if (A <= 0 || d <= 0 || p <= 0) return 0;
    return A * (d / 12) * p;
  }

  function calculateVv(areaSF, rainfallDepthIn, runoffCoeff) {
    const A = Number(areaSF) || 0;
    const P = Number(rainfallDepthIn) || 0;
    const Cw = Number(runoffCoeff) || 0;
    if (A <= 0 || P <= 0 || Cw <= 0) return 0;
    return (P / 12) * A * Cw;
  }

  function calculateQDRR(areaSF, releaseRateCfsPerAcre) {
    const A = Number(areaSF) || 0;
    const q = Number(releaseRateCfsPerAcre) || 0;
    if (A <= 0 || q <= 0) return 0;
    // 1 acre = 43,560 SF
    return (q * A) / 43560;
  }

  function calculateOrificeWidth(Q, CD, hIn, storageDepthFT) {
    const Qc = Number(Q) || 0;
    const Cd = Number(CD) || 0;
    const h = Number(hIn) || 0;
    const SDF_rect = Number(storageDepthFT) || 0;

    if (Qc <= 0 || Cd <= 0 || h <= 0 || SDF_rect <= 0) return 0;

    // From NYC DEP guidance (user‑provided form):
    // w² = (322 / CD²) × (Q² / h²) ÷ (SDF_rect − (h / 24))
    const denom = (SDF_rect - (h / 24));
    if (denom <= 0) return 0;

    const w2 = (322 / (Cd * Cd)) * ((Qc * Qc) / (h * h)) / denom;
    if (w2 <= 0) return 0;
    return Math.sqrt(w2);
  }

  function run(inputs, database, cityConfig) {
    const warnings = [];
    const pi = inputs || {};
    const areas = pi.areas || {};
    const targets = pi.targets || {};

    const methodConfig = (cityConfig && cityConfig.methodConfig) || {};

    // Derive basic areas
    const imperviousArea =
      (areas.imperviousVehicularPavement || 0) +
      (areas.imperviousPedestrianPavement || 0) +
      (areas.imperviousCAUntreated || 0);

    const totalArea =
      (areas.perviousLandscapingUsable || 0) +
      imperviousArea +
      (areas.flatDeckOnStructureArea || 0) +
      (areas.slopedRoofArea || 0) +
      (areas.paversOnStructureArea || 0);

    if (totalArea <= 0) {
      warnings.push('NYC method: no contributing area provided; using 0 for all volumes.');
    }

    const imperviousPct = totalArea > 0 ? (imperviousArea / totalArea) * 100 : 0;

    // Design storm depths and coefficients (fall back to reasonable defaults)
    const wqvRainIn = methodConfig.wqvRainIn != null ? methodConfig.wqvRainIn : 1.5; // in.
    const vvRainIn = methodConfig.vvRainIn != null ? methodConfig.vvRainIn : wqvRainIn;
    const runoffCoeff = methodConfig.runoffCoeff != null ? methodConfig.runoffCoeff : 0.9;

    const WQv = calculateWQv(totalArea, wqvRainIn, imperviousPct);

    // RRv provided by green roof / storage layers
    const rrvDepthIn = methodConfig.rrvDepthIn != null ? methodConfig.rrvDepthIn : wqvRainIn;
    const rrvPorosity = methodConfig.rrvPorosity != null ? methodConfig.rrvPorosity : 0.4;
    const RRvProvided = calculateLayerStorage(totalArea, rrvDepthIn, rrvPorosity);

    // Required volume for downstream conveyance / detention (Vv)
    const VvRequired = calculateVv(totalArea, vvRainIn, runoffCoeff);

    // Detention storage (often based on a separate depth + void ratio)
    const detDepthIn = methodConfig.detentionDepthIn != null ? methodConfig.detentionDepthIn : 6;
    const detPorosity = methodConfig.detentionPorosity != null ? methodConfig.detentionPorosity : 0.95;
    const detentionStorage = calculateLayerStorage(totalArea, detDepthIn, detPorosity);

    // Design release rate (QDRR)
    const releaseRateCfsPerAcre =
      methodConfig.releaseRateCfsPerAcre != null ? methodConfig.releaseRateCfsPerAcre : 0.1;
    const QDRR = calculateQDRR(totalArea, releaseRateCfsPerAcre);

    // Required orifice width for rectangular outlet
    const Cd = methodConfig.orificeCd != null ? methodConfig.orificeCd : 0.62;
    const hIn = methodConfig.orificeHeadIn != null ? methodConfig.orificeHeadIn : 12; // in
    const storageDepthFt =
      methodConfig.storageDepthFt != null ? methodConfig.storageDepthFt : detDepthIn / 12;

    const orificeWidth = calculateOrificeWidth(QDRR, Cd, hIn, storageDepthFt);

    if (!targets.detentionNeeded && !targets.retentionNeeded) {
      warnings.push('NYC method: neither detention nor retention targets are flagged as needed.');
    }

    return {
      WQv,
      RRvProvided,
      VvRequired,
      detentionStorage,
      QDRR,
      orificeWidth,
      warnings
    };
  }

  global.NYC_DEP_RRV_VV_OUTFLOW = { run };
})(window);

