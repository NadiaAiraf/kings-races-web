# Roadmap: Kings Races Web

## Milestones

- **v1.0 MVP** - Phases 1-5 (shipped 2026-03-30)
- **v1.1 Bug Fixes** - Phases 6-7 (shipped 2026-03-30)
- **v1.2 Cheat Sheet Accuracy** - Phases 8-9 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) - SHIPPED 2026-03-30</summary>

- [x] **Phase 1: Foundation** - Project scaffolding, cheat sheet extraction, domain models, persistence
- [x] **Phase 2: Race Day UI** - Team entry, race list, scoring, standings overlay
- [x] **Phase 3: Multi-Round Flow** - R2 generation, R2 scoring, finals bracket and results
- [x] **Phase 4: PWA & Polish** - Service worker, offline support, installability
- [x] **Phase 5: Gap Closure** - R2 transition fix, tiebreak resolver UI

</details>

<details>
<summary>v1.1 Bug Fixes (Phases 6-7) - SHIPPED 2026-03-30</summary>

- [x] **Phase 6: Scoring UI & Interaction Fixes** - Merge race/score tabs and fix DSQ-then-Win bugs
- [x] **Phase 7: Standings & Finals Calculation Fixes** - Scope round standings correctly and fix finals placement logic

</details>

### v1.2 Cheat Sheet Accuracy

**Milestone Goal:** Fix group seeding to match xlsx serpentine draft pattern and validate all cheat sheet data against the master xlsx source of truth.

- [ ] **Phase 8: Ground Truth & Validation** - Extract golden data from xlsx and establish automated validation tests for all 29 cheat sheets
- [ ] **Phase 9: Seeding & R2 Order Fix** - Add seedMap to TournamentStructure, fix assignSlots serpentine seeding, and correct R2 race order

## Phase Details

<details>
<summary>v1.0 MVP Phase Details (Phases 1-5)</summary>

### Phase 1: Foundation
**Goal**: Project scaffolding, cheat sheet extraction, domain models, persistence
**Depends on**: Nothing
**Plans**: 3 plans

Plans:
- [x] 01-01: Vite + React + TS scaffolding with cheat sheet extraction
- [x] 01-02: Domain models, scoring engine, group calculations
- [x] 01-03: Zustand store with localStorage persistence

### Phase 2: Race Day UI
**Goal**: Team entry, race list, scoring, standings overlay
**Depends on**: Phase 1
**Plans**: 5 plans

Plans:
- [x] 02-01: App shell layout and discipline navigation
- [x] 02-02: Team entry form
- [x] 02-03: Race list view with team name resolution
- [x] 02-04: Scoring interface with 1-tap recording
- [x] 02-05: Standings overlay with group tables

**UI hint**: yes

### Phase 3: Multi-Round Flow
**Goal**: R2 generation, R2 scoring, finals bracket and results
**Depends on**: Phase 2
**Plans**: 4 plans

Plans:
- [x] 03-01: R2 seeding and race generation
- [x] 03-02: R2 scoring flow
- [x] 03-03: Finals bracket with placement matches
- [x] 03-04: Final results and CSV export

### Phase 4: PWA & Polish
**Goal**: Service worker, offline support, installability
**Depends on**: Phase 3
**Plans**: 1 plan

Plans:
- [x] 04-01: VitePWA configuration with offline caching

### Phase 5: Gap Closure
**Goal**: R2 transition fix, tiebreak resolver UI
**Depends on**: Phase 4
**Plans**: 1 plan

Plans:
- [x] 05-01: R2 phase transition guard and tiebreak resolution UI

</details>

<details>
<summary>v1.1 Bug Fixes Phase Details (Phases 6-7)</summary>

### Phase 6: Scoring UI & Interaction Fixes
**Goal**: Race officials can view races and score them in a single unified tab with correct, mutually exclusive outcome selection
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: NAV-01, SCORE-01, SCORE-02
**Success Criteria** (what must be TRUE):
  1. User sees a single "Races" tab (no separate Score tab) that displays the race list with inline scoring controls
  2. After selecting DSQ for a team, that team's Win button is visually disabled and non-interactive
  3. Selecting a new outcome for a team automatically clears any previously selected outcome for that same team
  4. Scoring a matchup from the merged Races tab updates standings identically to the old Score tab
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md -- Create ExpandableRaceCard, update SubTabs and AppShell (remove Score/Finals tabs)
- [x] 06-02-PLAN.md -- Refactor RaceListView into unified scoring surface with inline scoring and finals integration

