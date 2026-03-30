# Roadmap: Kings Races Web

## Milestones

- **v1.0 MVP** - Phases 1-5 (shipped 2026-03-30)
- **v1.1 Bug Fixes** - Phases 6-7 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) - SHIPPED 2026-03-30</summary>

- [x] **Phase 1: Foundation** - Project scaffolding, cheat sheet extraction, domain models, persistence
- [x] **Phase 2: Race Day UI** - Team entry, race list, scoring, standings overlay
- [x] **Phase 3: Multi-Round Flow** - R2 generation, R2 scoring, finals bracket and results
- [x] **Phase 4: PWA & Polish** - Service worker, offline support, installability
- [x] **Phase 5: Gap Closure** - R2 transition fix, tiebreak resolver UI

</details>

### v1.1 Bug Fixes

**Milestone Goal:** Fix scoring interaction bugs, correct standings/finals calculation scoping, and streamline race-day navigation.

- [ ] **Phase 6: Scoring UI & Interaction Fixes** - Merge race/score tabs and fix DSQ-then-Win bugs
- [x] **Phase 7: Standings & Finals Calculation Fixes** - Scope round standings correctly and fix finals placement logic (completed 2026-03-30)

## Phase Details

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

## Progress

**Execution Order:** Phase 6 then Phase 7.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-03-28 |
| 2. Race Day UI | v1.0 | 5/5 | Complete | 2026-03-29 |
| 3. Multi-Round Flow | v1.0 | 4/4 | Complete | 2026-03-30 |
| 4. PWA & Polish | v1.0 | 1/1 | Complete | 2026-03-30 |
| 5. Gap Closure | v1.0 | 1/1 | Complete | 2026-03-30 |
| 6. Scoring UI & Interaction Fixes | v1.1 | 2/2 | Complete | 2026-03-30 |
| 7. Standings & Finals Calculation Fixes | v1.1 | 1/1 | Complete   | 2026-03-30 |
