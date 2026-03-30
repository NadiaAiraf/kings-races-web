# Phase 4: PWA and Offline - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds PWA capability: service worker for offline caching, web app manifest for Add to Home Screen installability, and app identity configuration. The app already works offline (localStorage has all data) — this phase ensures the app files themselves are cached so the app loads with zero network.

Requirements: MOBL-03

</domain>

<decisions>
## Implementation Decisions

### App Identity
- **D-01:** App name on home screen: "Kings Races"
- **D-02:** Theme color / status bar: blue-600 (#2563EB) — matches the existing app accent color

### Caching Strategy
- **D-03:** Standard precache of all app assets via vite-plugin-pwa with generateSW strategy. No custom runtime caching needed — the app makes no API calls.
- **D-04:** Auto-update silently — new service worker downloads in background and activates on next page load. No update prompt UI needed.

### Claude's Discretion
- PWA icon generation (sizes, formats)
- Manifest display mode, orientation, background color
- Service worker configuration details
- Whether to add an offline indicator (not required)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stack Decisions
- `.planning/research/STACK.md` — Recommends vite-plugin-pwa 1.2.x with generateSW strategy
- `vite.config.ts` — Existing Vite configuration to extend with PWA plugin
- `index.html` — Existing HTML entry point (may need manifest link, theme-color meta)

### Project Context
- `.planning/PROJECT.md` — Project vision, constraints
- `.planning/REQUIREMENTS.md` — MOBL-03 requirement

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
None specific to PWA — this is new infrastructure.

### Established Patterns
- Vite 8.0.x build pipeline already configured
- Tailwind CSS 4 with @tailwindcss/vite plugin in vite.config.ts

### Integration Points
- `vite.config.ts` — add VitePWA plugin
- `index.html` — add manifest link and theme-color meta tag
- Build output — service worker generated alongside existing assets

</code_context>

<specifics>
## Specific Ideas

- Keep it minimal — this is a lightweight PWA wrapper around an already-functional app
- The app icon should be simple and recognizable (could use a ski/mountain motif or just "KR" text)

</specifics>

<deferred>
## Deferred Ideas

- **Hosting/deployment:** Squarespace domain exists but can't host a React app. Netlify/Vercel/GitHub Pages are recommended alternatives. A subdomain (e.g., races.kingsski.club) could point to the hosting provider.

</deferred>

---

*Phase: 04-pwa-and-offline*
*Context gathered: 2026-03-30*
