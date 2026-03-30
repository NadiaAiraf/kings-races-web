---
phase: 09-seeding-r2-order-fix
plan: 02
subsystem: domain-logic
tags: [assignSlots, seedMap, serpentine-seeding, TDD]
dependency_graph:
  requires:
    - phase: 09-01
      provides: seedMap arrays on TournamentStructure for all 29 cheat sheets
  provides:
    - assignSlots domain function using seedMap for correct serpentine seeding
    - Unit tests validating serpentine seeding for representative team counts
  affects: [team-entry, group-assignment]
tech_stack:
  added: []
  patterns: [domain-extraction, TDD-red-green]
key_files:
  created:
    - src/domain/assignSlots.ts
    - src/domain/assignSlots.test.ts
  modified:
    - src/components/teams/TeamEntryView.tsx
key_decisions:
  - "assignSlots uses structure.seedMap[i] instead of allSlots flatMap for correct serpentine ordering"
  - "Domain extraction: assignSlots moved from UI component to src/domain/ for testability"
patterns-established:
  - "Domain function extraction: move logic from components to src/domain/ with co-located tests"
requirements-completed: [SEED-01]
metrics:
  duration: 1min
  completed: "2026-03-30T15:54:36Z"
---

# Phase 09 Plan 02: Extract assignSlots Domain Function Summary

**Extracted assignSlots to domain layer using seedMap for serpentine seeding, replacing buggy sequential slot assignment with 5 unit tests and 472 total tests green.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-30T15:53:29Z
- **Completed:** 2026-03-30T15:54:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extracted assignSlots from TeamEntryView.tsx to src/domain/assignSlots.ts using structure.seedMap[i]
- Added 5 TDD unit tests validating serpentine seeding for 4, 8, 16 teams and sub-4 fallback
- Wired domain function into TeamEntryView, removing local definition and unused imports
- Full test suite passes: 472 tests, 0 failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create assignSlots domain function with tests** - `e83d25e` (feat - TDD red/green)
2. **Task 2: Wire assignSlots into TeamEntryView and run full test suite** - `22ce20b` (refactor)

## Files Created/Modified
- `src/domain/assignSlots.ts` - Domain function using seedMap for serpentine slot assignment
- `src/domain/assignSlots.test.ts` - 5 unit tests validating seeding for 4, 8, 16 teams + fallback
- `src/components/teams/TeamEntryView.tsx` - Imports assignSlots from domain, local function removed

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use structure.seedMap[i] instead of allSlots flatMap | seedMap contains serpentine-ordered slots matching xlsx; allSlots was just sequential group slots |
| Extract to src/domain/ with co-located test | Domain logic should be testable independently of React components |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all functionality fully wired.

## Next Phase Readiness
- SEED-01 requirement complete: team seeding follows xlsx serpentine draft pattern
- All 472 tests pass with zero regressions
- assignSlots is now independently testable in the domain layer

## Self-Check: PASSED

- All 4 files exist (assignSlots.ts, assignSlots.test.ts, TeamEntryView.tsx, 09-02-SUMMARY.md)
- Both commits found (e83d25e, 22ce20b)
- seedMap used in assignSlots.ts (1 match), allSlots absent (0 matches)
- No local assignSlots function in TeamEntryView.tsx (0 matches)
- Import from domain present in TeamEntryView.tsx

---
*Phase: 09-seeding-r2-order-fix*
*Completed: 2026-03-30*
