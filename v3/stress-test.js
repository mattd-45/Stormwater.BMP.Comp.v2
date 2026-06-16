#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function loadScript(context, relPath) {
  const abs = path.join(ROOT, relPath);
  const code = fs.readFileSync(abs, 'utf8');
  vm.runInContext(code, context, { filename: abs });
}

function setupRuntime() {
  const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    Date,
    Math
  });
  context.window = context;
  context.global = context;

  loadScript(context, path.join('data', 'bmp-options.js'));
  loadScript(context, path.join('data', 'regulation-profiles.js'));
  loadScript(context, path.join('data', 'city-data.js'));
  vm.runInContext(
    [
      'if (typeof BMP_OPTIONS_DEFAULT !== "undefined") window.BMP_OPTIONS_DEFAULT = BMP_OPTIONS_DEFAULT;',
      'if (typeof REGULATION_PROFILES_DEFAULT !== "undefined") window.REGULATION_PROFILES_DEFAULT = REGULATION_PROFILES_DEFAULT;',
      'if (typeof CITY_DATA !== "undefined") window.CITY_DATA = CITY_DATA;'
    ].join('\n'),
    context
  );
  loadScript(context, path.join('engine', 'adapters', 'index.js'));
  loadScript(context, path.join('engine', 'model.js'));
  loadScript(context, path.join('v3', 'v3-project-schema.js'));
  loadScript(context, path.join('v3', 'v3-adapter.js'));

  return context;
}

function buildDatabase(ctx) {
  const db = {
    bmpOptions: ctx.BMP_OPTIONS_DEFAULT,
    cityRulesByCityKey: {},
    cityConfigs: ctx.CITY_DATA
  };
  for (const [key, city] of Object.entries(ctx.CITY_DATA || {})) {
    const profileId = city.regulationProfileId || 'general';
    const profile = (ctx.REGULATION_PROFILES_DEFAULT || {})[profileId]
      || (ctx.REGULATION_PROFILES_DEFAULT || {}).general;
    db.cityRulesByCityKey[key] = { regulationProfileId: profileId, profile };
  }
  return db;
}

const PRESETS = {
  balanced: { building: 25000, landscape: 12500, parking: 12500 },
  'dense-urban': { building: 40000, landscape: 0, parking: 10000 },
  campus: { building: 15000, landscape: 25000, parking: 10000 },
  'parking-dominant': { building: 10000, landscape: 5000, parking: 35000 },
  podium: { building: 30000, landscape: 15000, parking: 5000 },
  'big-box-retail': { building: 55000, landscape: 5000, parking: 40000 }
};

const SPLITS = {
  balanced: { slopedRoof: 0.6, flatDeck: 0.4, pavers: 0, vehicular: 0.8, pedestrian: 0.2 },
  'dense-urban': { slopedRoof: 0.45, flatDeck: 0.4, pavers: 0.15, vehicular: 0.5, pedestrian: 0.5 },
  campus: { slopedRoof: 0.75, flatDeck: 0.25, pavers: 0, vehicular: 0.65, pedestrian: 0.35 },
  'parking-dominant': { slopedRoof: 0.75, flatDeck: 0.25, pavers: 0, vehicular: 0.9, pedestrian: 0.1 },
  podium: { slopedRoof: 0.25, flatDeck: 0.5, pavers: 0.25, vehicular: 0.5, pedestrian: 0.5 },
  'big-box-retail': { slopedRoof: 0.7, flatDeck: 0.2, pavers: 0.1, vehicular: 0.92, pedestrian: 0.08 }
};

function scalePreset(presetKey, totalSiteArea) {
  const base = PRESETS[presetKey];
  const totalBase = base.building + base.landscape + base.parking;
  const scale = totalSiteArea / totalBase;
  return {
    building: Math.round(base.building * scale),
    landscape: Math.round(base.landscape * scale),
    parking: Math.round(base.parking * scale)
  };
}

function buildAreas(presetKey, totals) {
  const s = SPLITS[presetKey];
  return {
    perviousLandscapingUsable: totals.landscape,
    imperviousVehicularPavement: Math.round(totals.parking * s.vehicular),
    imperviousPedestrianPavement: Math.round(totals.parking * s.pedestrian),
    perviousTreeCoverNonUsable: 0,
    flatDeckOnStructureArea: Math.round(totals.building * s.flatDeck),
    slopedRoofArea: Math.round(totals.building * s.slopedRoof),
    paversOnStructureArea: Math.round(totals.building * s.pavers),
    imperviousCAUntreated: 0
  };
}

