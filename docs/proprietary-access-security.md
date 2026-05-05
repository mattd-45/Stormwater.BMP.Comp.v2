# Proprietary Access and Security Notes

## Current exposure

- The public GitHub repository is reachable at `https://github.com/mattd-45/Stormwater.BMP.Comp.v2`.
- V3 is a static browser app. JavaScript, data files, pricing assumptions, and recommendation logic are downloaded by any authorized browser session.
- Netlify can gate access to the deployed site, but it cannot prevent an authorized user from inspecting downloaded client-side code.

## Short-term access gate

Use Netlify dashboard Password Protection for the production site as the immediate access gate. Do not store shared passwords in `netlify.toml`, `_headers`, or source code.

Recommended setup:

1. Make the GitHub repository private.
2. In Netlify, enable site-wide Password Protection for production deploys.
3. Share the password only with approved users.
4. Rotate the password when access should be revoked.

The repository now also sends deployment headers through `netlify.toml` to discourage indexing, archiving, framing, MIME sniffing, and unnecessary browser permissions.

## Long-term login recommendation

Use Netlify Identity for the first named-user login implementation.

Why:

- It fits the current Netlify-hosted static app.
- It supports invite-only users.
- It avoids a larger authentication migration before the tool's workflow stabilizes.

Consider Auth0 later if the tool needs enterprise SSO, MFA policies, customer organizations, advanced audit controls, or stronger role management.

## Copy protection limits

Client-side JavaScript can be copied after it is delivered to the browser. Minification or obfuscation can reduce casual copying, but it is not true protection.

For stronger protection, move sensitive pieces behind a server/API:

- `engine/model.js`
- `data/cost-items.js`
- `data/cost-adjustments.js`
- `data/bmp-options.js`
- `data/roof-profiles.js`
- `v3/run-analysis.js`
- `v3/strategy.js`

Target architecture:

1. Browser collects project inputs.
2. Browser sends inputs to a protected Netlify Function or backend API.
3. Server runs pricing, ranking, recommendation, and controlled-language logic.
4. Browser receives only the final results needed for display and report generation.

