---
phase: 04-pwa-and-offline
plan: 01
subsystem: infra
tags: [pwa, service-worker, vite-plugin-pwa, workbox, offline, manifest]

# Dependency graph
requires:
  - phase: 03-finals-and-results
    provides: complete app with all UI and domain logic
provides:
  - PWA manifest and service worker for offline support
  - App installable via Add to Home Screen on iOS and Android
  - All app assets precached for zero-connectivity operation
affects: []

# Tech tracking
tech-stack:
  added: [vite-plugin-pwa, @vite-pwa/assets-generator, workbox]
  patterns: [VitePWA autoUpdate registration, generateSW strategy]

key-files:
  created:
    - public/pwa-64x64.png
    - public/pwa-192x192.png
    - public/pwa-512x512.png
    - public/maskable-icon-512x512.png
    - public/apple-touch-icon-180x180.png
    - public/favicon.ico
  modified:
    - vite.config.ts
    - index.html
    - package.json

key-decisions:
  - "autoUpdate registerType for silent SW updates without prompt UI"
  - "generateSW strategy (default) for simple precaching of all static assets"
  - "blue-600 (#2563EB) as PWA theme color matching app branding"

patterns-established:
  - "VitePWA plugin added after tailwindcss() in Vite plugins array"
  - "PWA icons generated via @vite-pwa/assets-generator minimal-2023 preset from favicon.svg"

requirements-completed: [MOBL-03]

# Metrics
duration: 5min
completed: 2026-03-30
---

# Phase 4 Plan 1: PWA Setup Summary

**VitePWA configured with autoUpdate, standalone display, and Workbox precaching for full offline support**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-30T10:57:33Z
- **Completed:** 2026-03-30T11:02:56Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Installed vite-plugin-pwa with Vite 8 peer dep override and generated all 6 PWA icon sizes from favicon.svg
- Configured VitePWA plugin with autoUpdate, standalone display, portrait orientation, and blue-600 theme
- Updated index.html with correct title, theme-color meta, description meta, and apple-touch-icon link
- Production build generates sw.js (precaches 16 entries / 428 KiB) and manifest.webmanifest

## Task Commits

Each task was committed atomically:

1. **Task 1: Install vite-plugin-pwa, generate PWA icons, configure package.json** - `4925cf6` (chore)
2. **Task 2: Configure VitePWA plugin, update index.html, verify production build** - `fdbff6c` (feat)

## Files Created/Modified
- `package.json` - Added vite-plugin-pwa, @vite-pwa/assets-generator, overrides for Vite 8
- `vite.config.ts` - VitePWA plugin with manifest, workbox, and autoUpdate config
- `index.html` - PWA meta tags, apple-touch-icon, correct title
- `public/pwa-64x64.png` - Favicon PNG
- `public/pwa-192x192.png` - Manifest icon 192x192
- `public/pwa-512x512.png` - Manifest icon 512x512
- `public/maskable-icon-512x512.png` - Android adaptive icon
- `public/apple-touch-icon-180x180.png` - iOS home screen icon
- `public/favicon.ico` - ICO fallback

## Decisions Made
- Used autoUpdate registerType (silent update, no prompt UI needed for single-official use case)
- Used generateSW workbox strategy (simpler than injectManifest, sufficient for static asset precaching)
- Set theme_color to #2563EB (blue-600) for consistent branding in mobile chrome

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing unused variable TypeScript errors**
- **Found during:** Task 2 (production build)
- **Issue:** 13 unused variable/import TS errors in existing code blocked `tsc -b` during build
- **Fix:** Removed unused imports (hasTies, TournamentStructure, ResolvedFinalsMatchupWithNames), removed unused local variables (groupLetter, posIndex, teamMap), removed unused destructured bindings (isActive, allR1Scored, r2State, scoredR1, scoredR2)
- **Files modified:** FinalsMatchupCard.tsx, AppShell.tsx, ScoringFocusView.tsx, StandingsView.tsx, finalsSeeding.test.ts, r2Seeding.test.ts, useFinalResults.ts
- **Verification:** `npm run build` succeeds, all 372 tests pass
- **Committed in:** fdbff6c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Pre-existing TS errors prevented build. Cleanup was minimal and safe (unused code removal only). No scope creep.

## Issues Encountered
None beyond the pre-existing TS errors documented above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all PWA configuration is fully wired and functional.

## Next Phase Readiness
- PWA support is complete. App is installable and works offline when served via `npm run preview`
- Phase 04 has only this single plan, so the milestone is ready for verification

## Self-Check: PASSED

All 8 key files verified present. Both task commits (4925cf6, fdbff6c) verified in git log.

---
*Phase: 04-pwa-and-offline*
*Completed: 2026-03-30*
