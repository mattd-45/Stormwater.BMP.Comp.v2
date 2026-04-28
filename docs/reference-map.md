# Active Reference Map

Last updated: 2026-04-28

This map identifies paths that should be treated as active until a cleanup batch is approved and verified.

## V3 app shell

Referenced by `v3/index.html`:
- `../images/logo-sempergreen.png`
- `../images/logo-lbg-transparent.png`
- `../images/isometric_architectural_diagram_of_a_single_building.jpeg`
- `../images/image-constraint-underground-utilities.gif`
- `../images/image-constraint-high-water.jpg`
- `../images/image-constraint-contaminated-soil.png`
- `../images/image-constraint-grading.jpg`
- `resources.html`

Referenced scripts from `v3/index.html`:
- `../data/bmp-options.js`
- `../data/regulation-profiles.js`
- `../data/city-data.js`
- `../data/city-reg-summaries.js`
- `../data/roof-layers.js`
- `../data/roof-profiles.js`
- `../data/cost-items.js`
- `../data/cost-adjustments.js`
- `../data/technical-assets.js`
- `../engine/model.js`
- `v3-project-schema.js`
- `v3-adapter.js`
- `state.js`
- `ui-inputs.js`
- `strategy.js`
- `roof-profile-calc.js`
- `pricing-calc.js`
- `run-analysis.js`
- `report-view.js`
- `app.js`
- `flow.js`

## Resources page

Referenced by `v3/resources.html`:
- `../images/logo-sempergreen.png`
- `../images/logo-lbg-transparent.png`
- `index.html`

Referenced by `v3/resources-catalog.js`:
- `../images/logo-purple-roof.png`
- `../images/pv-cover-overeasy-image.png`
- `../images/fallpro-cover-diasafe-line-21-inage.jpg`
- `../../SG-product-guide-2026/source-collateral-for-projects/product-info-purple-roof/index.html`
- External links: Sempergreen website and HydroCAD.

The remaining product collateral entries in `v3/resources-catalog.js` are intentional placeholders with empty `href` values.

## Technical asset registry

Referenced by `data/technical-assets.js`:
- `../images/bmp-detail-bioretention-basin.png`
- `../images/bmp-graphic-underground-passive-cells-graphic.png`
- `../images/bmp-detail-permeable-pavers.png`
- `../images/bmp-detail-underground-tank-and-pump.png`
- `../images/bmp-graphic-blue-roof.png`
- `../images/bmp-graphic-trad-green-roof-6-graphic.png`
- `../images/bmp-graphic-sponge-4-2-graphic.png`
- `../images/bmp-graphic-purple-veg-4-1-2.png`
- `../images/bmp-graphic-purple-veg-4-1-4.png`
- `../images/bmp-graphic-purple-paver-1-2.png`
- `../images/bmp-graphic-purple-paver-1-4.png`
- `../images/site-1-balanced-mixed-use.jpg`
- `../images/site-2-dense-urban.jpg`
- `../images/site-3-landscape-heavy.jpg`
- `../images/site-4-parking-dominant.jpg`
- `../images/site-5-podium-deck.jpg`
- `../images/site-6-big-box.jpg`

## City data references

Referenced by `data/city-data.js`:
- `city-data/NY-New-York-City/nyc-stormwater-overview.html`
- `city-data/NY-New-York-City/IMAGE-NYC-ms4-map.jpg`
- `city-data/MA-Boston/IMAGE-boston.jpg`
- `city-data/PA-Philadelphia/philadelphia-stormwater-overview.html`
- `city-data/TN-Nashville/nashville-stormwater-overview.html`
- `images/IMAGE-washington-dc.jpg`
- `images/IMAGE-chicago.jpg`
- `images/IMAGE-philadelphia.jpg`
- `images/IMAGE-nashville.jpg`
- `images/IMAGE-seattle-wa.jpg`
- `images/IMAGE-columbus-oh.jpg`

Case study PDFs referenced by `data/city-data.js`:
- `project-case-studies/Purple-Roof-case-study-BaltimoreMD-JohnsHopkins-2024.pdf`
- `project-case-studies/Purple-roof-case-study-CambridgeMA-IQHQ-2024.pdf`
- `project-case-studies/Purple-roof-case-study-CharlotteNC-HPEC-2027 internal.pdf`
- `project-case-studies/Purple-Roof-case-study-ColumbusOH-Hilton2.0-2023.pdf`
- `project-case-studies/Purple-Roof-case-study-PrincetonNJ-_SEAS-2024.pdf`
- `project-case-studies/Purple-Roof-case-study-SaratogaSpringsNY-TheModerne-2022p.pdf`
- `project-case-studies/Purple-Roof-case-study-SeattleWA-YeslerTerrace-2024.pdf`

## Legacy image map note

`data/bmp-options.js` still defines `BMP_IMAGES` with legacy image filenames:
- `images/bmp-bioretention-cell.jpg`
- `images/bmp-permeable-pavers.png`
- `images/bmp-trad-green-roof-6.png`
- `images/bmp-sponge-4-2.png`
- `images/bmp-purple-veg-4-1-2.png`
- `images/bmp-purple-veg-4-1-4.png`
- `images/bmp-purple-paver-1-2.png`
- `images/bmp-purple-paver-1-4.png`
- `images/bmp-overeasy-pv-1.jpg`
- `images/bmp-solar-green-roof-2.jpg`
- `images/bmp-diasafe-line-21.jpg`

Several of these filenames are not present in the normalized asset set. The active V3 report/result visuals should be checked against `data/technical-assets.js` before restoring or renaming old assets.
