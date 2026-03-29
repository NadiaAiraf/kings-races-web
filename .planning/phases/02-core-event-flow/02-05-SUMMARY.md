---
phase: 02-core-event-flow
plan: 05
subsystem: ui
tags: [react, tailwind, standings, overlay, mobile-first]

requires:
  - phase: 02-01
    provides: "AppShell with showStandings state placeholder, DisciplineTabs, SubTabs"
  - phase: 02-04
    provides: "ScoringFocusView with live score recording that feeds standings"
provides:
  - "StandingsView full-screen overlay component"
  - "GroupStandingsTable with rank, W/L/DSQ/Pts, race-by-race grid"
  - "ResultCell colored outcome cells (24x24)"
  - "TieBadge tie indicator"
  - "Standings toggle button in AppShell"
affects: [finals, results-export]

tech-stack:
  added: []
  patterns: [full-screen-overlay-toggle, semantic-table-with-scope]

key-files:
  created:
    - src/components/standings/ResultCell.tsx
    - src/components/standings/TieBadge.tsx
    - src/components/standings/GroupStandingsTable.tsx
    - src/components/standings/StandingsView.tsx
  modified:
    - src/components/layout/AppShell.tsx

key-decisions:
  - "Standings overlay replaces entire content area below discipline tabs (D-09 full-screen toggle, not sub-tab)"
  - "Floating Standings button hidden on Teams tab (irrelevant during team entry)"

patterns-established:
  - "Full-screen overlay toggle: conditionally render overlay vs normal content in AppShell"
  - "Semantic table with scope=col for accessibility in data-heavy views"

requirements-completed: [STND-01, STND-02, STND-03]

duration: 2min
completed: 2026-03-29
---

# Phase 02 Plan 05: Standings View Summary

**Full-screen standings overlay with per-group tables showing rank, W/L/DSQ/Pts, race-by-race colored result cells, and tie indicators**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T10:10:40Z
- **Completed:** 2026-03-29T10:12:23Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Built standings overlay as full-screen toggle per D-09 (not a sub-tab)
- Per-group tables with rank, team name, W/L/DSQ/Pts columns and race-by-race results grid
- Colored 24x24 ResultCell components (green/amber/red) with monospace font
- TieBadge shows "TIE" indicator for teams with equal points
- Standings button visible on Races/Score tabs, hidden on Teams tab
- "Back to Scoring" button preserves scoring position via Zustand store

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ResultCell, TieBadge, and GroupStandingsTable components** - `d952a54` (feat)
2. **Task 2: Build StandingsView overlay and wire toggle into AppShell** - `1dfe6b1` (feat)

## Files Created/Modified
- `src/components/standings/ResultCell.tsx` - Colored 24x24 outcome cells (3/1/0) with font-mono
- `src/components/standings/TieBadge.tsx` - Amber "TIE" indicator badge
- `src/components/standings/GroupStandingsTable.tsx` - Semantic table with rank, team, W/L/DSQ/Pts, race grid
- `src/components/standings/StandingsView.tsx` - Full-screen overlay with per-group tables and close button
- `src/components/layout/AppShell.tsx` - Wired StandingsView overlay and toggle button

## Decisions Made
- Standings overlay replaces entire content area below discipline tabs (D-09 full-screen toggle, not sub-tab)
- Floating Standings button hidden on Teams tab since standings are irrelevant during team entry
- Discipline tabs remain visible during standings view so officials can switch disciplines while checking standings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 02 plans (01-05) complete
- Core event flow is fully functional: team entry, race schedule generation, live scoring, and standings viewing
- Ready for Phase 03 (finals/bracket stage) or results export

---
*Phase: 02-core-event-flow*
*Completed: 2026-03-29*
