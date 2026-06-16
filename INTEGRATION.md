# Purple Roof Simulator — Integration Contract

Last updated: 2026-06-04

This document describes the query-parameter contract used when the Stormwater BMP Comparison Tool opens the [Purple Roof Simulator](https://purple-roof-simulator.com/roof-simulator.html) in a new tab (TR-20 handoff).

---

## Entry Point

**TR-20 (active):**

```
https://purple-roof-simulator.com/roof-simulator.html
```

**SWMM continuous simulation:** not yet available. The launch button shows a "coming soon" message when SWMM is selected.

---

## Query Parameters

All parameters are built with `URLSearchParams`. Never concatenate raw strings.

### From this tool (dynamic)

| Param | Type    | Required | Source |
|-------|---------|----------|--------|
| `lat` | decimal | Yes      | City `coords.lat` or user edit; sent as 6 decimal places (e.g. `40.712800`). |
| `lon` | decimal | Yes      | City `coords.lon` or user edit; 6 decimal places. |
| `gr`  | integer | Yes      | Green roof area (SF): `flatDeckOnStructureArea + slopedRoofArea`, or user edit. |
| `pv`  | integer | No       | Paver system area (SF): `paversOnStructureArea`. Defaults to `0` if none. |
| `cf`  | integer | No       | Contributing area (SF). Handoff form; default untreated CA or `1000`. |
| `tc`  | decimal | No       | Time of concentration (min). Handoff form; default `6`. |
| `sd`  | integer | Yes*     | Soil depth (in). Assembly preset; user may override in handoff form. |
| `wd`  | integer | Yes*     | Mineral wool depth (in). Assembly preset; user may override. |
| `hd`  | integer | Yes*     | Honeycomb depth (in). Assembly preset; user may override. |
| `sp`  | decimal | Yes*     | Soil porosity from assembly preset. |
| `wp`  | decimal | Yes*     | Mineral wool porosity from assembly preset. |
| `hp`  | decimal | Yes*     | Honeycomb porosity from assembly preset. |
| `pn`  | string  | No       | `projectInfo.projectName`, max 100 characters. Omitted if empty. |
| `nb`  | integer | Yes      | Number of roof drains — entered on results CTA before launch. |
| `bw`  | decimal | Yes      | Orifice width per drain (in). Default **24**; user may override (app shows info warning if not 24). |

\* Layer params are set when `assemblyId` matches `ASSEMBLY_PRESETS`.

### TR-20 defaults (static, from production handoff sample)

These are applied from `PURPLE_ROOF_SIMULATOR_DEFAULTS` in `v3/run-analysis.js` and overridden only where noted above.

| Param | Default | Notes |
|-------|---------|--------|
| `th` | `l` | Units / theme flag (USA layout). |
| `tc` | `6` | Time of concentration (min); overridden when set in handoff form. |
| `oh` | `0.2` | Orifice height (in). |
| `oc` | `0.07` | Orifice coefficient. |
| `st` | `3.5` | Storage-related default. |
| `du` | `24` | Storm duration (h). |
| `ca` | `120` | Chicago / IDF coefficient *a*. |
| `cb` | `13` | Chicago / IDF coefficient *b*. |
| `cc` | `0.786` | Chicago / IDF coefficient *c*. |
| `cr` | `0.35` | Peak fraction *r*. |
| `ch` | `2` | Hyetograph parameter. |
| `rain` | `0` | Rainfall depth override (0 = use Atlas fetch). |
| `ds` | `t2` | Design storm: SCS 24-hr Type 2. |

Reference sample URL (NYC, vegetated 4+1+2):

```
https://purple-roof-simulator.com/roof-simulator.html?th=l&gr=36576&cf=1000&pv=200&tc=6&sd=4&sp=0.53&wd=1&wp=0.93&hd=2&hp=0.95&nb=5&bw=24&oh=0.2&oc=0.07&st=3.5&du=24&ca=120&cb=13&cc=0.786&cr=0.35&ch=2&rain=0&lat=40.712800&lon=-74.006000&pn=test&ds=t2
```

---

## Assembly Presets

| BMP ID | Assembly Name                 | sd | wd | hd | sp   | wp   | hp   |
|--------|-------------------------------|----|----|----|------|------|------|
| `10`   | Purple-Roof (Vegetated) 4+1+2 | 4  | 1  | 2  | 0.53 | 0.93 | 0.95 |
| `10C`  | Purple-Roof (Vegetated) 4+1+1 | 4  | 1  | 1  | 0.53 | 0.93 | 0.95 |
| `10D`  | Purple-Roof (Vegetated) 4+1+3 | 4  | 1  | 3  | 0.53 | 0.93 | 0.95 |
| `10B`  | Purple-Roof (Vegetated) 4+1+4 | 4  | 1  | 4  | 0.53 | 0.93 | 0.95 |
| `11`   | Purple-Roof (Pavers) P+1+2    | 0  | 1  | 2  | 0.53 | 0.93 | 0.95 |
| `11C`  | Purple-Roof (Pavers) P+1+1    | 0  | 1  | 1  | 0.53 | 0.93 | 0.95 |
| `11D`  | Purple-Roof (Pavers) P+1+3    | 0  | 1  | 3  | 0.53 | 0.93 | 0.95 |
| `11B`  | Purple-Roof (Pavers) P+1+4    | 0  | 1  | 4  | 0.53 | 0.93 | 0.95 |

---

## Example URLs

**Philadelphia** — 55,750 SF green roof, assembly 4+1+2 (unit test):

```
https://purple-roof-simulator.com/roof-simulator.html?...&lat=39.952600&lon=-75.165200&gr=55750&sd=4&wd=1&hd=2&ds=t2
```

(Query string includes full default set; key values above.)

---

## Source Function

`window.V3RunAnalysis.buildPurpleRoofSimulatorUrl(opts)` in `v3/run-analysis.js`.

```javascript
{
  lat:                  number,   // decimal degrees
  lon:                  number,
  greenRoofAreaSqFt:    number,   // gr (or use roofAreaSqFt alias)
  paverAreaSqFt:        number,   // pv; optional
  contributingAreaSqFt: number,   // cf; optional, default 1000
  timeOfConcentrationMin: number, // tc; optional, default 6
  layerProfile:         object,   // { sd, wd, hd, sp, wp, hp } overrides assembly depths
  assemblyId:           string,   // '10', '10C', '10D', '10B', '11', '11C', '11D', '11B'
  projectName:          string,   // pn; optional
  drainboxCount:        number,   // nb; optional; planner UI defaults to ceil(roof SF / 1500), min 1
  orificeWidthIn:       number    // bw; optional, default 24
}
```

Planner results step collects all simulator-visible inputs (location, assembly, areas, profile depths, drainboxes) before launch. Values are saved on `settings.purpleRoofHandoff` when opening the simulator.

### Layer right-sizing (Planning hero)

For Purple-Roof vegetated, paver, and Sponge roof heroes, `pickRecommended` runs a depth search (within `data/roof-layers.js` bounds) using `EngineStormwater.calculateCapacity`. The hero label reflects optimized depths (e.g. **4+1+2**), not necessarily the deepest catalog SKU. Discrete BMP IDs (`10`, `10C`, `10B`, …) remain for the ranked table; the optimizer only updates the highlighted pick and simulator handoff (`layerProfile` / `layerDepths`).

In **Engineering** mode, edited simulator layer depths are saved on `settings.purpleRoofHandoff` and refresh Step 6 (debounced re-run).

Unit-tested via `npm run check:stress`.

---

## Launch Behaviour

- **TR-20:** `window.open(url, '_blank', 'noopener,noreferrer')`
- **SWMM:** inline "coming soon"; no tab
- Missing or invalid lat/lon: inline error; no tab
- Missing or invalid roof drain count (`nb`) or orifice width (`bw`): inline error; no tab
- `bw` not equal to 24: inline info warning; simulator still opens with entered value

---

## Not Implemented

- postMessage / iframe
- SWMM deep links
- Return handoff from simulator to this tool
