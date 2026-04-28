# Recommendation Explanation Language Review

Last updated: 2026-04-28

This document reviews the controlled wording for the future "Why this recommendation?" section.

Phase 4A adds the dictionary only. The app does not render these phrases yet. Phase 4B should render them only after the wording is approved.

## Wording Rules

- Use planning-level language: "may", "can", "should be confirmed".
- Do not imply final design approval.
- Do not say a BMP is impossible unless the engine explicitly blocks it.
- Tie every phrase to an actual project input, result, or pricing condition.
- When evidence is weak or unknown, show no phrase rather than speculating.

## Driver Dictionary

### undergroundUtilities

Trigger: `project.constraints.hasUndergroundUtilities === true`

Phrase: Known or suspected underground utilities may limit excavation-heavy BMPs and should be confirmed during civil/site coordination.

Caution: Confirm utility locations, offsets, and conflicts before treating subsurface storage or excavation-based BMPs as feasible.

### highWaterTable

Trigger: `project.constraints.hasHighWaterTable === true`

Phrase: A high water table can reduce feasibility for subsurface storage or infiltration-based systems.

Caution: Confirm seasonal groundwater elevation and allowable separation before final BMP selection.

### contaminatedSoil

Trigger: `project.constraints.hasContaminatedSoil === true`

Phrase: Contaminated soils may increase handling, lining, or disposal requirements and can reduce suitability for infiltration-based BMPs.

Caution: Coordinate soil management assumptions with the environmental consultant and civil engineer.

### gradingConstraint

Trigger: `project.constraints.hasSiteGradingConstraint === true`

Phrase: Site grading constraints may limit where surface BMPs, overflow paths, or low-point collection systems can be placed.

Caution: Confirm grading, overflow routing, and accessible maintenance paths during civil design.

### poorInfiltrationSoil

Trigger: `project.site.soilType === 'clay' || project.site.soilType === 'rock'`

Phrase: Mapped or assumed low-infiltration soils can make lined, controlled-release, or on-structure strategies more practical than infiltration-dependent BMPs.

Caution: Confirm infiltration assumptions with project-specific geotechnical or civil testing.

### highValueGroundSpace

Trigger: `project.assumptions.programmableSpaceIsHighValue === true`

Phrase: High-value ground-level or programmable space may make roof, deck, or compact BMP strategies more attractive than large surface BMP footprints.

Caution: Confirm owner priorities for outdoor programming, circulation, and maintainable BMP footprint.

### greenRoofInScope

Trigger: `project.assumptions.greenRoofAlreadyInScope === true`

Phrase: If a green roof is already in scope, incremental detention or retention upgrades may be more efficient than treating the roof as an entirely new scope item.

Caution: Confirm whether pricing should be evaluated as an upgrade scope or a full installed assembly.

### roofOpportunity

Trigger: roof/on-structure area is a meaningful share of total eligible area

Phrase: Available roof or on-structure area can provide a practical location for stormwater controls without consuming ground-level space.

Caution: Confirm structural loading, waterproofing, access, and maintenance assumptions before final selection.

### groundOpportunity

Trigger: ground area is a meaningful share of total eligible area and ground BMPs remain viable

Phrase: Available ground area can support surface or subsurface BMPs where utilities, grading, soils, and programming constraints allow.

Caution: Confirm civil layout, maintenance access, and owner tolerance for surface or subsurface disruption.

### retentionTarget

Trigger: `project.targets.retentionNeeded === true && project.targets.retentionCF > 0`

Phrase: The retention target influences whether the strategy needs storage, evapotranspiration, reuse, or other credited retention volume.

Caution: Confirm the credited retention method and target volume with the civil engineer and authority having jurisdiction.

### detentionTarget

Trigger: `project.targets.detentionNeeded === true && project.targets.detentionCF > 0`

Phrase: The detention target influences whether the strategy needs controlled release storage in addition to any retention benefit.

Caution: Confirm allowable release rate, routing, and outlet control assumptions during civil design.

### jurisdictionContext

Trigger: city/regulation profile is selected

Phrase: Local stormwater rules and credited BMP assumptions should guide which systems are treated as viable planning options.

Caution: Confirm final requirements against current published guidance and AHJ review comments.

### costConstructability

Trigger: top recommendation and pricing data are available

Phrase: Cost and constructability should be reviewed alongside stormwater performance because the lowest planning-cost option may not be the easiest option to permit or build.

Caution: Confirm installed cost, access, phasing, and constructability with the project team before procurement.

## Approval Notes

Before Phase 4B:
- Edit any phrase that sounds too strong or too vague.
- Remove any driver that should not appear in client-facing output.
- Decide whether Sales and Engineering modes should use the same language or separate variants.
