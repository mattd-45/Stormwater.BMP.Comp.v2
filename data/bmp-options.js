// ═══════════════════════════════════════════════════════════════════════
// BMP OPTIONS — master library of stormwater BMP systems
// ═══════════════════════════════════════════════════════════════════════
// Global, city-independent. Each entry defines a BMP system with:
//   id        — unique identifier
//   name      — display name
//   areaType  — which surface category this BMP applies to
//   unitPrice — cost per SF
//   specs     — depths, porosity, void ratios, etc.
//   extra     — optional pricing/comparison metadata
//   pvOnly    — true if this is a PV/ancillary system, not a stormwater BMP
//
// To add a new BMP: add an entry to the array below.
// ═══════════════════════════════════════════════════════════════════════

const BMP_OPTIONS_DEFAULT = [
  { id: 1, name: "Bioretention Cell (at grade)", areaType: 'atGrade_pervious', unitPrice: 75, specs: { freeboard: 18, soilDepth: 24, soilPorosity: 0.15, gravelDepth: 24, gravelPorosity: 0.50, spaceLoss: 0.20 } },
  { id: 2, name: "Underground Cells / Crates", areaType: 'atGrade_combined', unitPrice: 100, specs: { storageDepth: 36, voidRatio: 0.95, freeboard: 6, spaceLoss: 0.15 } },
  { id: 3, name: "Permeable Pavers", areaType: 'atGrade_ped', unitPrice: 155, specs: { reservoirDepth: 18, voidRatio: 0.40, spaceLoss: 0.10 } },
  { id: 4, name: "Below Grade Tank (Dead Space)", areaType: 'atGrade_landscape_veh', unitPrice: 1200, specs: { detentionDepth: 72, freeboard: 24, spaceLoss: 0.15 } },
  { id: 5, name: "Below Grade Tank (Usable Space)", areaType: 'atGrade_landscape_veh', unitPrice: 1500, specs: { detentionDepth: 72, freeboard: 24, spaceLoss: 0.20 } },
  { id: 6, name: "On-Structure Tank (Usable Space)", areaType: 'on_structure_tank', unitPrice: 1500, specs: { detentionDepth: 72, freeboard: 24, spaceLoss: 0.15 } },
  { id: 7, name: "Blue Roof Cells 6\"", areaType: 'flatDeck_strict', unitPrice: 75, specs: { storageDepth: 3, voidRatio: 0.95, freeboard: 0, spaceLoss: 0.05 } },
  // Green roof media options – include explicit soilPorosity (credited retention) and NMW retention where applicable
  { id: 8, name: "Traditional Green Roof 6\"", areaType: 'sloped_roof', unitPrice: 30, specs: { mediaDepth: 4, soilPorosity: 0.20, detLayerDepth: 0, detVoidRatio: 0.95, spaceLoss: 0.05 } },
  { id: 9, name: "Sponge Roof 4+2", areaType: 'sloped_roof', unitPrice: 28.39, specs: { mediaDepth: 4, soilPorosity: 0.20, nmwDepth: 2, nmwRetentionPct: 0.40, spaceLoss: 0.05 } },
  { id: 10, name: "Purple-Roof (Vegetated) 4+1+2", areaType: 'sloped_roof_or_flat_deck', unitPrice: 35.87, specs: { soilDepth: 4, soilPorosity: 0.20, nmwDepth: 1, nmwPorosity: 0.93, nmwRetentionPct: 0.40, hcDepth: 2, hcVoidRatio: 0.95, dlDepth: 0.2, dlPorosity: 0.93, spaceLoss: 0.05 }, extra: { pricingMode: 'black', pricingUpgrade: 15, pricingBase: 40 } },
  { id: '10B', name: "Purple-Roof (Vegetated) 4+1+4", areaType: 'sloped_roof_or_flat_deck', unitPrice: 43.72, specs: { soilDepth: 4, soilPorosity: 0.20, nmwDepth: 1, nmwPorosity: 0.93, nmwRetentionPct: 0.40, hcDepth: 4, hcVoidRatio: 0.95, dlDepth: 0.2, dlPorosity: 0.93, spaceLoss: 0.05 }, extra: { pricingMode: 'black', pricingUpgrade: 22.85, pricingBase: 47.85 } },
  { id: 11, name: "Purple-Roof (Pavers) P+1+2", areaType: 'pavers_or_sloped_or_flat_deck', unitPrice: 38.79, specs: { hcDepth: 2, hcVoidRatio: 0.95, nmwDepth: 1, nmwRetentionPct: 0.40, spaceLoss: 0.05 }, extra: { tradPaverBasePrice: 22.82 } },
  { id: '11B', name: "Purple-Roof (Pavers) P+1+4", areaType: 'pavers_or_sloped_or_flat_deck', unitPrice: 47.47, specs: { hcDepth: 4, hcVoidRatio: 0.95, nmwDepth: 1, nmwRetentionPct: 0.40, spaceLoss: 0.05 }, extra: { tradPaverBasePrice: 22.82 } },
  { id: 12, name: "OverEasy xM3-256", areaType: 'sloped_roof_or_flat_deck', unitPrice: 14.82, pvOnly: true, specs: { sfPerUnit: 45, kwPerUnit: 0.256, kwhPerUnitBase: 300, pricePerUnit: 667, spaceLoss: 0.05 } },
  {
    id: 15,
    name: "Contec Greenlite Pro 4mm base plate + rails",
    areaType: 'pavers_or_sloped_or_flat_deck',
    unitPrice: 370,
    pvOnly: true,
    specs: {
      format: 'Landscape',
      rowSpacingIn: 36,
      sfPerUnit: 41.21,
      kwPerUnit: 0.40,
      kwhPerUnitBase: 520,
      pricePerUnit: 370,
      spaceLoss: 0.05
    }
  },
  {
    id: 16,
    name: "Diadem Line 21 fall protection anchor",
    areaType: 'sloped_roof_or_flat_deck',
    unitPrice: 1000,
    pvOnly: true,
    specs: {
      lfPerAnchor: 25,
      anchorsPerCorner: 1,
      spaceLoss: 0
    }
  }
];

