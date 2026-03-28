# Project Research Summary

**Project:** Kings Races Web
**Domain:** Mobile-first, client-side race management web application (university ski club parallel slalom)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

Kings Races Web is a purpose-built tournament management tool for running parallel slalom ski racing events slope-side on a phone. The product replaces a spreadsheet that already handles team entry, cheat-sheet-driven race order generation, round-robin group scoring, and finals bracket seeding for three independent disciplines (Mixed, Board, Ladies). Because the official runs the event in cold conditions, likely wearing gloves, with unreliable connectivity, the architecture must be client-side only, offline-first, and optimised for touch usability with large targets and high contrast. The recommended stack is React 19 + TypeScript 6 + Vite 7.3 + Tailwind v4 + Zustand, with vite-plugin-pwa for offline caching and localStorage (via Zustand persist) as the primary persistence layer.

The highest-risk element of the entire project is the cheat sheet data: 29 pre-computed race order sequences (4-32 teams) that must match the existing spreadsheet exactly. Any divergence — even a single swapped matchup — destroys official trust and causes the app to be abandoned mid-event. These sequences must be hard-coded as static lookup tables and verified against the original spreadsheet with automated tests before any UI work begins. All other complexity (group standings, finals seeding, tiebreaker logic) flows downstream from this data being correct.

The single biggest operational risk is data loss. Safari on iOS evicts localStorage aggressively, mobile OS memory management kills background tabs, and a phone can die in cold weather. The storage-first architecture pattern — where localStorage is the source of truth and the app fully reconstructs from storage on every load — must be established in Phase 1 and never compromised. Every feature built afterward inherits this guarantee. A JSON export/backup mechanism should ship in the same phase as data entry, before the first live event.

## Key Findings

### Recommended Stack

The stack is deliberately minimal: no server, no backend, no authentication. Vite 7.3 (pinned, not 8, for vite-plugin-pwa peer dependency compatibility) builds the SPA; React 19.1 with TypeScript 6.0 handles the UI; Zustand 5 manages global state with its built-in `persist` middleware writing to localStorage. Tailwind v4 (utility-first, no config file) handles mobile-first styling. The PWA layer (vite-plugin-pwa + Workbox) precaches the app shell for offline use. Supporting libraries are minimal: `clsx` for conditional classes, `papaparse` for CSV export. No HTTP client is needed — this app makes no network requests in v1.

**Core technologies:**
- React 19.1.x: UI framework — industry standard, excellent mobile web support, stable ecosystem
- TypeScript 6.0: Type safety — critical for complex race logic (scoring, bracket generation, cheat sheet lookup)
- Vite 7.3.x: Build tool — pinned to v7 for guaranteed vite-plugin-pwa compatibility; speed gains of v8 are negligible for a small app
- Tailwind CSS 4.2.x: Styling — mobile-first utility classes, zero runtime overhead, 5x faster builds than v3
- Zustand 5.0.x: State management — 1KB, centralized store with built-in localStorage persistence, no boilerplate
- React Router 7.13.x: Client-side routing — navigation between disciplines, phases, and results views
- vite-plugin-pwa 1.2.x: PWA / offline — Workbox-based service worker, precaches app shell for slope-side reliability
- papaparse 5.x: CSV export — handles edge cases (commas in team names, unicode)
- Vitest 4.1.x: Testing — native Vite integration, fast, essential for scoring engine and cheat sheet verification

### Expected Features

**Must have (table stakes):**
- Team entry per discipline — enables everything downstream; supports 4-32 teams per discipline
- Race order from cheat sheets — replicates exact pre-computed sequences for all 29 team counts; non-negotiable for official trust
- Race list display — large text, high contrast, outdoor-readable matchup view
- Result recording (Win/Loss/DSQ) — primary interaction loop; must be 2 taps max, designed for gloves
- Live group standings — real-time recalculation as results are entered; officials check this constantly
- Finals bracket generation — auto-seeded from group standings; handles odd team counts and placement logic
- Final results view — clear ranking display with team names and positions
- Three independent disciplines — Mixed, Board, Ladies run separately; tab/navigation between them
- Undo / correct a result — mistakes happen; must cascade to standings recalculation
- Offline tolerance — client-side storage; no server dependency; data must survive tab kill and phone restart

**Should have (differentiators):**
- "Current race" focus mode — shows only the current matchup with big action buttons, auto-advances; the UX feature that replaces the spreadsheet
- Progress indicator — "Race 14 of 28" reduces cognitive load
- CSV export of results — continuity with existing spreadsheet-based processes
- PWA / Add to Home Screen — no browser chrome, offline-first asset caching
- Quick-glance standings overlay — fast access when officials are asked "who's winning?"

**Defer to v2+:**
- Event history (local) — useful but not critical for v1
- Visual bracket display — graphical bracket is a polish item
- Season/league standings — fundamentally different data model; separate milestone
- Multi-device collaboration — solves a problem that does not yet exist
- Individual racer tracking — different product scope

### Architecture Approach

