# Kings Races Web

## What This Is

A mobile-first PWA for Kings Ski Club race officials to run university dry slope parallel slalom championship events from their phone. Replaces a Google Spreadsheet - handles team entry, race order generation (28 pre-computed sequences for 4-31 teams), live result recording with 1-tap scoring, group standings with race-by-race grids, multi-round tournament flow (R1 -> R2 -> Finals), final results, and CSV export. Officials sign in with Firebase Auth: approved officials (the approvedUsers allowlist) can create and score rounds, everyone else views read-only. Rounds sync through Firestore with a persistent offline cache, so scoring still works slope-side, and each round belongs to a season and league with season standings and league points.

## Core Value

A race official can run an entire event from their phone - entering teams, seeing the race order, recording results live, and viewing group standings at any time.

## Current State

**v1.2 shipped** (2026-03-30), followed by Firebase-backed multi-user work (PRs #2-#22, merged through 2026-10-27).

- ~18,300 lines of TypeScript/TSX in src, 1,162 unit/component tests plus Firestore rules tests
- React 19 + Vite 8 + Zustand + Tailwind CSS 4 + Firebase (Auth + Firestore) + vite-plugin-pwa
- Full event lifecycle: team entry -> R1 scoring -> R2 scoring -> finals -> results + CSV, inside seasons and leagues
- Deployed to GitHub Pages by `.github/workflows/deploy.yml` after CI passes on master

## Requirements

### Validated

- Enter teams by name per discipline (Mixed, Board, Ladies) - v1.0
- Auto-generate race order from exact cheat sheet sequences (4-32 teams) - v1.0 (later capped at 31 teams)
- Display race list with team names resolved - v1.0
- Record results: Win (3pts) / Loss (1pt) / DSQ (0pts) - v1.0
- Live-updating group tables with race-by-race grid - v1.0
- Finals bracket with placement matches - v1.0
- Final standings per discipline - v1.0
- CSV export - v1.0
- Mobile-first with 56px+ touch targets - v1.0
- localStorage persistence (survives tab death) - v1.0 (superseded by the Firestore offline cache)
- PWA installable with offline support - v1.0
- Tiebreak resolution UI for manual ordering - v1.0
- Merge Races + Score into single tab (NAV-01) - v1.1 Phase 6
- Fix DSQ-then-Win scoring bug (SCORE-01, SCORE-02) - v1.1 Phase 6
- Fix standings to count only per-round results (STAND-01, STAND-02, STAND-03) - v1.1 Phase 7
- Fix finals to determine placement solely from finals results (FINAL-01, FINAL-02) - v1.1 Phase 7
- Group seeding matches xlsx serpentine draft for all 29 team counts (SEED-01, SEED-02) - v1.2 Phase 9 (later capped at 31 teams)
- R2 race order matches xlsx for all team counts (R2ORD-01) - v1.2 Phase 9
- All cheat sheet data validated against xlsx source of truth (VALID-01, VALID-02, VALID-03) - v1.2 Phase 8

**Post-v1.2 (PRs #2-#22):**

- Firebase Auth login; approved officials edit, everyone else is a read-only viewer (teams tab hidden for viewers)
- Firestore sync with persistent offline cache, Safari long-polling fallback, and a warning when IndexedDB is unavailable
- Seasons and leagues (five leagues, rounds R1-R4 per season), league teams checklist including adding new teams
- Season standings with league points and spreadsheet tiebreak order
- Results-only rounds and rounds stopped early with hand-entered places
- R2 and finals races can be marked not run
- Race notes
- Completed rounds folded away
- Soft-deleted rounds (archived to deletedEvents) and discipline reset behind confirm dialogs
- Discipline and tab kept in the URL
- Per-discipline table colours, club branding, tablet width layout
- Firestore rules tests against the emulator
- CI (lint, unit tests, build, rules tests, dependency audit) and GitHub Pages deploy

### Active

None - no milestone open

### Out of Scope

- Individual racer tracking - teams are the unit

## Context

- **Tech stack:** React 19.2, React Router 7 (HashRouter), Vite 8, TypeScript 6.0, Zustand 5 (no persist), Tailwind CSS 4, Firebase 12 (Auth + Firestore), vite-plugin-pwa, papaparse, Vitest 5; pnpm 12 via corepack with pnpm-lock.yaml, Node 26 (.nvmrc) locally and in CI
- **Race format:** Parallel slalom, team relay. Head-to-head round-robin in groups, cross-group R2 for 8+ teams, then placement finals
- **Three disciplines:** Mixed (4-31 teams), Board (4-17), Ladies (4-17)
- **Users:** Approved Kings Ski Club officials scoring on phones slope-side (possibly gloved), plus read-only viewers
- **Data model:** Firestore collections `events`, `deletedEvents`, `seasons`, `seasons/{seasonId}/leagues/{league}` and `approvedUsers`. Event docs store scores and tiebreaks as maps keyed by race id / group so concurrent scorers write separate fields and do not clobber each other. A single Zustand store holds the open event.
- **Known tech debt:** `isValidTeamCount` export only used by its own test; Firestore rules deployed by hand, not by CI; approvedUsers allowlist managed by hand in the Firebase console

## Constraints

- **Platform**: Web app, mobile-first (no native app)
- **Data**: Firebase Auth + Firestore, with Firestore persistent offline cache; no custom server
- **Hosting**: GitHub Pages static site, HashRouter for deep links
- **Race orders**: Exact cheat sheet replication (28 sequences, 4-31 teams)
- **Offline**: PWA service worker for slope-side reliability, plus the Firestore offline cache

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No auth for v1 | Single official per event | Superseded (PR #2) - multiple officials and viewers needed shared live results; Firebase Auth + approvedUsers allowlist |
| Client-side only | No server needed | Superseded (PR #2) - Firestore backend for shared events, offline cache keeps slope-side use |
| Exact cheat sheet replication | Officials know existing race orders | Good - 29 sequences extracted from xlsx, later capped at 31 teams (28 sequences) |
| Mobile-first design | Slope-side phone use | Good - 56px+ touch targets, high contrast |
| Zustand single store with persist | Atomic state, auto-save | Partly superseded - single store kept, persist removed in favour of Firestore cache |
| No component tests | Domain logic fully tested (372 tests) | Superseded - component tests added alongside UI work |
| TiebreakResolver with UP/DOWN buttons | Simpler than drag-and-drop for gloved use | Good |
| Firebase (Auth + Firestore) over a custom backend | Shared live results with offline support and no server to run | Good |
| Firestore rules are the real access control | UI hides mutating controls via useCanEdit, but the client cannot be trusted | Good |
| GitHub Pages + HashRouter | Free static hosting; Pages cannot serve deep links | Good |
| Soft delete into deletedEvents behind confirm dialogs | Accidental deletes on a phone must be recoverable | Good |
| Firestore long polling for Safari | Safari tracking protection broke the streaming Listen channel | Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-29 - docs refresh after PRs #2-#22*
