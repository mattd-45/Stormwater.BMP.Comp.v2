# V3 Architecture Plan — Stormwater BMP Platform

## 1. Proposed Folder/File Structure

```
/v3/
│
├── index.html                          # Minimal HTML shell — loads modules, no inline JS
├── app.js                              # App entry point: init, routing, state machine
│
├── /data/                              # All data as JSON (not JS). Editable without touching code.
│   ├── bmp-stormwater.json             # Stormwater BMPs only (IDs 1–11B from current bmp-options.js)
│   ├── systems-pv.json                 # PV products (current IDs 12, 15)
│   ├── systems-ancillary.json          # Fall protection, future ancillary (current ID 16)
│   ├── cities.json                     # All city configs (from current city-data.js)
│   ├── regulation-profiles.json        # Regulation profiles (from current regulation-profiles.js)
│   ├── presets.json                    # Site type presets (currently hardcoded in index.html)
│   ├── city-sales-data.json            # Sales talking points (from current city-sales-data.js)
│   └── city-reg-summaries/             # Per-city HTML regulation summaries
│       ├── nyc.html
│       ├── dc.html
│       └── ...
│
├── /schema/
│   └── project.json                    # Project data schema (see Section 2)
│
├── /engine/                            # Calculation layer — no DOM, no UI, pure functions
│   ├── stormwater.js                   # Current engine/model.js (renamed, minor cleanup)
│   ├── pv.js                           # PV calcs (extracted from index.html ~lines 2133+)
│   ├── fall-protection.js              # Fall protection calcs (extracted from index.html)
│   ├── recommend.js                    # Recommendation + ranking logic (extracted from model.js)
│   ├── rules.js                        # Viability rules: blockers, warnings, constraint checks
│   │                                   # (extracted from runStormwaterCalculations in model.js)
│   └── /adapters/
│       ├── base.js                     # Single clean base adapter (deduplicated from current index.js)
│       └── nyc.js                      # NYC-specific adapter (only cities with custom logic get a file)
│
├── /engine/methods/
│   └── nyc-dep-rrv-vv.js              # NYC DEP volumetric method (current file, cleaned up)
│
├── /ui/                                # UI layer — rendering, events, DOM manipulation
│   ├── state.js                        # Project state manager with schema validation
│   ├── render-inputs.js                # Input form rendering (areas, targets, constraints)
│   ├── render-results.js               # Stormwater results table + recommendation
│   ├── render-pv.js                    # PV system results rendering
│   ├── render-ancillary.js             # Fall protection + future systems rendering
│   ├── render-city.js                  # City selector, city page, regulation display
│   ├── render-presets.js               # Preset card rendering + distribution logic
│   └── print.js                        # Print layout logic
│
├── /assets/
│   ├── style.css                       # All CSS (extracted from index.html <style> blocks)
│   └── /images/                        # BMP cross-sections, city headers, system graphics
│       ├── bmp-*.png
│       └── city-*.jpg
│
└── /legacy/                            # Reference copy — not loaded by v3
    └── index-v2.html                   # Current index.html preserved for reference
```

### Key decisions in this structure

**Data as JSON, not JS.**
Current data files are `.js` files that define global constants (`const BMP_OPTIONS_DEFAULT = [...]`). The new structure uses `.json` files loaded via `fetch()`. This means non-developers can edit BMP specs, city configs, or pricing without touching JavaScript. It also makes it possible to swap data sources later (API, database, admin UI) without changing the engine.

**System categories are separate files.**
Currently all 16 "BMPs" live in one array. The `pvOnly: true` flag is a workaround. In v3, stormwater BMPs, PV products, and ancillary systems each have their own data file. The engine loads only what it needs. Adding a new product category (living walls, ballasted solar, etc.) means adding a new JSON file and a calculation module — no changes to existing code.

**Engine stays pure.**
`engine/stormwater.js` is the current `model.js` with minimal changes. The `runModel()` interface stays the same. Blocker/warning logic gets extracted to `rules.js` so rules can be edited independently of calculation math. Recommendation logic gets its own module so you can add sort-by options without touching the capacity calculator.

**UI is modular but still vanilla JS.**
No framework. Each render module owns one section of the page. `state.js` replaces the current `salesModeState` Proxy with a schema-validated state manager. This is the minimum needed to make the UI maintainable without a full rewrite.

**Adapters are deduplicated.**
Current `engine/adapters/index.js` has two IIFEs that both define `CityAdapterBase` and `adaptCityInputs`. Each city file (nyc.js, dc.js, boston.js, etc.) also has two IIFEs doing the same thing. In v3, there's one `base.js` and only cities with actual custom logic get their own file. Cities using the base adapter don't need a file.

---

