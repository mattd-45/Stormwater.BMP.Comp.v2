// Build script: creates v3-standalone-test.html by inlining all dependencies.
// Run with: node v3/build-standalone.js (from the project root)

var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

// Read all source files
var css             = readFile('v3/style.css');
var bmpOptions      = readFile('data/bmp-options.js');
var regProfiles     = readFile('data/regulation-profiles.js');
var cityData        = readFile('data/city-data.js');
var roofLayers      = readFile('data/roof-layers.js');
var roofProfiles    = readFile('data/roof-profiles.js');
var costItems       = readFile('data/cost-items.js');
var costAdjustments = readFile('data/cost-adjustments.js');
var techAssets      = readFile('data/technical-assets.js');
var engineModel     = readFile('engine/model.js');
var schema          = readFile('v3/v3-project-schema.js');
var adapter         = readFile('v3/v3-adapter.js');
var stateJs         = readFile('v3/state.js');
var uiInputsJs      = readFile('v3/ui-inputs.js');
var strategyJs      = readFile('v3/strategy.js');
var roofProfileCalc = readFile('v3/roof-profile-calc.js');
var pricingCalc     = readFile('v3/pricing-calc.js');
var runAnalysisJs   = readFile('v3/run-analysis.js');
var reportViewJs    = readFile('v3/report-view.js');
var appJs           = readFile('v3/app.js');

// Read HTML template
var html = readFile('v3/index.html');

// Step 1: Inline CSS
html = html.replace(
  '<link rel="stylesheet" href="style.css">',
  '<style>\n' + css + '\n</style>'
);

// Step 2: Remove existing external script tags
//   They look like: <script src="../data/bmp-options.js"></script>
//   or:             <script src="state.js"></script>
html = html.replace(/<script src="[^"]*"><\/script>\s*/g, '');

// Also remove the comment line "<!-- Scripts: ... -->"
html = html.replace(/\s*<!--\s*Scripts:.*?-->\s*/g, '\n');

// Step 3: Build inline script tags
// IMPORTANT: Use plain string concatenation. Do NOT use template literals (`...${...}...`)
// because the source files contain $ characters that would be interpolated.
//
// Data files use `const` which doesn't attach to `window` in browsers.
// Modules that reference data via window.VARNAME need explicit assignments.
// We add them after the data files that use `const` for their exports.
var windowShim =
  'if(typeof BMP_OPTIONS_DEFAULT!=="undefined")window.BMP_OPTIONS_DEFAULT=BMP_OPTIONS_DEFAULT;\n' +
  'if(typeof BMP_SPEC_LABELS!=="undefined")window.BMP_SPEC_LABELS=BMP_SPEC_LABELS;\n' +
  'if(typeof BMP_SPEC_AS_PERCENT!=="undefined")window.BMP_SPEC_AS_PERCENT=BMP_SPEC_AS_PERCENT;\n' +
  'if(typeof BMP_IMAGES!=="undefined")window.BMP_IMAGES=BMP_IMAGES;\n' +
  'if(typeof REGULATION_PROFILES_DEFAULT!=="undefined")window.REGULATION_PROFILES_DEFAULT=REGULATION_PROFILES_DEFAULT;\n' +
  'if(typeof CITY_DATA!=="undefined")window.CITY_DATA=CITY_DATA;\n' +
  'if(typeof CASE_STUDIES!=="undefined")window.CASE_STUDIES=CASE_STUDIES;\n' +
  'if(typeof ROOF_LAYERS!=="undefined")window.ROOF_LAYERS=ROOF_LAYERS;\n' +
  'if(typeof ROOF_PROFILES!=="undefined")window.ROOF_PROFILES=ROOF_PROFILES;\n' +
  'if(typeof COST_ITEMS!=="undefined")window.COST_ITEMS=COST_ITEMS;\n' +
  'if(typeof COST_ADJUSTMENTS!=="undefined")window.COST_ADJUSTMENTS=COST_ADJUSTMENTS;\n' +
  'if(typeof COST_MARKUPS!=="undefined")window.COST_MARKUPS=COST_MARKUPS;\n' +
  'if(typeof TECHNICAL_ASSETS!=="undefined")window.TECHNICAL_ASSETS=TECHNICAL_ASSETS;\n';

var scripts = [
  bmpOptions,
  regProfiles,
  cityData,
  roofLayers,
  roofProfiles,
  costItems,
  costAdjustments,
  techAssets,
  windowShim,    // bridge const → window after all data files
  engineModel,
  schema,
  adapter,
  stateJs,
  uiInputsJs,
  strategyJs,
  roofProfileCalc,
  pricingCalc,
  runAnalysisJs,
  reportViewJs,
  appJs
];

var scriptBlock = '\n';
for (var i = 0; i < scripts.length; i++) {
  scriptBlock = scriptBlock + '  <script>\n' + scripts[i] + '\n  </script>\n';
}

// Step 4: Insert before </body>
// IMPORTANT: Cannot use html.replace('</body>', scriptBlock + '</body>') because
// String.replace() interprets $' in the replacement string as a special pattern
// (inserts the portion of string after the match). The JS source files contain
// '$' characters that trigger this. Using a replacer function avoids this.
var bodyCloseIdx = html.indexOf('</body>');
if (bodyCloseIdx === -1) throw new Error('</body> not found in HTML');
html = html.substring(0, bodyCloseIdx) + scriptBlock + html.substring(bodyCloseIdx);

// Step 5: Write output
var outPath = path.join(root, 'v3', 'v3-standalone-test.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Built: ' + outPath + ' (' + html.length + ' bytes)');

// Step 6: Verify - extract script 8 (run-analysis) and check for the dollar sign
var checkIdx = html.indexOf("return '$'");
if (checkIdx >= 0) {
  console.log('Verify: dollar sign string found at offset ' + checkIdx + ' - OK');
} else {
  console.log('ERROR: dollar sign string NOT found in output - build is corrupting content');
}
