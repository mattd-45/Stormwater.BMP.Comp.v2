#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = [
  'data/bmp-options.js',
  'data/regulation-profiles.js',
  'data/city-data.js',
  'data/city-reg-summaries.js',
  'data/roof-layers.js',
  'data/roof-profiles.js',
  'data/cost-items.js',
  'data/cost-adjustments.js',
  'data/technical-assets.js',
  'engine/adapters/index.js',
  'engine/model.js',
  'v3/v3-project-schema.js',
  'v3/v3-adapter.js',
  'v3/state.js',
  'v3/ui-inputs.js',
  'v3/strategy.js',
  'v3/roof-profile-calc.js',
  'v3/pricing-calc.js',
  'v3/run-analysis.js',
  'v3/report-view.js',
  'v3/app.js',
  'v3/flow.js',
  'v3/resources-catalog.js',
  'v3/stress-test.js',
  'v3/build-standalone.js',
  'v3/build-admin-editor.js',
  'scripts/check-references.js'
];

let failed = false;

files.forEach((file) => {
  const abs = path.join(ROOT, file);
  const result = spawnSync(process.execPath, ['--check', abs], {
    cwd: ROOT,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`Syntax check failed: ${file}`);
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
  }
});

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Syntax check passed (${files.length} files).`);
}
