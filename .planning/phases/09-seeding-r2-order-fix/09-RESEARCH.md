# Phase 9: Seeding & R2 Order Fix - Research

**Researched:** 2026-03-30
**Domain:** Cheat sheet data correction (seedMap + R2 race orders) and domain function extraction
**Confidence:** HIGH

## Summary

Phase 9 is a data-driven fix phase. The golden data fixture from Phase 8 (`goldenData.json`) contains the exact correct `seedMap` and `r2Races` for all 29 team counts (4-32). The work is: (1) add `seedMap: number[]` to the `TournamentStructure` type, (2) populate `seedMap` in all 29 cheat sheet files from golden data, (3) fix R2 race arrays in 26 cheat sheet files (7-32) from golden data, and (4) extract `assignSlots` from `TeamEntryView.tsx` to a domain module that uses `seedMap`.

The current test suite has 467 tests: 441 passing, 26 failing (all VALID-03 R2 race order mismatches). After this phase, all 467 tests should pass. No new validation tests are needed -- Phase 8 already created the comprehensive golden data validation suite.

**Primary recommendation:** Use a script-driven approach to update all 29 cheat sheet files from the golden data JSON. The data is machine-extractable and too large (29 files, some with 45+ R2 races) for reliable manual transcription.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add `seedMap: number[]` field to `TournamentStructure` in `src/domain/types.ts`. Ordered array where index i is seed number (0-based) and value is the slot number.
- **D-02:** Populate `seedMap` in all 29 files using golden data from `goldenData.json`. Must exactly match.
- **D-03:** Fix `roundTwoGroups[].races` arrays in all cheat sheet files where R2 race order doesn't match xlsx. 26 team counts have discrepancies.
- **D-04:** Extract `assignSlots` from `TeamEntryView.tsx` to `src/domain/assignSlots.ts`. Function uses `structure.seedMap[i]` instead of `allSlots[i]`.
- **D-05:** Update `TeamEntryView.tsx` to import `assignSlots` from new domain module.
- **D-06:** All 87 golden data tests + 380+ existing tests must pass after all fixes.

### Claude's Discretion
- Whether to update cheat sheet files via a script or manually
- Order of file updates (type first, then data, then function -- or combined)
- Whether to update the extraction script to also generate seedMap data

### Deferred Ideas (OUT OF SCOPE)
None

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEED-01 | Team-to-group assignment must follow xlsx serpentine draft pattern for all 29 team counts | Golden data `seedMap` arrays contain exact mappings. `assignSlots` extraction + seedMap usage implements this. |
| SEED-02 | A `seedMap` array must be added to each cheat sheet's `TournamentStructure` | Type change to `types.ts` + 29 file updates. Golden data JSON is the source. TypeScript enforces completeness. |
| R2ORD-01 | Round 2 race order must exactly match xlsx for all applicable team counts (8+) | Golden data `r2Races` arrays contain exact correct R2 sequences. 26 TS files need R2 race array replacement. |

</phase_requirements>

## Architecture Patterns

### What Changes

| Component | File(s) | Change | Complexity |
|-----------|---------|--------|------------|
| Type definition | `src/domain/types.ts` | Add `seedMap: number[]` to `TournamentStructure` | Trivial -- 1 line |
| Cheat sheet data (seedMap) | 29 files: `teams4.ts` through `teams32.ts` | Add `seedMap` array to each | Mechanical -- data from golden JSON |
| Cheat sheet data (R2 races) | 26 files: `teams7.ts` through `teams32.ts` | Replace `roundTwoGroups[].races` arrays | Moderate -- requires reconstructing per-group arrays from flat interleaved golden data |
| Domain function (new) | `src/domain/assignSlots.ts` | Extract from TeamEntryView, use `seedMap` | Simple -- 10 lines |
| Domain function test (new) | `src/domain/assignSlots.test.ts` | Unit test for correct seeding | Simple |
| UI component | `src/components/teams/TeamEntryView.tsx` | Import `assignSlots` from domain, remove local definition | Simple -- delete + import |

