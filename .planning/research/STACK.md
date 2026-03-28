# Stack Research

**Domain:** Mobile-first, client-side-only race management web application
**Researched:** 2026-03-28
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.1.x | UI framework | Industry standard for component-based UIs. React 19 stable with server components, but we use client-only features. Massive ecosystem, excellent mobile web support. 19.1.x over 19.2.x for stability (19.2 adds Activity/SSR features we don't need). |
| TypeScript | 6.0 | Type safety | Current stable release (March 2026). Catches bugs at compile time -- critical for complex race logic (scoring, bracket generation). TS 6.0 is last JS-based compiler; TS 7 (Go-based) coming but not stable yet. |
| Vite | 8.0.x | Build tool / dev server | Latest stable (March 2026). Rolldown-powered bundler is 10-30x faster builds. Native React support. Tailwind v4.2.2+ officially supports Vite 8. |
| Tailwind CSS | 4.2.x | Styling | Mobile-first utility classes. v4 eliminates config files -- just `@import "tailwindcss"`. 5x faster builds than v3. `@tailwindcss/vite` plugin for native integration. Perfect for rapid mobile UI development without writing custom CSS. |
| Zustand | 5.0.x | State management | 1KB, no boilerplate, no provider needed. Centralized store pattern fits race management well (event state, race results, standings are app-global). Built-in `persist` middleware writes to localStorage automatically. Simpler than Jotai for this use case where state is naturally centralized per-event. |
| React Router | 7.13.x | Client-side routing | Stable, mature. Handles navigation between disciplines, race views, standings, and results. Non-breaking upgrade path from v6 if needed. |

### Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| localStorage (via Zustand persist) | N/A | Primary data persistence | Sufficient for this app's data volume. Race event data is small (teams, scores, brackets -- well under 5MB). Zustand's `persist` middleware handles serialization automatically. No extra dependency needed. |

**Why NOT IndexedDB/Dexie.js:** The data for a single race event is small and flat (team names, scores, race order indices). localStorage's 5-10MB limit is more than enough. Dexie.js adds complexity (async queries, schema migrations) that provides no benefit here. If future versions need multi-event history or season data, upgrade to Dexie.js then.

### PWA / Offline Support

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| vite-plugin-pwa | 1.2.x | Service worker generation, offline caching | Zero-config PWA support via Workbox. Precaches app shell for offline use. Critical for slope-side reliability with spotty connectivity. |

**Vite 8 compatibility note:** As of March 2026, vite-plugin-pwa v1.2.0 does not officially declare Vite 8 in peer dependencies, but it works functionally (confirmed via GitHub issue #918). Two options: (1) use `--legacy-peer-deps` with Vite 8, or (2) pin Vite to 7.3.x for guaranteed compatibility. **Recommendation: Use Vite 7.3.x** for PWA stability -- the 10-30x speed gains of Vite 8's Rolldown are irrelevant for a small app, and PWA offline support is mission-critical for slope-side use.

**Revised Vite recommendation:** Vite 7.3.x (latest v7 patch) instead of 8.0.x, to guarantee vite-plugin-pwa compatibility without workarounds.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x | Conditional CSS class joining | When building components with conditional Tailwind classes (active states, responsive toggles) |
| papaparse | 5.x | CSV export | For the "Export results as CSV" requirement. Lightweight, handles edge cases (commas in team names, unicode). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | 4.1.x | Unit and integration testing | Native Vite integration, fast, compatible with React Testing Library. Test race logic (scoring, bracket generation, cheat sheet matching) thoroughly. |
| @testing-library/react | 16.x | Component testing | Test UI interactions (recording results, navigating disciplines). Encourages testing user behavior not implementation. |
| ESLint | 9.x | Linting | With `@eslint/js` and `typescript-eslint`. Flat config format (eslint.config.js). |
| Prettier | 3.x | Code formatting | Consistent formatting. Use `prettier-plugin-tailwindcss` for automatic class sorting. |

## Installation

```bash
# Core
npm install react react-dom react-router zustand

# Styling
npm install tailwindcss @tailwindcss/vite clsx

# PWA
npm install vite-plugin-pwa

# CSV Export
npm install papaparse

# Dev dependencies
npm install -D typescript @types/react @types/react-dom @types/papaparse
npm install -D vite @vitejs/plugin-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D eslint @eslint/js typescript-eslint
npm install -D prettier prettier-plugin-tailwindcss
```

**Project scaffolding:**
```bash
npm create vite@latest kings-races-web -- --template react-ts
```
This gives you React + TypeScript + Vite out of the box, then add the remaining dependencies.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React | Preact | If bundle size is absolutely critical (<3KB). But React's ecosystem and tooling are vastly better for a project this complex. |
| React | Svelte 5 | If starting fresh with no React experience. Svelte has less boilerplate. But React's ecosystem depth (testing, libraries, community answers) wins for a project with complex state logic. |
| Zustand | Jotai | If state is naturally atomic (many independent pieces). Race management state is centralized (event -> disciplines -> races -> results), making Zustand's store pattern a better fit. |
| Zustand | React Context | If state is trivial. Race state (teams, scores, standings, brackets across 3 disciplines) is complex enough to warrant a proper state library. Context causes unnecessary re-renders without careful memoization. |
| Tailwind CSS | Plain CSS / CSS Modules | If you prefer writing traditional CSS. Tailwind is faster for mobile-first responsive development -- `sm:`, `md:` breakpoint prefixes are exactly what this app needs. |
| localStorage | Dexie.js (IndexedDB) | If the app needs to store multi-event history, large datasets, or complex queries. For v1 with single-event data, localStorage is simpler and sufficient. |
| Vite 7.3.x | Vite 8.0.x | When vite-plugin-pwa officially supports Vite 8 peer dependencies. Vite 8's Rolldown bundler is faster but the speed difference is negligible for a small app. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js / Remix | Server-side frameworks. This app is client-side only with no backend. SSR/SSG adds complexity for zero benefit. Deployment is a static file host. | Vite + React (SPA) |
| Redux / Redux Toolkit | Overkill boilerplate for this app size. Actions, reducers, selectors pattern is unnecessary when Zustand does the same in 1/10th the code. | Zustand |
| Bootstrap / Material UI | Heavy component libraries. Bootstrap is 22KB+ gzipped CSS. MUI ships JS-in-CSS runtime. Both are bloated for a mobile-first app that needs fast load on spotty connectivity. | Tailwind CSS (utility classes, no runtime) |
| Firebase / Supabase | Backend-as-a-service. v1 explicitly requires no server. Adding a BaaS creates a dependency, requires auth setup, and adds latency. Build client-only first. | localStorage via Zustand persist |
| Axios | Unnecessary -- this app makes no HTTP requests in v1. If API calls are needed later, native `fetch()` is sufficient. | Nothing (no network calls in v1) |
| CSS-in-JS (styled-components, Emotion) | Runtime overhead on every render. Worse performance on mobile. Tailwind's utility classes are zero-runtime. | Tailwind CSS |
| Jest | Slower than Vitest, requires separate configuration, doesn't integrate with Vite's transform pipeline. | Vitest |

## Stack Patterns for This Project

**Since client-side only with localStorage:**
- Use Zustand's `persist` middleware with `localStorage` as the storage engine
- Structure stores per-domain: `useEventStore`, `useRaceStore`, `useResultsStore`
- Zustand persist handles JSON serialization/deserialization automatically
- No need for loading states or error boundaries around data fetching

**Since mobile-first, slope-side use:**
- PWA with precached app shell (vite-plugin-pwa with `generateSW` strategy)
- Tailwind's mobile-first breakpoints (`sm:` for tablet, `md:` for desktop -- mobile is the default)
- Large touch targets (min 44x44px) -- Tailwind classes like `p-4`, `min-h-[44px]`
- High contrast colors for outdoor/bright conditions

**Since pre-computed race orders:**
- Store cheat sheet data as static TypeScript const arrays (type-safe, no runtime parsing)
- Import only the needed sequence based on team count
- No generation algorithm needed -- just lookup tables

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vite 7.3.x | vite-plugin-pwa 1.2.x | Officially supported peer dependency |
| Vite 7.3.x | @tailwindcss/vite 4.2.x | Tailwind v4 supports Vite 5+ |
| React 19.1.x | React Router 7.13.x | Fully compatible |
| React 19.1.x | Zustand 5.0.x | Fully compatible, supports React 18+ |
| React 19.1.x | @testing-library/react 16.x | Compatible with React 19 |
| Vitest 4.1.x | Vite 7.3.x | Vitest 4.x supports Vite 7 and 8 |
| TypeScript 6.0 | All above | Universal compatibility |

## Sources

- [React versions](https://react.dev/versions) -- React 19.2 latest, 19.1 for stability (HIGH confidence)
- [Vite releases](https://vite.dev/releases) -- Vite 8.0 stable March 2026, Vite 7.3 LTS (HIGH confidence)
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 architecture changes (HIGH confidence)
- [Tailwind CSS Vite 8 support](https://github.com/tailwindlabs/tailwindcss/discussions/19624) -- @tailwindcss/vite 4.2.2+ supports Vite 8 (HIGH confidence)
- [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) -- TS 6.0 stable March 2026 (HIGH confidence)
- [Zustand npm](https://www.npmjs.com/package/zustand) -- v5.0.12 latest (HIGH confidence)
- [React Router npm](https://www.npmjs.com/package/react-router) -- v7.13.2 latest (HIGH confidence)
- [vite-plugin-pwa GitHub #918](https://github.com/vite-pwa/vite-plugin-pwa/issues/918) -- Vite 8 compatibility status (MEDIUM confidence -- functionally works but not officially declared)
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) -- Browser mode stable (HIGH confidence)
- [Zustand vs Jotai comparison](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k) -- State management landscape (MEDIUM confidence -- community source)
- [Dexie.js vs localStorage](https://blog.logrocket.com/dexie-js-indexeddb-react-apps-offline-data-storage/) -- Storage comparison (MEDIUM confidence)

---
*Stack research for: Kings Races Web -- mobile-first race management app*
*Researched: 2026-03-28*