The architecture is a four-layer client-side SPA: UI features (React components organised by feature), state layer (Zustand store with persist middleware, single centralized event store partitioned by discipline), domain logic layer (pure functions for race order lookup, scoring engine, group table calculation, and finals seeding), and a persistence layer (localStorage via Zustand persist + CSV export). Each discipline (Mixed, Board, Ladies) is a partition within a single event state tree — not a separate state instance — allowing atomic persistence and cross-discipline operations. Derived data (group standings, bracket seedings) is always computed from raw scores via `useMemo` selectors, never stored, eliminating sync bugs when results are corrected. A phase-based flow (setup -> group-stage -> finals -> complete) per discipline prevents invalid state transitions.

**Major components:**
1. Domain layer (types, cheat sheets, scoring engine, group calculator, finals logic) — pure functions, zero React dependency, fully testable before any UI exists
2. State layer (Zustand event store, persist middleware, selectors) — single source of truth; localStorage is always in sync
3. Feature UI (Team Entry, Race Schedule, Scoring Console, Group Table, Finals Bracket, Results/Export) — feature-based folder structure, each feature maps to a visible section of the app
4. PWA layer (vite-plugin-pwa, Workbox service worker) — precaches app shell; offline is a first-class requirement

### Critical Pitfalls

1. **Safari/iOS localStorage eviction destroys event data mid-competition** — call `navigator.storage.persist()` on first load; save after every single action; ship a one-tap JSON export/backup before the first live event; display a "data loaded from storage" indicator on startup
2. **Cheat sheet race order mismatch** — hard-code every sequence as a static lookup table copied exactly from the spreadsheet; write automated tests comparing all 29 team counts against the original; never generate schedules algorithmically
3. **Accidental result entry with gloves** — minimum 56-64px touch targets; full-row visual feedback on result entry; undo via single tap (not confirmation dialog); disable browser swipe-back gestures with `overscroll-behavior: none`
4. **Browser tab killed by OS memory management** — treat localStorage as source of truth, not React state; hydrate from storage on every page load; save synchronously on every state change; test by force-killing the tab after every major interaction
5. **Tiebreaker logic undefined or inconsistent with existing rules** — document the exact tiebreaker hierarchy from the race official before writing any standings logic; implement as composable comparator chain; include manual override escape hatch; test all tie scenarios (2-way, 3-way circular)
6. **Sunlight readability failures** — WCAG AAA contrast (7:1 minimum); shape + color + text for all status indicators; minimum 20px for team names and scores; test outdoors on a bright day

## Implications for Roadmap

Based on research, the architecture's build order dependency chain and the pitfall-to-phase mapping both point to the same natural phase structure:

### Phase 1: Data Foundation and Storage

**Rationale:** Everything else depends on correct cheat sheet data and a storage-first architecture. The domain logic must be built and verified before any UI exists. The storage pattern must be established before any feature is added. This is also where the highest-risk pitfalls live.
**Delivers:** Project scaffold, TypeScript types, all 29 cheat sheets as static data with automated tests, scoring engine (Win=3/Loss=1/DSQ=0) with tiebreaker logic, group calculation functions, Zustand store with localStorage persistence, `navigator.storage.persist()` call, JSON export/import backup mechanism
**Addresses features:** Team entry (data model), race order generation (cheat sheet lookup), result recording (scoring engine), offline tolerance (storage-first architecture)
**Avoids pitfalls:** Cheat sheet mismatch (static lookup + automated tests), Safari storage eviction (storage.persist + export), tab killed (storage-first pattern from day one), tiebreaker errors (logic defined before standings UI)

### Phase 2: Core Event Flow UI

**Rationale:** With the domain logic and state layer proven, build the primary interaction surfaces that officials use during an event. This is the critical path from team entry through scoring and live standings. The glove-usability and sunlight readability constraints must be designed in from the start of this phase, not retrofitted.
**Delivers:** Team entry UI per discipline, discipline tabs/navigation, race schedule display, scoring console (glove-optimised, 56px+ touch targets, full-row visual feedback, undo), live group standings with tiebreaker display, progress indicator ("Race N of M"), "current race" focus mode
**Addresses features:** All table-stakes features and the "current race" focus mode differentiator
**Avoids pitfalls:** Accidental tap/glove usability (touch target sizing and undo), sunlight readability (design system with AAA contrast from day one)

### Phase 3: Finals and Complete Event Flow

**Rationale:** Finals logic is distinct from group stage logic and has its own complexity, bracket structure, and testing requirements. It must be its own phase rather than bundled with group stage to ensure adequate testing of the group-to-finals transition.
**Delivers:** Finals bracket generation and display, placement match scoring, final results view, CSV export, end-to-end event completion flow
**Addresses features:** Finals bracket generation, final results view, CSV export, undo/correct with cascade
**Avoids pitfalls:** Group-to-finals transition errors (dedicated phase with end-to-end tests)

### Phase 4: PWA, Polish, and Reliability

