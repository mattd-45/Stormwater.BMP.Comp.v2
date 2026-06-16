// City-level sales intelligence — talking points, objection handling, and best-fit system notes.
// Keyed by the same city keys used in CITY_DATA.
// Loaded via <script> tag before the inline script block.

const CITY_SALES_DATA = {
  nyc: {
    talkingPoints: [
      'NYC DEP requires on-site stormwater retention for all new development and major renovations over 20,000 SF disturbed area.',
      'Green roof systems can earn zoning FAR bonuses in certain districts — check ZR 43-30.',
      'Purple-Roof detention layer converts any green roof into a two-layer stormwater management system with no additional footprint.'
    ],
    objections: [
      {
        objection: 'We already have a green roof specified.',
        response: 'Purple-Roof adds a detention layer beneath the existing green roof — no extra footprint, just added stormwater performance. It upgrades a landscape amenity into a compliance tool.'
      },
      {
        objection: 'Underground tanks are cheaper.',
        response: 'Underground tanks require excavation in Manhattan-class soil conditions, plus dewatering and utility relocation. Rooftop systems avoid all subsurface risk.'
      }
    ],
    bestFitSystems: [
      {
        condition: 'Limited at-grade space, high land value',
        recommendation: 'Purple-Roof or Blue Roof — keeps stormwater on the rooftop, frees ground-level area for revenue-generating use.'
      },
      {
        condition: 'Green roof already in scope',
        recommendation: 'Purple-Roof upgrade — adds detention layer beneath existing green roof specification at incremental cost.'
      }
    ]
  },
  dc: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  chicago: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  boston: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  philadelphia: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  nashville: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  seattle: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  san_francisco: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  toronto: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  ohio_statewide: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  columbus_oh: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  virginia_statewide: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  richmond_va: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  },
  montgomery_md: {
    talkingPoints: [],
    objections: [],
    bestFitSystems: []
  }
};
