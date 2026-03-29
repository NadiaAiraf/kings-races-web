---
phase: 02-core-event-flow
plan: 03
subsystem: ui
tags: [react, race-list, race-card, round-header, mobile-first]

requires:
  - phase: 02-core-event-flow
    plan: 01
    provides: "AppShell, useDisciplineState hook, useCurrentRace hook, ProgressBar"
provides:
  - "RaceListView component displaying all Round 1 matchups with team names"
  - "RaceCard component with outcome badges (W/L/DSQ) and Edit label"
  - "RoundHeader component with active/inactive (greyed-out) states"
  - "Round 2 and Finals placeholders for 8+ team events"
  - "Empty state for fewer than 4 teams"
  - "Progress bar wired to real race data"
affects: [02-04, 02-05]

tech-stack:
  added: []
  patterns: ["Derived team/score maps from useDisciplineState", "Race ID convention r1-{raceNum}"]

key-files:
  created:
    - src/components/races/RaceCard.tsx
    - src/components/races/RoundHeader.tsx
    - src/components/races/RaceListView.tsx
  modified:
    - src/components/layout/AppShell.tsx

key-decisions:
  - "Round 2 shown as placeholder text, not individual race cards (team names unresolvable until Round 1 completes)"
  - "Progress bar handles all-scored edge case (currentIndex -1 maps to totalRaces)"

patterns-established:
  - "Race components: RaceListView derives teamMap and scoreMap from useDisciplineState"
  - "RoundHeader isFirst prop controls top margin to avoid double spacing"

requirements-completed: [RACE-03]

duration: 2min
completed: 2026-03-29
---

# Phase 02 Plan 03: Race List View Summary

**Race list view showing Round 1 matchups with team name resolution, outcome badges, and greyed-out Round 2/Finals placeholders for 8+ team events**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-29T10:03:26Z
- **Completed:** 2026-03-29T10:05:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- RaceCard displays race number, "Team A vs Team B" with names resolved from slot numbers, and W/L/DSQ outcome badges on scored races
- RoundHeader separates rounds with active (slate-900) and inactive (slate-400 opacity-40) states
- RaceListView derives all data reactively from useDisciplineState hook
- Empty state ("Add teams first") shown when fewer than 4 teams entered
- Round 2 placeholder shows race count and "seeded from Round 1 results" for 8+ team events
- Finals placeholder shown greyed out for events with finals
- Progress bar now reflects real scored race progress

## Task Commits

Each task was committed atomically:

1. **Task 1: Build RaceCard, RoundHeader, and RaceListView components** - `507fa95` (feat)
2. **Task 2: Wire RaceListView into AppShell** - `e799f5e` (feat)

## Files Created/Modified
- `src/components/races/RaceCard.tsx` - Race matchup card with outcome badges and Edit label
- `src/components/races/RoundHeader.tsx` - Round section divider with active/inactive styling
- `src/components/races/RaceListView.tsx` - Race list container deriving data from useDisciplineState
- `src/components/layout/AppShell.tsx` - Added RaceListView to Races sub-tab, connected ProgressBar to useCurrentRace

## Decisions Made
- Round 2 displayed as placeholder text rather than individual race cards (team names cannot be resolved until Round 1 completes)
- Progress bar handles the "all races scored" edge case where currentIndex is -1 by showing total/total

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed progress bar showing "Race 0 of N" when all races scored**
- **Found during:** Task 2
- **Issue:** When all races are scored, useCurrentRace returns currentIndex=-1, so currentIndex+1=0 would show "Race 0 of N"
- **Fix:** Added raceProgress variable that maps -1 to totalRaces when totalRaces > 0
- **Files modified:** src/components/layout/AppShell.tsx
- **Commit:** e799f5e

## Issues Encountered

None.

## User Setup Required

None.

## Known Stubs

None -- all components render real data from the store via useDisciplineState.

## Next Phase Readiness
- Race list is visible and functional via the Races sub-tab
- RaceCard Edit label is rendered but not wired (Plan 02-04 will connect scoring)
- Progress bar shows real race progress for downstream scoring views

## Self-Check: PASSED

All 3 created files verified on disk. All 2 task commits verified in git log.
