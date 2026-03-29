# Requirements: Kings Races Web

**Defined:** 2026-03-28
**Core Value:** A race official can run an entire event from their phone — entering teams, seeing the race order, recording results live, and viewing group standings at any time.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Team Management

- [x] **TEAM-01**: Official can enter team names for each discipline (Mixed, Board, Ladies) independently
- [x] **TEAM-02**: Each discipline supports a variable number of teams (Mixed: 4-32, Board: 4-17, Ladies: 4-17)
- [x] **TEAM-03**: Official can switch between disciplines via tabs or navigation
- [x] **TEAM-04**: Team data persists in localStorage so the app survives tab death or refresh

### Race Order

- [x] **RACE-01**: App auto-generates race order using exact pre-computed cheat sheet sequences based on number of teams entered
- [x] **RACE-02**: Cheat sheet matchup sequences for 4-32 teams are hard-coded and match the existing spreadsheet exactly
- [x] **RACE-03**: Race list displays all matchups in correct order showing "Team A V Team B" with team names resolved
- [x] **RACE-04**: Current race focus mode highlights the active matchup with large action buttons and auto-advances after recording
- [x] **RACE-05**: Progress indicator shows position in event (e.g., "Race 14 of 28")

### Result Recording

- [x] **RESL-01**: Official can record a result for each matchup: Win (3pts) / Loss (1pt) / DSQ (0pts) for each team
- [x] **RESL-02**: Result entry requires maximum 2 taps per matchup with touch targets of at least 56px for gloved use
- [x] **RESL-03**: Official can undo or correct a previously recorded result
- [x] **RESL-04**: Correcting a result cascades recalculation to group standings and any dependent finals seeding

### Group Standings

- [x] **STND-01**: Group table updates live as results are recorded, showing each team's wins, losses, DSQs, and total points
- [x] **STND-02**: Official can view group standings at any time without losing their place in the scoring flow (quick-glance overlay)
- [x] **STND-03**: Teams are ranked by total points within each group

### Finals

- [x] **FINL-01**: Finals bracket auto-generates from group stage results with correct placement match seeding
- [x] **FINL-02**: Finals include placement matches (1st/2nd, 3rd/4th, 5th/6th, etc.) matching the existing spreadsheet structure
- [x] **FINL-03**: Official can record finals results using the same Win/Loss/DSQ interface
- [x] **FINL-04**: Visual bracket display shows the finals structure graphically

### Results & Export

- [x] **EXPR-01**: Final results view shows complete standings per discipline after all races are completed
- [x] **EXPR-02**: Official can export results as a CSV file

### Mobile & Reliability

- [x] **MOBL-01**: Mobile-first responsive design with large touch targets (56px+), high contrast, and outdoor readability
- [x] **MOBL-02**: App persists all state to localStorage — survives tab death, browser restart, and phone lock
- [ ] **MOBL-03**: PWA support: installable via Add to Home Screen, service worker caches assets for offline use
- [x] **MOBL-04**: App reconstructs full state from localStorage on every load (normal path, not error recovery)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Season Standings

- **SEAS-01**: Track team standings across multiple events (R1-R4) in a season
- **SEAS-02**: Apply league points lookup per discipline (Mixed: 30/28/26..., Ladies: 15/13/11..., Board: 10/8/6...)
- **SEAS-03**: Season rankings with tiebreakers (best results, most recent, last year's position)

### Individual Tracking

- **INDV-01**: Track individual racers (Uni, Name) across events
- **INDV-02**: Individual standings with per-round points and totals

### Collaboration

- **COLB-01**: User authentication for race officials
- **COLB-02**: Server-side persistence for cross-device access
- **COLB-03**: Event history browsable across sessions

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication / login | Single official per event, adds friction for zero v1 value |
| Server-side database | Introduces hosting costs and connectivity dependency — opposite of slope-side needs |
| Real-time multi-user collaboration | Only one official records results. Conflict resolution is a complexity trap |
| Individual racer tracking | Teams are the unit, not individuals. Different product scope |
| Automated timing integration | Hardware timing is for FIS-level races, not university dry slope events |
| Spectator-facing live website | Adds hosting and a second UI surface to maintain |
| Registration / sign-up forms | Official enters team names directly. Self-registration is a different product |
| Payment / fee collection | Not the job of the race management tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEAM-01 | Phase 2 | Complete |
| TEAM-02 | Phase 1 | Complete |
| TEAM-03 | Phase 2 | Complete |
| TEAM-04 | Phase 1 | Complete |
| RACE-01 | Phase 1 | Complete |
| RACE-02 | Phase 1 | Complete |
| RACE-03 | Phase 2 | Complete |
| RACE-04 | Phase 2 | Complete |
| RACE-05 | Phase 2 | Complete |
| RESL-01 | Phase 2 | Complete |
| RESL-02 | Phase 2 | Complete |
| RESL-03 | Phase 2 | Complete |
| RESL-04 | Phase 2 | Complete |
| STND-01 | Phase 2 | Complete |
| STND-02 | Phase 2 | Complete |
| STND-03 | Phase 2 | Complete |
| FINL-01 | Phase 3 | Complete |
| FINL-02 | Phase 3 | Complete |
| FINL-03 | Phase 3 | Complete |
| FINL-04 | Phase 3 | Complete |
| EXPR-01 | Phase 3 | Complete |
| EXPR-02 | Phase 3 | Complete |
| MOBL-01 | Phase 2 | Complete |
| MOBL-02 | Phase 1 | Complete |
| MOBL-03 | Phase 4 | Pending |
| MOBL-04 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
