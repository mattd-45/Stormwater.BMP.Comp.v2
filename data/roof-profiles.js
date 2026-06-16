// ═══════════════════════════════════════════════════════════════════════
// ROOF PROFILES — predefined roof assembly configurations
// ═══════════════════════════════════════════════════════════════════════
//
// Each profile defines a complete roof assembly as an ordered stack of
// layers (bottom to top). Layers reference ROOF_LAYERS by id.
// Profiles can override the default thickness of adjustable layers.
//
// This is a DATA MODEL ONLY. No calculations happen here.
// A future profile calculator will iterate the layer stack, look up
// each layer in ROOF_LAYERS, apply the profile's thickness overrides,
// and sum up weight, cost, retention, and detention.
//
// ── Field reference ─────────────────────────────────────────────────
//
//   id              Unique string identifier (kebab-case)
//   name            Display name
//   shortName       Abbreviated name for tables / compact views
//   profileCategory One of: traditional, purple-roof, paver-purple
//   systemType      Which BMP system this profile corresponds to.
//                   Maps to bmp-options.js id for cross-reference.
//                   null if no direct BMP match.
//   description     1-2 sentence summary of the assembly
//   assumptions     Key assumptions or caveats for this profile
//
//   layers          Ordered array (bottom → top) of layer references:
//     layerId       References ROOF_LAYERS[].id
//     depthIn       Thickness for this layer in this profile (inches).
//                   Overrides the layer's defaultDepthIn.
//                   For fixed layers, use the layer's defaultDepthIn.
//     fixed         true if this layer's depth cannot be changed in
//                   this profile (even if the layer is adjustable).
//                   false or omitted if the user can adjust it.
//
//   totalDepthIn    Pre-calculated total assembly depth (inches).
//                   Informational — a calculator should recompute this
//                   from layers. Included here for quick reference.
//
//   resourceLinks   Placeholder object for future links to spec sheets,
//                   detail drawings, installation guides, etc.
//                   Structure: { specSheet: null, detailDrawing: null,
//                   installGuide: null }
//
// ── Relationship to bmp-options.js ──────────────────────────────────
//
//   systemType links a profile to its BMP engine entry:
//     'trad-gr-6'   → BMP id 8  (Traditional Green Roof 6")
//     'pr-veg-412'  → BMP id 10 (Purple-Roof Vegetated 4+1+2)
//     'pr-veg-414'  → BMP 10B   (Purple-Roof Vegetated 4+1+4)
//     'pr-pav-p12'  → BMP id 11 (Purple-Roof Pavers P+1+2)
//
//   The engine handles stormwater volume calcs. The profile calculator
//   handles weight, cost, and physical layer breakdown — complementary
//   views of the same system.
//
// ── Stack order convention ──────────────────────────────────────────
//
//   Layers are listed bottom to top:
//     1. protection-mat      (on membrane)
//     2. drainage-layer      (if present)
//     3. honeycomb-detention (if present)
//     4. mineral-wool        (if present)
//     5. extensive-media     (if present)
//     6. sedum-mat / pavers  (top)
//
// ═══════════════════════════════════════════════════════════════════════

