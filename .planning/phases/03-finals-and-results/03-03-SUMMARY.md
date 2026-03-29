---
phase: 03-finals-and-results
plan: 03
subsystem: ui
tags: [react, zustand, finals, scoring, tailwind]

# Dependency graph
requires:
  - phase: 03-finals-and-results/01
    provides: finalsSeeding domain logic (resolveAllFinalsMatchups, areAllFinalsScored)
  - phase: 03-finals-and-results/02
    provides: R2 state hook (useR2State with standings, ties, completion)
provides:
  - FinalsView container with state machine rendering (blocked/ready/confirmed/complete)
  - FinalsMatchupCard with placement labels, seeding context, and scoring
  - useFinalsState hook deriving full finals state from group stage
  - Shared scoring helpers (getComplement, getDisabledOutcomes)
  - Auto-transition from finals to complete phase
affects: [03-04, results, csv-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [forwardRef for scroll-to-next, shared scoring helpers extraction]

key-files:
  created:
    - src/hooks/useFinalsState.ts
    - src/components/finals/FinalsView.tsx
    - src/components/finals/FinalsMatchupCard.tsx
    - src/components/finals/FinalsReadyBanner.tsx
    - src/components/finals/FinalsBlockedBanner.tsx
    - src/domain/scoringHelpers.ts
  modified:
    - src/components/layout/AppShell.tsx
    - src/components/scoring/ScoringFocusView.tsx

key-decisions:
  - "Extracted getComplement and getDisabledOutcomes to shared scoringHelpers.ts for reuse between ScoringFocusView and FinalsMatchupCard"
  - "Auto-transition from finals to complete phase handled in AppShell effect watching finalsState"
  - "Card refs use Map-based lazy initialization for stable scroll-to-next behavior"

patterns-established:
  - "Shared scoring helpers: all outcome logic in src/domain/scoringHelpers.ts"
  - "Finals state machine: useFinalsState derives phase from group stage completion and ties"

requirements-completed: [FINL-01, FINL-02, FINL-03, FINL-04]

# Metrics
duration: 3min
completed: 2026-03-29
---

# Phase 3 Plan 3: Finals Scoring UI Summary

**Finals sub-tab with state machine rendering, placement matchup cards with seeding context, and Win/Loss/DSQ scoring with auto-advance**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T11:27:37Z
- **Completed:** 2026-03-29T11:31:08Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- FinalsView container renders correct state based on group stage completion: blocked banners when incomplete or ties exist, ready banner with Confirm Finals button, matchup cards when confirmed
- FinalsMatchupCard displays placement label, seeding context (refs), resolved team names, and full scoring UI with Win/Loss/DSQ auto-complement
- All placement matches visible simultaneously (no pagination) with auto-advance scrolling to next unscored match
- Phase auto-transitions to complete when all finals scored

## Task Commits

Each task was committed atomically:

1. **Task 1: useFinalsState hook and FinalsView with banners** - `f0b25a0` (feat)
2. **Task 2: FinalsMatchupCard with scoring and auto-advance** - `04e4e4b` (feat)

## Files Created/Modified
- `src/hooks/useFinalsState.ts` - Derives finals phase, resolved matchups with team names, completion state
- `src/components/finals/FinalsView.tsx` - Main container with state machine rendering and scroll-to-next
- `src/components/finals/FinalsMatchupCard.tsx` - Placement match card with seeding context and scoring buttons
- `src/components/finals/FinalsReadyBanner.tsx` - Green banner with Confirm Finals button
- `src/components/finals/FinalsBlockedBanner.tsx` - Blocked state banner with reason-specific messages
- `src/domain/scoringHelpers.ts` - Shared getComplement and getDisabledOutcomes extracted from ScoringFocusView
- `src/components/layout/AppShell.tsx` - FinalsView integration and finals->complete auto-transition
- `src/components/scoring/ScoringFocusView.tsx` - Refactored to import from shared scoringHelpers

## Decisions Made
- Extracted scoring complement/disabled logic to shared `scoringHelpers.ts` rather than duplicating in FinalsMatchupCard
- Auto-transition from finals to complete phase handled in AppShell effect (consistent with group-stage -> round-two pattern)
- Used forwardRef + Map-based lazy ref creation for scroll-to-next card behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data sources are wired to live store state.

## Next Phase Readiness
- Finals scoring UI complete, ready for Plan 04 (final results view and CSV export)
- Phase transitions work end-to-end: group-stage -> round-two -> finals -> complete
- Shared scoring helpers available for any future scoring components

---
*Phase: 03-finals-and-results*
*Completed: 2026-03-29*