function createProject(ctx, scenario) {
  const totals = scalePreset(scenario.presetKey, scenario.totalSiteAreaSF);
  const areas = buildAreas(scenario.presetKey, totals);
  return {
    schemaVersion: '3.0',
    projectInfo: {
      projectName: `Stress Test ${scenario.id} - ${scenario.cityKey}`,
      projectAddress: '100 Test Ave',
      clientName: 'Test',
      clientAddress: '',
      clientCompany: 'QA',
      preparedBy: 'stress-test.js',
      projectId: `stress-${scenario.id}`,
      createdDate: new Date().toISOString().slice(0, 10),
      modifiedDate: new Date().toISOString().slice(0, 10),
      notes: ''
    },
    site: {
      cityKey: scenario.cityKey,
      presetKey: scenario.presetKey,
      siteType: 'new_development',
      soilType: scenario.soilType || null,
      designModeAreas: {
        totalSiteAreaSF: scenario.totalSiteAreaSF,
        totalBuildingSF: totals.building,
        totalLandscapeSF: totals.landscape,
        totalParkingSF: totals.parking
      },
      areas
    },
    targets: {
      retentionNeeded: true,
      retentionCF: scenario.retentionCF,
      detentionNeeded: true,
      detentionCF: scenario.detentionCF,
      retentionSourceNote: '',
      detentionSourceNote: ''
    },
    constraints: {
      hasUndergroundUtilities: !!scenario.constraints.hasUndergroundUtilities,
      hasHighWaterTable: !!scenario.constraints.hasHighWaterTable,
      hasContaminatedSoil: !!scenario.constraints.hasContaminatedSoil,
      hasSiteGradingConstraint: !!scenario.constraints.hasSiteGradingConstraint,
      hasStructuralLoadLimit: false,
      maxRoofLoadPSF: null
    },
    assumptions: {
      greenRoofAlreadyInScope: !!scenario.assumptions.greenRoofAlreadyInScope,
      programmableSpaceIsHighValue: !!scenario.assumptions.programmableSpaceIsHighValue,
      allowSteepSlopeGreenRoof: false,
      highValueIndoorSpace: !!scenario.assumptions.highValueIndoorSpace
    },
    systemCategories: {
      stormwater: true,
      vpv: false,
      traditionalPV: false,
      fallProtection: false,
      livingWall: false,
      ballastedSolar: false
    },
    settings: {
      mode: 'engineering',
      sortResultsBy: 'totalCost',
      pricingOverrides: {},
      purpleRoofPricingMode: 'black',
      showDetailCards: true,
      showCostData: true,
      showWeightData: false,
      markup: { installerPct: 0.25, waterprooferEnabled: false, waterprooferPct: 0.1, gcPct: 0.1 }
    }
  };
}

function defaultScenarios(ctx) {
  const cityKeys = Object.keys(ctx.CITY_DATA || {}).slice(0, 10);
  const presets = ['balanced', 'dense-urban', 'campus', 'parking-dominant', 'podium', 'big-box-retail'];
  const constraintsSet = [
    {},
    { hasUndergroundUtilities: true },
    { hasHighWaterTable: true },
    { hasContaminatedSoil: true },
    { hasSiteGradingConstraint: true }
  ];
  const out = [];
  for (let i = 0; i < cityKeys.length; i++) {
    out.push({
      id: i + 1,
      cityKey: cityKeys[i],
      presetKey: presets[i % presets.length],
      totalSiteAreaSF: 45000 + (i * 5000),
      retentionCF: 80 + (i * 10),
      detentionCF: 100 + (i * 15),
      constraints: constraintsSet[i % constraintsSet.length],
      assumptions: {
        greenRoofAlreadyInScope: i % 4 === 0,
        programmableSpaceIsHighValue: i % 3 === 0,
        highValueIndoorSpace: i % 5 === 0
      }
    });
  }
  return out;
}

