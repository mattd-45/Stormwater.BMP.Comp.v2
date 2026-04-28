# Archive Staging

Use this folder for non-destructive cleanup only.

Files moved here should be treated as candidates for later deletion, not deleted immediately. Keep enough folder context to understand where each file came from.

Recommended pattern:

```text
_archive/
  legacy/
  generated/
  duplicate-assets/
  old-collateral/
```

Before moving anything here:
1. Confirm the file is not referenced by the active V3 app.
2. Record the move in `docs/cleanup-audit.md`.
3. Run reference checks after the move.

Do not use this folder for active app assets.
