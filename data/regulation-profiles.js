// ═══════════════════════════════════════════════════════════════════════
// REGULATION PROFILES — credit calculation parameters by jurisdiction
// ═══════════════════════════════════════════════════════════════════════
// Each profile defines:
//   id       — unique key (referenced by CITY_DATA.regulationProfileId)
//   label    — display name
//   defaults — soil retention %, NMW retention %, honeycomb void %
//   rules    — calculation rules (e.g., min soil cover for NMW credit)
//
// Cities reference a profile by ID. Multiple cities can share a profile
// (e.g., all Ohio cities might use the same 'oh_epa' profile).
// The 'general' profile is the fallback for any city without a specific one.
// ═══════════════════════════════════════════════════════════════════════

const REGULATION_PROFILES_DEFAULT = {
  general: {
    id: 'general',
    label: 'General Defaults',
    defaults: { soilRetentionPct: 0.40, nmwRetentionPct: 0.80, honeycombVoidPct: 0.95 },
    rules: { nmwRetentionRequiresMinSoilCoverIn: 0 }
  },
  nyc_dep: {
    id: 'nyc_dep',
    label: 'NYC DEP',
    defaults: { soilRetentionPct: 0.20, nmwRetentionPct: 0.40, honeycombVoidPct: 0.95 },
    rules: { nmwRetentionRequiresMinSoilCoverIn: 4.0 }
  }
};
