# QA Checklist

Use this checklist after `npm run check` passes and before sharing a demo, committing a cleanup batch, or deploying.

## Automated gate

Run from the repository root:

```shell
npm run check
```

This runs JavaScript syntax checks, local reference checks, V3 stress scenarios, and the two standalone build scripts.

## Manual browser checks

Start the local server:

```shell
npm run start
```

Open `http://localhost:3000/v3/`.

### App load
- Header logos load or fail gracefully.
- Home screen renders without content hidden under the sticky header.
- Sales/Engineering mode toggle works.
- Open Resources button opens `v3/resources.html`.

### Guided workflow
- Start Evaluation moves to the city step.
- Select at least one city and confirm local requirement content updates.
- Choose a site preset and confirm site graphics display.
- Toggle each site condition and confirm selected states are visible.
- Enter retention and detention targets.
- Run analysis and confirm the recommendation section renders with a top pick or clear validation message.

### Report generation
- Generate Client Report opens a report window or fallback.
- Report includes project context, recommendation, cost metrics, and logos.
- Print/export preview is readable.

### Resources page
- Product family selector changes the hero image/accent and visible resource cards.
- Placeholder resource cards are disabled/clearly marked.
- Active links open as expected.

### Admin editor
- Open the admin editor from Engineering mode.
- Validate Data runs and returns results.
- Standalone admin build opens if using the standalone path.

## Release note

If a manual check fails, record the failure, browser, and input scenario before changing source files.
