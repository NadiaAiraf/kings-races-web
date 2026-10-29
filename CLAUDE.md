<!-- GSD:project-start source:PROJECT.md -->
## Project

**Kings Races Web**

A mobile-first PWA for Kings Ski Club race officials to run university dry slope parallel slalom championship events from their phone. Replaces a Google Spreadsheet - handles team entry, race order generation (29 pre-computed sequences for 4-32 teams), live result recording with 1-tap scoring, group standings with race-by-race grids, multi-round tournament flow (R1 -> R2 -> Finals), final results, and CSV export. Officials sign in with Firebase Auth: approved officials (the approvedUsers allowlist) can create and score rounds, everyone else views read-only. Rounds sync through Firestore with a persistent offline cache, so scoring still works slope-side, and each round belongs to a season and league with season standings and league points. Hosted on GitHub Pages.

**Core Value:** A race official can run an entire event from their phone - entering teams, seeing the race order, recording results live, and viewing group standings at any time.

### Constraints

- **Platform**: Web app, mobile-first (no native app)
- **Data**: Firebase Auth + Firestore with persistent offline cache; no custom server
- **Race orders**: Exact cheat sheet replication (29 sequences)
- **Offline**: PWA service worker for the app shell, plus the Firestore offline cache for data
- **Hosting**: GitHub Pages static site with HashRouter
- **Access control**: `firestore.rules` is authoritative and is deployed by hand (not by CI)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Installed Stack
### Core Technologies
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| React | 19.2.x | UI framework | Client-only SPA. |
| TypeScript | 5.9 | Type safety | Catches bugs at compile time -- critical for complex race logic (scoring, bracket generation). `npm run build` runs `tsc -b` first. |
| Vite | 8.0.x | Build tool / dev server | Rolldown-powered bundler, `@vitejs/plugin-react` 6. |
| Tailwind CSS | 4.2.x | Styling | Mobile-first utility classes via `@tailwindcss/vite`; no config file, just `@import "tailwindcss"`. |
| Zustand | 5.0.x | State management | Single store for the open event. No `persist` middleware; Firestore's offline cache is the storage. |
| React Router | 7.x | Client-side routing | `HashRouter`, because GitHub Pages cannot serve deep links. |
| Firebase | 12.x | Auth + database | Auth for sign-in; Firestore for events, seasons, leagues and approvedUsers, with `persistentLocalCache` (multi-tab manager). |
### Storage
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Firestore persistent local cache (IndexedDB) | via Firebase SDK | Offline storage and sync | Writes queue offline and sync when back online. `src/lib/offlineStorage.ts` warns when IndexedDB is unavailable (private modes). The legacy `kings-races-event` localStorage key is left untouched and not read. |
### PWA / Offline Support
| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| vite-plugin-pwa | 1.2.x | Service worker generation, offline caching | Workbox precache of the app shell for slope-side use. Its Vite peer is pinned to the installed Vite via `overrides` in package.json. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x | Conditional CSS class joining | When building components with conditional Tailwind classes (active states, responsive toggles) |
| papaparse | 5.x | CSV export | For the "Export results as CSV" requirement. Handles edge cases (commas in team names, unicode). |
### Development Tools
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Vitest | 3.2.x | Unit and component testing | jsdom environment, `vitest.config.ts` includes `src/**/*.test.ts(x)`. |
| @testing-library/react | 16.x | Component testing | Test UI interactions, not implementation. |
| @firebase/rules-unit-testing + firebase-tools | 5.x / 15.x | Firestore rules tests | Runs `rules/firestore.rules.test.ts` against the Firestore emulator via `vitest.rules.config.ts`. |
| ESLint | 9.x | Linting | `@eslint/js` + `typescript-eslint`, flat config (`eslint.config.js`). |
| Prettier | - | Not set up | No formatter is installed. |
## Installation
Tooling is npm with `package-lock.json`; CI uses Node 22.
```bash
npm ci                # install
npm run dev           # dev server
npm test              # unit + component tests (vitest run)
npm run test:rules    # Firestore rules tests in the emulator (needs Java)
npm run emulators     # local Firestore + Auth emulators
npm run build         # tsc -b && vite build
```
The app needs `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID`; it throws at startup if any are missing. `VITE_FIREBASE_USE_EMULATORS=true` points at the local emulators and is rejected in production builds.
## Alternatives Considered
| Chosen | Alternative | When to Use Alternative |
|--------|-------------|-------------------------|
| React | Preact | If bundle size is absolutely critical (<3KB). But React's ecosystem and tooling are vastly better for a project this complex. |
| React | Svelte 5 | If starting fresh with no React experience. Svelte has less boilerplate. But React's ecosystem depth (testing, libraries, community answers) wins for a project with complex state logic. |
| Zustand | Jotai | If state is naturally atomic (many independent pieces). Race management state is centralized (event -> disciplines -> races -> results), making Zustand's store pattern a better fit. |
| Zustand | React Context | If state is trivial. Race state (teams, scores, standings, brackets across 3 disciplines) is complex enough to warrant a proper state library. Context causes unnecessary re-renders without careful memoization. |
| Tailwind CSS | Plain CSS / CSS Modules | If you prefer writing traditional CSS. Tailwind is faster for mobile-first responsive development -- `sm:`, `md:` breakpoint prefixes are exactly what this app needs. |
| Firebase | Custom backend / Supabase | If the app outgrows Firestore's data model or needs server-side logic. Firebase gives auth, sync and an offline cache with no server to run. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js / Remix | Server-side frameworks. This app is a static SPA on GitHub Pages. SSR/SSG adds complexity for zero benefit. | Vite + React (SPA) |
| Redux / Redux Toolkit | Overkill boilerplate for this app size. Actions, reducers, selectors pattern is unnecessary when Zustand does the same in 1/10th the code. | Zustand |
| Bootstrap / Material UI | Heavy component libraries. Bootstrap is 22KB+ gzipped CSS. MUI ships JS-in-CSS runtime. Both are bloated for a mobile-first app that needs fast load on spotty connectivity. | Tailwind CSS (utility classes, no runtime) |
| Other BaaS (Supabase etc.) | Firebase is already the backend; a second one splits auth and data. | Firebase Auth + Firestore |
| Axios | Unnecessary -- the app makes no HTTP requests beyond the Firebase SDK. If one is needed, native `fetch()` is sufficient. | Firebase SDK / `fetch()` |
| CSS-in-JS (styled-components, Emotion) | Runtime overhead on every render. Worse performance on mobile. Tailwind's utility classes are zero-runtime. | Tailwind CSS |
| Jest | Slower than Vitest, requires separate configuration, doesn't integrate with Vite's transform pipeline. | Vitest |
## Stack Patterns for This Project
- One Zustand store (`src/store/eventStore.ts`) for the open event, fed by `startEventSync`
- Firestore writes go through the repos in `src/events` and `src/seasons`
- Firestore snapshots are async: handle loading and empty states, do not assume data is present on first render
- PWA with precached app shell (vite-plugin-pwa with `generateSW` strategy)
- Tailwind's mobile-first breakpoints (`sm:` for tablet, `md:` for desktop -- mobile is the default)
- Large touch targets (min 44x44px) -- Tailwind classes like `p-4`, `min-h-[44px]`
- High contrast colors for outdoor/bright conditions
- Store cheat sheet data as static TypeScript const arrays (type-safe, no runtime parsing)
- Import only the needed sequence based on team count
- No generation algorithm needed -- just lookup tables
## Version Compatibility
| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vite 8.0.x | vite-plugin-pwa 1.2.x | Works; peer dependency pinned to the installed Vite via `overrides` |
| Vite 8.0.x | @tailwindcss/vite 4.2.2+ | Officially supports Vite 8 |
| Vitest 3.2.x | Vite 8.0.x | In use for unit, component and rules tests |
| React 19.2.x | React Router 7.x, Zustand 5.0.x, @testing-library/react 16.x | Fully compatible |
| Firebase 12.x | @firebase/rules-unit-testing 5.x, firebase-tools 15.x | Emulator-based rules tests |
## Sources
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 architecture changes (HIGH confidence)
- [Tailwind CSS Vite 8 support](https://github.com/tailwindlabs/tailwindcss/discussions/19624) -- @tailwindcss/vite 4.2.2+ supports Vite 8 (HIGH confidence)
- [vite-plugin-pwa GitHub #918](https://github.com/vite-pwa/vite-plugin-pwa/issues/918) -- Vite 8 compatibility status (MEDIUM confidence -- functionally works but not officially declared)
- [Zustand vs Jotai comparison](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k) -- State management landscape (MEDIUM confidence -- community source)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- Tests are colocated as `*.test.ts(x)` beside the source; Firestore rules tests live in `rules/`
- Pure race logic lives in `src/domain` and is unit tested
- Components that render a mutating control call `useCanEdit()` and hide it themselves; Firestore rules are the real access control
- Destructive actions go through `ConfirmDialog` and soft delete (rounds are archived to `deletedEvents`)
- Conventional Commits with the quick-task scope, e.g. `feat(quick-261027-noe): ...`; a failing `test(...)` commit lands before the `feat(...)` commit
- Branches are `af/<brief-descriptor>`, merged to `master` by PR
- CI must pass (lint, tests, build, rules tests, npm audit) before the GitHub Pages deploy runs
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- `src/domain/` - pure race logic: cheat sheets, scoring, group calculations, R2 seeding and order, finals seeding, placings, CSV export, validation, types
- `src/store/` - single Zustand `eventStore` for the open event (not persisted)
- `src/events/` - Firestore event doc shape (`eventDoc`), sync (`eventSync`), repo (`eventsRepo`), event info
- `src/seasons/` - seasons, leagues, league rounds and teams, season standings (league points + spreadsheet tiebreak order)
- `src/auth/` - `AuthProvider`, auth status, Firebase Auth wrapper, `editAccess` (`useCanEdit`, defaults to false)
- `src/firebase/` - app init (persistent multi-tab cache) and env config (Safari long-polling transport)
- `src/lib/` - small helpers (dates, Firebase error messages, offline storage detection)
- `src/hooks/` - derived-state hooks (standings, R2, finals, final results, current race, round fold, discipline state)
- `src/components/{finals,layout,races,results,scoring,season,shared,standings,teams}` - UI components
- `src/pages/` - route pages
- `rules/` - Firestore rules tests; `firestore.rules` - security rules (events, deletedEvents, seasons, seasons/{seasonId}/leagues/{league}, approvedUsers)
- `.github/workflows/` - `ci.yml` (lint, tests, build, rules tests, dependency audit) and `deploy.yml` (GitHub Pages)

Data flow: Firestore snapshot -> `startEventSync` -> Zustand `eventStore` -> hooks derive standings and brackets -> components. Writes go back to Firestore through `eventSync`, which drops them for users who cannot edit.

Routes (HashRouter): `/`, `/rounds`, `/seasons/new`, `/seasons/:seasonId/:league`, `/seasons/:seasonId/:league/new`, `/events/:id`, `/login`.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