### R2 Race Data: The Interleaving Problem

The golden data stores R2 races in **flat interleaved order** (all groups' round 1, then all groups' round 2, etc.):
```
Golden 8 teams: A-B, C-D, E-F, G-H, B-C, D-A, F-G, H-E, A-C, B-D, E-G, F-H
```

The TS files store R2 races **per-group** within `roundTwoGroups[].races[]`:
```
TS 8 teams Group I: A-B, C-D, B-C, D-A, A-C, B-D
TS 8 teams Group II: E-F, G-H, F-G, H-E, E-G, F-H
```

The golden data validation test (VALID-03) flattens the TS per-group races via `flatMap` and compares against the golden flat sequence. For this to match, the **per-group race arrays must be reordered** so that when flattened (Group I races, then Group II races, then Group III races...), they produce the golden interleaved sequence.

**Key insight:** The golden flat sequence interleaves round-by-round across groups. To reconstruct per-group arrays from the golden data, group the flat sequence by which R2 group each race belongs to (determined by the letter assignments in `seedingEntries`). Each R2 group's letters are defined in the existing TS data and do NOT change.

### R2 Race Count Mismatches

Some TS files have fewer R2 races than the golden data expects:

| Team Count | Current R2 Races | Golden R2 Races | Difference |
|-----------|-----------------|-----------------|------------|
| 21 | 26 | 27 | +1 |
| 23 | 31 | 33 | +2 |
| 24 | 33 | 36 | +3 |
| 26 | 36 | 39 | +3 |
| 27 | 36 | 39 | +3 |
| 28 | 39 | 42 | +3 |
| 29 | 39 | 42 | +3 |
| 30 | 39 | 42 | +3 |
| 31 | 42 | 45 | +3 |

The `roundTwoRaceCount` field already declares the correct (golden) count in all these files. The actual race arrays are simply incomplete. Fixing the arrays to match golden data also fixes these count mismatches.

### Two Failure Categories Among 26 R2 Failures

1. **Order-only failures** (17 team counts: 7-20, 22, 25, 32): Same number of R2 races, but wrong order when flattened
2. **Count + order failures** (9 team counts: 21, 23, 24, 26-31): Missing R2 races AND wrong order

Both categories are fixed the same way: replace R2 race arrays from golden data.

### Build Order

```
1. types.ts (add seedMap) -- unlocks TypeScript errors on all 29 files
2. All 29 cheat sheet files (add seedMap + fix R2 races) -- fixes data
3. assignSlots.ts (new domain function) -- uses seedMap
4. assignSlots.test.ts (new tests) -- validates function
5. TeamEntryView.tsx (import swap) -- completes integration
6. Run full test suite -- verify all 467 tests pass
```

### Script-Based Update Strategy (Recommended)

A Node.js script can read `goldenData.json` and each `teams{N}.ts` file, then:
1. Insert the `seedMap` array after the `teamCount` line
2. Reconstruct per-group R2 race arrays from the golden flat R2 sequence
3. Write the updated file

The script needs to:
- Parse each TS file to find insertion points
- Map golden flat R2 races back to per-group arrays using letter-to-group assignments from `seedingEntries`
- Preserve all existing structure (groups, R1 races, seedingEntries, finals) exactly

Alternatively, a simpler approach: since the golden data validation test compares flat R2 sequences, the R2 races per group can be reconstructed by:
1. Reading each group's letter set from `seedingEntries`
2. Filtering the golden flat R2 array to races involving that group's letters
3. Maintaining the golden order within each group's filtered subset

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Serpentine seeding algorithm | Runtime computation of seed-to-slot | Static `seedMap` arrays from golden data | Edge cases with uneven groups, within-group reordering, two-half split for 6+ groups |
| R2 race generation | Algorithm to compute R2 race orders | Static data from golden data JSON | Race orders come from xlsx formulas, not a simple pattern |
| Data transcription | Manual copy-paste of 29 seedMaps + 26 R2 race arrays | Script reading goldenData.json | Too much data for reliable manual entry |

