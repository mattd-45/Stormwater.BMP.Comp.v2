# Docs Folder

This folder is for project documentation and non-code reference material.

## Current structure
- `regulations/` contains jurisdiction stormwater regulation summaries and the combined regulation summary markdown.

## Future collateral structure
If product collateral needs to be stored locally instead of linked externally, use:

```text
docs/collateral/
  green-roof/
  pv/
  fall-protection/
```

For regularly updated product data, brochures, specifications, CAD details, and case studies, prefer external hosted links and manage them in `v3/resources-catalog.js`.

## Cleanup rule
Do not move regulation PDFs or collateral documents without updating any links in `v3/resources-catalog.js`, `data/city-data.js`, or related city summary files.
