# Roadmap: Kings Races Web

## Overview

This roadmap takes Kings Races Web from zero to a fully functional slope-side race management app in four phases. We start by building and verifying the domain logic and storage foundation (cheat sheets, scoring engine, persistence) with no UI. Then we build the core event flow UI that officials use during a race: team entry, race display, scoring, and live standings. Phase 3 adds finals bracket generation, results display, and CSV export to complete the event lifecycle. Phase 4 makes the app installable and offline-capable via PWA support.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Data Foundation and Storage** - Domain logic, cheat sheets, scoring engine, and storage-first persistence layer
- [ ] **Phase 2: Core Event Flow** - Team entry, race display, result recording, and live group standings UI
- [ ] **Phase 3: Finals and Results** - Finals bracket generation, placement matches, final standings, and CSV export
- [ ] **Phase 4: PWA and Offline** - Service worker, offline caching, and Add to Home Screen installability

## Phase Details

### Phase 1: Data Foundation and Storage
**Goal**: All domain logic (cheat sheets, scoring, group calculation) is implemented as tested pure functions, and the storage-first persistence pattern is established so every subsequent feature inherits data safety
**Depends on**: Nothing (first phase)
**Requirements**: TEAM-02, TEAM-04, RACE-01, RACE-02, MOBL-02, MOBL-04
**Success Criteria** (what must be TRUE):
  1. All 29 cheat sheet race order sequences (4-32 teams) are hard-coded and pass automated tests verifying they match the existing spreadsheet
  2. Scoring engine correctly calculates Win (3pts), Loss (1pt), DSQ (0pts) and ranks teams by total points within groups
  3. App state persists to localStorage and fully reconstructs on page reload, tab kill, or browser restart
  4. Each discipline supports its correct team count range (Mixed: 4-32, Board: 4-17, Ladies: 4-17)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Scaffold Vite project and extract all 29 cheat sheets from xlsx
- [x] 01-02-PLAN.md -- Scoring engine, group calculations, validation, and cheat sheet integrity tests (TDD)
- [x] 01-03-PLAN.md -- Zustand store with persist middleware for localStorage persistence (TDD)

### Phase 2: Core Event Flow
**Goal**: A race official can enter teams, view the race schedule, record results with gloved hands, and check live group standings -- the complete group stage workflow on a phone
**Depends on**: Phase 1
**Requirements**: TEAM-01, TEAM-03, RACE-03, RACE-04, RACE-05, RESL-01, RESL-02, RESL-03, RESL-04, STND-01, STND-02, STND-03, MOBL-01
**Success Criteria** (what must be TRUE):
  1. Official can enter team names for each discipline and switch between disciplines via tabs or navigation
  2. Race list displays all matchups in correct order with team names resolved, and a focus mode highlights the current race with large action buttons
  3. Official can record a result (Win/Loss/DSQ) for any matchup in 2 taps or fewer, with touch targets of at least 56px
  4. Official can undo or correct a previously recorded result and see standings recalculate immediately
  5. Group standings table updates live as results are recorded, showing wins, losses, DSQs, points, and ranking -- accessible as a quick-glance overlay without losing scoring position
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md -- Tailwind CSS 4 setup, app shell with discipline tabs, sub-tabs, progress bar, hooks, and shared components
- [x] 02-02-PLAN.md -- Team entry view with add/delete/reset and slot assignment
- [x] 02-03-PLAN.md -- Race list view with matchup cards, round headers, and Round 2 placeholder
- [x] 02-04-PLAN.md -- Scoring focus view with auto-complement, auto-advance, undo, and DSQ constraint
- [x] 02-05-PLAN.md -- Standings view with per-group tables, race results grid, and tie indicators

### Phase 3: Finals and Results
**Goal**: After the group stage completes, the app generates a finals bracket, the official records placement matches, and complete results can be viewed and exported
**Depends on**: Phase 2
**Requirements**: FINL-01, FINL-02, FINL-03, FINL-04, EXPR-01, EXPR-02
**Success Criteria** (what must be TRUE):
  1. Finals bracket auto-generates from group stage results with correct placement match seeding (1st/2nd, 3rd/4th, 5th/6th, etc.)
  2. Official can record finals results using the same Win/Loss/DSQ interface as group stage
  3. Visual bracket display shows the finals structure graphically
  4. Final results view shows complete standings per discipline, and official can export results as CSV
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md -- Domain logic TDD: finals seeding resolution, R2 seeding, CSV export (all 29 cheat sheet patterns)
- [x] 03-02-PLAN.md -- R2 scoring UI: SubTabs extension to 5 tabs, R2 race display/scoring, R2 standings, phase transitions
- [ ] 03-03-PLAN.md -- Finals UI: FinalsView with banners, FinalsMatchupCard with scoring, auto-advance, completion detection
- [ ] 03-04-PLAN.md -- Results and export: FinalResultsTable, ExportButton, CSV download, StandingsView integration

### Phase 4: PWA and Offline
**Goal**: The app is installable on a phone home screen and works fully offline slope-side with no connectivity
**Depends on**: Phase 3
**Requirements**: MOBL-03
**Success Criteria** (what must be TRUE):
  1. App can be installed via Add to Home Screen on iOS and Android and launches without browser chrome
  2. Service worker precaches all app assets so the app loads and functions with zero network connectivity
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation and Storage | 0/3 | Planning complete | - |
| 2. Core Event Flow | 0/5 | Planning complete | - |
| 3. Finals and Results | 0/4 | Planning complete | - |
| 4. PWA and Offline | 0/0 | Not started | - |
