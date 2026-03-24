// ═══════════════════════════════════════════════════════════════════════
// CITY DATA — master configuration for all cities
// ═══════════════════════════════════════════════════════════════════════
// Each city entry contains:
//   name          — display name (e.g. "New York City, NY")
//   coords        — lat/lon for map placement
//   mapX, mapY    — pixel position on US map
//   climate       — precip, evap, storage (30-year cumulative inches)
//   links         — URLs to regulations, manuals, incentives
//   regs          — regulation bullets (retention, detention, pv)
//   defaults      — soil retention %, mineral wool %, honeycomb void %
//   regulationProfileId — engine adapter key
//   icon          — path to city header image
//
// To add a new city:
//   1. Add an entry below following the existing pattern
//   2. Add regulation summaries in city-reg-summaries.js (optional)
//   3. Create a city-data/XX-CityName/ folder for images (optional)
//   4. Create an engine adapter in engine/adapters/ if needed
// ═══════════════════════════════════════════════════════════════════════

const CITY_DATA = {
  nyc: {
    name: "New York City, NY",
    coords: { lat: 40.7128, lon: -74.0060 },
    mapX: 850,
    mapY: 220,
    climate: {
      precip: 1320.893, // inches (30-year cumulative)
      evap: 649.331,    // inches (30-year cumulative)
      storage: 0.200    // inches
    },
    links: {
      stormwater: "https://www.nyc.gov/site/dep/water/unified-stormwater-rule.page",
      stormwaterManual: "https://www.nyc.gov/assets/dep/downloads/pdf/water/stormwater/unified-stormwater-rule/uswr_nyc_stormwater_manual.pdf",
      pv: "https://www.nyc.gov/site/buildings/codes/ll92-solar-green-roofs.page",
      stormwaterSummary: "city-data/NY-New-York-City/nyc-stormwater-overview.html",
      ms4Map: "https://nycdep.maps.arcgis.com/apps/webappviewer/index.html?id=81c926d182454388869ff135ef603c60",
      incentives: [
        "https://www.nyc.gov/site/buildings/codes/ll92-solar-green-roofs.page",
        "https://www.nyc.gov/site/buildings/codes/solar-faq.page",
        "https://nysolarmap.com/incentives/",
        "https://programs.dsireusa.org/system/program/detail/1027" // NYC property tax abatement
      ]
    },
    regs: {
      retention: [
        "USWR requires capture of the 1.5\" Water Quality Volume (WQv) in MS4 areas; 1.85\" Sewer Operations Volume in CSS areas.",
        "Compliance hierarchy: Infiltration → Evapotranspiration → Reuse → Treatment/Filtration.",
        "Triggers: ≥20,000 SF soil disturbance OR ≥5,000 SF new impervious, OR subject to LL 92/94.",
        "DEP Green Infrastructure Grant reimburses up to 100% of green roof installation costs (min 3,500 SF).",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "CSS areas: max release = greater of 0.25 cfs OR 10% of Allowable Flow; weighted coefficient as low as 0.10.",
        "MS4 areas: site stormwater flow restricted to Allowable Flow.",
        "NYC CSS covers ~60% of the city; USWR aims to reduce peak flows and prevent CSOs."
      ],
      pv: [
        "Local Laws 92/94: 100% of Sustainable Roofing Zone must be solar PV, green roof, or combination.",
        "Solar property tax abatement: 7.5%/yr for 4 years (up to $250,000 total, 30% of eligible costs).",
        "NY‑Sun incentives: ~$0.30/W residential, ~$0.40/W commercial in Con Edison territory.",
        "Net metering: 1:1 retail rate credit; large commercial (>10 kW) uses VDER Value Stack Tariff.",
        "Bio‑solar roofs meet LL 92/94 dual requirement while achieving both WQv and renewable energy goals."
      ]
    },
    defaults: {
      soilRetentionPct: 0.20,
      mineralWoolRetentionPct: 0.40,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'nyc_dep',
    icon: "city-data/NY-New-York-City/IMAGE-NYC-ms4-map.jpg"
  },
  dc: {
    name: "Washington, DC",
    coords: { lat: 38.9072, lon: -77.0369 },
    mapX: 800,
    mapY: 250,
    climate: {
      precip: 1200.0, // inches (30-year cumulative) - placeholder
      evap: 600.0,     // inches (30-year cumulative) - placeholder
      storage: 0.200
    },
    links: {
      stormwater: "https://doee.dc.gov/swregs",
      stormwaterManual: "https://doee.dc.gov/swguidebook",
      pv: "https://doee.dc.gov/service/solar-district",
      incentives: [
        "https://doee.dc.gov/service/solar-district",
        "https://doee.dc.gov/solarforall",
        "https://doee.dc.gov/fr/service/commercial-green-incentives",
        "https://programs.dsireusa.org/system/program/dc"
      ],
      ms4Map: "https://experience.arcgis.com/experience/d03534b10eaa4bd8991df7cf4f9dfb53"
    },
    regs: {
      retention: [
        "New development: retain 1.2\" Stormwater Retention Volume (SWRv); major renovations: 0.8\".",
        "Triggers: sites disturbing ≥5,000 SF of land.",
        "Tradable Stormwater Retention Credits (SRCs): 1 SRC = 1 gallon of GI retention capacity/year.",
        "MS4 sites: minimum 50% on‑site before using SRCs; CSS sites: up to 100% via SRCs.",
        "RiverSmart Rewards rebates: $15/SF for green roofs in Wards 7, 8, and MS4 area.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "2‑year, 24‑hr storm: post‑development peak ≤ pre‑development peak (channel protection).",
        "15‑year, 24‑hr storm: design capacity of District's sewer conveyance system (flood protection).",
        "CSS serves ~1/3 of District; MS4 serves ~2/3. Current MS4 NPDES permit expires Dec 2028."
      ],
      pv: [
        "Clean Energy DC Omnibus Act: 100% Tier 1 renewable by 2032; 2026 target: 5% solar carve‑out.",
        "SRECs: 1 per MWh generated; market value up to ~$400/SREC — significant revenue for building owners.",
        "Net metering: full retail rate credit via PEPCO; 12‑month credit banking.",
        "Green Area Ratio (GAR): score‑based requirement (0.2–0.4); green roofs earn multiplier credit.",
        "BEPS: all buildings >10,000 SF must meet energy performance thresholds in 6‑year cycles.",
        "Solar for All: free PV for households ≤80% AMI, ~50% bill reduction over 15 years."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general',
    icon: "images/IMAGE-washington-dc.jpg"
  },
  chicago: {
    name: "Chicago, IL",
    coords: { lat: 41.8781, lon: -87.6298 },
    mapX: 550,
    mapY: 200,
    climate: {
      precip: 1055.042, // inches (30-year cumulative)
      evap: 645.944,     // inches (30-year cumulative)
      storage: 0.200
    },
    links: {
      stormwater: "https://www.chicago.gov/content/dam/city/depts/water/general/Engineering/SewerConstStormReq/2024Regulations.pdf",
      stormwaterManual: "https://www.chicago.gov/content/dam/city/depts/water/general/Engineering/SewerConstStormReq/2024StormwaterManual.pdf",
      pv: "https://www.chicago.gov/city/en/progs/env/solar_in_chicago.html",
      incentives: [
        "https://www.chicago.gov/city/en/progs/env/solar_in_chicago.html",
        "https://www.chicago.gov/city/en/depts/bldgs/provdrs/permits/svcs/green-permits.html",
        "https://illinoisshines.com/",
        "https://programs.dsireusa.org/system/program/il"
      ],
      summary: "city-data/IL-Chicago/chicago-stormwater-overview.html"
    },
    regs: {
      retention: [
        "Capture the first 0.5\" of runoff from all impervious surfaces with approved BMPs (2024 DWM Regulations).",
        "Triggers: ≥15,000 SF land disturbance OR ≥7,500 SF new contiguous impervious area.",
        "Alternative path: provide ≥15% reduction in total impervious area vs. existing conditions.",
        "Green roofs explicitly recognized as approved Volume Control BMPs.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Design storm: 100‑year event. Sites ≤0.5 ac: max 0.15 cfs (3\" vortex restrictor).",
        "Sites 0.5–1.75 ac: interpolated 0.15–0.25 cfs (4\" vortex restrictor). At‑grade open space: 1.0 cfs/acre.",
        "Lot‑to‑lot buildings (>85% lot coverage): rooftop storage may use 10‑year storm if 100‑yr overflows safely routed.",
        "Exempt: sites discharging to Lake Michigan, Lake Calumet, or Calumet River north of O'Brien Lock."
      ],
      pv: [
        "No blanket solar mandate, but FAR bonuses up to 2 FAR when ≥50% of roof is green roof (Zoning 17‑4‑1015).",
        "Solar‑Ready Building Code (eff. Jan 2023): 40% of available roof must be solar‑ready zone (≥7,500 SF footprint, ≤60 ft).",
        "Green Permit Program: expedited review (<30 days), possible fee reduction, waiver up to $25,000.",
        "Illinois Shines / Adjustable Block: SREC payments over 15 years; ~$300/kW installed (ComEd territory).",
        "Illinois residential solar: full property tax exemption on added home value (no dollar limit).",
        "C‑PACE financing available for commercial properties."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general',
    icon: "images/IMAGE-chicago.jpg"
  },
  boston: {
    name: "Boston, MA",
    coords: { lat: 42.3601, lon: -71.0589 },
    mapX: 900,
    mapY: 180,
    climate: {
      precip: 1265.409, // inches (30-year cumulative)
      evap: 603.197,     // inches (30-year cumulative)
      storage: 0.200
    },
    links: {
      stormwater: "https://www.bwsc.org/builders-contractors/site-plan-requirements/storm-drain-requirements",
      stormwaterManual: "https://www.bwsc.org/sites/default/files/2019-01/stormwater_bmp_guidance_2013.pdf",
      pv: "https://www.boston.gov/boston-permitting/install-or-replace/install-or-replace-solar-panels",
      incentives: [
        "https://www.boston.gov/boston-permitting/install-or-replace/install-or-replace-solar-panels",
        "https://www.mass.gov/solar-information-programs",
        "https://www.masssave.com/",
        "https://programs.dsireusa.org/system/program/ma"
      ]
    },
    regs: {
      retention: [
        "Projects <100,000 SF: retain runoff from 1.0\" of rainfall × impervious area; ≥100,000 SF: 1.25\".",
        "Triggers: >400 SF impervious (stormwater charge); >2,500 SF (drainage analysis); >50,000 SF GFA (Article 37).",
        "MassDEP: 80% TSS removal; min soil infiltration rate 0.17 in/hr at actual location.",
        "Up to 30% credit on stormwater fees for green roofs and other demonstrated BMPs.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Post‑development peak ≤ pre‑development for 2‑year and 10‑year, 24‑hr storms (10‑yr = 5.15\" rainfall).",
        "100‑year event evaluation also required per Massachusetts Wetland Protection Act.",
        "CSS: 155 miles of combined sewer; new connections ≥15,000 gpd require 4:1 I/I reduction ratio."
      ],
      pv: [
        "Net Zero Carbon Zoning (projects filed after July 1, 2025): ≥50% of flat/south‑facing roof must have solar.",
        "90% of uncovered parking structure decks must have solar coverage.",
        "BERDO: buildings ≥20,000 SF must meet emissions standards; net‑zero by 2050. On‑site solar is 'most effective strategy.'",
        "SMART 3.0: performance‑based incentive for 10 yrs (residential) or 20 yrs (commercial); 900 MW capacity in 2026.",
        "Adders: battery storage ~$0.04/kWh, building‑mounted $0.02/kWh, low‑income double rate.",
        "Solar exempt from property taxes for 20 years; 15% MA state income tax credit (up to $1,000); sales tax exempt."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general',
    icon: "city-data/MA-Boston/IMAGE-boston.jpg",
    flag: {
      background: 'linear-gradient(to right, #0369a1 0 20%, #e0f2fe 20% 100%)'
    }
  },
  philadelphia: {
    name: "Philadelphia, PA",
    coords: { lat: 39.9526, lon: -75.1652 },
    mapX: 820,
    mapY: 230,
    climate: {
      precip: 1150.0, // inches (30-year cumulative) - placeholder
      evap: 580.0,     // inches (30-year cumulative) - placeholder
      storage: 0.200
    },
    links: {
      stormwater: "https://water.phila.gov/development/stormwater-plan-review/manual/",
      stormwaterManual: "https://water.phila.gov/development/stormwater-plan-review/manual/appendices/c-pwd-stormwater-regulations/",
      pv: "https://www.phila.gov/services/permits-violations-licenses/apply-for-a-permit/building-and-repair-permits/get-a-permit-to-install-solar-panels/",
      incentives: [
        "https://www.phila.gov/programs/solar-rebate-program/",
        "https://www.phila.gov/programs/solar-rebate-program/resources/",
        "https://programs.dsireusa.org/system/program/pa"
      ],
      stormwaterSummary: "city-data/PA-Philadelphia/philadelphia-stormwater-overview.html"
    },
    regs: {
      retention: [
        "Retain the first 1.5\" of runoff (WQv) from all Directly Connected Impervious Areas (DCIA).",
        "Triggers: ≥15,000 SF earth disturbance (citywide); ≥5,000 SF in Darby/Cobbs or Wissahickon watersheds.",
        "If infiltration feasible: 100% of WQv infiltrated. If not (CSS): treat 100% WQv; max release 0.05 cfs/ac DCIA.",
        "20% Rule: redevelopment reducing impervious by ≥20% exempt from Flood Control and Channel Protection.",
        "Green roofs: min 3\" media; runoff coefficients 0.10–0.30 (vs. 0.95 conventional); 'Highest Preference' BMP.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Channel Protection: 1‑year, 24‑hr storm peak flow control.",
        "Flood Control: 10‑year and 100‑year storm peaks must not exceed pre‑development rates.",
        "Non‑infiltrating areas: max release rate 0.05 cfs/acre DCIA when routing 1.7\" PWD Design Storm.",
        "Act 167: watershed‑specific peak rate requirements per PA Stormwater Management Act."
      ],
      pv: [
        "No citywide solar mandate. C‑PACE and local programs favor projects combining solar PV with green roofs.",
        "Green Roof Tax Credit: 50% of construction costs, up to $100,000; applied against BIRT; requires ≥60% roof coverage.",
        "Expedited 5‑Day Green Review for projects with ≥95% green infrastructure.",
        "Zoning bonus: up to 25% increase in dwelling units for green roofs covering ≥60% of rooftop.",
        "PA SRECs: ~$31/SREC (1 per MWh); 3‑year validity. PECO net metering at full retail rate.",
        "C‑PACE: 100% of hard/soft costs, up to 30‑yr repayment on property tax bill."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general',
    icon: "images/IMAGE-philadelphia.jpg"
  },
  nashville: {
    name: "Nashville, TN",
    coords: { lat: 36.1627, lon: -86.7816 },
    mapX: 600,
    mapY: 280,
    climate: {
      precip: 1100.0, // inches (30-year cumulative) - placeholder
      evap: 620.0,     // inches (30-year cumulative) - placeholder
      storage: 0.200
    },
    links: {
      stormwater: "https://www.nashville.gov/departments/water/developers/stormwater-review/stormwater-management-manual/regulations",
      stormwaterManual: "https://www.nashville.gov/departments/water/developers/stormwater-review/stormwater-management-manual",
      pv: "https://www.nashville.gov/departments/codes/construction-and-permits/trades-permits/solar-panel-photovoltaic-permits",
      incentives: [
        "https://www.nashville.gov/departments/codes/construction-and-permits/trades-permits/solar-panel-photovoltaic-permits",
        "https://programs.dsireusa.org/system/program/tn",
        "https://www.tva.com/energy/blue-switch"
      ],
      stormwaterSummary: "city-data/TN-Nashville/nashville-stormwater-overview.html"
    },
    regs: {
      retention: [
        "Runoff Reduction Volume (RRv): capture the first 1.1\" of rainfall using LID practices to maximum extent practicable.",
        "Triggers: projects disturbing >10,000 SF requiring a Grading Permit.",
        "Structural SCMs must achieve 80% TSS removal; pretreatment approval at 50% TSS.",
        "Green roofs capture ~55% of annual rainfall; recognized as structural Stormwater Control Measure.",
        "LID Waiver required when site constraints prevent full 1.1\" RRv — submit to MWS for alternative compliance.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Post‑development peaks must not exceed pre‑development for 2, 10, 25, 50, and 100‑year, 24‑hr storms.",
        "Pre‑ and post‑development hydrographs required for all design storms.",
        "Downstream impact analysis required at point where site ≤10% of total drainage area."
      ],
      pv: [
        "No municipal solar mandate.",
        "Green roof stormwater rebate: $10/SF of installed vegetative roof; credit applied to monthly sewer charges for 60 months.",
        "Stormwater User Fee Credit: up to 50% reduction for approved SCMs including green roofs (Ordinance BL2009‑407).",
        "TVA Green Switch: match 100% of electricity with solar for $2/month. DPP: excess solar purchased at ~2¢/kWh.",
        "Tennessee: NO traditional net metering. Solar sales tax exempt. Property tax: assessed at only 12.5% of install cost.",
        "SolSmart Bronze designation: streamlined solar permitting; permits start at $75."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general',
    icon: "images/IMAGE-nashville.jpg"
  },
  seattle: {
    name: "Seattle, WA",
    coords: { lat: 47.6062, lon: -122.3321 },
    mapX: 150,
    mapY: 120,
    climate: {
      precip: 1200.0,
      evap: 500.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://www.seattle.gov/sdci/codes/codes-we-enforce-(a-z)/stormwater-code",
      stormwaterManual: "https://www.seattle.gov/documents/Departments/SDCI/Codes/StormwaterCode/2021SWManualVol3ProjectStormwaterControlClean.pdf",
      pv: "https://www.seattle.gov/sdci/codes/codes-we-enforce-(a-z)/energy-code",
      incentives: [
        "https://www.seattle.gov/city-light/residential-services/home-energy-solutions/solar-power",
        "https://www.seattle.gov/sdci/codes/codes-we-enforce-(a-z)/seattle-green-factor",
        "https://www.seattle.gov/sdci/permits/green-building/living-building-pilot-overview",
        "https://www.solarwa.org/solar_incentives"
      ]
    },
    regs: {
      retention: [
        "GSI required to Maximum Extent Feasible (MEF) for all projects with ≥2,000 SF new/replaced impervious surface.",
        "≥5,000 SF: drainage report by licensed CE; ≥10,000 SF: continuous runoff modeling (158‑year precip series).",
        "Pre‑development pasture hydrology standard: post‑developed flows ≤ pre‑developed pasture within 1–10% exceedance range.",
        "Green Factor multiplier: 0.7 for rooftop plantings at least one floor above grade.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "1–10% exceedance standard: post‑developed discharge ≤ pre‑developed pasture across full flow duration range.",
        "Flow duration matching required between pre‑ and post‑developed conditions.",
        "Detention facilities alone cannot meet code — must be combined with OSM practices."
      ],
      pv: [
        "Solar‑Ready Code: commercial buildings ≤20 stories — min 40% of net roof area as solar zone.",
        "System sizing: 0.50 W/SF of conditioned space; structural: 4 psf additional dead load in solar zone.",
        "Green Factor: score‑based landscaping code; 0.30 (commercial), 0.50 (mid/highrise res), 0.60 (lowrise res).",
        "Living Building Pilot: height bonuses +12.5–30 ft depending on zone height limit (expires Dec 2030 or 20 projects).",
        "WA sales tax exempt: 100% for systems <100 kW (through Dec 2029); 50% for 100–500 kW.",
        "Seattle City Light net metering: bill credits for systems <100 kW. HOA solar bans void per RCW 64.38.055."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general',
    icon: "images/IMAGE-seattle-wa.jpg"
  },
  san_francisco: {
    name: "San Francisco, CA",
    coords: { lat: 37.7749, lon: -122.4194 },
    mapX: 120,
    mapY: 220,
    climate: {
      precip: 900.0,
      evap: 550.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://www.sfpuc.org/construction-contracts/new-developments/stormwater-management",
      stormwaterManual: "https://www.sfpuc.org/construction-contracts/new-developments/stormwater-management/stormwater-requirements",
      pv: "https://sfplanning.org/project/better-roofs",
      incentives: [
        "https://sfplanning.org/project/better-roofs",
        "https://www.sfpuc.gov/accounts-services/sign-up-for-savings/gosolarsf",
        "https://programs.dsireusa.org/system/program/ca"
      ]
    },
    regs: {
      retention: [
        "Separate sewer areas: capture and treat runoff from a 0.75\", 24‑hr rainfall event (≥2,500 SF trigger).",
        "Combined sewer areas: 25% reduction in peak flow rate and volume from pre‑development for 2‑yr, 24‑hr storm (≥5,000 SF trigger).",
        "Green roof minimum: 4\" growing media, high species diversity, native/low water use plants.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Sites ≤50% existing imperviousness: post‑development peak/volume must not exceed pre‑development for 1‑yr and 2‑yr, 24‑hr storms.",
        "Sites >50% existing imperviousness: decrease peak/volume by 25% from pre‑development for 2‑yr, 24‑hr storm.",
        "Release rates project‑specific through Stormwater Control Plan; must align with receiving sewer capacity."
      ],
      pv: [
        "Better Roofs Ordinance (eff. Jan 2017): 15% of roof area as Solar PV, OR 30% as Living Roof, OR combination.",
        "Applies to non‑residential ≥2,000 SF and all residential, both ≤10 occupied floors.",
        "CA Title 24: solar PV required on most new residential and commercial; battery storage required with PV (eff. Jan 2023).",
        "NEM 3.0 (eff. mid‑April 2023): export rate ~$0.05/kWh (vs. ~$0.30 under NEM 2.0); battery storage increasingly important.",
        "SFPUC GI Grants: up to $2.5M/project for green infrastructure including green roofs; post‑install stormwater credits.",
        "Active solar systems NOT assessed as property improvements — no property tax increase (through Jan 2027)."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general'
  },
  toronto: {
    name: "Toronto, ON (Canada)",
    coords: { lat: 43.6532, lon: -79.3832 },
    mapX: 780,
    mapY: 120,
    climate: {
      precip: 1100.0,
      evap: 550.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://www.toronto.ca/city-government/planning-development/official-plan-guidelines/toronto-green-standard/toronto-green-standard-version-4/",
      stormwaterManual: "https://trca.ca/conservation/stormwater-management/",
      pv: "https://www.oeb.ca/consumer-information-and-protection/net-metering",
      incentives: [
        "https://www.toronto.ca/city-government/planning-development/official-plan-guidelines/toronto-green-standard/toronto-green-standard-version-4/",
        "https://trca.ca/conservation/stormwater-management/"
      ]
    },
    regs: {
      retention: [
        "TGS v4 Tier 1 (mandatory): retain minimum 50% of annual rainfall OR equivalent of 5 mm from each event.",
        "TGS v4 Tier 2 (voluntary): retain minimum 25 mm from each rainfall event — partial refund of dev expenses available.",
        "Triggers: Site Plan Control applications with >2,000 m² GFA; apartment buildings 4+ storeys.",
        "Extensive green roofs: 5 mm initial abstraction; intensive: 7 mm. Essential for water balance on tall buildings.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Post‑development peaks must not exceed pre‑development for 2, 5, 10, 25, 50, and 100‑year storms.",
        "Regulatory floodplain based on more severe of Hurricane Hazel or 100‑year storm.",
        "TRCA: target flow = erosion threshold for most sensitive reach; site‑specific hydrologic modeling required."
      ],
      pv: [
        "NOTE: Toronto Green Roof Bylaw REPEALED by provincial order‑in‑council (Oct 23, 2025). Green roofs now voluntary.",
        "Previously mandated 20–60% green roof coverage on buildings >2,000 m².",
        "TGS v4 Tier 2 (voluntary): min 5% of building energy from renewables, min 1% from solar PV/thermal.",
        "100% of available roof must be green roof, solar PV, or cool roof (Tier 2).",
        "Ontario net metering: systems <500 kW; excess credited on bill up to 12 months.",
        "Home Renovation Savings Program: up to $10,000 rebate for solar + battery. $300M provincial PACE investment."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general'
  },
  ohio_statewide: {
    name: "Ohio (Statewide)",
    coords: { lat: 40.4173, lon: -82.9071 },
    mapX: 650,
    mapY: 210,
    climate: {
      precip: 1100.0,
      evap: 580.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://epa.ohio.gov/divisions-and-offices/surface-water/permits/stormwater-construction-general-permit",
      stormwaterManual: "https://dx-stg.ohio.gov/wps/portal/gov/epa/divisions-and-offices/surface-water/guides-manuals/rainwater-and-land-development",
      pv: "https://www.sopec-oh.gov/solar-net-metering",
      incentives: [
        "https://ohpace.org/",
        "https://development.ohio.gov/cs/cs_altstormwater.htm",
        "https://programs.dsireusa.org/system/program/oh"
      ]
    },
    regs: {
      retention: [
        "WQv design storm: 0.90\" precipitation; achieves ~80% TSS reduction on average annual basis.",
        "CGP (OHC000006): applies to construction disturbing ≥1 acre. SWPPP and NOI required (21‑day advance).",
        "LID practices encouraged: bioretention, permeable pavement, green roofs, vegetated swales.",
        "Post‑construction: permanent BMPs required with maintenance plan, inspection schedules, and recorded easements.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Dry Extended Detention: 48‑hr drawdown of WQv with <50% emptying in first 16 hours.",
        "Wet Extended Detention/Wetland: 24‑hr minimum drawdown with <50% in first 8 hours.",
        "Critical Storm Method: peak rates for all 1–100 year, 24‑hr storms must not exceed pre‑development."
      ],
      pv: [
        "No statewide solar mandate. RPS reduced to 8.5% by 2026; solar carve‑out 0.5% (frozen since 2014).",
        "PUCO net metering: systems ≤25 kW at 1:1 retail rate; max 120% of annual usage.",
        "SRECs: ~$3/SREC (market oversupplied). Property tax exempt: systems ≤250 kW permanently exempt.",
        "Alternative Stormwater Infrastructure Loan Program (ASIL): below‑market loans up to $5M for GI projects.",
        "C‑PACE: 15–25 yr fixed‑rate, 100% upfront costs. R‑PACE also available in Ohio."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general'
  },
  columbus_oh: {
    name: "Columbus, OH",
    coords: { lat: 39.9612, lon: -82.9988 },
    mapX: 640,
    mapY: 230,
    climate: {
      precip: 1100.0,
      evap: 580.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://www.columbus.gov/Services/Public-Utilities/Information-for-Customers/Public-Utility-Contractors/Stormwater-Drainage-Manual",
      stormwaterManual: "https://www.columbus.gov/files/sharedassets/city/v/2/utilities/documents/sewer-publications/2024-columbus-stormwater-drainage-manual.pdf",
      pv: "https://www.aepohio.com/clean-energy/renewable/",
      incentives: [
        "https://www.columbus.gov/Services/Housing-Assistance-Programs/Apply-for-Residential-Tax-Incentives",
        "https://blueprintneighborhoods.com/",
        "https://smartcolumbus.com/"
      ]
    },
    regs: {
      retention: [
        "Follows Ohio EPA standards: 0.90\" design storm for WQv; some watersheds require Stream Protection Volume (SV).",
        "Stream Corridor Protection Zones required via deed restrictions/easements; no stormwater facilities in FEMA 100‑yr floodplain.",
        "Blueprint Columbus: GI initiative for CWA compliance — bioretention, permeable pavement, rain gardens, green roofs.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Peak flow control for 2, 5, 10, 25, 50, and 100‑year storms using Critical Storm Method.",
        "Correction factors: f=1.0 (up to 10‑yr), f=1.1 (25‑yr), f=1.2 (50‑yr), f=1.3 (100‑yr).",
        "Basin design: side slopes 4(H):1(V) or flatter; min bottom width 12 ft for dry detention."
      ],
      pv: [
        "No dedicated solar ordinance.",
        "Community Reinvestment Areas (CRAs): 15‑year, 100% property tax abatement on structure value (incl. solar improvements).",
        "AEP Ohio net metering subject to PUCO rules (≤25 kW at retail rate); excess at ~$0.11/kWh.",
        "Ohio property tax exemption: systems ≤250 kW permanently exempt.",
        "Smart Columbus: $40M federal Smart Cities grant; carbon neutrality goal by 2050; $502M+ total commitment."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general',
    icon: "images/IMAGE-columbus-oh.jpg"
  },
  virginia_statewide: {
    name: "Virginia (Statewide)",
    coords: { lat: 37.4316, lon: -78.6569 },
    mapX: 720,
    mapY: 260,
    climate: {
      precip: 1150.0,
      evap: 600.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://www.deq.virginia.gov/water/stormwater/stormwater-construction",
      stormwaterManual: "https://www.deq.virginia.gov/water/stormwater/stormwater-construction/bmp-clearinghouse",
      pv: "https://law.lis.virginia.gov/vacodefull/title45.2/chapter19/",
      incentives: [
        "https://programs.dsireusa.org/system/program/va",
        "https://www.deq.virginia.gov/water/stormwater/stormwater-construction/bmp-clearinghouse"
      ]
    },
    regs: {
      retention: [
        "Virginia Runoff Reduction Method (VRRM v4.1): manage site‑specific Treatment Volume (Tv) for phosphorus reduction.",
        "New development (eff. July 1, 2025): must not exceed 0.26 lbs total phosphorus/acre/year.",
        "Prior Developed Lands ≥1 ac: min 20% phosphorus load reduction; <1 ac: 10% reduction.",
        "Triggers: land‑disturbing activities ≥10,000 SF; Chesapeake Bay Preservation Areas: ≥2,500 SF.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Energy Balance approach applied when impervious area exceeds 7.5%.",
        "Channel Protection: 2‑yr, 24‑hr storm — post‑development peak must not cause erosion.",
        "Flood Protection: 10‑yr, 24‑hr storm — post‑development peak must not exceed pre‑development peak.",
        "Improvement Factor: 0.8 for sites >1 ac; 0.9 for sites ≤1 ac."
      ],
      pv: [
        "VA Clean Economy Act (2020): 100% clean electricity by 2050 for investor‑owned utilities.",
        "Net metering: Dominion 1:1 retail rate (max 25 kW); Appalachian Power 1:1 up to annual consumption, then 5.66¢/kWh.",
        "SRECs: 1 per MWh; sold to utilities for RPS compliance.",
        "Property tax exemptions: Years 1–5: 80% exempt; 6–10: 70%; 11+: 60%. Systems ≤25 kW: automatic.",
        "Solar rights: HOAs cannot prohibit solar unless explicit deed restriction; may not increase cost >5% or reduce production >10%.",
        "Community solar: project max 5 MW; min 3 subscribers; total cap 150 MW. C‑PACE in 17 municipalities."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general'
  },
  richmond_va: {
    name: "Richmond, VA",
    coords: { lat: 37.5407, lon: -77.4360 },
    mapX: 735,
    mapY: 270,
    climate: {
      precip: 1150.0,
      evap: 600.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://www.rva.gov/public-utilities/stormwater-management",
      stormwaterManual: "https://www.deq.virginia.gov/water/stormwater/stormwater-construction",
      pv: "https://www.rvagreen2050.com/",
      incentives: [
        "https://www.rvagreen2050.com/",
        "https://programs.dsireusa.org/system/program/va"
      ]
    },
    regs: {
      retention: [
        "Follows Virginia state VSMP requirements: 0.26 lbs TP/acre/year (eff. July 1, 2025).",
        "CSS serves ~1/3 of city; Long Term CSO Control Plan approved 2005; final CSS plan approved by DEQ Aug 2024.",
        "Subject to Chesapeake Bay TMDL wasteload allocations for TN, TP, and TSS (EPA 2010 TMDL).",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Follows Virginia state Energy Balance method when impervious >7.5%.",
        "1‑year and 10‑year, 24‑hr storm peaks controlled to pre‑development/forested conditions.",
        "Improvement Factor: 0.8 for sites >1 ac; 0.9 for sites ≤1 ac."
      ],
      pv: [
        "No local solar mandate.",
        "Virginia state property tax exemptions apply: 80%/70%/60% declining schedule; ≤25 kW automatic.",
        "Dominion Energy: 1:1 net metering at retail rate (max 25 kW); SREC program available.",
        "Richmond 300 Master Plan: 45% GHG reduction by 2030; net‑zero emissions by 2050.",
        "East End Landfill solar meadow: 15 acres, 5 MW, powers ~1,250 homes."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general'
  },
  montgomery_md: {
    name: "Montgomery County, MD",
    coords: { lat: 39.1547, lon: -77.2405 },
    mapX: 770,
    mapY: 240,
    climate: {
      precip: 1150.0,
      evap: 590.0,
      storage: 0.200
    },
    links: {
      stormwater: "https://www.montgomerycountymd.gov/DEP/water/clean-water-montgomery/stormwater/index.html",
      stormwaterManual: "https://mde.maryland.gov/programs/water/stormwatermanagementprogram/pages/stormwater_design.aspx",
      pv: "https://mcgreenbank.org/",
      incentives: [
        "https://mcgreenbank.org/",
        "https://www.psc.state.md.us/electricity/community-solar-pilot-program/",
        "https://programs.dsireusa.org/system/program/md"
      ]
    },
    regs: {
      retention: [
        "Environmental Site Design (ESD) to Maximum Extent Practicable: replicate 'Woods in Good Condition' (CN=55) for 1‑yr, 24‑hr event.",
        "Triggers: ≥5,000 SF land disturbance; redevelopment ≥5,000 SF where existing imperviousness >40%.",
        "WQv: Central/Eastern MD rainfall zone — 1.5\" precipitation depth for sizing.",
        "Mineral wool provides roughly double the retention of soil per inch."
      ],
      detention: [
        "Channel Protection (Cpv): 24‑hr extended detention of 1‑yr, 24‑hr storm (12 hrs in Use III/IV watersheds).",
        "Overbank Flood Protection (Q10): 10‑yr storm peak controlled vs. existing conditions.",
        "Extreme Flood (Q100): 100‑yr event safely conveyed; peak flow controlled vs. existing conditions."
      ],
      pv: [
        "IgCC adopted for commercial construction ≥5,000 SF: comply via Zero Energy Performance Index (zEPI) score ≤50.",
        "Maryland RPS: 2026 solar carve‑out 8.0%; overall RPS 40.5%; target 50% by 2030.",
        "Net metering (Pepco/BGE): 3,000 MW statewide cap; system sizing up to 110% of 12‑month usage.",
        "SRECs: 1 per MWh; 15‑year validity. MD property tax credit: 100% of assessment increase for solar (full exemption).",
        "Montgomery County Green Bank: Solar Loan 30‑yr (0% low‑income, 4.99% others); MSAP grants up to $7,500.",
        "Community solar (MD Pilot → permanent): min 40% low/middle‑income participants. C‑PACE available."
      ]
    },
    defaults: {
      soilRetentionPct: 0.40,
      mineralWoolRetentionPct: 0.80,
      honeycombVoidPct: 0.95
    },
    regulationProfileId: 'general'
  }
};

// Purple-Roof® case study locations (for US map)
const CASE_STUDIES = [
  {
    id: 'baltimore_md',
    label: 'Baltimore, MD – Johns Hopkins (2024)',
    coords: { lat: 39.2904, lon: -76.6122 },
    pdf: 'project-case-studies/Purple-Roof-case-study-BaltimoreMD-JohnsHopkins-2024.pdf'
  },
  {
    id: 'cambridge_ma',
    label: 'Cambridge, MA – IQHQ (2024)',
    coords: { lat: 42.3736, lon: -71.1097 },
    pdf: 'project-case-studies/Purple-roof-case-study-CambridgeMA-IQHQ-2024.pdf'
  },
  {
    id: 'charlotte_nc',
    label: 'Charlotte, NC – HPEC (2027, internal)',
    coords: { lat: 35.2271, lon: -80.8431 },
    pdf: 'project-case-studies/Purple-roof-case-study-CharlotteNC-HPEC-2027 internal.pdf'
  },
  {
    id: 'columbus_oh_hilton',
    label: 'Columbus, OH – Hilton 2.0 (2023)',
    coords: { lat: 39.9612, lon: -82.9988 },
    pdf: 'project-case-studies/Purple-Roof-case-study-ColumbusOH-Hilton2.0-2023.pdf',
    cityKey: 'columbus_oh'
  },
  {
    id: 'princeton_nj',
    label: 'Princeton, NJ – SEAS (2024)',
    coords: { lat: 40.3430, lon: -74.6514 },
    pdf: 'project-case-studies/Purple-Roof-case-study-PrincetonNJ-_SEAS-2024.pdf'
  },
  {
    id: 'saratoga_springs_ny',
    label: 'Saratoga Springs, NY – The Moderne (2022)',
    coords: { lat: 43.0831, lon: -73.7846 },
    pdf: 'project-case-studies/Purple-Roof-case-study-SaratogaSpringsNY-TheModerne-2022p.pdf'
  },
  {
    id: 'seattle_wa_yesler',
    label: 'Seattle, WA – Yesler Terrace (2024)',
    coords: { lat: 47.6019, lon: -122.3170 },
    pdf: 'project-case-studies/Purple-Roof-case-study-SeattleWA-YeslerTerrace-2024.pdf',
    cityKey: 'seattle'
  }
  // Note: Stepstone NL case study is outside North America, so not shown on this US map.
];