function evaluateScenario(ctx, db, scenario) {
  const row = {
    id: scenario.id,
    cityKey: scenario.cityKey,
    cityName: (ctx.CITY_DATA[scenario.cityKey] && ctx.CITY_DATA[scenario.cityKey].name) || scenario.cityKey,
    presetKey: scenario.presetKey,
    retentionCF: scenario.retentionCF,
    detentionCF: scenario.detentionCF,
    status: 'PASS',
    issues: []
  };

  const schema = createProject(ctx, scenario);
  const validation = ctx.validateV3Project(schema);
  if (!validation.valid) {
    row.status = 'FAIL';
    row.issues.push('Schema invalid: ' + (validation.errors || []).join('; '));
    return row;
  }

  const adapted = ctx.adaptV3ToEngine(schema);
  if (!adapted || !adapted.project) {
    row.status = 'FAIL';
    row.issues.push('Adapter returned null project.');
    return row;
  }

  let output;
  try {
    output = ctx.runModel(adapted.project, db);
  } catch (err) {
    row.status = 'FAIL';
    row.issues.push('Engine error: ' + (err && err.message ? err.message : String(err)));
    return row;
  }

  const sw = output && output.stormwater ? output.stormwater : {};
  const results = Array.isArray(sw.results) ? sw.results : [];
  const viable = results.filter(r => r && r.isViable);
  const meetsBoth = viable.filter(r => (Number(r.retPct) || 0) >= 99 && (Number(r.detPct) || 0) >= 99);

  row.profileId = output && output.meta ? output.meta.regulationProfileId : '';
  row.recommended = sw.recommended ? sw.recommended.name : '';
  row.viableCount = viable.length;
  row.meetsBothCount = meetsBoth.length;

  if (results.length === 0) row.issues.push('No engine results.');
  if (viable.length === 0) row.issues.push('No viable BMPs.');

  results.forEach(function (r) {
    if (!Number.isFinite(r.costDesigned)) row.issues.push(`Non-finite costDesigned for BMP ${r.id}`);
    if (!Number.isFinite(r.grossDesignedArea)) row.issues.push(`Non-finite grossDesignedArea for BMP ${r.id}`);
    if (!Number.isFinite(r.retPct)) row.issues.push(`Non-finite retPct for BMP ${r.id}`);
    if (!Number.isFinite(r.detPct)) row.issues.push(`Non-finite detPct for BMP ${r.id}`);
  });

  if (meetsBoth.length > 0 && !sw.recommended) {
    row.issues.push('Recommended missing even though at least one BMP meets both targets.');
  }
  if (sw.recommended && (!sw.recommended.isViable || sw.recommended.retPct < 99 || sw.recommended.detPct < 99) && meetsBoth.length > 0) {
    row.issues.push('Recommended does not meet both targets while alternatives do.');
  }

  if (row.issues.length > 0) row.status = 'WARN';
  if (row.issues.some(i => i.indexOf('Schema invalid') === 0 || i.indexOf('Engine error') === 0 || i === 'No engine results.')) {
    row.status = 'FAIL';
  }

  return row;
}

function printSummary(rows) {
  console.log('\nV3 STRESS TEST (10 city/layout scenarios)');
  console.log('='.repeat(92));
  console.log('ID  City                Preset             Viable  MeetsBoth  Status  Recommended');
  console.log('-'.repeat(92));
  rows.forEach(function (r) {
    const city = String(r.cityKey).padEnd(18);
    const preset = String(r.presetKey).padEnd(18);
    const viable = String(r.viableCount == null ? '-' : r.viableCount).padEnd(6);
    const both = String(r.meetsBothCount == null ? '-' : r.meetsBothCount).padEnd(9);
    const status = String(r.status).padEnd(6);
    const rec = (r.recommended || '-').slice(0, 30);
    console.log(`${String(r.id).padEnd(3)} ${city} ${preset} ${viable} ${both} ${status} ${rec}`);
    if (r.issues.length) {
      r.issues.forEach(function (issue) {
        console.log(`    - ${issue}`);
      });
    }
  });
  console.log('-'.repeat(92));
  const pass = rows.filter(r => r.status === 'PASS').length;
  const warn = rows.filter(r => r.status === 'WARN').length;
  const fail = rows.filter(r => r.status === 'FAIL').length;
  console.log(`Summary: PASS=${pass} WARN=${warn} FAIL=${fail} TOTAL=${rows.length}`);
}

// ── buildPurpleRoofSimulatorUrl unit test ──────────────────────────────
// Loads run-analysis.js in a minimal sandbox (pure function only — no DOM)
// and verifies the Philadelphia example produces the expected URL params.