## 2. Project Data Schema

This is the canonical shape of a project in v3. It extends the current `ProjectInputs` shape (documented in `model.js` lines 8-41) with metadata, soil type, and settings.

```json
{
  "$schema": "project-v3",
  "version": "3.0",

  "meta": {
    "projectId": "",
    "projectName": "",
    "projectAddress": "",
    "clientName": "",
    "clientCompany": "",
    "preparedBy": "",
    "createdDate": "2026-04-06",
    "modifiedDate": "2026-04-06",
    "notes": ""
  },

  "site": {
    "cityKey": "nyc",
    "presetKey": "balanced",
    "soilType": "clay",
    "areas": {
      "perviousLandscapingUsable": 0,
      "imperviousVehicularPavement": 0,
      "imperviousPedestrianPavement": 0,
      "perviousTreeCoverNonUsable": 0,
      "flatDeckOnStructureArea": 0,
      "slopedRoofArea": 0,
      "paversOnStructureArea": 0,
      "imperviousCAUntreated": 0
    },
    "designModeAreas": {
      "totalBuildingSF": 0,
      "totalLandscapeSF": 0,
      "totalParkingSF": 0
    }
  },

  "targets": {
    "retentionNeeded": false,
    "retentionCF": 0,
    "detentionNeeded": false,
    "detentionCF": 0
  },

  "constraints": {
    "hasUndergroundUtilities": false,
    "hasHighWaterTable": false,
    "hasContaminatedSoil": false,
    "hasSiteGradingConstraint": false
  },

  "assumptions": {
    "greenRoofAlreadyInScope": false,
    "programmableSpaceIsHighValue": false,
    "allowSteepSlopeGreenRoof": false
  },

  "settings": {
    "mode": "sales",
    "pricingOverrides": {},
    "enabledSystemCategories": ["stormwater", "pv", "fall-protection"],
    "sortResultsBy": "cost"
  }
}
```

### Schema notes

**`site.areas`** — Identical field names to current `ProjectInputs.areas` in model.js. The engine already expects this exact shape. No translation needed.

**`site.designModeAreas`** — The simplified "design mode" inputs (total building, landscape, parking). These get distributed to `site.areas` using preset logic, same as current tool. Storing both means the UI can switch modes without losing data.

**`site.soilType`** — New field. Currently not a user input — soil retention factors are hardcoded in regulation profiles. In v3, this can optionally override the profile defaults. The engine falls back to profile defaults if not set.

**`targets`** — Same shape as current `ProjectInputs.targets`. Field names match.

**`constraints`** and **`assumptions`** — Same shape as current. Kept separate because they serve different purposes: constraints are physical site conditions, assumptions are design decisions.

**`settings.pricingOverrides`** — Replaces the current localStorage-based admin overrides. Keyed by BMP ID, same as current `overrides` parameter in `runModel()`.

**`settings.enabledSystemCategories`** — Controls which system types to evaluate. Defaults to all. Allows future categories without changing the schema.

**`settings.sortResultsBy`** — New. Currently results sort by BMP ID order. Options: `"cost"`, `"costPerCf"`, `"areaEfficiency"`, `"id"`.

### How this maps to the current engine

The engine's `runModel(project, database)` call stays the same. The adapter layer converts this schema into the `project` object the engine expects:

```
v3 Project Schema                    engine/model.js project param
─────────────────                    ─────────────────────────────
meta.* ─────────────────────────── → (not used by engine, UI-only)
site.cityKey ───────────────────── → project.cityKey
site.areas.* ───────────────────── → project.inputs.areas.*
targets.* ──────────────────────── → project.inputs.targets.*
constraints.* ──────────────────── → project.inputs.constraints.*
assumptions.* ──────────────────── → project.inputs.assumptions.*
settings.pricingOverrides ──────── → project.overrides
```

The mapping is nearly 1:1. The adapter just nests `site.areas`, `targets`, `constraints`, and `assumptions` under `project.inputs`. No calculation changes required.

---

## 3. Reuse / Refactor / Leave Behind

### REUSE AS-IS (copy into v3, minimal changes)

| Current File | v3 Location | What Changes |
|---|---|---|
| `engine/model.js` (525 lines) | `engine/stormwater.js` | Rename file. Remove the IIFE wrapper if using ES modules, or keep it. Zero logic changes. |
| `engine/methods/nyc_dep_rrv_vv_outflow.js` (137 lines) | `engine/methods/nyc-dep-rrv-vv.js` | Rename only. Pure calculation, no dependencies. |
| `data/regulation-profiles.js` (28 lines) | `data/regulation-profiles.json` | Convert JS constant to JSON. Remove `const` wrapper. |
| `images/*` (27+ files) | `assets/images/*` | Move. No changes. |
| City-specific HTML summaries | `data/city-reg-summaries/` | Move. No changes. |
| Product PDFs (`fall-pro-data/`, `pv-*-data/`) | Reference only | Keep in project root. Not loaded by v3 app. |

