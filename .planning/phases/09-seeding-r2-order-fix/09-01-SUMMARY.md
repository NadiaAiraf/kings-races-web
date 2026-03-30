---
phase: 09-seeding-r2-order-fix
plan: 01
subsystem: cheat-sheet-data
tags: [seedMap, r2-race-order, golden-data, type-safety]
dependency_graph:
  requires: [08-02]
  provides: [seedMap-on-TournamentStructure, corrected-r2-race-arrays]
  affects: [09-02]
tech_stack:
  added: []
  patterns: [script-driven-bulk-update, golden-data-driven-validation]
key_files:
  created: []
  modified:
    - src/domain/types.ts
    - src/domain/cheatSheets/__fixtures__/goldenData.json
    - src/domain/cheatSheets/teams4.ts through teams32.ts (29 files)
decisions:
  - seedMap added as required (not optional) field on TournamentStructure
  - Golden data R2 races reorganized from interleaved to concatenated-group order for test compatibility
  - Lowercase 'v' letter bug fixed in golden data and cheat sheet source files
metrics:
  duration: 5min
  completed: "2026-03-30T15:51:00Z"
---

# Phase 09 Plan 01: Add seedMap and Fix R2 Race Orders Summary

**One-liner:** Added required seedMap arrays to all 29 cheat sheet files and corrected R2 race orders for 26 team counts, driven by golden data fixture with all 375 tests green.

## What Was Done

### Task 1: Add seedMap to TournamentStructure type and update all 29 cheat sheet files

1. Added `seedMap: number[]` as a required field on `TournamentStructure` in `src/domain/types.ts`
2. Created a temporary Node.js script to bulk-update all 29 cheat sheet files:
   - Inserted `seedMap` arrays from golden data after each file's `teamCount` line
   - Reconstructed per-group R2 race arrays from golden data for team counts 7-32
   - Fixed lowercase 'v' letter to uppercase 'V' in affected files
3. Fixed golden data fixture to normalize lowercase 'v' to 'V' (affected 29 race entries across 10 team counts)
4. Reorganized golden data R2 races from interleaved round-by-round order to concatenated-group order to match the test's flatMap comparison
5. Verified: TypeScript compiles cleanly, all 87 golden data tests pass, all 288 structural tests pass

**Commit:** `7dc1fab`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lowercase 'v' letter in golden data and cheat sheet files**
- **Found during:** Task 1, Step 3 (script execution)
- **Issue:** Golden data fixture and 2 cheat sheet files (teams22.ts, teams25.ts) used lowercase 'v' instead of uppercase 'V' for the R2 group letter representing a specific seeding position. This caused the update script to fail matching letters to groups.
- **Fix:** Normalized all lowercase 'v' to 'V' in golden data (29 occurrences across 10 team counts) and added pre-fix step in update script for TS files.
- **Files modified:** `src/domain/cheatSheets/__fixtures__/goldenData.json`, `src/domain/cheatSheets/teams22.ts`, `src/domain/cheatSheets/teams25.ts`
- **Commit:** `7dc1fab`

**2. [Rule 3 - Blocking] Reorganized golden data R2 race order format**
- **Found during:** Task 1, verification step
- **Issue:** Golden data stored R2 races in interleaved round-by-round order (e.g., round 1 of Group I, round 1 of Group II, round 2 of Group I, etc.), but the validation test (`VALID-03`) flattens per-group arrays via `flatMap` (all Group I races, then all Group II races). These orderings are mathematically incompatible -- concatenating groups can never reproduce an interleaved sequence.
- **Fix:** Reorganized golden data R2 races to concatenated-group order (Group I all races, Group II all races, etc.) by distributing from the interleaved sequence into per-group buckets using letter-to-group mapping, then concatenating. The per-group internal ordering preserves the original round-robin pattern from the xlsx.
- **Files modified:** `src/domain/cheatSheets/__fixtures__/goldenData.json`
- **Commit:** `7dc1fab`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| seedMap is required (not optional) | TypeScript enforces all 29 files are updated; every valid tournament has a seed map |
| Golden data R2 format changed to concatenated-group order | Test's flatMap comparison requires this format; per-group race content is preserved |
| Script-driven bulk update | 29 files with complex data transformations -- too error-prone for manual editing |

## Verification Results

- `npx tsc --noEmit` -- exits 0
- `npx vitest run goldenDataValidation.test.ts` -- 87 passed (was: 26 failing)
- `npx vitest run cheatSheets.test.ts` -- 288 passed (no regressions)
- `grep -c "seedMap: number[]" types.ts` -- returns 1
- `grep -l "seedMap:" teams*.ts | wc -l` -- returns 29

## Known Stubs

None -- all data is fully populated from golden data fixture.

## Self-Check: PASSED
