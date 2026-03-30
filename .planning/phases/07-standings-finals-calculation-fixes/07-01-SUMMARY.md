---
phase: 07-standings-finals-calculation-fixes
plan: 01
subsystem: scoring
tags: [standings, scoring, csv-export, round-scoping, finals]

requires:
  - phase: 06-scoring-ui-interaction-fixes
    provides: merged race/score UI and DSQ scoring fixes
provides:
  - R1 standings scoped to r1-* scores only (useStandings.ts)
  - CSV export R1 standings scoped to r1-* scores only (StandingsView.tsx)
  - Round-scoped standings test contract (scoring.test.ts)
  - Finals placement verification tests (useFinalResults.test.ts)
affects: []

tech-stack:
  added: []
  patterns: [filter-at-call-site for round-scoping]

key-files:
  created: [src/hooks/useFinalResults.test.ts]
  modified: [src/hooks/useStandings.ts, src/components/standings/StandingsView.tsx, src/domain/scoring.test.ts]

key-decisions:
  - "Filter scores at call site (r1-* prefix) rather than modifying calculateAllGroupStandings signature"
  - "Tests document filtering contract rather than testing filtering itself (pure function receives pre-filtered data)"

patterns-established:
  - "Round-scoping: filter scores by raceId prefix at the call site before passing to calculation functions"

requirements-completed: [STAND-01, STAND-02, STAND-03, FINAL-01, FINAL-02]

duration: 2min
completed: 2026-03-30
---

# Phase 7 Plan 1: Standings & Finals Calculation Fixes Summary

**R1 standings scoped to round-only scores via r1-* prefix filter, with 8 new tests verifying round-scoping and finals placement correctness**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-30T13:24:36Z
- **Completed:** 2026-03-30T13:26:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Fixed R1 standings to exclude R2 and finals scores from W/L/DSQ/Pts totals
- Fixed CSV export to use same round-scoped R1 standings as UI display
- Added 3 round-scoped standings tests documenting the filtering contract
- Added 5 finals placement tests proving positions derive from matchup outcomes only

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix R1 standings scoping and CSV export** - `f112e76` (fix)
2. **Task 2: Add finals placement verification tests** - `8aac6f4` (test)

## Files Created/Modified
- `src/hooks/useStandings.ts` - Added r1-* score filtering before calculateAllGroupStandings
- `src/components/standings/StandingsView.tsx` - Added r1-* score filtering in buildResultsForDiscipline (CSV export)
- `src/domain/scoring.test.ts` - 3 new tests in "round-scoped standings" describe block
- `src/hooks/useFinalResults.test.ts` - New file with 5 tests for computeFinalResults

## Decisions Made
- Filter scores at the call site using `scores.filter(s => s.raceId.startsWith('r1-'))` rather than modifying `calculateAllGroupStandings` to accept a round parameter. This matches the existing pattern in `useR2State.ts` and keeps the calculation functions pure and round-agnostic.
- Tests for round-scoping verify the contract (pre-filtered data produces correct results) rather than testing the filtering itself, since `calculateGroupStandings` is a pure function.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all changes are production-ready with no placeholders.

## Next Phase Readiness
- All 5 requirements (STAND-01, STAND-02, STAND-03, FINAL-01, FINAL-02) are satisfied
- 380 tests passing, zero TypeScript errors
- No further phases planned for v1.1

---
*Phase: 07-standings-finals-calculation-fixes*
*Completed: 2026-03-30*
