// ═══════════════════════════════════════════════════════════════════════
// CITY REGULATION SUMMARIES — technical 8-section stormwater profiles
// Replaces the old retention / detention / PV card layout.
// ═══════════════════════════════════════════════════════════════════════
// Items marked ⚠️ should be verified against current municipal codes.
//
// ── FORMAT ──────────────────────────────────────────────────────────────
// Each section (regulatoryOverview, soilConditions, etc.) can be:
//
//   A) A plain array of strings (simple mode):
//        regulatoryOverview: ['bullet 1', 'bullet 2', 'bullet 3', ...]
//        → Engineering mode shows ALL bullets
//        → Sales mode shows ONE-LINER (auto-generated from first bullet)
//
//   B) An object with items + salesOneLiner (recommended):
//        regulatoryOverview: {
//          items: ['bullet 1', 'bullet 2', 'bullet 3', ...],
//          salesOneLiner: 'Short sentence a salesperson needs to know.'
//        }
//        → Engineering mode shows ALL items
//        → Sales mode shows ONLY the salesOneLiner
//
// The salesOneLiner should be a plain-English takeaway — not regulatory
// jargon. Think "what does the salesperson say to the client?"
// ────────────────────────────────────────────────────────────────────────

const CITY_REG_SUMMARIES = {

  nyc: {
    regulatoryOverview: {
      items: [
        'Primary driver: Combined Sewer Overflow (CSO) reduction — ~60% of NYC is served by combined sewers.',
        'Unified Stormwater Rule (USWR), effective February 2022, consolidated NYC DEP stormwater requirements. Technical appendices (sizing, design examples) updated September 2024.',
        'NYS Construction General Permit GP-0-25-001 (effective January 2025) replaces GP-0-20-001 — adds climate risk requirements and references the 2024 NYS Stormwater Design Manual.',
        'Applies to projects with ≥20,000 SF soil disturbance OR ≥5,000 SF new impervious surface.',
        'MS4 areas require Water Quality Volume (WQv) retention; CSS areas require Sewer Operations Volume control.',
        'Local Law 92/94 (2019) mandates sustainable roofing (solar, green roof, or combo) on all new buildings and major roof renovations.'
      ],
      salesOneLiner: 'NYC requires stormwater management on most new projects, and LL 92/94 mandates green or solar roofing on all new buildings.'
    },
    soilConditions: {
      items: [
        'Urban fill dominates most of Manhattan, Brooklyn, and Queens — highly variable composition.',
        'Native soils where present are primarily glacial till and outwash: sandy loam to silty clay.',
        'Hydrologic Soil Group: Predominantly C and D (poor infiltration) due to fill and compacted urban soils.',
        'Implication: On-site infiltration is rarely feasible — regulations emphasize retention and controlled release rather than ground infiltration.',
        '⚠️ Site-specific geotechnical investigation always required; fill composition varies block to block.'
      ],
      salesOneLiner: 'Poor soils across most of the city — ground infiltration rarely works, so rooftop retention is the practical path.'
    },
    greenRoofRequirements: {
      items: [
        'Green roofs are effectively mandatory under Local Law 92/94: all new buildings and major roof renovations must install sustainable roofing (green roof, solar, or combination) on 100% of the Sustainable Roofing Zone.',
        'NYC DEP Green Infrastructure Grant Program can reimburse up to 100% of green roof installation costs on qualifying sites.',
        'Green roofs receive stormwater retention credit under the USWR — credited volume depends on media depth and system design.',
        'Extensive green roofs (4" media) credited at approximately 1.0" retention; intensive systems receive higher credits.',
        'Bio-solar (PV + green roof) satisfies both LL 92/94 sustainable roofing and DEP stormwater requirements simultaneously.'
      ],
      salesOneLiner: 'Green roofs are effectively mandatory (LL 92/94), and DEP grants can reimburse up to 100% of installation cost.'
    },
    tssRequirements: {
      items: [
        'NYC DEP requires 80% Total Suspended Solids (TSS) removal for post-construction stormwater management.',
        'Green roofs are an approved BMP that receives TSS removal credit — typically credited at 80-85% TSS reduction.',
        'The USWR accepts green roofs as a standalone BMP for TSS compliance when properly designed.',
        'Additional TSS measures (hydrodynamic separators, media filters) may be required for runoff from non-green-roof impervious areas.',
        'CSS areas: TSS reduction contributes to CSO pollutant load reduction targets.'
      ],
      salesOneLiner: '80% TSS removal required — green roofs are an approved standalone solution that meets this standard.'
    },
    retentionRequirements: {
      items: [
        'MS4 areas: Retain 1.5" WQv (Water Quality Volume) from all impervious surfaces.',
        'CSS areas: Retain 1.85" Sewer Operations Volume (SOV) to reduce combined sewer discharge.',
        'Retention must be achieved through approved on-site BMPs — green roofs, bioretention, permeable pavement, or cisterns.',
        'Curve Number (CN) method is the standard evaluation metric: pre-development CN compared to post-development with BMPs.',
        'Target CN varies by land use; typical post-development target with green roof: CN 55-65 (approximating meadow/woods in good condition).',
        '⚠️ NYC uses a modified CN approach specific to the USWR — verify against current DEP technical guidance.'
      ],
      salesOneLiner: 'Retain 1.5" (MS4) or 1.85" (CSS) on-site — green roofs are one of the primary approved methods.'
    },
    outflowRates: {
      items: [
        'CSS areas: Maximum release rate = the greater of 0.25 cfs or 10% of Allowable Flow (if Allowable Flow < 0.25 cfs, release = Allowable Flow).',
        'MS4 areas: Post-development peak flow must not exceed the site\'s Allowable Flow for 1-yr, 10-yr, and 100-yr storms.',
        'Converted to metric: 0.25 cfs/acre ≈ 17.4 l/s/ha (typical small-site CSS limit).',
        '⚠️ Actual allowable rate is site-specific, calculated based on downstream sewer capacity — not a flat rate.',
        'NYC does not use a simple l/s/ha standard; allowable flow is determined by DEP sewer capacity analysis for each connection point.'
      ],
      salesOneLiner: 'Outflow rates are site-specific based on DEP sewer capacity — not a simple flat limit.'
    },
    detentionRequirements: {
      items: [
        'NYC DEP requires on-site detention for sites in MS4 areas where post-development peak flows exceed pre-development rates.',
        'CSS areas: Detention is implicitly addressed by release rate controls — storage must be provided to limit outflow to allowable rate.',
        'Design storms: 1-year, 10-year, and 100-year events must be detained to pre-development peak flows.',
        'Minimum 24-hour drawdown for water quality detention volume.',
        '⚠️ Detention requirements vary by sewer shed — DEP site connection proposal (SCP) determines specific requirements.'
      ],
      salesOneLiner: 'On-site detention required to control peak flows to pre-development rates — varies by sewer shed.'
    },
    solarPvRequirements: {
      items: [
        'Local Law 92/94 (2019): All new buildings and major roof renovations must install solar PV, green roof, or a combination on 100% of the available roof area.',
        'Bio-solar (green roof + PV) satisfies both LL 92/94 and DEP stormwater requirements simultaneously — the strongest dual-compliance pathway.',
        'NY-Sun incentive (NYSERDA): MW Block incentives for commercial solar; stacks with federal ITC (30%) and NYC property tax abatement.',
        'NYC Property Tax Abatement for solar PV: Up to $5,000/kW or the cost of the system, reducing property taxes for 4 years.',
        'Climate Mobilization Act (LL 97): Buildings >25,000 SF face carbon emission caps starting 2024 — on-site solar directly reduces reported emissions.',
        '⚠️ NYC Fire Code setback requirements (3-6 ft from roof edge and between arrays) reduce usable PV area — bio-solar systems share setbacks efficiently.'
      ],
      salesOneLiner: 'LL 92/94 mandates solar or green roof on all new buildings — bio-solar satisfies both stormwater and energy requirements.'
    }
  },

  dc: {
    regulatoryOverview: [
      'Primary driver: Chesapeake Bay TMDL compliance and local water quality improvement.',
      'DC Stormwater Management Rule (2020 update) administered by DOEE (Dept. of Energy & Environment).',
      'Applies to projects with ≥5,000 SF of land disturbance.',
      'Unique feature: Tradable Stormwater Retention Credits (SRCs) create a market-based incentive for on-site retention.',
      'Green Area Ratio (GAR) requirements in most zoning districts push vegetated solutions including green roofs.'
    ],
    soilConditions: [
      'Piedmont/Coastal Plain transition zone — soils range from clay-rich residual soils in upper NW to alluvial deposits along the Anacostia and Potomac.',
      'Hydrologic Soil Group: Predominantly C and D in developed areas; some B soils in less-disturbed upland areas.',
      'Heavy Piedmont clays (Christiana series and similar residual soils) limit infiltration in many parts of the city.',
      'Implication: Infiltration-based BMPs face challenging soil conditions — retention and controlled release (including rooftop) are preferred.',
      '⚠️ Site-specific soil investigation required; alluvial areas near waterways may have different characteristics.'
    ],
    greenRoofRequirements: [
      'Green roofs are not strictly mandatory, but GAR (Green Area Ratio) requirements in most zones create strong incentive.',
      'GAR assigns landscape multipliers — green roofs receive a multiplier of 0.60 (extensive) to 0.80 (intensive), making them efficient for compliance.',
      'DOEE RiverSmart Rooftops program provides rebates for green roof installation.',
      'Green roofs generate SRCs that can be sold on the open market (average ~$1.40/gal/yr as of 2024; prices fluctuate) — creating ongoing revenue.',
      'Clean Energy DC targets 100% renewable by 2032; bio-solar (green roof + PV) addresses both stormwater and energy goals.'
    ],
    tssRequirements: [
      'DC stormwater rule requires 60% TSS removal for general runoff; 80% TSS removal required for vehicular surfaces (parking, driveways) draining to MS4 or waterways.',
      'Green roofs are an approved BMP credited with TSS removal — meeting the 60% general standard for captured volume.',
      'Phosphorus and nitrogen removal also required under Chesapeake Bay TMDL — green roofs receive pollutant removal credits for both.',
      'SRC calculations include pollutant removal benefits, increasing the credit value of green roofs vs. detention-only systems.',
      '⚠️ TSS removal credits may vary by green roof design — verify against current DOEE Stormwater Management Guidebook.'
    ],
    retentionRequirements: [
      'New development: Retain 1.2" SWRv (Stormwater Retention Volume) from all impervious surfaces.',
      'Major renovation: Retain 0.8" SWRv.',
      'SWRv must be achieved through on-site BMPs — infiltration, evapotranspiration (green roofs), or rainwater harvesting.',
      'Alternatively, retention credits can be purchased via SRC market or in-lieu fee ($4.71/gal as of Aug 2024, adjusted annually for CPI; applies to first 50% of requirement).',
      'CN (Curve Number) method used for volume calculations; typical urban post-development CN: 98 (impervious) reduced to 55-70 with BMPs.',
      'On-site retention is almost always more cost-effective than SRC purchase over the building lifecycle.'
    ],
    outflowRates: [
      '2-year storm: Post-development peak must not exceed pre-development peak discharge.',
      '15-year storm: Same peak flow control requirement.',
      'DC does not specify a flat l/s/ha rate — allowable discharge is site-specific based on pre-development conditions.',
      '⚠️ Typical pre-development release rates for urban sites range from 30-80 l/s/ha depending on existing imperviousness.',
      'Extended detention required for channel protection: 24-hour drawdown of the 1-year storm event.'
    ],
    detentionRequirements: [
      'Channel Protection Volume (Cpv): 24-hour extended detention of the 1-year, 24-hour storm event.',
      'Detention must be provided for 2-year and 15-year storms to reduce post-development peak to pre-development.',
      'DOEE requires a detention facility or BMP train that drawdowns the Cpv within 24 hours.',
      'Green roofs provide detention credit by attenuating peak flows and extending the runoff hydrograph.',
      '⚠️ SRC trades do not satisfy detention requirements — on-site flow control is still required even if retention credits are purchased.'
    ],
    solarPvRequirements: [
      'Clean Energy DC Omnibus Act: Targets 100% renewable energy by 2032 — strong policy driver for on-site solar.',
      'DC Solar for All program provides incentives for solar installation, particularly for affordable housing and community solar.',
      'Federal ITC (30%) + DC Renewable Energy Portfolio Standard (RPS) create favorable economics for rooftop PV.',
      'Bio-solar (green roof + PV) addresses both stormwater SRC generation and Clean Energy DC targets simultaneously.',
      'Green roofs generate tradable SRCs (~$1.40/gal/yr) while PV generates Solar Renewable Energy Credits (SRECs) — dual revenue stream.',
      '⚠️ DC Fire Code setback requirements apply to rooftop PV arrays — coordinate with green roof layout early in design.'
    ]
  },

  chicago: {
    regulatoryOverview: [
      'Primary driver: Combined sewer overflow reduction and flood control — Chicago has one of the largest combined sewer systems in the US.',
      'Chicago Stormwater Management Ordinance (2024 update) administered by DWM (Dept. of Water Management).',
      'Applies to ≥7,500 SF new/redeveloped impervious (regulated development threshold); O&M plan required at ≥15,000 SF.',
      'Volume control storage for the first 0.5" of runoff from impervious area, plus peak flow control for up to 100-yr storms.',
      'Green Permit Program fast-tracks permitting with fee waivers (up to $25,000) for buildings that incorporate green infrastructure.'
    ],
    soilConditions: [
      'Glacial lake plain soils — predominantly heavy clays (Hydrologic Soil Group D).',
      'Typical soils: Ashkum silty clay loam, Milford silty clay — very low infiltration rates (< 0.05 in/hr).',
      'Hydrologic Soil Group: Predominantly D across most of the city.',
      'Implication: Ground infiltration is extremely limited — Chicago regulations reflect this by emphasizing detention and controlled release rather than infiltration.',
      'Deep tunnel (TARP) system provides regional storage, but site-level management is still required.'
    ],
    greenRoofRequirements: [
      'Green roofs are not legally mandatory but are strongly incentivized through the Green Permit Program.',
      'Chicago was an early US adopter — City Hall green roof installed 2001, catalyzed the market.',
      'Green Permit provides expedited review and fee waivers (up to $25,000) for projects that include green roofs and achieve LEED certification.',
      'Green roofs count toward the 0.5" volume control requirement and receive stormwater fee credits.',
      'DWM recognizes green roofs as an approved BMP with quantified retention and detention credit.',
      '⚠️ The 2024 DWM regulation update may have adjusted incentive details — confirm current program terms.'
    ],
    tssRequirements: [
      '⚠️ Chicago requires TSS removal for post-construction stormwater — verify specific percentage in 2024 DWM ordinance manual.',
      'Green roofs are credited with TSS removal when properly designed — capturing the first 0.5" of runoff addresses the highest-concentration pollutant load.',
      'First-flush capture inherently addresses a significant portion of the TSS load (first flush carries the highest pollutant concentrations).',
      'For runoff volumes exceeding green roof capacity, supplemental TSS treatment may be needed.',
      'DWM Stormwater Management Manual includes green roofs in approved BMP list with TSS credits.'
    ],
    retentionRequirements: [
      'Volume control storage: retain the first 0.5" of runoff from all impervious surfaces using approved BMPs.',
      'Approved retention BMPs include green roofs, bioretention, permeable pavement, and cisterns.',
      'CN (Curve Number) method is used for peak flow calculations; TR-55 methodology is standard.',
      'Typical urban CN: 98 (impervious); green roof reduces effective CN to approximately 65-75 depending on depth.',
      'Due to HSG D soils, volume-based retention credit (not infiltration credit) is the primary design approach.',
      '⚠️ 2024 ordinance update may have refined retention calculation methodology — verify against current DWM guidance.'
    ],
    outflowRates: [
      'Sites ≤0.5 ac: max 0.15 cfs release (3" vortex restrictor).',
      'Sites 0.5–1.75 ac: interpolated 0.15–0.25 cfs release (4" vortex restrictor).',
      'At-grade open space: 1.0 cfs/acre.',
      'Sites >1.75 ac: post-development peak ≤ pre-development peak for 2-yr and 100-yr storms.',
      '⚠️ Site-specific hydrology required; DWM reviews each project individually based on downstream sewer capacity.'
    ],
    detentionRequirements: [
      'Volume control storage: Detain the first 0.5" of runoff from all impervious surfaces for controlled release.',
      '2-year and 100-year storms: Detention must reduce post-development peak to pre-development peak.',
      'TARP (Tunnel and Reservoir Plan) provides regional detention, but site-level detention is still required.',
      'DWM accepts green roofs for detention credit — attenuated release over 24-72 hours from green roof media.',
      '⚠️ 2024 DWM ordinance update may have revised detention sizing methodology — confirm current requirements.'
    ],
    solarPvRequirements: [
      'Illinois Future Energy Jobs Act (FEJA) and Climate & Equitable Jobs Act (CEJA): Illinois targets 40% renewable by 2030, 50% by 2040.',
      'Illinois Shines (formerly ABP): Adjustable Block Program provides upfront incentives for commercial rooftop solar.',
      'Chicago Green Permit Program: Bio-solar installations qualify for expedited permitting and fee waivers (up to $25,000).',
      'ComEd net metering available for systems up to 2 MW — favorable for large commercial rooftops.',
      'Green roofs improve PV efficiency by reducing ambient roof temperature — panels on green roofs produce 3-6% more energy than on conventional roofs.',
      '⚠️ Chicago wind loads are significant — PV mounting on green roofs must account for ballast and wind uplift per Chicago Building Code.'
    ]
  },

  boston: {
    regulatoryOverview: [
      'Primary drivers: Combined sewer overflow (CSO) reduction, Charles River and Boston Harbor water quality.',
      'Regulated by BWSC (Boston Water & Sewer Commission) for site drainage + MassDEP Stormwater Standards (10 standards).',
      'Article 37 (Green Building) applies to projects >50,000 SF GFA — LEED certifiable standard required.',
      '⚠️ New CSS connections may require I/I (Inflow/Infiltration) reduction ratio (verify specific ratio with BWSC) — makes stormwater management mandatory.',
      'Net Zero Carbon Zoning (effective July 2025) requires zero-emission new construction — multiple compliance pathways including solar, renewable energy contracts, and low-carbon design.'
    ],
    soilConditions: [
      'Boston sits on a mix of glacial till, marine clay (Boston Blue Clay), and historic fill (Back Bay, Seaport).',
      'Boston Blue Clay is a well-known marine deposit — extremely low permeability, HSG D.',
      'Hydrologic Soil Group: Predominantly C and D; some sandy outwash areas (B) in outer neighborhoods.',
      'Back Bay, Seaport, and East Boston are largely built on fill over tidal flats — variable and often poor infiltration.',
      'Implication: Ground infiltration is rarely viable — retention via rooftop systems and controlled release to sewers is the practical approach.',
      '⚠️ Groundwater levels are high in waterfront areas — subsurface BMPs face additional constraints.'
    ],
    greenRoofRequirements: [
      'Green roofs are not explicitly mandatory, but Article 37 (LEED certifiable) and BERDO (Building Emissions Reporting) create strong incentive.',
      'BWSC provides up to 30% stormwater fee credit for green roofs that manage on-site runoff.',
      'Net Zero Carbon Zoning (2025) requires zero-emission new construction — bio-solar (green roof + PV) is a strong compliance pathway.',
      'BERDO requires buildings ≥20,000 SF to meet emissions reduction targets — green roofs contribute to compliance.',
      'MassDEP Stormwater Standard #4 (80% TSS removal) can be partially met with green roof systems.',
      'MA SMART 3.0 solar incentive provides 10-20 year performance payments — stacks with green roof stormwater credits.'
    ],
    tssRequirements: [
      'MassDEP Stormwater Standard #4 requires 80% TSS removal (new developments may require 90% under updated standards).',
      'Green roofs are recognized as a BMP contributing to TSS removal — typically credited at 80%+ reduction for captured volume.',
      'Standard #4 also requires 44% phosphorus removal — green roofs provide nutrient removal credit.',
      'For projects in the Charles River watershed, additional phosphorus loading limits may apply.',
      'BWSC may require additional treatment beyond green roof for high-TSS source areas (parking, loading).',
      '⚠️ MassDEP BMP crediting varies by system design — verify current credit rates in the MA Stormwater Handbook.'
    ],
    retentionRequirements: [
      'Retain 1.0" for sites <100,000 SF; retain 1.25" for sites ≥100,000 SF.',
      'Retention volume must be managed through on-site BMPs prior to discharge to BWSC system.',
      'CN (Curve Number) method per TR-55 is the standard design approach.',
      'MassDEP Stormwater Standard #3: No new stormwater conveyances to wetlands or waterbodies without treatment.',
      'Standard #2: Post-development peak discharge ≤ pre-development for 2-yr and 10-yr storms (10-yr = 5.15" in Boston).',
      '⚠️ I/I reduction ratio for new CSS connections — verify specific ratio requirements with BWSC for the project sewer shed.'
    ],
    outflowRates: [
      '2-year storm: Post-development peak ≤ pre-development peak discharge.',
      '10-year storm (5.15"): Post-development peak ≤ pre-development peak discharge.',
      'BWSC does not use a flat l/s/ha rate — requirements are relative to pre-development conditions.',
      'For CSS areas, the 4:1 I/I ratio effectively limits new discharge to 25% of pre-existing inflow contribution.',
      '⚠️ Typical allowable rates vary significantly by sewer shed — BWSC approval required for each connection.',
      '⚠️ For reference, typical pre-development rates for urban Boston sites: 20-50 l/s/ha range for the 10-yr storm.'
    ],
    detentionRequirements: [
      'MassDEP Stormwater Standard #2: Post-development peak discharge ≤ pre-development for 2-yr and 10-yr storms.',
      'Extended detention of the 1-year storm for channel protection in sensitive receiving waters.',
      'BWSC requires detention facilities to drawdown within 72 hours to prevent vector breeding.',
      'CSS areas: The I/I ratio effectively mandates detention — new connections must offset inflow at 4:1.',
      '⚠️ Detention volume and drawdown requirements vary by sewer shed — BWSC site connection approval required.'
    ],
    solarPvRequirements: [
      'Net Zero Carbon Zoning (effective July 2025): All new construction must be zero-emission — on-site solar is a primary compliance pathway.',
      'MA SMART 3.0 (Solar Massachusetts Renewable Target): 10-20 year performance-based incentive payments for commercial solar.',
      'SMART adders: Additional incentives for solar on brownfields, parking canopies, and building-mounted systems — green roof base qualifies.',
      'BERDO (Building Emissions Reporting & Disclosure): Buildings ≥20,000 SF must meet emissions reduction targets — on-site PV reduces reported emissions.',
      'Federal ITC (30%) + MA SMART payments + net metering create strong economics for rooftop bio-solar.',
      '⚠️ Boston historic districts may have design review requirements for visible rooftop PV — coordinate with Landmarks Commission early.'
    ]
  },

  philadelphia: {
    regulatoryOverview: [
      'Primary driver: Green City, Clean Waters — a $2.4B, 25-year green infrastructure initiative to reduce CSOs.',
      'PWD (Philadelphia Water Department) Stormwater Management Guidance Manual (v3.3) governs all development.',
      'Applies to ≥15,000 SF earth disturbance (5,000 SF in Darby/Cobbs Creek watershed) OR any new connection to the public stormwater system.',
      'First-inch retention from all Directly Connected Impervious Area (DCIA) is the core requirement.',
      'Parcel-based stormwater billing creates a direct financial incentive for every property owner to manage runoff.'
    ],
    soilConditions: [
      'Piedmont/Coastal Plain transition — soils range from Piedmont residual clays in NW to Coastal Plain sands in South/SW.',
      'Common soil series: Manor (stony loam), Chester (silt loam) in Piedmont; Sassafras (sandy loam) in Coastal Plain.',
      'Hydrologic Soil Group: Mixed — B in sandy Coastal Plain areas, C-D in Piedmont clay areas.',
      'Urban fill is prevalent in older developed areas, particularly Center City and along the Delaware/Schuylkill waterfronts.',
      'Implication: Infiltration is site-specific — feasible in sandy areas (South/SW Philly) but challenging on Piedmont clays. PWD accepts both infiltration and non-infiltration BMPs.'
    ],
    greenRoofRequirements: [
      'Green roofs are not mandatory but are one of the most effective BMPs for meeting the first-inch DCIA requirement on constrained sites.',
      'PWD stormwater fee credits can offset up to 100% of the stormwater bill for projects that manage runoff on-site.',
      'Green roofs receive direct DCIA disconnection credit — the green roof area is removed from DCIA calculations.',
      'PWD Stormwater Management Guidance Manual provides specific design criteria and credit calculations for green roofs.',
      'Solarize Philly program provides group-buying discounts for solar — bio-solar systems address both stormwater and energy.'
    ],
    tssRequirements: [
      'PWD requires 80% TSS removal per the federal MS4 permit and CSO Long-Term Control Plan.',
      'Green roofs are approved BMPs with TSS removal credit — capturing the first inch inherently addresses the highest-TSS volume.',
      'PWD\'s Green City, Clean Waters plan ($2.4B over 25 years) relies heavily on green infrastructure (including green roofs) for pollutant load reduction.',
      'Additional treatment may be required for high-pollutant source areas (gas stations, industrial sites).',
      'Stormwater fee credit calculations factor in both volume reduction and pollutant removal from green BMPs.'
    ],
    retentionRequirements: [
      'Retain the first 1.0" of rainfall from all Directly Connected Impervious Area (DCIA).',
      'For larger sites, PWD may require retention of up to 1.5" depending on downstream conditions.',
      'NRCS CN (Curve Number) method is the standard volume calculation approach.',
      'Typical post-development CN for impervious: 98; green roof-mitigated area: 65-75.',
      'PWD accepts green roofs, bioretention, permeable pavement, subsurface infiltration, and cisterns as retention BMPs.',
      'Channel Protection Volume (CPv): extended detention of the post-development 1-year, 24-hour storm (2.83") with drawdown in ≤72 hours.'
    ],
    outflowRates: [
      'Channel Protection: 24-hour extended detention of 1-year storm — limits effective peak release.',
      'PWD does not specify a flat l/s/ha rate — peak flow control is relative to pre-development hydrology.',
      'For reference, typical pre-development urban release: 30-60 l/s/ha for the 10-year storm.',
      '⚠️ PWD reviews each project\'s drainage analysis individually — allowable rates depend on downstream sewer capacity.',
      'Green roofs reduce peak discharge by attenuating rainfall and reducing total runoff volume — PWD quantifies this in their BMP calculations.'
    ],
    detentionRequirements: [
      'Channel Protection Volume (CPv): Extended detention of the 1-year, 24-hour storm (2.83") with drawdown in ≤72 hours.',
      'Overbank flood protection: Detain 2-yr through 100-yr events to pre-development peak discharge rates.',
      'PWD requires detention sizing using the Modified Rational Method or NRCS Unit Hydrograph approach.',
      'Green roofs receive detention credit — media storage + controlled orifice release qualifies as detention BMP.',
      '⚠️ PWD reviews detention facility sizing and outlet control on a per-project basis — no simplified standard applies.'
    ],
    solarPvRequirements: [
      'Solarize Philly: City-supported group-buying program reduces solar installation costs for commercial and residential properties.',
      'Philadelphia Energy Authority (PEA) promotes on-site solar as part of the Powering Philadelphia initiative.',
      'PA net metering: Available for systems up to 3 MW behind the meter — favorable for large commercial rooftops.',
      'Federal ITC (30%) + PA SREC-II program (Solar Renewable Energy Credits) provide dual financial incentives.',
      'Bio-solar addresses both PWD stormwater fee reduction (up to 100% credit) and on-site energy generation — strong dual ROI.',
      '⚠️ PECO interconnection process can take 4-8 weeks for commercial systems — factor into project schedule.'
    ]
  },

  nashville: {
    regulatoryOverview: [
      'Primary driver: Flood control and water quality — Nashville experienced catastrophic flooding in 2010 ($2B+ damage).',
      'Metro Nashville Stormwater Management Manual (2021) administered by Metro Water Services.',
      'Applies to projects with ≥10,000 SF cumulative impervious (stricter in special flood hazard and buffer areas).',
      'Dual requirements: Water Quality (WQ) volume capture + peak flow rate control for multiple storm events.',
      'NPDES MS4 permit requires post-construction stormwater management for all qualifying developments.'
    ],
    soilConditions: [
      'Nashville Basin is predominantly limestone karst terrain underlain by Ordovician-age limestone.',
      'Typical soils: Maury silt loam (well-drained, B), Mimosa-Braxton complex (moderately well-drained, C).',
      'Hydrologic Soil Group: Mixed B and C — better than many major cities but karst creates unique challenges.',
      'Karst features (sinkholes, solution channels) are common — infiltration BMPs must avoid directing water into karst voids.',
      'Implication: While soils can support some infiltration, karst risk pushes many sites toward retention/detention rather than direct infiltration.',
      '⚠️ Karst assessment required for sites in the Inner Basin — consult Metro Nashville sinkhole database.'
    ],
    greenRoofRequirements: [
      'Green roofs are not mandatory — Nashville does not have a green roof ordinance or building requirement.',
      'Metro Nashville accepts green roofs as an approved BMP for WQ volume management.',
      'Stormwater fee credit is available for properties that manage runoff on-site, including via green roof.',
      'TVA Green Invest program supports renewable energy/green infrastructure but does not specifically target green roofs.',
      'Market is less mature than coastal cities — opportunity to educate engineers and developers on rooftop stormwater management.'
    ],
    tssRequirements: [
      'Nashville requires 80% TSS removal as part of the Water Quality volume management standard (1.0" WQ event).',
      'Green roofs can contribute to TSS compliance — capturing the WQ event (1.1") addresses the first-flush pollutant load.',
      'Metro Nashville Stormwater Manual lists green roofs among approved BMPs with pollutant removal credits.',
      'Additional TSS treatment may be needed for ground-level impervious areas not managed by rooftop BMPs.',
      '⚠️ Specific TSS removal credit percentages for green roofs should be confirmed in current Metro Nashville BMP manual.'
    ],
    retentionRequirements: [
      'Capture and treat the Water Quality Volume (WQv): 1.0" event (preceded by 72-hr dry period) from all impervious surfaces.',
      'WQv can be managed through retention (infiltration, evapotranspiration) or treatment (filtration, settling).',
      'CN (Curve Number) method per NRCS TR-55 is the standard for peak flow calculations.',
      'Typical Nashville urban CN: 80-90 (developed); target with BMPs: 65-75.',
      'Metro Nashville uses the Critical Storm Method for some detention sizing — verify which method applies to the specific project.'
    ],
    outflowRates: [
      'Peak flow control required for 2-yr, 10-yr, 25-yr, and 100-yr storm events.',
      'Post-development peak flow must not exceed pre-development peak flow for each design storm.',
      'Nashville does not use a flat l/s/ha standard — control is relative to pre-development conditions.',
      'For reference, typical undeveloped Nashville site (CN 65-70): approximately 15-30 l/s/ha for the 10-year storm.',
      '⚠️ Site-specific hydrology required; Metro Water Services reviews each project\'s drainage study.',
      '⚠️ Special Flood Hazard Areas may have additional flow restrictions beyond standard requirements.'
    ],
    detentionRequirements: [
      'Peak flow detention required for 2-yr, 10-yr, 25-yr, and 100-yr storm events to pre-development rates.',
      'Water Quality Volume (WQv): 1.0" must be captured and treated — detention of the WQ event with 24-48 hour drawdown.',
      'Metro Nashville uses the Critical Storm Method for detention sizing in some watersheds.',
      'Green roofs provide detention credit by attenuating and delaying peak runoff — quantified in TR-55 routing.',
      '⚠️ Post-2010 flood regulations may impose enhanced detention in Special Flood Hazard Areas — verify with Metro Water Services.'
    ],
    solarPvRequirements: [
      'TVA Green Invest program: Allows large commercial customers to source renewable energy — supports corporate ESG commitments.',
      'Tennessee has no state renewable portfolio standard (RPS) — solar adoption is market-driven, not mandated.',
      'Nashville Electric Service (NES) net metering: Available for systems up to 1 MW — favorable for commercial rooftops.',
      'Federal ITC (30%) is the primary financial driver for solar in Nashville — no state-level solar tax credits or SREC market.',
      'Nashville Climate Action Plan (2021) encourages on-site renewable energy — bio-solar aligns with city sustainability goals.',
      '⚠️ Nashville has high solar irradiance (~4.8 kWh/m²/day) — good production potential but no strong regulatory mandate for solar.'
    ]
  },

  seattle: {
    regulatoryOverview: [
      'Primary driver: Salmon habitat protection and Puget Sound water quality.',
      'Seattle Stormwater Code (SMC 22.800) + King County Surface Water Design Manual (SWDM).',
      'Applies to ≥2,000 SF new + replaced impervious surface — one of the lowest thresholds in the US.',
      'Low Impact Development (LID) is required as the first priority — must demonstrate infeasibility before using conventional BMPs.',
      'Flow Duration Standard is the most stringent flow control requirement: match forested condition for ½ of 2-yr through 50-yr peaks.'
    ],
    soilConditions: [
      'Glacial deposits dominate — Vashon till (dense, compacted) overlying Vashon advance outwash (permeable gravels).',
      'Typical soils: Alderwood gravelly sandy loam (till over outwash), Everett gravelly sandy loam (outwash).',
      'Hydrologic Soil Group: C-D for Alderwood (till); A-B for Everett and similar outwash soils.',
      'Seattle has highly variable soil conditions — till is nearly impermeable while outwash gravels drain rapidly.',
      'Implication: Infiltration is excellent where outwash is accessible but impractical on till. Many urban sites have been regraded, mixing soil types.',
      '⚠️ Geotechnical borings critical — till depth varies significantly, sometimes within a single site.'
    ],
    greenRoofRequirements: [
      'Green roofs are not mandatory but qualify as LID BMPs — satisfying Seattle\'s first-priority LID requirement.',
      'RainWise rebate program: up to ~$7.90/SF for green roofs in eligible combined sewer basins (rates increased significantly in 2023-2024).',
      'Seattle Living Building Ordinance encourages green roofs in certain zones.',
      'SPU credits green roofs for both retention (evapotranspiration) and flow control (detention).',
      'WA State Clean Energy Transformation Act (CETA) and net metering support bio-solar systems.',
      'On constrained urban sites, green roofs may be the only feasible LID option — strengthens the case.'
    ],
    tssRequirements: [
      'Seattle requires Enhanced Treatment (for basic water quality) or equivalent: 80% TSS removal standard.',
      'Pollution-generating impervious surfaces (PGIS) — roads, parking, industrial — require treatment.',
      'Green roofs are credited for TSS removal on non-pollution-generating surfaces.',
      'For PGIS, additional treatment (bioretention, media filter) is typically required beyond what a green roof provides.',
      '⚠️ Seattle distinguishes between basic, enhanced, and oil-control treatment levels — green roof credit level should be confirmed in current SPU guidance.'
    ],
    retentionRequirements: [
      'LID Performance Standard: Infiltrate, disperse, or retain stormwater on-site to match pre-development (forested) hydrology.',
      'Flow Duration Standard: Post-development flow duration must match forested condition for range from 50% of 2-yr to 50-yr peak.',
      'This is one of the most stringent standards in the US — equivalent to retaining the vast majority of annual rainfall volume.',
      'Seattle uses continuous simulation modeling (WWHM or MGS Flood) rather than single-event CN method.',
      'CN is not the primary design tool — Western Washington Hydrology Model (WWHM) runs continuous hourly precipitation for 50+ years of record.',
      '⚠️ Design methodology is significantly different from East Coast/Midwest CN-based approach — ensure design team uses WWHM.'
    ],
    outflowRates: [
      'Flow Duration Standard: Outflow at any rate between 50% of the 2-yr peak and the 50-yr peak must not exceed the duration of that flow rate under forested conditions.',
      'This is NOT a simple peak rate limit — it controls the entire flow-duration curve.',
      'For simplified reference: Matching forested condition typically limits effective release to approximately 5-15 l/s/ha for the 2-year storm.',
      '⚠️ The flow duration standard cannot be accurately expressed as a single l/s/ha value — continuous simulation is required.',
      'King County Surface Water Design Manual provides detailed methodology and flow control targets.'
    ],
    detentionRequirements: [
      'Flow Duration Standard effectively functions as a detention requirement — storage must match forested-condition flow durations.',
      'Detention sizing uses continuous simulation (WWHM or MGS Flood) — NOT single-event methods like TR-55.',
      'The flow-duration approach requires more detention volume than simple peak-rate matching — this is one of the most demanding standards in the US.',
      'Green roofs provide detention credit in WWHM modeling — soil moisture storage and controlled release are modeled hourly.',
      '⚠️ Do not attempt to size detention using TR-55 or Rational Method — WWHM continuous simulation is required by King County/Seattle.'
    ],
    solarPvRequirements: [
      'WA Clean Energy Transformation Act (CETA): Requires 100% clean electricity by 2045 — strong state-level driver for on-site solar.',
      'Seattle City Light is already ~90% hydroelectric — adding rooftop solar further reduces grid carbon intensity.',
      'WA State net metering: Available for systems up to 100 kW; larger systems use customer-generated power agreements.',
      'Federal ITC (30%) + WA sales tax exemption on solar equipment (through 2029) improve project economics.',
      'RainWise rebates for green roofs (~$7.90/SF) can be combined with solar incentives — bio-solar maximizes both stormwater and energy value.',
      '⚠️ Seattle has moderate solar irradiance (~3.6 kWh/m²/day) — lower than sunbelt cities but still viable with current incentives.'
    ]
  },

  san_francisco: {
    regulatoryOverview: [
      'Primary driver: Combined sewer overflow reduction and Bay water quality protection.',
      'San Francisco Stormwater Management Requirements (SMR) administered by SFPUC.',
      'Applies to projects with ≥5,000 SF of new or replaced impervious surface in combined sewer areas (≥2,500 SF in separate sewer areas).',
      'LID-based approach: Manage the 25th percentile storm event (approximately 0.75") via on-site LID.',
      'Better Roofs Ordinance: 15-30% of roof area must be solar or living roof on new construction ≥2,000 SF.'
    ],
    soilConditions: [
      'San Francisco soils are primarily Franciscan Complex-derived — sandstone, shale, and serpentinite weathering products.',
      'Typical soils: Urban land-Orthents complex (fill), Candlestick-Kron complex (clay loam on steep slopes).',
      'Hydrologic Soil Group: Predominantly C and D — clay-rich and often shallow to bedrock.',
      'Western neighborhoods (Sunset, Richmond) have sandy soils (Dune sand deposits) with better infiltration (HSG A-B).',
      'Implication: Infiltration potential varies dramatically by neighborhood — sandy west side vs. clay east side. Many sites use fill.',
      '⚠️ Seismic considerations are paramount — subsurface BMP design must account for liquefaction potential.'
    ],
    greenRoofRequirements: [
      'Better Roofs Ordinance (2017): 15-30% of roof area on new buildings ≥2,000 SF must be solar OR living roof (green roof).',
      'Bio-solar (OverEasy VPV on green roof) satisfies both the solar and living roof requirements simultaneously.',
      'SFPUC stormwater fee credit available for green roofs that manage on-site runoff.',
      'Green roofs count toward the 25th percentile storm retention requirement under the SMR.',
      'SF has a Mediterranean climate (dry summers) — irrigation considerations differ from East Coast green roofs.',
      'Lightweight extensive systems (<25 psf saturated) are preferred due to seismic weight considerations.'
    ],
    tssRequirements: [
      'SFPUC SMR requires LID-based treatment of the 25th percentile storm — inherently addresses TSS for that volume.',
      'Green roofs capture and treat the design storm volume, providing effective TSS removal for captured rainfall.',
      'No separate numeric TSS percentage target in the SMR — compliance is achieved by meeting the LID performance standard.',
      'Bay Area Regional Water Quality Control Board may impose additional TMDLs for specific pollutants in some watersheds.',
      '⚠️ Mercury and PCB TMDLs affect some SF watersheds — verify if additional pollutant-specific treatment is needed.'
    ],
    retentionRequirements: [
      'Retain the 25th percentile, 24-hour storm event (approximately 0.75") from all project impervious surfaces.',
      'Retention via LID: infiltration, evapotranspiration (green roofs), or rainwater harvesting.',
      'CN method is used for volume calculations where applicable, though SF often uses the Rational Method for peak flows.',
      'Low annual rainfall (23.6") means green roofs can capture a high percentage of annual precipitation — high retention effectiveness.',
      'Mediterranean climate: most rainfall occurs November-March — summer maintenance differs from humid-climate green roofs.'
    ],
    outflowRates: [
      'Post-development flow duration must not exceed pre-development for the range of storms up to the 25th percentile event.',
      'SF does not specify a flat l/s/ha rate — requirements are LID performance-based.',
      'For combined sewer areas, SFPUC manages downstream capacity — site-level flow control reduces CSO frequency.',
      '⚠️ Allowable rates depend on specific sewer shed capacity — SFPUC reviews each project.',
      'For reference, managing the 0.75" event equates to approximately controlling flows up to 5-10 l/s/ha in a typical 24-hr event.'
    ],
    detentionRequirements: [
      'LID-based approach: Manage the 25th percentile storm on-site — detention is achieved through LID storage, not traditional ponds.',
      'Combined sewer areas: SFPUC manages system-level detention — site-level LID reduces inflow to combined system.',
      'SF does not typically require traditional detention basins — LID performance-based compliance is the standard.',
      'Green roofs provide effective detention by absorbing and slowly releasing rainfall — well-suited to SF\'s Mediterranean storm patterns.',
      '⚠️ Large projects may have additional detention or rate control requirements — verify with SFPUC on a project-specific basis.'
    ],
    solarPvRequirements: [
      'Better Roofs Ordinance (2017): 15-30% of roof area on new buildings ≥2,000 SF must be solar PV or living roof — bio-solar satisfies both.',
      'CA Solar Mandate (Title 24): Commercial buildings have prescriptive solar requirements based on conditioned floor area.',
      'SF has excellent solar irradiance (~5.0 kWh/m²/day) — among the best production potential of any major US city.',
      'NEM 3.0 (Net Billing): California shifted to export-based compensation in 2023 — favors self-consumption and on-site storage.',
      'Federal ITC (30%) + CA SGIP (Self-Generation Incentive Program for storage) + SF GoSolarSF incentive support rooftop solar.',
      '⚠️ Seismic loading requirements affect PV mounting design — lightweight bio-solar systems reduce structural impact vs. ballasted racking.'
    ]
  },

  toronto: {
    regulatoryOverview: [
      'Toronto\'s stormwater management framework is governed by the Wet Weather Flow Management Guidelines (WWFMG) and enforced through the Toronto Green Standard (TGS), currently at Version 4.',
      'Primary Drivers: Reducing Combined Sewer Overflows (CSOs) to Lake Ontario, protecting tributary streams from erosion, and achieving long-term water quality targets (80% TSS removal).',
      'All developments subject to Site Plan Approval must comply with WWFMG water balance, water quality, and water quantity controls.',
      'TGS applies mandatory Tier 1 performance measures to all new planning applications received after May 1, 2022.',
      'TGS has different requirement tiers by building type: (1) low-rise residential, (2) mid to high-rise residential & non-residential, and (3) City agency, corporation & division-owned facilities.'
    ],
    soilConditions: [
      'Toronto\'s subsurface is dominated by glacial till deposits from the last ice age, creating challenging infiltration conditions across most of the city.',
      'Predominant soils are silty clays and clayey silts, classifying as HSG C and D (low to very low infiltration capacity, typically < 1.3 mm/hr for HSG D).',
      'Localized Exceptions: Sandy glacial outwash deposits exist along portions of the waterfront and in the Scarborough Bluffs area, occasionally yielding HSG B conditions.',
      'Due to pervasive low-permeability soils, Toronto\'s regulations emphasize evapotranspiration and water reuse (green roofs, rainwater harvesting) over pure infiltration.',
      'Underdrained bioretention facilities and "lined" green infrastructure systems are standard practice where native soil infiltration rates fail geotechnical feasibility thresholds.'
    ],
    greenRoofRequirements: [
      'Green roofs were legally mandatory in Toronto under the Green Roof Bylaw (Chapter 492) from 2010 to 2025. As of November 3, 2025, the Bylaw is no longer applicable law under the Ontario Building Code.',
      'Legacy Requirements (2010–2025): New buildings with GFA ≥ 2,000 m² were required to provide green roof coverage of 20–60% of Available Roof Space, scaled by building size.',
      'Current Status: Green roofs are now voluntary for private development. However, the City continues to mandate green roofs on its own buildings (50% coverage minimum under TGS category 3: City agency, corporation & division-owned facilities).',
      'TGS Tier 1 remains mandatory for private buildings (categories 1 & 2), and green roofs play an important role in the Water Quality & Efficiency section — WQ 1.1 Water Balance, Quality & Quantity Control and WQ 1.3 On-site Green Infrastructure.',
      'Eco-Roof Incentive Program: $100/m² grants for green roofs (up to $100,000) to encourage voluntary installation on existing buildings.',
      '⚠️ Legality of continued TGS green roof requirements is controversial — the provincial bill that repealed the Green Roof Bylaw aimed to remove all municipal green standards.'
    ],
    tssRequirements: [
      'TSS reduction is mandatory in Toronto. The WWFMG and TGS establish explicit Total Suspended Solids removal targets as a core water quality criterion.',
      'Mandatory Reduction Target: 80% removal of TSS from stormwater runoff on an average annual basis, aligning with the Ontario MECP Enhanced Protection Level standard.',
      'Water Quality Volume: Treatment required for runoff from the first 25 mm of rainfall over the contributing drainage area.',
      'Green Roof TSS Credit: Extensive green roofs (100–150 mm media depth) are credited with 70–85% TSS removal for rainfall captured within the system\'s retention capacity. No further treatment necessary for a green roof.',
      'Other Approved TSS Removal Efficiencies: Oil-Grit Separator (OGS) 50–60%; Bioretention/Bioswale 80–90%; Constructed Wetland 80–85%; Sand Filter 80–85%; Permeable Pavement 70–80%.',
      'Treatment Train Approach: When a single practice cannot achieve 80% TSS removal, Toronto permits combining multiple practices in series (e.g., green roof + OGS for roof and hardscape runoff).'
    ],
    retentionRequirements: [
      'TGS and WWFMG establish a strict retention-first hierarchy prioritizing vegetated and nature-based Stormwater Management Practices (SMPs).',
      'Water Balance Mandate (TGS Tier 1, WQ 1.1): Sites must retain a minimum of 50% of total average annual rainfall volume, equivalent to 5 mm from each rainfall event, through infiltration, evapotranspiration, or rainwater harvesting/reuse.',
      'Green Infrastructure Requirement (TGS Tier 1, WQ 1.3): Sites must include at least one of: biodiverse green roof ≥ 50% of Green Roof Area; intensive green roof (≥ 150 mm media) ≥ 80% of Green Roof Area; green roof ≥ 80% of Available Roof Space; at-grade bioretention capturing 75% of hardscape runoff; or 25% of Lot Area planted with native pollinator species.',
      'Toronto uses Curve Numbers (CN) per USDA NRCS TR-55 methodology. Initial Abstraction (IA) values for green roofs: 5 mm for extensive systems; 7 mm for intensive systems per WWFMG.',
      'Metric units standard: retention volumes specified in mm of rainfall depth over contributing area.'
    ],
    outflowRates: [
      'The allowable post-development peak flow up to the 100-year storm event must not exceed the 2-year pre-development flow rate.',
      'Toronto 2-year IDF: I = 21.8 × T^(−0.78), where T = time of concentration. At Tc = 10 min → I = 88.2 mm/hr.',
      'Using Modified Rational Method: Q = 2.78 × C × I × A → Q/A = 2.78 × C × 88.2 = 245 × C (l/s/ha).',
      'Most Toronto projects are redevelopment (e.g., old shopping plaza to condo) with high pre-development C (0.7–0.9). WWFMG states C ≤ 0.5 shall be used for pre-development, yielding a 2-year release rate of 122 l/s/ha.',
      'Allowable post-development peak flow up to the 100-year storm: 122 l/s/ha.',
      '⚠️ Toronto Region Conservation Authority (TRCA) may impose additional flow restrictions for sites near ravines or watercourses. Allowable rates are project-specific — confirm with Toronto Water and/or TRCA.'
    ],
    detentionRequirements: [
      'TGS Tier 1: On-site detention required to control post-development peaks up to the 100-year storm to the 2-year pre-development rate.',
      'Water balance: TGS requires maintaining pre-development water balance — detention alone is insufficient without retention.',
      'TRCA may require extended detention (48-72 hour drawdown) for sites draining to ravine systems.',
      'Green roofs provide detention credit — TGS quantifies the attenuation benefit in stormwater modeling.',
      '⚠️ Detention requirements may be more stringent for sites in TRCA-regulated flood plains or near erosion-prone ravines.'
    ],
    solarPvRequirements: [
      'Ontario Net Metering: Available for systems up to 500 kW — commercial rooftop solar feeds excess generation back to the grid.',
      'Canada Greener Homes Grant and CMHC Green Home programs provide incentives for residential solar; commercial incentives are more limited.',
      'TGS Tier 2+ incentivizes on-site renewable energy through development charge refunds — bio-solar qualifies.',
      'Green Roof Bylaw was repealed Nov 3, 2025 — green roofs are now voluntary for private development, but adding PV to a green roof remains an efficient use of roof space for TGS compliance.',
      'Eco-Roof Incentive Program ($100/m² rebate) can be combined with solar installation on the same roof.',
      '⚠️ Ontario electricity rates are lower than most US states — solar ROI depends more on incentives and avoided demand charges than energy savings alone.'
    ]
  },

  ohio_statewide: {
    regulatoryOverview: [
      'Primary driver: NPDES MS4 permit compliance and Ohio EPA post-construction stormwater management.',
      'Ohio EPA Construction General Permit (CGP) governs projects with ≥1 acre of soil disturbance.',
      'Local MS4 permittees (cities, counties) often have stricter requirements than state minimums.',
      'Post-construction BMP required for all qualifying developments — permanent stormwater management.',
      'Ohio EPA Water Resource Restoration Sponsor Program (WRRSP) provides incentives for green infrastructure.'
    ],
    soilConditions: [
      'Ohio soils vary significantly by region — glaciated (north/central) vs. unglaciated (southeast).',
      'Glaciated areas: heavy clay tills (Hoytville, Pewamo series) in NW; silty clay loam in central (Crosby, Celina).',
      'Unglaciated SE Ohio: Gilpin-Upshur-Wellston complex — silt loam over shale, moderate to poor drainage.',
      'Hydrologic Soil Group: Predominantly C-D across glaciated areas; mixed B-C in unglaciated regions.',
      'Implication: Statewide, many soils have limited infiltration — detention and retention approaches often more practical than infiltration.',
      '⚠️ Soil conditions are highly variable by county — site-specific investigation required.'
    ],
    greenRoofRequirements: [
      'No statewide green roof mandate — Ohio does not have a green roof ordinance at any level of government.',
      'Ohio EPA accepts green roofs as an approved post-construction BMP under the CGP.',
      'Local stormwater fee credit programs (Columbus, Cleveland, Cincinnati) incentivize green roofs.',
      'Ohio PACE (Property Assessed Clean Energy) financing can be used for green roof and solar installation.',
      'Market is developing — green roof awareness is lower than coastal cities but growing, especially in Columbus and Cleveland.'
    ],
    tssRequirements: [
      'Ohio EPA requires 80% TSS removal for post-construction stormwater management.',
      'Green roofs provide TSS removal credit for captured rainfall volume — accepted in Ohio EPA BMP manual.',
      'WQv (Water Quality Volume) capture of the 0.90" event inherently addresses the highest-TSS first flush.',
      'Additional TSS treatment may be required for ground-level impervious not managed by rooftop BMPs.',
      '⚠️ TSS credit rates for green roofs vary by local MS4 authority — check specific municipality.'
    ],
    retentionRequirements: [
      'WQv: Retain 0.90" per Ohio EPA CGP statewide standard; some local MS4 communities may require more.',
      'Ohio EPA accepts volume-based retention or treatment-based approaches for WQv compliance.',
      'CN (Curve Number) method per NRCS TR-55 is the standard statewide design approach.',
      'Critical Storm Method: Some Ohio communities require sizing detention to control the "critical storm" — the storm whose post-development peak most exceeds pre-development.',
      'Typical urban CN: 85-98; with green roof BMP: 65-75.',
      '⚠️ Requirements vary significantly by MS4 authority — confirm with specific municipality.'
    ],
    outflowRates: [
      'Critical Storm Method: Control post-development peak to ≤ pre-development for the critical storm event.',
      '1-year extended detention: 24-hour drawdown of the 1-year, 24-hour storm (common in many Ohio communities).',
      'Ohio does not have a statewide flat l/s/ha rate — requirements are relative to pre-development conditions.',
      'For reference, typical undeveloped Ohio site (CN 65-70): approximately 15-25 l/s/ha for the 10-year storm.',
      '⚠️ Check specific MS4 community requirements — Columbus, Cleveland, and Cincinnati each have distinct standards.'
    ],
    detentionRequirements: [
      'Critical Storm Method: Detention sized to control the storm event whose post-development peak most exceeds pre-development.',
      '1-year extended detention: 24-hour drawdown of the 1-year, 24-hour storm is common across many Ohio MS4 communities.',
      'Ohio EPA CGP requires post-construction BMPs that include detention or retention for qualifying developments.',
      'Green roofs provide detention credit — media storage attenuates peak flows for small and moderate storms.',
      '⚠️ Detention requirements vary significantly by MS4 community — Columbus, Cleveland, and Cincinnati each have distinct standards.'
    ],
    solarPvRequirements: [
      'Ohio PACE (Property Assessed Clean Energy): Financing available for commercial solar and green roof installations — repaid through property tax assessment.',
      'Ohio does not have a mandatory RPS for investor-owned utilities (frozen in 2019) — solar adoption is largely market-driven.',
      'Federal ITC (30%) is the primary financial driver for commercial solar in Ohio.',
      'AEP Ohio, Duke Energy Ohio, and FirstEnergy offer varying net metering and interconnection terms — check specific utility.',
      'Ohio EPA WRRSP (Water Resource Restoration Sponsor Program) supports green infrastructure — bio-solar projects may qualify.',
      '⚠️ Ohio solar irradiance is moderate (~4.0 kWh/m²/day) — project economics depend heavily on federal ITC and utility rate structure.'
    ]
  },

  columbus_oh: {
    regulatoryOverview: [
      'Primary drivers: MS4 permit compliance, Scioto River and Big Walnut Creek water quality.',
      'Columbus Stormwater Drainage Manual + Ohio EPA CGP govern stormwater management.',
      'City of Columbus Department of Public Utilities reviews all stormwater management plans.',
      'Franklin County also has jurisdiction over unincorporated areas with separate requirements.',
      'Columbus Climate Action Plan (2021) encourages green infrastructure and renewable energy adoption.'
    ],
    soilConditions: [
      'Columbus sits on glacial till plains — predominantly heavy clay soils (HSG C-D).',
      'Typical soils: Crosby silt loam, Kokomo silty clay loam — poor natural drainage.',
      'Hydrologic Soil Group: Predominantly C-D across the metro area.',
      'Scioto River floodplain has alluvial soils with variable drainage — some areas better for infiltration.',
      'Implication: Clay soils limit infiltration in most of Columbus — retention and controlled release are the practical approach.',
      '⚠️ Eastern suburbs (Gahanna, Reynoldsburg) may have slightly better drainage — site-specific testing required.'
    ],
    greenRoofRequirements: [
      'No green roof mandate in Columbus — adoption is voluntary and incentive-based.',
      'Columbus accepts green roofs as an approved post-construction BMP in their Stormwater Drainage Manual.',
      'Columbus Green Business Program provides recognition and some incentives for sustainable building practices.',
      'Ohio PACE financing available for green roof and solar installations.',
      'OSU campus and Nationwide Children\'s Hospital have institutional sustainability mandates that drive adoption.',
      'Short North and Franklinton redevelopment projects on constrained lots benefit from rooftop BMPs.'
    ],
    tssRequirements: [
      'Columbus follows Ohio EPA 80% TSS removal requirement for post-construction stormwater.',
      'Green roofs receive TSS credit for captured volume — consistent with Ohio EPA BMP manual.',
      'The 0.90" WQv capture addresses the first-flush pollutant load where TSS concentrations are highest.',
      'Ground-level runoff from parking and roadways may require additional treatment beyond green roof.',
      '⚠️ Confirm current TSS credit methodology in Columbus Stormwater Drainage Manual — may have been updated.'
    ],
    retentionRequirements: [
      'WQv: 0.90" from all developed impervious area (per Ohio EPA CGP standard).',
      'Critical Storm Method: Size detention to control the storm event whose post-development peak most exceeds pre-development.',
      'CN (Curve Number) method is the standard design approach, per NRCS TR-55.',
      'Typical Columbus urban CN: 85-98 (developed); with green roof: 65-75.',
      'Columbus may accept WQv management through retention (infiltration, evapotranspiration) or treatment (filtration).'
    ],
    outflowRates: [
      'Critical Storm Method: Post-development peak ≤ pre-development for the critical storm (typically near 1-year event).',
      '1-year through 100-year storms: peak flow control to pre-development rates.',
      'Columbus does not specify a flat l/s/ha rate — control is relative to pre-development.',
      'For reference, typical pre-development Columbus site (CN 70): approximately 18-28 l/s/ha for the 10-year storm.',
      '⚠️ Verify current standards in Columbus Stormwater Drainage Manual — requirements may differ by watershed.'
    ],
    detentionRequirements: [
      'Critical Storm Method: Detention sized to control the storm whose post-development peak most exceeds pre-development (typically near 1-year).',
      '1-year through 100-year storms: Peak flow must be controlled to pre-development rates.',
      'Columbus Stormwater Drainage Manual specifies detention sizing methodology and outlet control requirements.',
      'Green roofs receive detention credit — attenuated peak flow is modeled in routing calculations.',
      '⚠️ Detention requirements may differ by watershed within Columbus — verify in current Stormwater Drainage Manual.'
    ],
    solarPvRequirements: [
      'Columbus Climate Action Plan (2021): City targets 100% clean energy for municipal operations — encourages private-sector solar adoption.',
      'AEP Ohio net metering: Available for systems up to 1 MW — favorable for large commercial rooftop installations.',
      'Ohio PACE financing available in Franklin County for commercial solar and green infrastructure projects.',
      'OSU campus and major institutional partners (Nationwide Children\'s, OhioHealth) have sustainability mandates driving bio-solar demand.',
      'Federal ITC (30%) + potential Columbus Green Business Program recognition for bio-solar installations.',
      '⚠️ AEP Ohio interconnection process and capacity limits vary by feeder — early utility coordination recommended for larger systems.'
    ]
  },

  virginia_statewide: {
    regulatoryOverview: [
      'Primary driver: Chesapeake Bay TMDL — Virginia has the largest pollutant reduction obligation of any Bay state.',
      'Virginia Erosion and Stormwater Management Program (VESMP, renamed from VSMP effective July 2024) administered by VA DEQ.',
      'Unique approach: Phosphorus-based design — BMPs are credited based on phosphorus removal, not just volume.',
      'Applies to ≥1 acre land disturbance (VESMP) or ≥2,500 SF in Chesapeake Bay Preservation Areas (CBPA).',
      'Local MS4 permittees enforce VESMP requirements — Northern VA, Hampton Roads, and Richmond areas are most active.'
    ],
    soilConditions: [
      'Virginia spans three physiographic provinces with very different soil conditions:',
      'Coastal Plain (east): Sandy loam to sandy clay loam; HSG A-B; good infiltration potential.',
      'Piedmont (central): Residual clay soils from metamorphic/igneous rock; HSG C-D; poor infiltration.',
      'Valley and Ridge / Blue Ridge (west): Variable — residual clays in valleys (C-D), rocky soils on ridges.',
      'Northern VA (Fairfax, Arlington, Loudoun) is predominantly Piedmont clay — HSG C-D.',
      'Implication: Infiltration feasibility varies dramatically by region — Coastal Plain is favorable, Piedmont is challenging.'
    ],
    greenRoofRequirements: [
      'No statewide green roof mandate.',
      'Green roofs receive favorable phosphorus removal credits in the VA BMP Clearinghouse — making them effective for VESMP compliance.',
      'VA DEQ BMP Clearinghouse assigns pollutant removal efficiencies to each approved BMP, including green roofs.',
      'Northern VA jurisdictions (Arlington, Fairfax, Alexandria) have higher density and site constraints that favor rooftop BMPs.',
      'VA Clean Economy Act and PACE financing support combined green roof + solar installations.',
      'Data center corridor in Northern VA presents a large-footprint opportunity — massive flat roofs with corporate ESG commitments.'
    ],
    tssRequirements: [
      'Virginia\'s VESMP uses phosphorus as the primary pollutant design metric — not TSS directly.',
      'However, BMPs that achieve phosphorus reduction typically also achieve significant TSS removal.',
      '⚠️ VA BMP Clearinghouse provides pollutant removal rates for each approved BMP — verify current green roof TP removal credit in DEQ BMP Clearinghouse (legacy site migrated to DEQ website July 2024).',
      'The phosphorus-based approach means green roofs may receive higher compliance credit than in TSS-only jurisdictions.',
      '⚠️ Phosphorus removal credit percentages vary by BMP design — verify current values in VA BMP Clearinghouse (2024 update).'
    ],
    retentionRequirements: [
      'Phosphorus-based: New development must achieve a specified phosphorus load reduction based on land use and receiving waters.',
      'The required TP load is calculated per VESMP regulations — BMPs are selected to achieve the target load reduction.',
      'CN (Curve Number) method is used for volume and peak flow calculations — standard NRCS TR-55 approach.',
      'Green roofs are credited in the VA BMP Clearinghouse for both volume reduction and pollutant removal.',
      'Typical retention target approximately equivalent to 1.0" WQv in most jurisdictions.',
      'Chesapeake Bay Preservation Areas (CBPA) have additional riparian buffer and impervious cover requirements.'
    ],
    outflowRates: [
      'Channel protection (Cpv): 24-hour extended detention of the 1-year, 24-hour storm event.',
      'Flood protection: 10-year storm peak control to pre-development rate.',
      'Virginia does not specify a flat l/s/ha rate — control is relative to pre-development conditions.',
      'For reference, typical pre-development rates for Piedmont sites (CN 65-70): approximately 15-30 l/s/ha for the 10-year storm.',
      '⚠️ Local MS4 permittees may impose stricter flow control — verify with specific jurisdiction.',
      'Some Northern VA localities require 2-yr through 100-yr peak control.'
    ],
    detentionRequirements: [
      'Channel Protection (Cpv): 24-hour extended detention of the 1-year, 24-hour storm event.',
      'Flood Protection: 10-year storm detention to pre-development peak rate; some localities require 2-yr through 100-yr.',
      'VESMP requires detention as part of the post-construction stormwater management plan.',
      'Green roofs receive detention credit in VA BMP Clearinghouse — attenuated release is modeled in design.',
      '⚠️ Local MS4 permittees may have enhanced detention requirements beyond VESMP minimums — verify with specific jurisdiction.'
    ],
    solarPvRequirements: [
      'VA Clean Economy Act (VCEA, 2020): Dominion Energy must reach 100% clean energy by 2045 — strong state policy driver.',
      'Virginia PACE financing: Available for commercial solar and green infrastructure — repaid through property tax assessment.',
      'Federal ITC (30%) + VA property tax exemption for solar equipment (80% exemption for first 5 years) improve project economics.',
      'Dominion Energy net metering: Available for systems up to 1 MW; community solar programs expanding.',
      'Data center corridor (Loudoun, Prince William): Massive flat roofs with corporate ESG and renewable energy commitments — prime bio-solar opportunity.',
      '⚠️ Virginia solar interconnection timelines vary by utility territory (Dominion vs. Appalachian Power) — coordinate early in design.'
    ]
  },

  richmond_va: {
    regulatoryOverview: [
      'Primary drivers: James River watershed TMDL and Chesapeake Bay TMDL compliance.',
      'City of Richmond Department of Public Utilities administers local stormwater program.',
      'VESMP requirements apply + local Richmond Stormwater Utility requirements.',
      'Richmond has a combined sewer system in older neighborhoods — CSO reduction is a priority.',
      'Richmond 300 Master Plan encourages green infrastructure and sustainable development practices.'
    ],
    soilConditions: [
      'Richmond straddles the Fall Line — Piedmont clays to the west, Coastal Plain sands to the east.',
      'West of Fall Line (Fan, Museum District, Church Hill): residual Piedmont clay; HSG C-D.',
      'East of Fall Line (Shockoe Bottom, East End): Coastal Plain sandy loam and alluvial deposits; HSG B-C.',
      'James River floodplain soils are alluvial — variable drainage, moderate to good infiltration where not compacted.',
      'Implication: Site location relative to the Fall Line significantly affects infiltration feasibility — test before designing.',
      '⚠️ Historic fill is common in developed areas — soil investigation required regardless of mapped soil type.'
    ],
    greenRoofRequirements: [
      'No green roof mandate in Richmond.',
      'Green roofs receive phosphorus removal credit under VESMP — effective for meeting Virginia\'s pollutant-based requirements.',
      'Richmond stormwater utility fee credits available for on-site stormwater management, including green roofs.',
      'VCU and VCU Health System have institutional sustainability commitments that support green roof adoption.',
      'Scott\'s Addition and Manchester redevelopment projects face tight site constraints — rooftop BMPs are practical.',
      'Richmond 300 plan identifies green infrastructure as a priority strategy for urban resilience.'
    ],
    tssRequirements: [
      'Richmond follows Virginia VESMP phosphorus-based design approach — BMPs credited for TP removal.',
      'TSS removal is a co-benefit of phosphorus-focused BMPs — green roofs achieve both TP and TSS reduction.',
      'James River watershed TMDL establishes nutrient reduction targets that green infrastructure helps address.',
      'Combined sewer areas benefit from any volume reduction — green roofs reduce both CSO frequency and pollutant loading.',
      '⚠️ Confirm current pollutant removal credits for green roofs in Virginia BMP Clearinghouse.'
    ],
    retentionRequirements: [
      'VESMP phosphorus-based design requirements apply — retention volume that achieves required TP load reduction.',
      'Practical equivalent: approximately 1.0" retention standard for most Richmond sites.',
      'CN (Curve Number) method is the standard design approach.',
      'Richmond DPU reviews stormwater management plans for compliance with both local and state requirements.',
      'Combined sewer system areas: Any retention reduces CSO discharge to James River — additional regulatory value.',
      '⚠️ Richmond may have local amendments to VESMP standards — verify with DPU.'
    ],
    outflowRates: [
      'VESMP standards apply: 24-hr extended detention of 1-yr storm (Cpv) + 10-yr flood protection.',
      'Richmond does not specify a flat l/s/ha rate — control is relative to pre-development conditions.',
      'Combined sewer areas may have additional discharge restrictions based on sewer capacity.',
      'For reference, typical pre-development Richmond site (CN 65-70): approximately 15-30 l/s/ha for the 10-year storm.',
      '⚠️ Specific allowable rates depend on sewer shed — Richmond DPU approval required for each connection.'
    ],
    detentionRequirements: [
      'VESMP Channel Protection (Cpv): 24-hour extended detention of the 1-year storm event.',
      '10-year flood protection: Detention to pre-development peak rate.',
      'Combined sewer areas: Additional detention may be required to manage CSO discharge to James River.',
      'Green roofs provide detention credit — attenuated runoff reduces peak loading on combined sewer system.',
      '⚠️ Richmond DPU may impose enhanced detention in CSS areas — verify during site connection review.'
    ],
    solarPvRequirements: [
      'VA Clean Economy Act applies: Dominion Energy (Richmond\'s utility) must reach 100% clean energy by 2045.',
      'Virginia PACE financing available in Richmond for commercial solar and green infrastructure projects.',
      'Federal ITC (30%) + VA solar property tax exemption (80% for first 5 years) provide strong economics.',
      'Richmond 300 Master Plan identifies renewable energy and green infrastructure as priority strategies for urban resilience.',
      'VCU and institutional partners have sustainability mandates that support bio-solar adoption on campus and affiliated buildings.',
      '⚠️ Richmond has good solar irradiance (~4.5 kWh/m²/day) — Dominion interconnection timelines and capacity vary by circuit.'
    ]
  },

  montgomery_md: {
    regulatoryOverview: [
      'Primary driver: Chesapeake Bay TMDL compliance — Maryland has aggressive nutrient reduction targets.',
      'Environmental Site Design to Maximum Extent Practicable (ESD to MEP) is the core design philosophy.',
      'Maryland Department of Environment (MDE) Stormwater Design Manual + Montgomery County Code Chapter 19.',
      'Applies to ≥5,000 SF land disturbance; redevelopment triggers at ≥5,000 SF where existing imperviousness >40%.',
      'Montgomery County Building Energy Performance Standards (BEPS, adopted April 2024) apply to buildings ≥25,000 SF — energy efficiency requirements.'
    ],
    soilConditions: [
      'Montgomery County spans the Piedmont physiographic province — residual soils from metamorphic rock.',
      'Typical soils: Manor channery silt loam, Glenelg silt loam, Brinklow-Blocktown complex.',
      'Hydrologic Soil Group: Predominantly C, with some B soils in well-drained upland areas and D in valley bottoms.',
      'Piedmont clays limit infiltration in many areas — ESD to MEP acknowledges this by requiring design "to the maximum extent practicable."',
      'Implication: Many sites cannot fully achieve infiltration-based ESD — rooftop retention (green roofs, mineral wool) supplements ground-level BMPs.'
    ],
    greenRoofRequirements: [
      'Green roofs are not explicitly mandatory but are a key ESD practice for meeting "Maximum Extent Practicable" standard.',
      'MDE Stormwater Design Manual lists green roofs as an approved ESD practice with specific sizing criteria.',
      'RainScapes Rebate Program: up to $7,500 (residential) or $20,000 (commercial/institutional) for green infrastructure, including green roofs.',
      'Montgomery County Green Bank offers Solar Loan program — supports bio-solar installations.',
      'IgCC (International Green Construction Code) adopted for commercial ≥5,000 SF — green roof can contribute to compliance.',
      'Purple Line corridor development is driving demand for rooftop BMPs on transit-oriented projects.'
    ],
    tssRequirements: [
      'Maryland requires 80% TSS removal for post-construction stormwater management.',
      'Green roofs are approved ESD practices that contribute to TSS removal for captured rainfall volume.',
      'Chesapeake Bay TMDL adds phosphorus and nitrogen reduction requirements — green roofs provide nutrient removal credit.',
      'MDE Stormwater Design Manual assigns pollutant removal efficiencies to each approved ESD practice.',
      '⚠️ Specific TSS and nutrient removal credits for green roofs should be confirmed in current MDE manual.'
    ],
    retentionRequirements: [
      'ESD to MEP: Replicate "Woods in Good Condition" (CN = 55) for the 1-year, 24-hour storm event.',
      'This is a high bar — the goal is to make the developed site perform hydrologically like an undisturbed forest.',
      'Retention sizing: Central/Eastern MD rainfall zone — 1.5" precipitation depth for WQv calculations.',
      'CN (Curve Number) method is the standard design approach — target CN 55 for ESD to MEP.',
      'Where achieving CN 55 is not practicable, demonstrate that ESD practices were applied to the maximum extent feasible.',
      'Mineral wool in green roof systems provides approximately double the retention capacity of soil alone — key for meeting the CN 55 target.'
    ],
    outflowRates: [
      'Channel Protection (Cpv): 24-hour extended detention of the 1-year, 24-hour storm event.',
      'Overbank Flood Protection (Q10): 10-year storm peak controlled to pre-development rate.',
      'Extreme Flood (Q100): 100-year event safely conveyed; peak flow controlled to pre-development.',
      'Maryland does not specify a flat l/s/ha rate — control is relative to pre-development conditions.',
      'For reference, achieving CN 55 (woods in good condition) typically limits release to approximately 8-15 l/s/ha for the 10-year storm.',
      '⚠️ 12-hour extended detention required in Use III/IV watersheds — stricter than the standard 24-hour requirement.'
    ],
    detentionRequirements: [
      'Channel Protection (Cpv): 24-hour extended detention of the 1-year, 24-hour storm event (standard); 12-hour in Use III/IV watersheds.',
      'Overbank Flood Protection (Q10): 10-year storm detained to pre-development peak rate.',
      'Extreme Flood (Q100): 100-year event safely conveyed with peak flow controlled to pre-development.',
      'ESD to MEP approach: Detention is supplemental — first priority is distributed retention through ESD practices.',
      '⚠️ Use III/IV watershed designation triggers enhanced 12-hour Cpv drawdown — verify watershed classification for the project site.'
    ],
    solarPvRequirements: [
      'Montgomery County BEPS (Building Energy Performance Standards, April 2024): Buildings ≥25,000 SF must meet energy performance targets — on-site solar helps compliance.',
      'Maryland Community Solar Pilot Program: Allows shared solar subscriptions — relevant for buildings that can\'t host full rooftop systems.',
      'Montgomery County Green Bank Solar Loan program: Low-interest financing for solar installations on commercial and residential properties.',
      'Federal ITC (30%) + MD solar property tax exemption + net metering create strong economics for rooftop PV.',
      'IgCC (International Green Construction Code) adopted for commercial ≥5,000 SF — solar contributes to required energy performance.',
      '⚠️ Montgomery County has good solar irradiance (~4.3 kWh/m²/day) — Pepco/Potomac Edison interconnection timelines vary by circuit capacity.'
    ]
  }

};

// Merge into CITY_DATA
Object.entries(CITY_REG_SUMMARIES).forEach(([key, summary]) => {
  if (CITY_DATA[key]) CITY_DATA[key].regSummary = summary;
});