## Common Pitfalls

### Pitfall 1: R2 Race Letter-to-Group Mapping Errors
**What goes wrong:** When reconstructing per-group R2 race arrays from the golden flat sequence, a race gets assigned to the wrong group.
**Why it happens:** Each R2 group's `seedingEntries` defines letter assignments (e.g., Group I has A,B,C,D; Group II has E,F,G,H). A race like `E v F` belongs to Group II. If the letter mapping is wrong, races end up in the wrong group.
**How to avoid:** Build the letter-to-group mapping directly from the existing `roundTwoGroups[].seedingEntries[].letter` data in each TS file. This data is already correct and does not change.
**Warning signs:** After fix, the flattened race sequence doesn't match golden data.

### Pitfall 2: Forgetting roundTwoRaceCount Updates
**What goes wrong:** The `roundTwoRaceCount` field doesn't match the actual R2 race count after fixing arrays.
**Why it happens:** Focus on fixing race arrays but forgetting the count metadata.
**How to avoid:** Verified that `roundTwoRaceCount` values already match golden data counts for all files. No updates to this field are needed. The existing `cheatSheets.test.ts` structural tests validate count consistency.

### Pitfall 3: seedMap Type as Optional
**What goes wrong:** Adding `seedMap?: number[]` (optional) instead of `seedMap: number[]` (required).
**Why it happens:** Trying to update files incrementally without TypeScript errors.
**How to avoid:** Make it required from the start. TypeScript compilation will fail until all 29 files are updated, which is the desired enforcement mechanism.

### Pitfall 4: Test File Naming Convention
**What goes wrong:** Creating test file in `src/domain/__tests__/` subdirectory.
**Why it happens:** Common convention in other projects.
**How to avoid:** Follow existing project convention: test files are co-located as `src/domain/assignSlots.test.ts` (same as `scoring.test.ts`, `validation.test.ts`, etc.).

## Code Examples

### Type Change (types.ts)
```typescript
export interface TournamentStructure {
  teamCount: number;
  seedMap: number[];              // NEW: maps entry index -> slot number
  groups: GroupDefinition[];
  roundOneRaces: RaceMatchup[];
  roundTwoGroups?: RoundTwoGroupDefinition[];
  finals: FinalsMatchup[];
  roundOneRaceCount: number;
  roundTwoRaceCount?: number;
}
```

### seedMap in Cheat Sheet (example: teams8.ts)
```typescript
export const TEAMS_8: TournamentStructure = {
  teamCount: 8,
  seedMap: [1, 11, 14, 4, 2, 12, 13, 3],  // NEW
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
    { letter: 'B', teamSlots: [11, 12, 13, 14] },
  ],
  // ... rest unchanged
};
```

### Extracted assignSlots (src/domain/assignSlots.ts)
```typescript
import type { Team } from './types';
import { getCheatSheet } from './cheatSheets';

export function assignSlots(names: string[]): Team[] {
  if (names.length >= 4) {
    const structure = getCheatSheet(names.length);
    return names.map((n, i) => ({ slot: structure.seedMap[i], name: n }));
  }
  return names.map((n, i) => ({ slot: i + 1, name: n }));
}
```

### Updated TeamEntryView.tsx (import only)
```typescript
// Remove lines 16-23 (local assignSlots function)
// Add import:
import { assignSlots } from '../../domain/assignSlots';
```