**Rationale:** The app must work correctly before adding installability and polish. PWA setup (service worker, offline caching) is easier to configure correctly once the feature set is stable.
**Delivers:** vite-plugin-pwa integration, Workbox service worker with app shell precaching, Add to Home Screen manifest, visual bracket display, discipline summary dashboard, event history (local), outdoor readability audit and refinements
**Addresses features:** PWA/Add to Home Screen, visual bracket display, discipline dashboard, event history

### Phase Ordering Rationale

- Domain logic before UI: the domain layer (cheat sheets, scoring, group calc, finals logic) can be fully tested as pure functions before any React component is written; this is the architecture's explicit build order dependency chain
- Storage-first before features: the localStorage persistence pattern must be established in Phase 1 because every subsequent feature inherits it; retrofitting persistence is painful and risky
- Group stage before finals: the group-to-finals transition depends on correct group standing calculation; finals cannot be built or tested in isolation
- PWA last: service worker configuration is simplest when the feature set and URL structure are stable; adding it earlier creates churn in the Workbox precache manifest

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (cheat sheets):** Requires manual extraction and verification of all 29 race order sequences from the existing spreadsheet — this is not a development task but a data gathering task that needs the race official's involvement
- **Phase 1 (tiebreaker rules):** The exact tiebreaker hierarchy must be elicited from the race official before coding; the spreadsheet may have implicit rules embedded in formula logic that are not obvious

Phases with standard patterns (skip research):
- **Phase 2 (React UI):** Feature-based component structure is well-documented; Zustand + React integration is straightforward
- **Phase 3 (CSV export):** papaparse is well-documented; standard pattern
- **Phase 4 (PWA):** vite-plugin-pwa with generateSW strategy is well-documented for this stack

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All version recommendations sourced from official release pages and changelogs as of March 2026; the one medium-confidence item (vite-plugin-pwa + Vite 8 peer dependency) is resolved by pinning to Vite 7.3 |
| Features | HIGH | Feature set is directly derived from an existing spreadsheet workflow — there is minimal ambiguity about what officials need; comparables (Challonge, round-robin apps) corroborate the feature set |
| Architecture | HIGH | Pattern recommendations (single reducer with discipline partitioning, derived state via selectors, storage-first persistence) are supported by multiple open-source tournament app references and standard offline-first patterns |
| Pitfalls | HIGH | Safari storage eviction and iOS PWA limitations are documented by Apple and extensively reported; touch target guidance is from WCAG and Baymard research; all critical pitfalls are well-sourced |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact cheat sheet data:** The 29 race order sequences must be extracted from the existing spreadsheet before Phase 1 domain work can be completed. This requires access to the spreadsheet and verification with the race official. Block: cannot write or test `cheatSheets.ts` without this data.
- **Tiebreaker rules:** The exact tiebreaker hierarchy (head-to-head? points differential? coin flip? race-off?) is not documented in research and must be elicited from the race official before the scoring engine is finalised. Default assumption: points only with manual override.
- **Finals bracket structure per team count:** The finals bracket format may vary by team count (e.g., top 4 qualify for some counts, top 6 for others). The exact structure for each supported team count needs to be documented from the spreadsheet.
- **vite-plugin-pwa + Vite 8:** If vite-plugin-pwa officially declares Vite 8 peer dependency support by the time Phase 4 begins, upgrade Vite to 8.0.x for Rolldown build performance. Not a blocker for v1.

## Sources

### Primary (HIGH confidence)

- [React versions](https://react.dev/versions) — React 19.1 stability rationale
- [Vite releases](https://vite.dev/releases) — Vite 7.3 vs 8.0 decision
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — v4 architecture changes
- [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) — TS 6.0 stable March 2026
- [Updates to Storage Policy - WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/) — Safari localStorage eviction policy
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — browser storage quota documentation
- [WCAG 2.5.8 Target Size Minimum](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide) — touch target size requirements

### Secondary (MEDIUM confidence)

- [vite-plugin-pwa GitHub #918](https://github.com/vite-pwa/vite-plugin-pwa/issues/918) — Vite 8 functional compatibility (works but not officially declared)
- [Coronate chess tournament manager](https://dev.to/johnridesabike/building-coronate-an-open-source-chess-tournament-manager-46i8) — client-side-only tournament app architecture reference
- [brackets-manager.js](https://github.com/Drarig29/brackets-manager.js/) — domain logic / persistence separation pattern
- [PWA iOS Limitations and Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — iOS PWA limitations survey
- [Smashing Magazine - Accessible Target Sizes](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) — gloved touch target guidance
- [Baymard - Handling Accidental Taps](https://baymard.com/blog/handling-accidental-taps-on-touch-devices) — accidental tap prevention strategies
- [Zustand vs Jotai comparison](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k) — state management library selection

### Tertiary (LOW confidence)

- [Challonge](https://challonge.com/) — feature set benchmarking; generalised tournament app, not parallel slalom specific
- [All-Play-All](https://www.allplayall.app/features) — round-robin feature comparables; different sports domain

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