**Total reusable code: ~690 lines.** The entire calculation engine transfers without modification.

### REFACTOR (extract, clean up, restructure)

| Current Location | What to Extract | v3 Location | Work Required |
|---|---|---|---|
| `engine/adapters/index.js` (160 lines, two duplicate IIFEs) | Base adapter normalization | `engine/adapters/base.js` (~40 lines) | Deduplicate. Keep one `createProjectInputs()` function. Delete the second IIFE. |
| `engine/adapters/nyc.js` (22 lines, two duplicate IIFEs) | NYC adapter | `engine/adapters/nyc.js` (~10 lines) | Deduplicate. Currently just delegates to base — only keep if you plan to add NYC-specific logic. |
| 23 other adapter files (boston.js, dc.js, chicago.js, etc.) | Nothing — they all delegate to base | DELETE | All identical pass-throughs. In v3, cities without custom logic don't need adapter files. |
| `data/bmp-options.js` (120 lines) | Stormwater BMPs (IDs 1–11B) | `data/bmp-stormwater.json` | Split: stormwater systems → `bmp-stormwater.json`, PV → `systems-pv.json`, fall protection → `systems-ancillary.json`. Remove `pvOnly` flag — category is determined by which file the system lives in. |
| `data/city-data.js` (775 lines) | City configs | `data/cities.json` | Convert to JSON. Remove `const CITY_DATA =` wrapper. Structure stays the same. |
| `data/city-sales-data.js` (98 lines) | Sales talking points | `data/city-sales-data.json` | Convert to JSON. |
| `data/city-reg-summaries.js` (933 lines) | Regulation HTML | `data/city-reg-summaries/*.html` | Already mostly HTML strings. Extract each city's HTML to its own file. |
| `index.html` lines ~2133+ | PV calculator logic | `engine/pv.js` | Extract OverEasy + Contec calculation functions. Separate from DOM. ~80 lines of pure calc. |
| `index.html` lines ~2400+ | Fall protection calculator | `engine/fall-protection.js` | Extract DiaSafe anchor calculation. ~40 lines of pure calc. |
| `index.html` blocker/warning logic | Viability rules | `engine/rules.js` | The blocker checks in `runStormwaterCalculations()` (model.js lines 229–321) are already functional. Extract them into a separate `evaluateViability(bmp, inputs, capacity)` function. This is the embryonic rules engine — formalizing it means rules can be edited without touching the capacity math. |
| `index.html` recommendation logic | Ranking | `engine/recommend.js` | Extract the `meetsBoth` filter + sorting logic (model.js lines 352-368) into a standalone function. Add sort-by parameter. |
| `index.html` preset distribution logic | Preset engine | `ui/render-presets.js` | Currently inline in index.html. Extract the 5 preset definitions + the `distributeDesignToEngine()` function. Move preset definitions to `data/presets.json`. |
| `index.html` salesModeState Proxy | State manager | `ui/state.js` | Replace the Proxy-based state with a simple state object that validates against the project schema. Keep localStorage persistence but add JSON export/import. |
| `index.html` ~1400 lines of CSS | Stylesheet | `assets/style.css` | Extract all `<style>` blocks. No logic changes. |

**Total refactor effort: ~2,500 lines of extraction and cleanup.**

### LEAVE BEHIND (stays in V2 legacy, not ported to v3)

| Item | Why Leave It |
|---|---|
| `index.html` as monolithic file (6,574 lines) | Replaced by modular structure. Keep as `legacy/index-v2.html` for reference. |
| `legacy.html` | Already legacy. No value in porting. |
| `salesModeState` Proxy pattern | Clever but brittle. Replaced by schema-validated state in `ui/state.js`. |
| BMP admin editor (hidden textarea + copy-to-clipboard JSON) | Replaced by JSON data files that can be edited directly. A proper admin UI is a Phase 4 item. |
| `BMP_SPEC_LABELS` and `BMP_SPEC_AS_PERCENT` constants | Admin UI helpers. Not needed when data is in JSON files. |
| `BMP_IMAGES` mapping in bmp-options.js | Move image paths into the JSON data files as a field on each system record. |
| Rain drop animation + 2-second delay on "Run Comparison" | Nice touch for demos but doesn't belong in a production tool. Reimplement later if wanted. |
| Leaflet map on landing page | Can be rebuilt later. Not part of core functionality. |
| Duplicate adapter IIFEs | Pure technical debt. Cleaned up in refactor. |
| URL state encoding (`loadStateFromUrl`/`saveStateToUrl`) | Useful but not MVP. Add back in Phase 3. |

