// ═══════════════════════════════════════════════════════════════════════
// TECHNICAL ASSET LIBRARY — v3
// ═══════════════════════════════════════════════════════════════════════
//
// Lightweight file-based asset registry for technical images used by:
// - v3 results view (optional thumbnails)
// - v3 report view (optional technical visuals)
//
// Suggested folder structure (gradual migration target):
// images/technical/
//   bmp/
//   roof-profiles/
//   systems/
//   appendix/
//
// For now, this registry references existing files in images/.

const TECHNICAL_ASSETS = [
  {
    id: 'asset-bmp-1-bioretention',
    title: 'Bioretention Basin Detail',
    category: 'bmp-diagram',
    filePath: '../images/bmp-detail-bioretention-basin.png',
    related: { bmpId: '1', profileId: null, systemId: 'stormwater' },
    caption: 'Bioretention basin technical detail.',
    hoverDescription: 'Typical bioretention section with media and drainage layers.',
    active: true
  },
  {
    id: 'asset-bmp-2-underground-cells',
    title: 'Underground Cells / Crates',
    category: 'bmp-diagram',
    filePath: '../images/bmp-graphic-underground-passive-cells-graphic.png',
    related: { bmpId: '2', profileId: null, systemId: 'stormwater' },
    caption: 'Modular underground stormwater cells/crates (passive system).',
    hoverDescription: 'Graphic reference for underground cells/crates.',
    active: true
  },
  {
    id: 'asset-bmp-3-pavers',
    title: 'Permeable Pavers Detail',
    category: 'bmp-diagram',
    filePath: '../images/bmp-detail-permeable-pavers.png',
    related: { bmpId: '3', profileId: null, systemId: 'stormwater' },
    caption: 'Permeable paver section and drainage assembly.',
    hoverDescription: 'Pedestrian/vehicular paver system detail.',
    active: true
  },
  {
    id: 'asset-bmp-4-tank',
    title: 'Underground Tank Detail',
    category: 'bmp-diagram',
    filePath: '../images/bmp-detail-underground-tank-and-pump.png',
    related: { bmpId: '4', profileId: null, systemId: 'stormwater' },
    caption: 'Underground tank and pump arrangement.',
    hoverDescription: 'Typical below-grade storage and controlled discharge concept.',
    active: true
  },
  {
    id: 'asset-bmp-5-tank',
    title: 'Underground Tank Detail',
    category: 'bmp-diagram',
    filePath: '../images/bmp-detail-underground-tank-and-pump.png',
    related: { bmpId: '5', profileId: null, systemId: 'stormwater' },
    caption: 'Underground tank and pump arrangement.',
    hoverDescription: 'Typical below-grade storage and controlled discharge concept.',
    active: true
  },
  {
    id: 'asset-bmp-6-tank',
    title: 'Underground Tank Detail',
    category: 'bmp-diagram',
    filePath: '../images/bmp-detail-underground-tank-and-pump.png',
    related: { bmpId: '6', profileId: null, systemId: 'stormwater' },
    caption: 'Underground tank and pump arrangement.',
    hoverDescription: 'Typical on-structure or below-grade tank storage concept.',
    active: true
  },
  {
    id: 'asset-bmp-7-blue-roof',
    title: 'Blue Roof',
    category: 'bmp-diagram',
    filePath: '../images/bmp-graphic-blue-roof.png',
    related: { bmpId: '7', profileId: null, systemId: 'stormwater' },
    caption: 'Blue roof detention cells (conceptual section).',
    hoverDescription: 'Graphic reference for blue roof passive detention.',
    active: true
  },
  {
    id: 'asset-profile-trad-gr-6',
    title: 'Traditional Green Roof',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-trad-green-roof-6-graphic.png',
    related: { bmpId: '8', profileId: 'trad-gr-6', systemId: 'stormwater' },
    caption: 'Traditional green roof profile (6 in media class).',
    hoverDescription: 'Reference profile image used with roof profile output.',
    active: true
  },
  {
    id: 'asset-profile-sponge-42',
    title: 'Sponge Roof Profile',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-sponge-4-2-graphic.png',
    related: { bmpId: '9', profileId: 'sponge-42', systemId: 'stormwater' },
    caption: 'Sponge roof profile reference image.',
    hoverDescription: 'High detention roof-profile concept.',
    active: true
  },
  {
    id: 'asset-profile-pr-veg-412',
    title: 'Purple Roof Vegetative (4+1+2)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-veg-4-1-2.png',
    related: { bmpId: '10', profileId: 'pr-veg-412', systemId: 'stormwater' },
    caption: 'Purple roof vegetative profile 4+1+2.',
    hoverDescription: 'Profile cross-section for vegetative variant.',
    active: true
  },
  {
    id: 'asset-profile-pr-veg-414',
    title: 'Purple Roof Vegetative (4+1+4)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-veg-4-1-4.png',
    related: { bmpId: '10B', profileId: 'pr-veg-414', systemId: 'stormwater' },
    caption: 'Purple roof vegetative profile 4+1+4.',
    hoverDescription: 'Profile cross-section for deeper vegetative variant.',
    active: true
  },
  {
    id: 'asset-profile-pr-veg-411',
    title: 'Purple Roof Vegetative (4+1+1)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-veg-4-1-1.png',
    related: { bmpId: '10C', profileId: 'pr-veg-411', systemId: 'stormwater' },
    caption: 'Purple roof vegetative profile 4+1+1.',
    hoverDescription: 'Profile cross-section for shallow honeycomb vegetative variant.',
    active: true
  },
  {
    id: 'asset-profile-pr-veg-413',
    title: 'Purple Roof Vegetative (4+1+3)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-veg-4-1-3.png',
    related: { bmpId: '10D', profileId: 'pr-veg-413', systemId: 'stormwater' },
    caption: 'Purple roof vegetative profile 4+1+3.',
    hoverDescription: 'Profile cross-section for mid-depth honeycomb vegetative variant.',
    active: true
  },
  {
    id: 'asset-profile-pr-pav-p12',
    title: 'Purple Roof Paver (1+2)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-paver-1-2.png',
    related: { bmpId: '11', profileId: 'pr-pav-p12', systemId: 'stormwater' },
    caption: 'Purple roof paver profile 1+2.',
    hoverDescription: 'Paver profile variant with lighter section.',
    active: true
  },
  {
    id: 'asset-profile-pr-pav-p14',
    title: 'Purple Roof Paver (1+4)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-paver-1-4.png',
    related: { bmpId: '11B', profileId: 'pr-pav-p14', systemId: 'stormwater' },
    caption: 'Purple roof paver profile 1+4.',
    hoverDescription: 'Paver profile variant with deeper section.',
    active: true
  },
  {
    id: 'asset-profile-pr-pav-p11',
    title: 'Purple Roof Paver (1+1)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-paver-1-1.png',
    related: { bmpId: '11C', profileId: 'pr-pav-p11', systemId: 'stormwater' },
    caption: 'Purple roof paver profile 1+1.',
    hoverDescription: 'Paver profile variant with shallow honeycomb.',
    active: true
  },
  {
    id: 'asset-profile-pr-pav-p13',
    title: 'Purple Roof Paver (1+3)',
    category: 'roof-profile',
    filePath: '../images/bmp-graphic-purple-paver-1-3.png',
    related: { bmpId: '11D', profileId: 'pr-pav-p13', systemId: 'stormwater' },
    caption: 'Purple roof paver profile 1+3.',
    hoverDescription: 'Paver profile variant with mid-depth honeycomb.',
    active: true
  },
  {
    id: 'asset-site-balanced',
    title: 'Balanced Mixed-Use',
    category: 'site-type',
    filePath: '../images/site-1-balanced-mixed-use.jpg',
    related: { bmpId: null, profileId: null, systemId: 'stormwater', presetKey: 'balanced' },
    caption: 'Balanced mixed-use site context.',
    hoverDescription: 'Preset visual for balanced mixed-use site allocation.',
    active: true
  },
  {
    id: 'asset-site-dense-urban',
    title: 'Dense Urban',
    category: 'site-type',
    filePath: '../images/site-2-dense-urban.jpg',
    related: { bmpId: null, profileId: null, systemId: 'stormwater', presetKey: 'dense-urban' },
    caption: 'Dense urban site context.',
    hoverDescription: 'Preset visual for dense urban site allocation.',
    active: true
  },
  {
    id: 'asset-site-campus',
    title: 'Campus / Landscape-Heavy',
    category: 'site-type',
    filePath: '../images/site-3-landscape-heavy.jpg',
    related: { bmpId: null, profileId: null, systemId: 'stormwater', presetKey: 'campus' },
    caption: 'Campus and landscape-heavy site context.',
    hoverDescription: 'Preset visual for campus-style allocations.',
    active: true
  },
  {
    id: 'asset-site-parking-dominant',
    title: 'Parking-Dominant',
    category: 'site-type',
    filePath: '../images/site-4-parking-dominant.jpg',
    related: { bmpId: null, profileId: null, systemId: 'stormwater', presetKey: 'parking-dominant' },
    caption: 'Parking-dominant site context.',
    hoverDescription: 'Preset visual for parking-heavy sites.',
    active: true
  },
  {
    id: 'asset-site-podium',
    title: 'Podium / Structured Deck',
    category: 'site-type',
    filePath: '../images/site-5-podium-deck.jpg',
    related: { bmpId: null, profileId: null, systemId: 'stormwater', presetKey: 'podium' },
    caption: 'Podium / structured deck site context.',
    hoverDescription: 'Preset visual for podium and deck-oriented projects.',
    active: true
  },
  {
    id: 'asset-site-6-big-box',
    title: 'Big Box Retail',
    category: 'site-type',
    filePath: '../images/site-6-big-box.jpg',
    related: {
      bmpId: null,
      profileId: null,
      systemId: 'stormwater',
      presetKey: 'big-box-retail',
      siteTypeId: 'site-6'
    },
    caption: 'Big box retail site context.',
    hoverDescription: 'Preset visual for large-format retail and surface parking.',
    active: true
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TECHNICAL_ASSETS };
}
if (typeof window !== 'undefined') {
  window.TECHNICAL_ASSETS = TECHNICAL_ASSETS;
}
