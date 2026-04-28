# Cleanup Audit

Last updated: 2026-04-28

This audit records the first safe cleanup pass. No app assets were moved or deleted in this batch.

## Active V3 source

The active app entry point is `v3/index.html`.

Core V3 source files:
- `v3/index.html`
- `v3/style.css`
- `v3/app.js`
- `v3/flow.js`
- `v3/ui-inputs.js`
- `v3/run-analysis.js`
- `v3/report-view.js`
- `v3/state.js`
- `v3/strategy.js`
- `v3/pricing-calc.js`
- `v3/roof-profile-calc.js`
- `v3/v3-project-schema.js`
- `v3/v3-adapter.js`
- `v3/resources.html`
- `v3/resources-catalog.js`

Core data and engine files:
- `data/bmp-options.js`
- `data/regulation-profiles.js`
- `data/city-data.js`
- `data/city-reg-summaries.js`
- `data/roof-layers.js`
- `data/roof-profiles.js`
- `data/cost-items.js`
- `data/cost-adjustments.js`
- `data/technical-assets.js`
- `engine/model.js`

## Generated files

These files are generated or can be regenerated:
- `v3/v3-standalone-test.html` from `v3/build-standalone.js`
- `v3/admin-editor-standalone.html` from `v3/build-admin-editor.js`
- `v3/stress-test-report.json` from `v3/stress-test.js`

Recommended policy:
- Keep standalone HTML files only if they are useful for demos or offline handoff.
- Ignore `v3/stress-test-report.json` as generated output unless a specific report artifact needs to be saved.
- Keep standalone HTML files under review; do not ignore or archive them until you decide whether they should be tracked demos or rebuilt on demand.

## Existing legacy area

The `legacy/` folder already contains retired or backup files:
- `legacy/index-MUSA-PC-11.html`
- `legacy/index.BACKUP-before-fun.html`
- `legacy/model.BACKUP-before-fun.js`

Recommended policy:
- Keep these in `legacy/` for now.
- Do not mix active V3 source into `legacy/`.
- If more retired files appear, move them under `legacy/` or `_archive/legacy/` after approval.

## Candidate archive list

No files were moved in this batch. These are candidates for later review:

### Generated / local outputs
- `v3/stress-test-report.json` - generated report output; ignored in `.gitignore`.
- `.netlify/state.json` - local Netlify state; ignored in `.gitignore`.

### Generated standalone files
- `v3/v3-standalone-test.html`
- `v3/admin-editor-standalone.html`

Do not archive these unless you decide generated standalone files should be rebuilt on demand instead of tracked.

### Legacy files
- `legacy/index-MUSA-PC-11.html`
- `legacy/index.BACKUP-before-fun.html`
- `legacy/model.BACKUP-before-fun.js`

Already isolated in `legacy/`; no move needed unless you want them staged under `_archive/legacy/`.

### Root app files
- `index.html`
- `legacy.html`

These appear to be older/root app surfaces while V3 is active in `v3/index.html`. They should not be moved until deployment routing is confirmed, especially because `.netlify/netlify.toml` currently redirects `/*` to `/index.html`.

## Known migration state

The working tree currently shows many tracked old PDFs/images as deleted and many normalized replacement assets as untracked. This looks like an intentional asset migration. Do not restore old filenames or delete normalized replacement assets without checking references.

## Candidate fixes before deeper cleanup

- Decide whether root `index.html` remains a deployment entry point or should redirect to `v3/index.html`.
- Decide whether generated standalone files are committed artifacts or local build outputs.
- Keep `.netlify/state.json` and `v3/stress-test-report.json` ignored unless project workflow changes.
- Review `data/bmp-options.js` `BMP_IMAGES`: several legacy image names no longer exist, but active V3 results use `data/technical-assets.js` for visuals.

## Reliability gate

Run `npm run check` before future cleanup batches, demos, or deployment handoffs. The gate runs:
- JavaScript syntax checks for active data, engine, V3, build, and QA scripts.
- Local reference checks for active V3 shell assets, resource hero assets, and technical assets.
- V3 stress scenarios through `v3/stress-test.js`.
- Standalone app and admin editor rebuilds.

Manual browser coverage is tracked in `docs/qa-checklist.md`.

Latest automated result:
- 2026-04-28: `npm run check` passed.
- Syntax check passed for 27 files.
- Required reference check passed for 57 active references.
- Reference check reported 13 non-blocking warnings for legacy city icons and case study PDFs still listed in `data/city-data.js`.
- V3 stress test passed 10 of 10 scenarios.
- `v3/v3-standalone-test.html` and `v3/admin-editor-standalone.html` rebuilt successfully.