---

## 4. Minimum Viable First Build (MVP)

### Goal
A working v3 that loads JSON data, runs the existing stormwater engine, and renders results — using the new folder structure and project schema. No new features. Just the new architecture with existing functionality.

### What the MVP includes

1. **Project schema + state manager** (`schema/project.json` + `ui/state.js`)
   - Defines the canonical project object
   - Loads/saves to localStorage
   - Validates inputs before passing to engine
   - Supports JSON export/import (save project to file, load project from file)

2. **JSON data files** (`data/*.json`)
   - `bmp-stormwater.json` — 12 stormwater BMPs (IDs 1–11B), converted from bmp-options.js
   - `cities.json` — 14 cities, converted from city-data.js
   - `regulation-profiles.json` — 2 profiles, converted from regulation-profiles.js
   - `presets.json` — 5 site type presets, extracted from index.html

3. **Calculation engine** (`engine/`)
   - `stormwater.js` — current model.js, renamed
   - `adapters/base.js` — deduplicated base adapter
   - `methods/nyc-dep-rrv-vv.js` — current NYC method, renamed

4. **Minimal UI** (`ui/` + `index.html`)
   - City selector (dropdown, no map)
   - Area inputs (engineering mode only — skip design mode for MVP)
   - Target inputs (retention CF, detention CF)
   - Constraint checkboxes
   - "Run Comparison" button
   - Results table (same columns as current)
   - Recommendation banner

5. **CSS** (`assets/style.css`)
   - Extracted from index.html
   - Tailwind via CDN (same as current)

### What the MVP does NOT include

- Design mode / preset distribution (Phase 2)
- PV calculator (Phase 2)
- Fall protection calculator (Phase 2)
- Leaflet map (Phase 3)
- Sales talking points / regulation summaries (Phase 2)
- Print layout (Phase 2)
- Admin editor (Phase 4)
- URL state encoding (Phase 3)
- PDF/Excel export (Phase 4)
- Rain animation (never, unless requested)

### Build order

```
Step 1: Create folder structure + JSON data files
        Convert bmp-options.js → bmp-stormwater.json (strip pvOnly items)
        Convert city-data.js → cities.json
        Convert regulation-profiles.js → regulation-profiles.json
        Extract presets from index.html → presets.json
        ~2 hours

Step 2: Set up engine layer
        Copy model.js → engine/stormwater.js (add fetch-based data loading)
        Write engine/adapters/base.js (one clean adapter, ~40 lines)
        Copy nyc_dep method → engine/methods/nyc-dep-rrv-vv.js
        Wire up: app.js loads JSON → builds database object → passes to runModel()
        ~3 hours

Step 3: Build state manager
        Write ui/state.js: createProject(), updateProject(), validateProject()
        Schema validation (check required fields, types, ranges)
        localStorage save/load
        JSON export/import functions
        ~2 hours

Step 4: Build minimal UI
        Write index.html shell (empty sections, script tags)
        Write ui/render-city.js (city dropdown + load city rules)
        Write ui/render-inputs.js (area fields, target fields, constraint checkboxes)
        Write ui/render-results.js (results table + recommendation)
        Wire up "Run Comparison" → adapt inputs → runModel → render results
        ~4 hours

Step 5: Extract and link CSS
        Pull all styles from current index.html
        Save to assets/style.css
        Link in new index.html
        ~1 hour

Step 6: Verify
        Test with known inputs (NYC, 500 SF each area, 100 CF retention, 50 CF detention)
        Compare v3 results to v2 results — must be identical
        Test all 14 cities
        Test constraint blockers
        ~2 hours
```

**Total estimated effort: ~14 hours of focused work.**

### Verification criteria

The MVP is done when:
- v3 produces identical stormwater results to v2 for the same inputs
- All 14 cities load correctly from JSON
- All 12 stormwater BMPs calculate correctly
- Blocker/warning logic matches v2 behavior
- Project state saves to localStorage and survives page reload
- A project can be exported to JSON file and re-imported

### Phase 2 roadmap (after MVP)

- Add design mode + preset distribution
- Add PV calculator module
- Add fall protection calculator module
- Add sales data and regulation summary rendering
- Add print layout
- Add composite BMP analysis (combine two systems to meet targets)

### Phase 3 roadmap

- Strategy recommendation layer (ground vs. roof vs. hybrid)
- Formal ranking with user-selectable sort
- URL state encoding
- City map selector
- Project versioning (schema migration)

### Phase 4 roadmap

- PDF export
- Excel export
- Admin UI for data editing
- New system categories (living walls, ballasted solar, etc.)
