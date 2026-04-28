# Stormwater Strategy Platform Implementation Notes

Last updated: 2026-04-28

This note turns the strategy-platform roadmap into implementation-ready phases. It preserves the current vanilla HTML/CSS/JavaScript architecture and keeps `engine/model.js` calculation behavior unchanged unless a separate calculation bug is found.

## Baseline Confirmation

Automated gate:
- `npm run check` passes.
- Syntax check passes for 27 JavaScript files.
- Required reference check passes for 57 active references.
- Reference checker reports 13 non-blocking warnings for legacy city icons and case study PDFs still listed in `data/city-data.js`.
- V3 stress test passes 10 of 10 scenarios.
- `v3/v3-standalone-test.html` and `v3/admin-editor-standalone.html` rebuild successfully.

Current flow:
- Canonical user flow is Home -> City -> Local Requirements -> Site -> Conditions -> Targets -> Recommendation.
- The `flow.js` step id for Recommendation is `results`.
- The progress nav already labels the last step "Recommendation".
- `flow.js` still labels the same step internally as "Report"; this should be aligned during Phase 2.

Current mode behavior:
- `body[data-mode="sales"]` hides detailed engineering areas, markup, export, admin controls, and city admin.
- `body[data-mode="engineering"]` shows detailed areas, markup, file/admin utilities, city admin access, debug access, and fuller regulation details.
- Debug toggle appears in Engineering mode or with `?debug=true`.
- Sales users rely on autosave and in-flow controls because the full utility bar is hidden.

Current site type path:
- `PRESETS` in `v3/ui-inputs.js` defines building/landscape/parking templates.
- `ENGINEERING_SPLITS` in `v3/ui-inputs.js` maps those templates into detailed engine area fields.
- `data/technical-assets.js` provides site-type images using `category: 'site-type'` and `related.presetKey`.
- `site.presetKey` is UI state; engine receives the resulting `site.areas` values through the adapter.

Current recommendation/report path:
- `v3/run-analysis.js` reads `V3State`, validates, adapts, runs `engine/model.js`, classifies strategy, resolves pricing, renders results, and generates report HTML.
- `v3/strategy.js` provides narrative classification only; it does not change engine math or ranking.
- Report generation reruns analysis from current state through `generateReportHTML()`.

## Phase 2: Sales/Engineering Visibility Cleanup

Goal: make Sales mode cleaner and Engineering mode explicit without removing any capability.

Implementation status:
- Internal `results` flow label aligned to "Recommendation".
- Mode initialization now preserves saved `engineering` selections and only repairs missing/invalid modes back to `sales`.
- Source visibility rule documented near the mode CSS.

Files likely affected:
- `v3/flow.js`
- `v3/ui-inputs.js`
- `v3/style.css`
- `v3/index.html`
- `v3/app.js`

Implementation sequence:
1. Align the `results` step label in `v3/flow.js` from "Report" to "Recommendation".
2. Confirm whether `ensureSalesModeDefault()` should continue forcing restored projects back to Sales mode. Recommended default: keep Sales as first-load default, but do not overwrite a saved Engineering-mode project after the user explicitly selected Engineering.
3. Create a small visibility map in code comments near the mode CSS or UI mode handler so future edits know which controls belong to each mode.
4. Keep these Sales-hidden unless explicitly changed later: debug panel, admin editor, city admin, markup controls, export JSON, raw schema/project data, detailed engineering area inputs.
5. Keep these Engineering-visible: detailed area inputs, markup controls, admin/editor controls, city admin, debug toggle, raw schema panel, full regulation details.
6. Decide separately whether Sales should get lightweight Save/Load controls. Recommended: defer until after the main strategy flow is stable because autosave already exists.

Testing checklist:
- Switch Sales -> Engineering -> Sales and verify mode-specific controls.
- Reload after selecting Engineering and confirm intended persistence behavior.
- Open with `?debug=true` and verify debug panel access.
- Run analysis in both modes.
- Generate report in both modes.
- Run `npm run check`.

