---
phase: 08-ground-truth-validation
plan: 02
subsystem: testing
tags: [vitest, golden-data, cheat-sheets, validation, parametric-tests]

# Dependency graph
requires:
  - phase: 08-01
    provides: goldenData.json fixture with seed maps, R1 races, and R2 races for all 29 team counts
provides:
  - Parametric Vitest tests validating all 29 cheat sheets against golden data
  - Regression safety net for seed mapping, R1 race order, and R2 race order
  - Documented discrepancy list for Phase 9 corrections
affects: [09-seed-mapping-fix, 09-r2-race-order-fix]

# Tech tracking
tech-stack:
  added: []
  patterns: [parametric test generation with for-loop + individual it() calls]

key-files:
  created:
    - src/domain/cheatSheets/goldenDataValidation.test.ts
  modified: []

key-decisions:
  - "Flat R2 sequence comparison (concatenate groups in order) rather than per-group race number matching"
  - "Individual it() calls per team count (not it.each) for independent failure reporting"

patterns-established:
  - "Golden data validation: import fixture JSON, loop 29 team counts, assert against getCheatSheet()"

requirements-completed: [VALID-01, VALID-02, VALID-03]

# Metrics
duration: 3min
completed: 2026-03-30
---

# Phase 8 Plan 2: Golden Data Validation Tests Summary

**Parametric Vitest tests validate seed maps, R1 races, and R2 races for all 29 team counts (4-32) against xlsx golden data -- 61/87 pass, 26 R2 failures document Phase 9 work**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-30T15:00:53Z
- **Completed:** 2026-03-30T15:03:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created 87 parametric tests across 3 suites (VALID-01, VALID-02, VALID-03) covering all 29 team counts
- VALID-01 (seed mapping): All 29 pass -- every golden data slot exists in the TS cheat sheet groups
- VALID-02 (R1 race order): All 29 pass -- all R1 race matchups match xlsx exactly
- VALID-03 (R2 race order): 3 pass (4-6 teams, no R2), 26 fail -- R2 race count/order discrepancies for 7-32 teams documented as Phase 9 work

## Task Commits

Each task was committed atomically:

1. **Task 1: Write parametric golden data validation tests** - `9a36181` (test)

## Files Created/Modified
- `src/domain/cheatSheets/goldenDataValidation.test.ts` - 141-line test file with 3 describe blocks validating seed maps, R1 races, and R2 races

## Decisions Made
- Used flat R2 race sequence comparison (groups concatenated in order) per research recommendation, rather than per-group race number matching
- Used individual `it()` calls in a for-loop instead of `it.each` so each team count fails independently with clear output

## Test Results Detail

### VALID-01: Seed-to-slot mapping -- 29/29 PASS
All seed slots from golden data exist in the TS cheat sheet group definitions for every team count.

### VALID-02: R1 race order -- 29/29 PASS
All R1 race matchups (homeSlot, awaySlot) match the xlsx golden data exactly for every team count.

### VALID-03: R2 race order -- 3/29 PASS, 26/29 FAIL
- **4, 5, 6 teams:** PASS (no R2 races expected or present)
- **7-25 teams:** FAIL -- R2 race matchup order differs (same count but different sequence)
- **26-31 teams:** FAIL -- R2 race count mismatch (golden has 3 more races per group than TS)
- **32 teams:** FAIL -- R2 race matchup order differs at race 3

These R2 failures are expected and serve as the Phase 9 work list.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Known Stubs

None -- all tests are fully implemented and running.

## Next Phase Readiness
- Validation tests establish a regression safety net before Phase 9 code changes
- R2 failures clearly identify which team counts need race order fixes
- Seed mapping and R1 race order are confirmed correct -- no changes needed there

---
*Phase: 08-ground-truth-validation*
*Completed: 2026-03-30*

## Self-Check: PASSED
