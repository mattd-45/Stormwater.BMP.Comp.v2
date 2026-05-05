# Cleanup Pass 2 - Moderate Root Cleanup

Date: 2026-04-28

## Scope

This pass made the repository read more clearly as a V3-first project while keeping active V3 source, active data, the model engine, city data, docs, and referenced assets in place.

## Moved to archive

Root-level V2 and stale routing files were moved to `_archive/root-v2/`:

- `index.html` -> `_archive/root-v2/index-v2.html`
- `legacy.html` -> `_archive/root-v2/legacy.html`
- `_redirects` -> `_archive/root-v2/_redirects`

The old broad `_redirects` rule pointed all routes to root `index.html`, which is no longer the preferred V3 local entry.

## Left in place

- `v3/` remains the active app.
- `data/`, `engine/`, `images/`, `city-data/`, and `docs/` remain active/supporting project folders.
- `legacy/` remains the retired-code folder and now has a README.
- `v3/v3-standalone-test.html` and `v3/admin-editor-standalone.html` remain tracked generated artifacts for now.
- `.netlify/` remains local-only and untracked.

## Local start path

Local startup instructions now point to:

```text
http://localhost:3000/v3/
```

## Verification

Commands run after the cleanup moves:

- `npm run check:references`
- `npm run check`

Result:

- Syntax check passed.
- Required reference check passed for 57 active references.
- V3 stress test passed 10 of 10 scenarios.
- V3 standalone and admin standalone builds completed.

Known non-blocking warnings remain for legacy case-study paths still listed in `data/city-data.js`.

## Remaining cleanup candidates

- Resolve or update the non-blocking legacy case-study paths in `data/city-data.js`.
- Decide later whether generated standalone files should stay tracked or be rebuilt on demand.
- Consider a future asset sweep only after reference checks and targeted searches confirm files are unused.