Risk:
- Low to medium. The main risk is hiding controls that are still needed or changing saved mode behavior in a surprising way.

## Phase 3: Site Type Card UI Upgrade

Goal: make site type selection more informative while preserving the existing split math.

Implementation status:
- Added `SITE_TYPE_METADATA` in `v3/ui-inputs.js` keyed to the existing preset ids.
- Enriched site type cards now include planning description, Bldg/Roof/Landscape/Pavement shares, and likely BMP challenge text.
- Percentage displays reuse the same preset fractions used by the area-split math.
- Selected site type now shows a larger summary panel while alternate presets remain available in a compact strip.
- `applySitePreset()` and `_distributeToEngineeringAreas()` behavior is unchanged.

Files likely affected:
- `v3/ui-inputs.js`
- `v3/style.css`
- `data/technical-assets.js`
- Possibly `v3/index.html` if static helper copy is needed.

Implementation sequence:
1. Add a `SITE_TYPE_METADATA` map in `v3/ui-inputs.js` keyed by the existing preset keys.
2. Include for each preset: label, short description, likely BMP challenges, and optional notes.
3. Reuse `_presetFractions()` and `_presetSplitMini()` for building/landscape/parking percentages so the UI cannot drift from the actual math.
4. Extend `_siteTypeTileButtonHtml()` to render:
   - site type name
   - short description
   - building/roof percentage
   - landscape percentage
   - pavement percentage
   - likely BMP challenges
   - image from `data/technical-assets.js`, with graceful fallback
5. Extend the selected-state hero in `_renderSiteTypeTiles()` to show a larger summary for the selected site type while keeping the current strip of alternative presets.
6. Keep `applySitePreset()` and `_distributeToEngineeringAreas()` behavior unchanged.
7. Keep manual detailed area fields Engineering-only.

Testing checklist:
- Select each of the six presets.
- Change total site area and confirm building/landscape/parking plus detailed engineering areas update.
- Reload saved state and confirm selected site type restores.
- Switch Sales/Engineering and confirm manual area fields are only in Engineering.
- Run analysis after each preset.
- Run `npm run check`.

Risk:
- Medium. The card UI touches preset rendering; the highest-risk area is accidental drift between displayed percentages and actual area split math.

## Phase 4: Recommendation Explanation Logic

Goal: add a consultant-style "Why this recommendation?" section without changing engine math.

Implementation status:
- Phase 4 has been split into Phase 4A and Phase 4B to reduce wording risk.
- Phase 4A adds a controlled driver dictionary in `v3/strategy.js` and a review document at `docs/recommendation-explanation-language.md`.
- Phase 4B adds `buildRecommendationExplanation()` in `v3/strategy.js`, using only the controlled dictionary and actual project/result inputs.
- Phase 4B renders a "Why this recommendation?" section after the top recommendation in both screen and report output.
- The explanation remains narrative-only and does not change `engine/model.js`, rankings, viability, or pricing.

Files likely affected:
- `v3/strategy.js`
- `v3/run-analysis.js`
- `v3/v3-project-schema.js` only if new state fields are needed. Current recommendation: avoid schema changes at first.

Available data drivers:
- Constraints: underground utilities, high water table, contaminated soil, grading constraints.
- Assumptions: green roof already in scope, programmable space value, steep slope allowance.
- Site: preset key, soil type, design-mode area split, detailed area distribution.
- Targets: retention needed/CF, detention needed/CF, source notes.
- City: regulation profile, local summaries, climate/default assumptions.
- Results: top pick, viable/blocked systems, retention/detention percentages, warnings.
- Pricing: direct cost, sell total, roof profile pricing, markup settings.

Implementation sequence:
1. Add a pure narrative builder, preferably in `v3/strategy.js`, such as `buildRecommendationExplanation(project, topPick, viable, results, context)`.
2. Return structured output, not raw HTML:
   - title
   - summary paragraph
   - driver bullets
   - cautions/confirmation needs
   - cost/constructability notes