const ROOF_PROFILES = [

  // ── 1. Traditional Green Roof 6" ──────────────────────────────────
  //
  // Baseline extensive green roof. Soil media + vegetation only.
  // No mineral wool, no honeycomb. Retention only — no detention.
  // Maps to BMP id 8.

  {
    id:              'trad-gr-6',
    name:            'Traditional Green Roof 6"',
    shortName:       'Trad GR 6"',
    profileCategory: 'traditional',
    systemType:      'trad-gr-6',
    bmpId:           8,
    description:     'Standard extensive green roof with 4" engineered media and sedum vegetation. Provides retention through soil absorption. No detention layer.',
    assumptions:     'Assumes FLL-compliant media at 0.20 retention factor. No detention capacity. Weight is the primary structural consideration.',

    layers: [
      { layerId: 'protection-mat',   depthIn: 0,   fixed: true  },
      { layerId: 'extensive-media',  depthIn: 4,   fixed: false },
      { layerId: 'sedum-mat',        depthIn: 0,   fixed: true  }
    ],

    totalDepthIn: 4.0,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },


  // ── 2. Purple-Roof (Vegetated) 4+1+2 ─────────────────────────────
  //
  // Balanced profile: 4" media, 1" mineral wool, 2" honeycomb.
  // Provides both retention (media + NMW) and detention (honeycomb).
  // Maps to BMP id 10.

  {
    id:              'pr-veg-412',
    name:            'Purple-Roof (Vegetated) 4+1+2',
    shortName:       'PR Veg 4+1+2',
    profileCategory: 'purple-roof',
    systemType:      'pr-veg-412',
    bmpId:           10,
    description:     'Vegetated Purple-Roof with 4" media, 1" mineral wool retention, and 2" honeycomb detention. Balanced retention + detention in a moderate-weight assembly.',
    assumptions:     'Mineral wool retention at 0.40 factor. Honeycomb void ratio 0.95. Drainage layer at 0.2" with 0.93 porosity. Media retention at 0.20.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 2,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'extensive-media',      depthIn: 4,   fixed: false },
      { layerId: 'sedum-mat',            depthIn: 0,   fixed: true  }
    ],

    totalDepthIn: 7.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },


  // ── 3. Purple-Roof (Vegetated) 4+1+4 ─────────────────────────────
  //
  // Higher detention: 4" media, 1" mineral wool, 4" honeycomb.
  // Deeper honeycomb doubles detention capacity vs 4+1+2.
  // Lighter per CF of detention than adding ground-based systems.
  // Maps to BMP id 10B.

  {
    id:              'pr-veg-414',
    name:            'Purple-Roof (Vegetated) 4+1+4',
    shortName:       'PR Veg 4+1+4',
    profileCategory: 'purple-roof',
    systemType:      'pr-veg-414',
    bmpId:           '10B',
    description:     'Vegetated Purple-Roof with 4" media, 1" mineral wool, and 4" honeycomb. Higher detention capacity with moderate weight increase over the 4+1+2.',
    assumptions:     'Same layer factors as 4+1+2. Honeycomb doubled from 2" to 4" — detention roughly doubles. Weight increase is primarily from the additional water held in the honeycomb.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 4,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'extensive-media',      depthIn: 4,   fixed: false },
      { layerId: 'sedum-mat',            depthIn: 0,   fixed: true  }
    ],

    totalDepthIn: 9.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },

  {
    id:              'pr-veg-411',
    name:            'Purple-Roof (Vegetated) 4+1+1',
    shortName:       'PR Veg 4+1+1',
    profileCategory: 'purple-roof',
    systemType:      'pr-veg-411',
    bmpId:           '10C',
    description:     'Vegetated Purple-Roof with 4" media, 1" mineral wool, and 1" honeycomb detention. Lighter assembly between retention-focused and 4+1+2.',
    assumptions:     'Same layer factors as 4+1+2. Shallow honeycomb — less detention than 4+1+2.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 1,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'extensive-media',      depthIn: 4,   fixed: false },
      { layerId: 'sedum-mat',            depthIn: 0,   fixed: true  }
    ],

    totalDepthIn: 6.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },

  {
    id:              'pr-veg-413',
    name:            'Purple-Roof (Vegetated) 4+1+3',
    shortName:       'PR Veg 4+1+3',
    profileCategory: 'purple-roof',
    systemType:      'pr-veg-413',
    bmpId:           '10D',
    description:     'Vegetated Purple-Roof with 4" media, 1" mineral wool, and 3" honeycomb detention. Mid-depth detention between 4+1+2 and 4+1+4.',
    assumptions:     'Same layer factors as 4+1+2. Honeycomb between 2" and 4" variants.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 3,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'extensive-media',      depthIn: 4,   fixed: false },
      { layerId: 'sedum-mat',            depthIn: 0,   fixed: true  }
    ],

    totalDepthIn: 8.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },


  // ── 4. Sponge Roof 4+2 ────────────────────────────────────────────
  //
  // Media + mineral wool only. No honeycomb, no drainage layer.
  // Enhanced retention vs traditional GR, but no detention.
  // Maps to BMP id 9.

  {
    id:              'sponge-42',
    name:            'Sponge Roof 4+2',
    shortName:       'Sponge 4+2',
    profileCategory: 'purple-roof',
    systemType:      'sponge-42',
    bmpId:           9,
    description:     'Sponge roof with 4" media and 2" mineral wool for enhanced retention. No honeycomb detention layer. Retention from both soil and NMW.',
    assumptions:     'Mineral wool retention at regulation profile rate. NMW sits directly on protection mat (no drainage layer). No detention capacity.',

    layers: [
      { layerId: 'protection-mat',   depthIn: 0,   fixed: true  },
      { layerId: 'mineral-wool',     depthIn: 2,   fixed: false },
      { layerId: 'extensive-media',  depthIn: 4,   fixed: false },
      { layerId: 'sedum-mat',        depthIn: 0,   fixed: true  }
    ],

    totalDepthIn: 6.0,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },


  // ── 5. Purple-Roof (Pavers) P+1+2 ────────────────────────────────
  //
  // Paver-over-Purple: concrete pavers on pedestals over 1" NMW
  // and 2" honeycomb. No soil media. Retention from NMW only.
  // Maps to BMP id 11.

  {
    id:              'pr-pav-p12',
    name:            'Purple-Roof (Pavers) P+1+2',
    shortName:       'PR Paver P+1+2',
    profileCategory: 'paver-purple',
    systemType:      'pr-pav-p12',
    bmpId:           11,
    description:     'Paver-over-Purple with concrete pavers on pedestals, 1" mineral wool retention, and 2" honeycomb detention. Provides usable deck surface with stormwater management below.',
    assumptions:     'Paver weight is significant (~22 PSF). No soil media layer — retention from NMW only. Detention from honeycomb. Structural load check required.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 2,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'concrete-pavers',      depthIn: 2,   fixed: true  }
    ],

    totalDepthIn: 5.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },


  // ── 7. Purple-Roof (Pavers) P+1+4 ────────────────────────────────
  //
  // Same as P+1+2 but with 4" honeycomb for higher detention.
  // Maps to BMP id 11B.

  {
    id:              'pr-pav-p14',
    name:            'Purple-Roof (Pavers) P+1+4',
    shortName:       'PR Paver P+1+4',
    profileCategory: 'paver-purple',
    systemType:      'pr-pav-p14',
    bmpId:           '11B',
    description:     'Paver-over-Purple with concrete pavers on pedestals, 1" mineral wool retention, and 4" honeycomb detention. Higher detention capacity than the P+1+2 variant.',
    assumptions:     'Same layer factors as P+1+2. Honeycomb doubled from 2" to 4" — detention roughly doubles. Weight increase from additional detained water.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 4,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'concrete-pavers',      depthIn: 2,   fixed: true  }
    ],

    totalDepthIn: 7.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },

  {
    id:              'pr-pav-p11',
    name:            'Purple-Roof (Pavers) P+1+1',
    shortName:       'PR Paver P+1+1',
    profileCategory: 'paver-purple',
    systemType:      'pr-pav-p11',
    bmpId:           '11C',
    description:     'Paver-over-Purple with 1" mineral wool and 1" honeycomb detention. Lightest paver Purple-Roof detention profile.',
    assumptions:     'Paver weight significant. Retention from NMW only; shallow honeycomb.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 1,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'concrete-pavers',      depthIn: 2,   fixed: true  }
    ],

    totalDepthIn: 4.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  },

  {
    id:              'pr-pav-p13',
    name:            'Purple-Roof (Pavers) P+1+3',
    shortName:       'PR Paver P+1+3',
    profileCategory: 'paver-purple',
    systemType:      'pr-pav-p13',
    bmpId:           '11D',
    description:     'Paver-over-Purple with 1" mineral wool and 3" honeycomb detention. Mid-depth paver detention between P+1+2 and P+1+4.',
    assumptions:     'Same layer factors as P+1+2. Honeycomb between 2" and 4" variants.',

    layers: [
      { layerId: 'protection-mat',       depthIn: 0,   fixed: true  },
      { layerId: 'drainage-layer',       depthIn: 0.2, fixed: true  },
      { layerId: 'honeycomb-detention',  depthIn: 3,   fixed: false },
      { layerId: 'mineral-wool',         depthIn: 1,   fixed: false },
      { layerId: 'concrete-pavers',      depthIn: 2,   fixed: true  }
    ],

    totalDepthIn: 6.2,

    resourceLinks: {
      specSheet:      null,
      detailDrawing:  null,
      installGuide:   null
    }
  }

];


// ── Profile schema (for future validation / UI generation) ─────────

const ROOF_PROFILE_SCHEMA = {
  id:              { type: 'string',  required: true  },
  name:            { type: 'string',  required: true  },
  shortName:       { type: 'string',  required: true  },
  profileCategory: { type: 'string',  required: true, enum: ['traditional', 'purple-roof', 'paver-purple'] },
  systemType:      { type: 'string',  required: true  },
  bmpId:           { type: ['number', 'string'], required: false },
  description:     { type: 'string',  required: true  },
  assumptions:     { type: 'string',  required: true  },
  layers: {
    type: 'array', required: true,
    items: {
      layerId: { type: 'string',  required: true  },
      depthIn: { type: 'number',  required: true  },
      fixed:   { type: 'boolean', required: false }
    }
  },
  totalDepthIn:    { type: 'number',  required: true  },
  resourceLinks:   { type: 'object',  required: false }
};
