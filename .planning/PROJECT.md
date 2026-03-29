# Kings Races Web

## What This Is

A mobile-first web application for Kings Ski Club race officials to run university dry slope parallel slalom championship events. Replaces an existing Google Spreadsheet that manages team entry, race order generation, live result recording, group standings, and finals — making it usable slope-side on a phone.

## Core Value

A race official can run an entire event from their phone — entering teams, seeing the race order, recording results live, and viewing group standings at any time.

## Requirements

### Validated

- ✓ Auto-generate race order using exact pre-computed cheat sheet sequences (4-32 teams) — Phase 1
- ✓ Local/session data storage — no server required for v1 — Phase 1
- ✓ Support all three disciplines running independently within one event — Phase 1 (domain logic)
- ✓ Enter teams by name for each discipline (Mixed, Board, Ladies) with varying team counts per discipline — Phase 2
- ✓ Display race list showing each matchup (Team A V Team B) in correct order — Phase 2
- ✓ Record race results: Win (3pts), Loss (1pt), DSQ (0pts) for each team in a matchup — Phase 2
- ✓ Live-updating group tables ("boxes") showing each team's results and point totals during round-robin — Phase 2
- ✓ Mobile-first responsive design — must work well on phone slope-side — Phase 2
- ✓ Finals bracket with placement matches (1st/2nd, 3rd/4th, etc.) after group stage — Phase 3
- ✓ Final standings/results view per discipline — Phase 3
- ✓ Export results as CSV — Phase 3

### Active

- [ ] PWA support: installable via Add to Home Screen, service worker caches assets for offline use

### Out of Scope

- User authentication / login — not needed for v1, can come later
- Server-side database / persistence — local storage only for now
- Season standings across multiple events (R1-R4) — future feature
- Individual racer tracking — future feature
- League points lookup / season points — future feature (depends on season standings)
- Real-time multi-user collaboration — single official runs the event

## Context

- **Existing system:** Google Spreadsheet (v1.4) with 70+ tabs including hidden "cheat sheets" for race orders (4-32 teams), auto-populating formulas, and league points lookup tables
- **Race format:** Parallel slalom, team relay (5 racers per mixed team). Teams race head-to-head in round-robin within groups, then top teams go to placement finals
- **Scoring:** Win = 3pts, Loss = 1pt, DSQ = 0pts. Points accumulated across group matches determine standings
- **Three disciplines per event:** Mixed (up to 32 teams), Board/snowboard (up to 17 teams), Ladies (up to 17 teams) — each runs separately with same format
- **Race order cheat sheets:** Pre-computed matchup sequences exist for every team count (4-32). These must be replicated exactly — they define which team numbers face each other and in what order
- **Group stage + Finals:** Round-robin group stage determines seeding, then placement matches (1st/2nd, 3rd/4th, 5th/6th, etc.) determine final positions
- **League points:** Different point scales per discipline (Mixed: 30/28/26..., Ladies: 15/13/11..., Board: 10/8/6...) — relevant for future season standings feature
- **Users:** Race officials (organisers) from Kings Ski Club, using phones slope-side in potentially cold/gloved conditions
- **University league:** Teams represent universities

## Constraints

- **Platform**: Web app, mobile-first — must work in mobile browsers (no native app)
- **Data**: Client-side storage only for v1 (localStorage or similar)
- **Race orders**: Must replicate exact pre-computed cheat sheet matchup sequences from existing spreadsheet
- **Offline tolerance**: Should handle spotty connectivity gracefully since it's used slope-side

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No auth for v1 | Simplicity — single official per event, can add later | — Pending |
| Client-side only | No server infrastructure needed, fast to ship | — Pending |
| Exact cheat sheet replication | Officials are familiar with existing race orders, consistency matters | — Pending |
| Mobile-first design | Primary use case is slope-side on a phone | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after Phase 3 completion*