3. In `v3/run-analysis.js`, call the builder after top pick/ranking are known.
4. Render a new "Why this recommendation?" section near the top recommendation in Sales and Engineering.
5. Keep wording technical and planning-oriented:
   - "The recommendation is influenced by..."
   - "This should be confirmed by the civil engineer/AHJ..."
   - Avoid claims that the narrative changed the ranking.
6. Add clear fallback text when no viable BMP exists or no top pick is available.

Testing checklist:
- Run one scenario per active constraint.
- Test poor infiltration soils.
- Test roof-heavy and ground-heavy site types.
- Test retention-only, detention-only, and dual target cases.
- Confirm recommendation order does not change when explanation renders.
- Run `npm run check`.

Risk:
- Medium. Main risk is misleading prose. Keep the builder tied to actual fields and visible engine output.

## Phase 5: Report Output Upgrade

Goal: make generated reports read like a clear planning memo.

Implementation status:
- Report generation now adds a report-only planning memo before the reused analysis sections.
- Reports surface populated `targets.retentionSourceNote` and `targets.detentionSourceNote` in a dedicated target source notes section.
- Reports now include a recommended next steps section focused on civil engineer/AHJ confirmation, site constraints, structural/roof coordination, and final calculations.
- Embedded report CSS was updated for the new memo sections and the Phase 4 recommendation explanation cards.

Files likely affected:
- `v3/run-analysis.js`
- `v3/report-view.js`
- Possibly `v3/style.css` later if report styling is consolidated.

Implementation sequence:
1. Reuse the Phase 4 explanation output in report mode.
2. Add or refine report sections:
   - project summary
   - jurisdiction context
   - site assumptions
   - constraints
   - stormwater targets
   - BMP recommendation
   - why the recommendation was made
   - cost/constructability notes
   - next steps requiring civil engineer or AHJ confirmation
3. Surface `targets.retentionSourceNote` and `targets.detentionSourceNote` when populated.
4. Keep Sales reports client-safe and Engineering reports more detailed.
5. Avoid duplicating the same narrative in multiple sections.

Testing checklist:
- Generate report after a fresh analysis.
- Generate report after changing city/targets and rerunning analysis.
- Confirm print preview is readable.
- Confirm logos and report styling still load.
- Confirm no stale result appears after state changes.
- Run `npm run check`.

Risk:
- Medium. Main risks are report layout regressions and divergence between screen results and report output.

## Phase 6: Visual Polish

Goal: make the platform feel polished, professional, technical, and non-salesy after content structure is stable.

Files likely affected:
- `v3/style.css`
- `v3/index.html`
- `v3/run-analysis.js`
- `v3/resources.html` only if secondary-page alignment is needed.

Implementation sequence:
1. Refine home screen hierarchy and keep the workflow clear.
2. Tighten step heading rhythm and explanatory copy.
3. Improve card spacing, button grouping, and selected states.
4. Improve results section hierarchy around top recommendation, why explanation, observations, and next steps.
5. Check responsive behavior at narrow widths.
6. Check report preview/print styling after screen polish.

Testing checklist:
- Full guided flow on desktop.
- Full guided flow on narrow viewport.
- Sticky header/progress scrolling.
- Sales and Engineering mode screenshots.
- Resources page visual pass.
- Report print preview.
- Run `npm run check`.

Risk:
- Low to medium. Visual changes can still affect sticky offsets, responsive wrapping, and report readability.

## Recommended Implementation Order

1. Phase 2 minimal cleanup: label alignment and mode persistence decision.
2. Phase 3 site type card upgrade.
3. Phase 4 recommendation explanation builder and screen rendering.
4. Phase 5 report output upgrade using the same explanation data.
5. Phase 6 visual polish after content and behavior are stable.

## Quality Standard

Every code phase should end with:
- `npm run check`
- targeted browser checks from `docs/qa-checklist.md`
- a short note in the change summary describing any remaining warnings