// Friendly labels for BMP spec fields (used by admin editor)
const BMP_SPEC_LABELS = {
  freeboard: 'Freeboard (in.)',
  soilDepth: 'Soil depth (in.)',
  soilPorosity: 'Soil porosity (%)',
  retentionFactorPct: 'Soil retention factor (%)',
  gravelDepth: 'Gravel depth (in.)',
  gravelPorosity: 'Gravel porosity (%)',
  spaceLoss: 'Space loss (%)',
  storageDepth: 'Storage depth (in.)',
  voidRatio: 'Void ratio (%)',
  reservoirDepth: 'Reservoir depth (in.)',
  detentionDepth: 'Detention depth (in.)',
  mediaDepth: 'Media depth (in.)',
  detLayerDepth: 'Detention layer depth (in.)',
  detVoidRatio: 'Detention void ratio (%)',
  nmwDepth: 'Mineral wool depth (in.)',
  nmwPorosity: 'NMW porosity (%)',
  nmwRetentionPct: 'NMW retention (%)',
  hcDepth: 'Honeycomb depth (in.)',
  hcVoidRatio: 'Honeycomb void ratio (%)',
  dlDepth: 'Drainage layer depth (in.)',
  dlPorosity: 'Drainage layer porosity (%)',
  format: 'Module orientation',
  rowSpacingIn: 'Row spacing (in.)',
  kwPerBase: 'Output per base (kW)',
  lfPerAnchor: 'LF per anchor',
  anchorsPerCorner: 'Anchors per corner',
  packingFactor: 'Packing factor (0–1)',
  minAreaSF: 'Minimum area (SF)',
  deadDepthIn: 'Dead storage depth (in.)',
  sfPerUnit: 'SF per unit',
  kwPerUnit: 'DC kW per unit',
  kwhPerUnitBase: 'Base kWh/yr per unit',
  pricePerUnit: 'Price per unit ($)'
};

// Spec keys stored as 0–1 in data but shown as 0–100% in the admin form
const BMP_SPEC_AS_PERCENT = new Set(['soilPorosity', 'gravelPorosity', 'spaceLoss', 'voidRatio', 'detVoidRatio', 'nmwPorosity', 'nmwRetentionPct', 'hcVoidRatio', 'dlPorosity', 'retentionFactorPct']);

// BMP card images (keyed by BMP id)
const BMP_IMAGES = {
  1: 'images/IMAGE-bioretention-cell.jpg',
  2: 'images/IMAGE-underground-passive-cells.png',
  3: 'images/IMAGE-perm-pavers.png',
  4: 'images/IMAGE-underground tank and pump.png',
  5: 'images/IMAGE-underground tank and pump.png',
  6: 'images/IMAGE-underground tank and pump.png',
  7: 'images/IMAGE-blue-roof.png',
  8: 'images/IMAGE-trad-green-roof-6.png',
  9: 'images/IMAGE-sponge4+2.png',
  10: 'images/IMAGE-purple-veg-4+1+2.png',
  '10B': 'images/IMAGE-purple-veg-4+1+4.png',
  11: 'images/IMAGE-purple-paver+1+2.png',
  '11B': 'images/IMAGE-purple-paver+1+4.png',
  12: 'images/IMAGE-overeasy-pv-1.jpg',
  15: 'images/solar_green_roof-2.jpg',
  16: 'images/IMAGE-Diasafe_line-21.jpg'
};