### R2 Race Reconstruction Logic (for script)
```typescript
// Given golden flat R2 races and existing roundTwoGroups with seedingEntries:
function reconstructPerGroupRaces(
  goldenR2Flat: { raceNum: number; homeLetter: string; awayLetter: string }[],
  roundTwoGroups: RoundTwoGroupDefinition[]
): void {
  // Build letter -> group index mapping
  const letterToGroup = new Map<string, number>();
  roundTwoGroups.forEach((g, idx) => {
    g.seedingEntries.forEach(entry => {
      letterToGroup.set(entry.letter, idx);
    });
  });

  // Distribute golden races to groups, preserving order
  const groupRaces: RoundTwoRace[][] = roundTwoGroups.map(() => []);
  for (const race of goldenR2Flat) {
    const groupIdx = letterToGroup.get(race.homeLetter)!;
    groupRaces[groupIdx].push({
      raceNum: groupRaces[groupIdx].length + 1,
      homeLetter: race.homeLetter,
      awayLetter: race.awayLetter,
    });
  }

  // Update each group's races
  roundTwoGroups.forEach((g, idx) => {
    g.races = groupRaces[idx];
  });
}
```

## Existing Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.x |
| Test count | 467 total (441 passing, 26 failing) |
| Failing tests | All 26 are VALID-03 (R2 race order) in `goldenDataValidation.test.ts` |
| Quick run | `npx vitest run` |
| Key test files | `cheatSheets.test.ts` (288 structural), `goldenDataValidation.test.ts` (87 golden) |

### Existing Validation Already Covers Phase Requirements

- **SEED-02 (seedMap presence):** `goldenDataValidation.test.ts` VALID-01 already validates seedMap for all 29 counts -- these tests pass because they only check golden data seedMap against group slots, not TS file seedMap (which doesn't exist yet). After adding `seedMap` to the type, a simple structural test can verify each file's seedMap matches golden data.
- **R2ORD-01 (R2 race order):** `goldenDataValidation.test.ts` VALID-03 tests all 26 team counts. Currently failing. Will pass after R2 fixes.
- **SEED-01 (serpentine assignment):** A new `assignSlots.test.ts` is needed to verify the function uses seedMap correctly for representative team counts.

## Scope Summary

| Change Category | Files | Nature |
|----------------|-------|--------|
| Type addition | 1 file (`types.ts`) | 1 line addition |
| seedMap data | 29 files (`teams4.ts` - `teams32.ts`) | Add seedMap array to each |
| R2 race fixes | 26 files (`teams7.ts` - `teams32.ts`) | Replace R2 race arrays from golden data |
| New domain function | 1 file (`assignSlots.ts`) | 10-line function |
| New test file | 1 file (`assignSlots.test.ts`) | Unit tests for assignSlots |
| UI import swap | 1 file (`TeamEntryView.tsx`) | Delete local function, add import |
| **Total files modified** | **32** (29 cheat sheets + types.ts + TeamEntryView.tsx + 2 new) | |

## Sources

### Primary (HIGH confidence)
- `src/domain/cheatSheets/__fixtures__/goldenData.json` -- Golden data with exact seedMap and r2Races for all 29 team counts (Phase 8 output)
- `src/domain/types.ts` -- Current `TournamentStructure` interface (direct code read)
- `src/components/teams/TeamEntryView.tsx` -- Current `assignSlots` implementation (direct code read)
- `src/domain/cheatSheets/goldenDataValidation.test.ts` -- Existing validation tests (direct code read)
- `src/domain/cheatSheets/teams{4,8,12}.ts` -- Representative cheat sheet structures (direct code read)
- `.planning/research/ARCHITECTURE.md` -- seedMap integration architecture (direct doc read)
- `.planning/research/FEATURES.md` -- Complete seed-to-slot mappings extracted from xlsx (direct doc read)
- Test suite output -- 26 failures confirmed, categorized by type (live test run)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all changes use existing patterns
- Architecture: HIGH - thoroughly documented in ARCHITECTURE.md, verified against live codebase
- Pitfalls: HIGH - failure modes identified from actual test output analysis

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- data-driven fixes with no external dependencies)
