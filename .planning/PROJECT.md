# Kings Races Web

## What This Is

A mobile-first PWA for Kings Ski Club race officials to run university dry slope parallel slalom championship events from their phone. Replaces a Google Spreadsheet — handles team entry, race order generation (29 pre-computed sequences for 4-32 teams), live result recording with 1-tap scoring, group standings with race-by-race grids, multi-round tournament flow (R1 → R2 → Finals), final results, and CSV export. Works offline slope-side.

## Core Value

A race official can run an entire event from their phone — entering teams, seeing the race order, recording results live, and viewing group standings at any time.

## Current State

**v1.0 MVP shipped** (2026-03-30)

- 7,868 lines of TypeScript/TSX, 372 tests, 85 commits
- React 19 + Vite 8 + Zustand + Tailwind CSS 4 + vite-plugin-pwa
- Full event lifecycle: team entry → R1 scoring → R2 scoring → finals → results + CSV
- PWA installable with offline service worker
- Deployed: Not yet — ready for Netlify/Vercel

## Requirements

### Validated

- ✓ Enter teams by name per discipline (Mixed, Board, Ladies) — v1.0
- ✓ Auto-generate race order from exact cheat sheet sequences (4-32 teams) — v1.0
- ✓ Display race list with team names resolved — v1.0
- ✓ Record results: Win (3pts) / Loss (1pt) / DSQ (0pts) — v1.0
- ✓ Live-updating group tables with race-by-race grid — v1.0
- ✓ Finals bracket with placement matches — v1.0
- ✓ Final standings per discipline — v1.0
- ✓ CSV export — v1.0
- ✓ Mobile-first with 56px+ touch targets — v1.0
- ✓ localStorage persistence (survives tab death) — v1.0
- ✓ PWA installable with offline support — v1.0
- ✓ Tiebreak resolution UI for manual ordering — v1.0
- ✓ Merge Races + Score into single tab (NAV-01) — v1.1 Phase 6
- ✓ Fix DSQ-then-Win scoring bug (SCORE-01, SCORE-02) — v1.1 Phase 6

### Active

- [ ] Fix standings to count only per-round results (STAND-01, STAND-02, STAND-03)
- [ ] Fix finals to determine placement solely from finals results (FINAL-01, FINAL-02)

### Out of Scope

- User authentication / login — single official per event, add if multi-user needed
- Server-side database — client-side sufficient for single-event use
- Season standings across events (R1-R4) — different data model, v2 candidate
- Individual racer tracking — teams are the unit
- League points lookup — depends on season standings
- Real-time multi-user collaboration — no concurrent access needed

## Context

- **Tech stack:** React 19.1, Vite 8, TypeScript, Zustand 5 (persist), Tailwind CSS 4, vite-plugin-pwa, papaparse, Vitest
- **Race format:** Parallel slalom, team relay. Head-to-head round-robin in groups, cross-group R2 for 8+ teams, then placement finals
- **Three disciplines:** Mixed (4-32 teams), Board (4-17), Ladies (4-17)
- **Users:** Kings Ski Club officials, phones slope-side, possibly gloved
- **Data model:** Single Zustand store with per-discipline state, localStorage persist
- **Known tech debt:** `resetEvent` store action has no UI caller, `isValidTeamCount` export orphaned, no component tests (domain fully tested)

## Constraints

- **Platform**: Web app, mobile-first (no native app)
- **Data**: Client-side localStorage only
- **Race orders**: Exact cheat sheet replication (29 sequences)
- **Offline**: PWA service worker for slope-side reliability

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No auth for v1 | Single official per event | ✓ Good — simplicity enabled fast ship |
| Client-side only | No server needed | ✓ Good — works offline, zero hosting cost |
| Exact cheat sheet replication | Officials know existing race orders | ✓ Good — 29 sequences extracted from xlsx |
| Mobile-first design | Slope-side phone use | ✓ Good — 56px+ touch targets, high contrast |
| Zustand single store with persist | Atomic state, auto-save | ✓ Good — survives tab death reliably |
| No component tests | Domain logic fully tested (372 tests) | ⚠️ Revisit — add if UI bugs emerge |
| TiebreakResolver with UP/DOWN buttons | Simpler than drag-and-drop for gloved use | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 after Phase 6 completion*
