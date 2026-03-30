---
phase: 06-scoring-ui-interaction-fixes
plan: 02
subsystem: ui
tags: [react, scoring, expandable-card, auto-advance, finals]

# Dependency graph
requires:
  - phase: 06-scoring-ui-interaction-fixes
    provides: ExpandableRaceCard, 3-tab SubTabs, AppShell cleanup
provides:
  - Unified scoring surface in RaceListView with expandable cards for R1, R2, Finals
  - Auto-expand and auto-scroll to next unscored race
  - Finals gate rendering (blocked/ready/confirmed banners and tiebreak resolver)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unified scoring surface: single scrollable list replaces Score + Finals tabs"
    - "Synchronous next-card computation in handleScore before React re-render"
    - "requestAnimationFrame scrollIntoView for post-score auto-scroll"

key-files:
  created: []
  modified:
    - src/components/races/RaceListView.tsx

key-decisions:
  - "findNextUnscoredId computes next card synchronously in handleScore to avoid useEffect timing issues"
  - "Finals cards rendered inline with R1/R2 cards in same scrollable list"
  - "Unresolved finals matchups show placeholder text instead of disabled card"

patterns-established:
  - "allRaceIds memoized array spanning R1 + R2 + Finals for unified auto-advance"
  - "cardRefs Map with ref callback pattern for scroll targeting"

requirements-completed: [NAV-01, SCORE-01, SCORE-02]

# Metrics
duration: 1min
completed: 2026-03-30
---

# Phase 6 Plan 2: Unified Scoring Surface Summary

**RaceListView refactored from read-only race list into unified scoring surface with expandable cards, auto-advance, auto-scroll, and finals gate integration**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-30T13:02:48Z
- **Completed:** 2026-03-30T13:04:08Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Refactored RaceListView from read-only display to unified scoring surface replacing ScoringFocusView and FinalsView
- All rounds (R1, R2, Finals) render as ExpandableRaceCards with inline one-tap scoring
- Auto-expand first unscored card on mount, auto-advance to next after scoring
- Auto-scroll via requestAnimationFrame + scrollIntoView keeps scoring card visible
- Finals section renders blocked/ready/confirmed banners with tiebreak resolver
- DSQ-then-Win bug eliminated by construction (one-tap resolution)

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor RaceListView into unified scoring surface** - `0a9155e` (feat)
2. **Task 2: Verify unified Races tab scoring flow** - Auto-approved (checkpoint)

## Files Created/Modified
- `src/components/races/RaceListView.tsx` - Complete rewrite from 82-line read-only list to 244-line unified scoring surface

## Decisions Made
- Synchronous next-card computation in handleScore avoids useEffect timing pitfalls
- Finals matchups rendered inline in same scrollable list as R1/R2 cards
- Unresolved finals matchups show text placeholder rather than disabled ExpandableRaceCard

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None

## Known Stubs
None -- all scoring, auto-advance, auto-scroll, and finals gate rendering fully wired.

## Self-Check: PASSED

---
*Phase: 06-scoring-ui-interaction-fixes*
*Completed: 2026-03-30*
