// Build script: creates admin-editor-standalone.html by inlining data files.
// Run with: node v3/build-admin-editor.js (from the project root)

var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

// Read data files — each entry maps a file to the globals it exports
var dataFiles = [
  { file: 'data/cost-items.js',       globals: ['COST_ITEMS', 'COST_ITEM_SCHEMA'] },
  { file: 'data/roof-layers.js',      globals: ['ROOF_LAYERS', 'ROOF_LAYER_SCHEMA'] },
  { file: 'data/roof-profiles.js',    globals: ['ROOF_PROFILES', 'ROOF_PROFILE_SCHEMA'] },
  { file: 'data/cost-adjustments.js', globals: ['COST_ADJUSTMENTS', 'COST_MARKUPS', 'COST_ADJUSTMENT_SCHEMA', 'COST_MARKUP_SCHEMA'] }
];

// Read the editor HTML
var html = readFile('v3/admin-editor.html');

// Build data script block
// Because data files use `const`, variables don't attach to `window`.
// We add explicit window assignments after each file so the editor
// can find them via window[varName].
var dataBlock = '\n';
for (var i = 0; i < dataFiles.length; i++) {
  var entry = dataFiles[i];
  var content = readFile(entry.file);
  // Add window assignments for each global
  var assignments = entry.globals.map(function (g) {
    return '  if (typeof ' + g + ' !== "undefined") window.' + g + ' = ' + g + ';';
  }).join('\n');
  dataBlock += '  <script>\n' + content + '\n' + assignments + '\n  </script>\n';
}

// Insert data scripts before the editor's own <script> tag
var editorScriptIdx = html.indexOf('<script>');
if (editorScriptIdx === -1) throw new Error('<script> not found in editor HTML');
html = html.substring(0, editorScriptIdx) + dataBlock + '\n' + html.substring(editorScriptIdx);

// Write output
var outPath = path.join(root, 'v3', 'admin-editor-standalone.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Built: ' + outPath + ' (' + html.length + ' bytes)');
