---
phase: 06-scoring-ui-interaction-fixes
plan: 01
subsystem: ui
tags: [react, tailwind, scoring, expandable-card]

# Dependency graph
requires:
  - phase: 02-race-scoring
    provides: OutcomeButton, RaceCard, scoring patterns
provides:
  - ExpandableRaceCard component with one-tap Win/DSQ scoring
  - 3-tab SubTabs navigation (Teams, Races, Stds)
  - AppShell routing cleaned of Score/Finals tab panels
affects: [06-02-scoring-ui-interaction-fixes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Expandable card pattern: collapsed display + expanded scoring in single component"
    - "One-tap matchup resolution: every button tap resolves both teams instantly"

key-files:
  created:
    - src/components/races/ExpandableRaceCard.tsx
  modified:
    - src/components/layout/SubTabs.tsx
    - src/components/layout/AppShell.tsx

key-decisions:
  - "ExpandableRaceCard is a new component (not a refactor of RaceCard) to avoid breaking existing RaceListView"
  - "No Loss button rendered -- Win/DSQ per team resolves full matchup by construction"

patterns-established:
  - "ExpandableRaceCard pattern: collapsed with badges, expanded with Win/DSQ buttons, one-tap resolution"
  - "handleScore(team, outcome) resolves both sides without intermediate state"

requirements-completed: [NAV-01, SCORE-01, SCORE-02]

# Metrics
duration: 1min
completed: 2026-03-30
---

# Phase 6 Plan 1: ExpandableRaceCard and Tab Cleanup Summary

**ExpandableRaceCard with one-tap Win/DSQ scoring, SubTabs reduced from 5 to 3, AppShell Score/Finals routing removed**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-30T12:59:10Z
- **Completed:** 2026-03-30T13:00:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created ExpandableRaceCard with collapsed (outcome badges) and expanded (Win/DSQ buttons) states
- One-tap scoring resolves full matchup instantly -- eliminates SCORE-01 and SCORE-02 bugs by construction
- Reduced SubTabs from 5 tabs to 3 (Teams, Races, Stds), removed Score and Finals tabs
- Cleaned AppShell routing: removed ScoringFocusView and FinalsView tab panels

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ExpandableRaceCard component** - `deff940` (feat)
2. **Task 2: Update SubTabs and AppShell to remove Score/Finals tabs** - `4262704` (feat)

## Files Created/Modified
- `src/components/races/ExpandableRaceCard.tsx` - New expandable card with collapsed display and expanded Win/DSQ scoring
- `src/components/layout/SubTabs.tsx` - Reduced from 5 tabs to 3 (teams, races, standings)
- `src/components/layout/AppShell.tsx` - Removed ScoringFocusView and FinalsView imports and routing

## Decisions Made
- Created ExpandableRaceCard as a new component rather than refactoring RaceCard, preserving existing RaceListView until plan 02 integrates it
- No Loss button rendered to OutcomeButton -- matchup resolution is entirely through Win/DSQ combinations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None -- all components are fully wired with props interface ready for integration in plan 02.

## Next Phase Readiness
- ExpandableRaceCard ready for integration into RaceListView (plan 06-02)
- SubTabs and AppShell routing updated, ready for the merged Races tab scoring surface

---
*Phase: 06-scoring-ui-interaction-fixes*
*Completed: 2026-03-30*