**UI hint**: yes

### Phase 7: Standings & Finals Calculation Fixes
**Goal**: Round standings reflect only their own round's results, and final event positions are determined solely by finals matchup outcomes
**Depends on**: Phase 6
**Requirements**: STAND-01, STAND-02, STAND-03, FINAL-01, FINAL-02
**Success Criteria** (what must be TRUE):
  1. Round 1 standings table shows points and results only from Round 1 races -- no R2 or finals data appears
  2. Round 2 standings table shows points and results only from Round 2 races -- no R1 or finals data appears
  3. Final event positions (1st, 2nd, 3rd, etc.) are determined entirely by finals matchup results, not group stage totals
  4. Group stage results (R1 + R2) affect only seeding into finals brackets, not final placement
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md -- Fix R1 standings scoping in useStandings and CSV export, add finals placement verification tests

</details>

### Phase 8: Ground Truth & Validation
**Goal**: All 29 cheat sheet data files are verified against the xlsx source of truth with automated tests, establishing a regression safety net before any code changes
**Depends on**: Phase 7 (v1.1 complete)
**Requirements**: VALID-01, VALID-02, VALID-03
**Success Criteria** (what must be TRUE):
  1. Golden data fixtures exist for all 29 team counts (4-32), extracted from reference/cheat-sheets-v1.4.xlsx and manually verified for at least 5 representative counts
  2. Automated tests validate every cheat sheet's seed-to-slot mapping against the golden data, and any mismatch causes a test failure
  3. Automated tests validate R1 race order (matchup pairs per group) for all 29 team counts against the golden data
  4. Automated tests validate R2 race order for all applicable team counts (8+) against the golden data
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md -- Extract golden data from xlsx into JSON fixture for all 29 team counts
- [x] 08-02-PLAN.md -- Write parametric Vitest validation tests for seed mappings, R1 races, and R2 races

### Phase 9: Seeding & R2 Order Fix
**Goal**: Teams are assigned to groups using the xlsx serpentine draft pattern for all 29 team counts, and R2 race order exactly matches the xlsx
**Depends on**: Phase 8
**Requirements**: SEED-01, SEED-02, R2ORD-01
**Success Criteria** (what must be TRUE):
  1. Entering teams for any team count (4-32) assigns them to groups following the serpentine draft pattern -- top seeds are spread across groups, not filled sequentially
  2. Each TournamentStructure in the codebase includes a seedMap array that defines the exact seed-to-slot mapping from the xlsx
  3. R2 race order for all applicable team counts (8+) matches the xlsx cheat sheet exactly
  4. All existing tests continue to pass (no regressions in R1 race order, scoring, standings, or finals)
**Plans**: 2 plans

Plans:
- [ ] 09-01-PLAN.md -- Add seedMap to TournamentStructure type and update all 29 cheat sheet files with seedMap + R2 race fixes
- [ ] 09-02-PLAN.md -- Extract assignSlots to domain module with serpentine seeding and wire into TeamEntryView

## Progress

**Execution Order:** Phase 8 then Phase 9.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-28 |
| 2. Race Day UI | v1.0 | 5/5 | Complete | 2026-03-29 |
| 3. Multi-Round Flow | v1.0 | 4/4 | Complete | 2026-03-30 |
| 4. PWA & Polish | v1.0 | 1/1 | Complete | 2026-03-30 |
| 5. Gap Closure | v1.0 | 1/1 | Complete | 2026-03-30 |
| 6. Scoring UI & Interaction Fixes | v1.1 | 2/2 | Complete | 2026-03-30 |
| 7. Standings & Finals Calculation Fixes | v1.1 | 1/1 | Complete | 2026-03-30 |
| 8. Ground Truth & Validation | v1.2 | 0/2 | In progress | - |
| 9. Seeding & R2 Order Fix | v1.2 | 0/2 | Not started | - |
