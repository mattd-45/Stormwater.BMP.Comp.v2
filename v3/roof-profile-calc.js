// ═══════════════════════════════════════════════════════════════════════════
// V3 ROOF PROFILE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Calculates weight, cost, retention, and detention for a roof profile
// using the layer library (ROOF_LAYERS) and profile library (ROOF_PROFILES).
//
// Regulation-profile-aware: credited retention and detention factors are
// resolved per-layer from retFactors[profileId] / detFactors[profileId],
// with fallback to 'general'. Conditional rules (retConditions) are
// evaluated — e.g., NYC DEP blocks mineral wool credit if soil < 4".
//
// This is a STANDALONE MODULE. It does not touch the stormwater engine,
// the UI, or any existing calculation path.
//
// ── Interface ───────────────────────────────────────────────────────────
//
//   V3RoofProfileCalc.calculate(profileId, areaSF, regulationProfileId, overrides)
//
//   Arguments:
//     profileId            String — matches ROOF_PROFILES[].id
//     areaSF               Number — roof area in square feet (>= 0)
//     regulationProfileId  String — matches regulation profile key
//                          (e.g., 'general', 'nyc_dep')
//     overrides            Optional object — thickness overrides for
//                          adjustable layers, keyed by layerId.
//                            { 'extensive-media': 6, 'honeycomb-detention': 4 }
//                          Only adjustable layers can be overridden.
//                          Values are clamped to [minDepthIn, maxDepthIn].
//
//   Returns: {
//     valid:       boolean,
//     errors:      string[],           // blocking errors (if valid === false)
//     profile:     { id, name, shortName, profileCategory, bmpId },
//     areaSF:      number,
//     regulationProfileId: string,
//
//     totals: {
//       thicknessIn:    number,        // total assembly depth (inches)
//       dryWeightPSF:   number,        // total dry weight (PSF)
//       satWeightPSF:   number,        // total saturated weight (PSF)
//       retCfPerSf:     number,        // credited retention (CF/SF)
//       detCfPerSf:     number,        // credited detention (CF/SF)
//       costPerSf:      number,        // total cost per SF ($/SF)
//       totalCost:      number,        // costPerSf * areaSF ($)
//       totalRetCf:     number,        // retCfPerSf * areaSF (CF)
//       totalDetCf:     number         // detCfPerSf * areaSF (CF)
//     },
//
//     layers: [                        // layer-by-layer breakdown
//       {
//         layerId:      string,
//         layerName:    string,
//         category:     string,
//         unitType:     string,        // 'depth' or 'fixed'
//         depthIn:      number,        // actual depth used
//         overridden:   boolean,       // true if depth was changed by override
//         adjustable:   boolean,
//         dryWeightPSF: number,        // this layer's weight contribution
//         satWeightPSF: number,
//         retCfPerSf:   number,        // this layer's credited retention
//         detCfPerSf:   number,        // this layer's credited detention
//         costPerSf:    number,        // this layer's cost contribution
//         retFactor:    number,        // the factor used (after profile resolution)
//         detFactor:    number,
//         notes:        string[]       // conditions triggered, warnings, etc.
//       }
//     ]
//   }
//
// ── Dependencies ────────────────────────────────────────────────────────
//
//   - ROOF_LAYERS         (data/roof-layers.js)
//   - ROOF_PROFILES       (data/roof-profiles.js)
//
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {

  // ── Layer lookup (built once) ──────────────────────────────────────

  var _layerMap = null;

  function getLayerMap() {
    if (_layerMap) return _layerMap;
    _layerMap = {};
    for (var i = 0; i < ROOF_LAYERS.length; i++) {
      _layerMap[ROOF_LAYERS[i].id] = ROOF_LAYERS[i];
    }
    return _layerMap;
  }

  function getProfile(profileId) {
    for (var i = 0; i < ROOF_PROFILES.length; i++) {
      if (ROOF_PROFILES[i].id === profileId) return ROOF_PROFILES[i];
    }
    return null;
  }


  // ── Factor resolution ──────────────────────────────────────────────
  //
  // Pick the factor for the active regulation profile.
  // Falls back to 'general' if the profile key is missing.

  function resolveFactor(factorObj, regProfileId) {
    if (!factorObj || typeof factorObj !== 'object') return 0;
    if (factorObj[regProfileId] != null) return factorObj[regProfileId];
    if (factorObj.general != null) return factorObj.general;
    return 0;
  }


  // ── Condition evaluation ───────────────────────────────────────────
  //
  // Checks retConditions for the active regulation profile.
  // Returns { allowed: boolean, notes: string[] }
  //
  // Currently supports:
  //   requiresMinSoilCoverIn — retention credit blocked if the profile's
  //   soil media depth is below this threshold.

  function evaluateRetConditions(layer, regProfileId, profileLayers, layerMap) {
    var result = { allowed: true, notes: [] };

    if (!layer.retConditions) return result;

    var conditions = layer.retConditions[regProfileId];
    if (!conditions) return result;

    if (conditions.requiresMinSoilCoverIn != null) {
      // Find the soil media depth in this profile
      var soilDepth = 0;
      for (var i = 0; i < profileLayers.length; i++) {
        var pl = profileLayers[i];
        var refLayer = layerMap[pl.layerId];
        if (refLayer && refLayer.category === 'media') {
          soilDepth += pl.depthIn;
        }
      }

      if (soilDepth < conditions.requiresMinSoilCoverIn) {
        result.allowed = false;
        result.notes.push(
          regProfileId + ': retention credit blocked — requires '
          + conditions.requiresMinSoilCoverIn + '" soil cover, profile has '
          + soilDepth + '"'
        );
      }
    }

    return result;
  }


  // ── Main calculator ────────────────────────────────────────────────

  function calculate(profileId, areaSF, regulationProfileId, overrides) {
    var errors = [];
    var layerMap = getLayerMap();
    overrides = overrides || {};
    regulationProfileId = regulationProfileId || 'general';

    // ── Validate inputs ──────────────────────────────────────────

    if (typeof areaSF !== 'number' || !isFinite(areaSF) || areaSF < 0) {
      errors.push('areaSF must be a non-negative number.');
    }

    var profile = getProfile(profileId);
    if (!profile) {
      errors.push('Unknown profile id: "' + profileId + '".');
      return { valid: false, errors: errors, profile: null, areaSF: areaSF,
               regulationProfileId: regulationProfileId, totals: null, layers: [] };
    }

    // Validate all layer references
    var profileLayers = profile.layers;
    for (var v = 0; v < profileLayers.length; v++) {
      if (!layerMap[profileLayers[v].layerId]) {
        errors.push('Profile "' + profileId + '" references unknown layer: "' + profileLayers[v].layerId + '".');
      }
    }

    // Validate overrides reference adjustable layers in this profile
    var overrideKeys = Object.keys(overrides);
    for (var k = 0; k < overrideKeys.length; k++) {
      var oKey = overrideKeys[k];
      var oLayer = layerMap[oKey];
      if (!oLayer) {
        errors.push('Override references unknown layer: "' + oKey + '".');
        continue;
      }
      // Check layer is in this profile
      var inProfile = false;
      for (var p = 0; p < profileLayers.length; p++) {
        if (profileLayers[p].layerId === oKey) { inProfile = true; break; }
      }
      if (!inProfile) {
        errors.push('Override layer "' + oKey + '" is not in profile "' + profileId + '".');
        continue;
      }
      if (!oLayer.adjustable) {
        errors.push('Layer "' + oKey + '" is not adjustable — cannot override thickness.');
        continue;
      }
      // Check if fixed in this profile
      var profileEntry = profileLayers.find(function (pl) { return pl.layerId === oKey; });
      if (profileEntry && profileEntry.fixed) {
        errors.push('Layer "' + oKey + '" is fixed in profile "' + profileId + '" — cannot override.');
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors: errors, profile: profileSummary(profile),
               areaSF: areaSF, regulationProfileId: regulationProfileId,
               totals: null, layers: [] };
    }

    // ── Resolve depths (apply overrides, clamp to min/max) ───────

    var resolvedLayers = [];
    for (var i = 0; i < profileLayers.length; i++) {
      var pl = profileLayers[i];
      var layer = layerMap[pl.layerId];
      var depth = pl.depthIn;
      var overridden = false;

      if (overrides[pl.layerId] != null && layer.adjustable && !pl.fixed) {
        var requested = Number(overrides[pl.layerId]);
        if (isFinite(requested)) {
          depth = Math.max(layer.minDepthIn, Math.min(layer.maxDepthIn, requested));
          overridden = true;
        }
      }

      resolvedLayers.push({
        layerId:   pl.layerId,
        layer:     layer,
        depthIn:   depth,
        overridden: overridden,
        fixed:     !!pl.fixed
      });
    }

    // ── Calculate per-layer ──────────────────────────────────────

    var totalThickness = 0;
    var totalDryW      = 0;
    var totalSatW      = 0;
    var totalRet       = 0;
    var totalDet       = 0;
    var totalCost      = 0;

    var layerResults = [];

    for (var j = 0; j < resolvedLayers.length; j++) {
      var rl     = resolvedLayers[j];
      var ly     = rl.layer;
      var d      = rl.depthIn;
      var notes  = [];

      // Resolve factors for this regulation profile
      var retF = resolveFactor(ly.retFactors, regulationProfileId);
      var detF = resolveFactor(ly.detFactors, regulationProfileId);

      // Check retention conditions
      if (retF > 0 && ly.retConditions) {
        var condResult = evaluateRetConditions(ly, regulationProfileId, resolvedLayers, layerMap);
        if (!condResult.allowed) {
          retF = 0;
          for (var n = 0; n < condResult.notes.length; n++) {
            notes.push(condResult.notes[n]);
          }
        }
      }

      // Calculate values based on unitType
      var lDryW, lSatW, lRet, lDet, lCost;

      if (ly.unitType === 'depth' && d > 0) {
        lDryW = ly.dryWeightPSF * d;
        lSatW = ly.satWeightPSF * d;
        lRet  = retF * d / 12;       // CF/SF = factor * inches / 12
        lDet  = detF * d / 12;
        lCost = ly.costPSF * d;
      } else {
        // Fixed layer: values are totals, not per-inch
        lDryW = ly.dryWeightPSF;
        lSatW = ly.satWeightPSF;
        lRet  = 0;   // fixed layers do not contribute volume
        lDet  = 0;
        lCost = ly.costPSF;
      }

      totalThickness += d;
      totalDryW      += lDryW;
      totalSatW      += lSatW;
      totalRet       += lRet;
      totalDet       += lDet;
      totalCost      += lCost;

      // Note if override was clamped
      if (rl.overridden) {
        notes.push('Thickness overridden to ' + d + '"');
      }

      layerResults.push({
        layerId:      rl.layerId,
        layerName:    ly.name,
        category:     ly.category,
        unitType:     ly.unitType,
        depthIn:      d,
        overridden:   rl.overridden,
        adjustable:   ly.adjustable && !rl.fixed,
        dryWeightPSF: round4(lDryW),
        satWeightPSF: round4(lSatW),
        retCfPerSf:   round6(lRet),
        detCfPerSf:   round6(lDet),
        costPerSf:    round4(lCost),
        retFactor:    retF,
        detFactor:    detF,
        notes:        notes
      });
    }

    // ── Assemble totals ──────────────────────────────────────────

    var safeArea = (typeof areaSF === 'number' && isFinite(areaSF) && areaSF > 0) ? areaSF : 0;

    var totals = {
      thicknessIn:  round4(totalThickness),
      dryWeightPSF: round4(totalDryW),
      satWeightPSF: round4(totalSatW),
      retCfPerSf:   round6(totalRet),
      detCfPerSf:   round6(totalDet),
      costPerSf:    round4(totalCost),
      totalCost:    round2(totalCost * safeArea),
      totalRetCf:   round4(totalRet * safeArea),
      totalDetCf:   round4(totalDet * safeArea)
    };

    return {
      valid:                true,
      errors:               [],
      profile:              profileSummary(profile),
      areaSF:               safeArea,
      regulationProfileId:  regulationProfileId,
      totals:               totals,
      layers:               layerResults
    };
  }


  // ── Helpers ────────────────────────────────────────────────────────

  function profileSummary(p) {
    return {
      id:              p.id,
      name:            p.name,
      shortName:       p.shortName,
      profileCategory: p.profileCategory,
      bmpId:           p.bmpId
    };
  }

  function round2(v) { return Math.round(v * 100) / 100; }
  function round4(v) { return Math.round(v * 10000) / 10000; }
  function round6(v) { return Math.round(v * 1000000) / 1000000; }


  // ── Export ─────────────────────────────────────────────────────────

  global.V3RoofProfileCalc = {
    calculate: calculate
  };

})(window);