function testBuildPurpleRoofSimulatorUrl() {
  const ctx = vm.createContext({
    console,
    Math,
    URLSearchParams: global.URLSearchParams
  });
  ctx.window = ctx;
  ctx.global = ctx;

  // run-analysis.js accesses CITY_DATA at render time, not load time,
  // but stub it so the IIFE initialises cleanly.
  ctx.CITY_DATA = {};
  ctx.BMP_OPTIONS_DEFAULT = [];

  loadScript(ctx, path.join('v3', 'run-analysis.js'));

  const fn = ctx.V3RunAnalysis && ctx.V3RunAnalysis.buildPurpleRoofSimulatorUrl;
  if (typeof fn !== 'function') throw new Error('buildPurpleRoofSimulatorUrl not exported on V3RunAnalysis');

  const url = fn({
    lat: 39.9526,
    lon: -75.1652,
    roofAreaSqFt: 55750,
    contributingAreaSqFt: 1000,
    paverAreaSqFt: 3658,
    timeOfConcentrationMin: 6,
    assemblyId: '10',
    drainboxCount: 5,
    orificeWidthIn: 24
  });

  const checks = [
    ['base URL (.html)',  url.startsWith('https://purple-roof-simulator.com/roof-simulator.html')],
    ['lat=39.9526',      url.includes('lat=39.9526')],
    ['lon=-75.1652',     url.includes('lon=-75.1652')],
    ['gr=55750',         url.includes('gr=55750')],
    ['cf=1000',          url.includes('cf=1000')],
    ['pv=3658',          url.includes('pv=3658')],
    ['tc=6',             url.includes('tc=6')],
    ['nb=5',             url.includes('nb=5')],
    ['bw=24',            url.includes('bw=24')],
    ['sd=4',             url.includes('sd=4')],
    ['wd=1',             url.includes('wd=1')],
    ['hd=2',             url.includes('hd=2')],
    ['ds=t2',            url.includes('ds=t2')],
    ['th=l',             url.includes('th=l')]
  ];

  let pass = 0, fail = 0;
  checks.forEach(([label, ok]) => {
    if (ok) { pass++; } else { fail++; console.error(`  FAIL [${label}] not found in: ${url}`); }
  });
  return { pass, fail, url };
}

function testDefaultPurpleRoofDrainboxCount() {
  const ctx = vm.createContext({
    console,
    Math,
    URLSearchParams: global.URLSearchParams
  });
  ctx.window = ctx;
  ctx.global = ctx;
  ctx.CITY_DATA = {};
  ctx.BMP_OPTIONS_DEFAULT = [];
  loadScript(ctx, path.join('v3', 'run-analysis.js'));

  const fn = ctx.V3RunAnalysis && ctx.V3RunAnalysis.defaultPurpleRoofDrainboxCount;
  if (typeof fn !== 'function') throw new Error('defaultPurpleRoofDrainboxCount not exported on V3RunAnalysis');

  const checks = [
    [0, 1],
    [1, 1],
    [1500, 1],
    [1501, 2],
    [14880, 10]
  ];
  let pass = 0;
  let fail = 0;
  checks.forEach(([sf, expected]) => {
    const got = fn(sf);
    if (got === expected) pass++;
    else {
      fail++;
      console.error(`  FAIL drainbox default: ${sf} SF expected ${expected}, got ${got}`);
    }
  });
  return { pass, fail };
}

function main() {
  const ctx = setupRuntime();
  const db = buildDatabase(ctx);
  const scenarios = defaultScenarios(ctx);
  const rows = scenarios.map(s => evaluateScenario(ctx, db, s));
  printSummary(rows);

  const report = {
    generatedAt: new Date().toISOString(),
    scenarioCount: rows.length,
    rows
  };
  const outPath = path.join(__dirname, 'stress-test-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nWrote report: ${outPath}`);

  // ── buildPurpleRoofSimulatorUrl unit test ──
  console.log('\n─── buildPurpleRoofSimulatorUrl unit test (Philadelphia) ───');
  try {
    const urlTest = testBuildPurpleRoofSimulatorUrl();
    console.log(`  URL: ${urlTest.url}`);
    console.log(`  Assertions: PASS=${urlTest.pass} FAIL=${urlTest.fail}`);
    if (urlTest.fail > 0) process.exitCode = 1;
  } catch (err) {
    console.error('  ERROR: ' + (err && err.message ? err.message : String(err)));
    process.exitCode = 1;
  }

  console.log('\n─── defaultPurpleRoofDrainboxCount unit test ───');
  try {
    const nbTest = testDefaultPurpleRoofDrainboxCount();
    console.log(`  Assertions: PASS=${nbTest.pass} FAIL=${nbTest.fail}`);
    if (nbTest.fail > 0) process.exitCode = 1;
  } catch (err) {
    console.error('  ERROR: ' + (err && err.message ? err.message : String(err)));
    process.exitCode = 1;
  }

  const hasFail = rows.some(r => r.status === 'FAIL');
  if (hasFail) process.exitCode = 1;
}

main();

