# Architecture: Corrected Seed-to-Slot Integration

**Domain:** Cheat sheet seeding accuracy (SEED-01, R2ORD-01, VALID-01)
**Researched:** 2026-03-30
**Confidence:** HIGH (based entirely on direct code reading)

## Problem Analysis

### Current Behavior

`assignSlots()` in `TeamEntryView.tsx` (line 16-23) assigns teams to slots by flattening groups left-to-right:

```typescript
function assignSlots(names: string[]): Team[] {
  const structure = getCheatSheet(names.length);
  const allSlots = structure.groups.flatMap((g) => g.teamSlots);
  return names.map((n, i) => ({ slot: allSlots[i], name: n }));
}
```

For 12 teams with groups `A[1,2,3] B[11,12,13] C[21,22,23] D[31,32,33]`, this produces:

| Entry order | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th | 11th | 12th |
|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|
| **Current** | A1 | A2 | A3 | B1 | B2 | B3 | C1 | C2 | C3 | D1 | D2 | D3 |

This fills Group A completely before moving to Group B. The strongest teams (entered first, presumably by seed) all land in Group A.

### Required Behavior (xlsx serpentine draft)

The xlsx uses serpentine/snake draft to distribute seeds evenly across groups:

| Entry order | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th | 11th | 12th |
|-------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|------|------|
| **Serpentine** | A1 | B1 | C1 | D1 | D2 | C2 | B2 | A2 | A3 | B3 | C3 | D3 |

Row 1: A->B->C->D. Row 2: D->C->B->A (snake back). Row 3: A->B->C->D again.

### Why This Matters

Without serpentine seeding, group balance is destroyed. The first N teams entered all land in Group A, making R1 group stage meaningless for competitive balance. This cascades into R2 and finals placement.

## Recommended Architecture

### Approach: Add `seedMap` array to `TournamentStructure`

Add a `seedMap: number[]` field to each cheat sheet file. This array maps entry-order index to the correct slot number. `assignSlots()` uses `seedMap` directly instead of flatMapping groups.

**Why this approach over alternatives:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A. Add `seedMap` to TournamentStructure** | Explicit, testable, matches xlsx exactly per team count | 29 files get a new field | **Recommended** |
| B. Compute serpentine at runtime from groups | No data changes | Assumes all team counts use the same serpentine pattern -- may not match xlsx for irregular group sizes (e.g., 7 teams = groups of 4+3) | Too risky |
| C. Reorder `teamSlots` arrays within groups | Minimal change | Breaks the semantic meaning of teamSlots (position within group vs seed order). Race matchups reference these slots, so reordering could silently break race pairings | Dangerous |
| D. Add a standalone `seedMaps.ts` lookup | Keeps cheat sheet files untouched | Splits related data across files -- seed map and group structure must stay in sync | Unnecessary indirection |

**Approach A wins** because:
1. The seed map is intrinsically per-team-count data -- it belongs in the cheat sheet.
2. It can be validated independently against the xlsx.
3. `assignSlots` becomes trivially simple: `seedMap[i]` gives the slot.
4. No risk of runtime computation diverging from xlsx for edge cases.

### Component Boundaries

| Component | Current Responsibility | Change Required |
|-----------|----------------------|-----------------|
| `src/domain/types.ts` | Defines `TournamentStructure` | Add `seedMap: number[]` field |
| `src/domain/cheatSheets/teams{N}.ts` (29 files) | Static cheat sheet data | Add `seedMap` array to each |
| `src/components/teams/TeamEntryView.tsx` | Team entry UI + `assignSlots()` | Modify `assignSlots` to use `seedMap`; extract to domain |
| `src/domain/cheatSheets/index.ts` | Lookup + exports | No change needed |

### Data Flow

```
User enters team name
  -> handleAdd() collects all names in entry order
  -> assignSlots(names) called
  -> getCheatSheet(names.length) returns TournamentStructure with seedMap
  -> names[i] gets slot seedMap[i]  (NEW -- replaces flatMap)
  -> Teams stored in Zustand with correct slot assignments
  -> Race matchups reference slots (unchanged)
  -> Standings computed from slots (unchanged)
```

## Type Changes

### `TournamentStructure` in `src/domain/types.ts`

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

**Invariant:** `seedMap.length === teamCount` and every slot in `seedMap` must appear in exactly one group's `teamSlots`. The set of slots in `seedMap` must exactly equal the union of all `groups[].teamSlots`.

### `assignSlots()` -- Updated Logic

```typescript
function assignSlots(names: string[]): Team[] {
  if (names.length >= 4) {
    const structure = getCheatSheet(names.length);
    return names.map((n, i) => ({ slot: structure.seedMap[i], name: n }));
  }
  return names.map((n, i) => ({ slot: i + 1, name: n }));
}
```

### Example `seedMap` Values

**12 teams** (4 groups of 3, serpentine across A, B, C, D):
```typescript
// Groups: A[1,2,3] B[11,12,13] C[21,22,23] D[31,32,33]
// Serpentine: A->B->C->D, D->C->B->A, A->B->C->D
seedMap: [1, 11, 21, 31, 32, 22, 12, 2, 3, 13, 23, 33]
//        A1  B1  C1  D1  D2  C2  B2  A2  A3  B3  C3  D3
```

**18 teams** (6 groups of 3, serpentine across A, B, C, D, E, F):
```typescript
// Groups: A[1,2,3] B[21,22,23] C[41,42,43] D[11,12,13] E[31,32,33] F[51,52,53]
// Serpentine: A->B->C->D->E->F, F->E->D->C->B->A, A->B->C->D->E->F
seedMap: [1, 21, 41, 11, 31, 51, 52, 32, 12, 42, 22, 2, 3, 23, 43, 13, 33, 53]
//        A1  B1  C1  D1  E1  F1  F2  E2  D2  C2  B2  A2  A3  B3  C3  D3  E3  F3
```

**Single-group counts (4-7 teams):**
```typescript
// Only one group, serpentine is identity
// teams4: seedMap: [1, 2, 3, 4]
// teams5: seedMap: [1, 2, 3, 4, 5]
// teams6: seedMap: [1, 2, 3, 4, 5, 6]
// teams7: seedMap: [1, 2, 3, 4, 5, 6, 7]
```

**IMPORTANT NOTE:** The example serpentine values above are illustrative. The actual `seedMap` for each team count MUST be extracted directly from the xlsx source of truth. Different team counts may have non-obvious group orderings (e.g., teams18.ts has groups ordered A, B, C, D, E, F with slot bases 1, 21, 41, 11, 31, 51 -- not sequential). The xlsx defines the canonical mapping.

## Patterns to Follow

### Pattern 1: Extract `assignSlots` to Domain Layer

`assignSlots` currently lives inside `TeamEntryView.tsx` (a UI component). It performs pure domain logic with zero React dependencies. Move it to `src/domain/assignSlots.ts` so it can be unit tested without component rendering.

```typescript
// src/domain/assignSlots.ts
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

**Why:** Domain logic in UI components is untestable without mounting React. The existing 372 tests are all domain-level tests -- this function belongs with them. The component simply imports and calls it.

### Pattern 2: Validation Function for seedMap Integrity

Add a parametric test that validates every cheat sheet's `seedMap` against its `groups`:

```typescript
// In test file
function validateSeedMap(structure: TournamentStructure): void {
  const allGroupSlots = structure.groups.flatMap(g => g.teamSlots);

  // seedMap has correct length
  expect(structure.seedMap).toHaveLength(structure.teamCount);

  // seedMap contains exactly the slots defined in groups
  expect(new Set(structure.seedMap)).toEqual(new Set(allGroupSlots));

  // No duplicates in seedMap
  expect(structure.seedMap.length).toBe(new Set(structure.seedMap).size);
}
```

Run this for all 29 team counts. This catches any mismatch between `seedMap` and group definitions.

### Pattern 3: Derive seedMap from xlsx, Not Algorithm

Each `seedMap` should be extracted directly from the xlsx "team entry" column order. Do NOT compute serpentine algorithmically and assume it matches. Different team counts may have different group sizes (e.g., 13 teams = groups of 4+3+3+3), and the xlsx may have non-obvious orderings.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Runtime Serpentine Computation

**What:** Computing the snake draft at runtime from group count and sizes.
**Why bad:** Assumes all 29 team counts follow the same serpentine rule. Edge cases with uneven group sizes may not snake identically. The xlsx is the source of truth, not an algorithm.
**Instead:** Extract the exact seed order from the xlsx into static `seedMap` arrays.

### Anti-Pattern 2: Reordering `teamSlots` Within Groups

**What:** Changing `teamSlots: [1, 2, 3]` to `teamSlots: [1, 3, 2]` to encode seed order within each group.
**Why bad:** `teamSlots` defines positional slots within a group. These slots are referenced by `roundOneRaces` (homeSlot/awaySlot), standings calculations, and R2 seeding entries. Reordering teamSlots silently breaks slot-to-position identity throughout the entire downstream pipeline.
**Instead:** Keep `teamSlots` arrays exactly as-is. Add `seedMap` as a separate, orthogonal concern.

### Anti-Pattern 3: Modifying the Zustand Store Shape

**What:** Adding seed information to `DisciplineState` or the Zustand store.
**Why bad:** Seeding is a cheat sheet concern (static data), not runtime state. Once teams are assigned slots via `assignSlots`, the entry-order seed information is irrelevant -- all downstream logic (race matchups, scoring, standings, R2 seeding, finals) operates solely on slot numbers.
**Instead:** `seedMap` lives only in static `TournamentStructure` data. No store changes.

### Anti-Pattern 4: Making seedMap Optional

**What:** Adding `seedMap?: number[]` and falling back to flatMap when absent.
**Why bad:** Creates two code paths that must both be correct. The fallback silently masks missing data. TypeScript's type checker should force every cheat sheet to provide seedMap.
**Instead:** Make `seedMap` required. TypeScript compilation fails if any of the 29 files omits it. This is the desired behavior -- compiler-driven completeness.

## Integration Points

### Files to Create (new)

| File | Purpose |
|------|---------|
| `src/domain/assignSlots.ts` | Extracted domain function (from TeamEntryView) |
| `src/domain/__tests__/assignSlots.test.ts` | Unit tests for correct seed-to-slot mapping |

### Files to Modify (existing)

| File | Change | Risk |
|------|--------|------|
| `src/domain/types.ts` | Add `seedMap: number[]` to `TournamentStructure` | LOW -- additive type change; TypeScript flags every cheat sheet missing it |
| `src/domain/cheatSheets/teams4.ts` through `teams32.ts` (29 files) | Add `seedMap` array to each | LOW -- purely additive data field |
| `src/components/teams/TeamEntryView.tsx` | Import `assignSlots` from `../domain/assignSlots`, remove local function definition | LOW -- same interface, corrected behavior |
| Existing cheat sheet tests (if any validate structure shape) | Add `seedMap` validation assertions | LOW -- additive test coverage |

### Files NOT Modified

| File | Why Untouched |
|------|---------------|
| `src/domain/cheatSheets/index.ts` | `getCheatSheet()` returns the full `TournamentStructure` -- `seedMap` comes through automatically |
| Store files (`eventStore.ts`, etc.) | Seed mapping is static data, not runtime state |
| Scoring/standings logic | Operates on slot numbers; unaffected by how slots were assigned to teams |
| R2 seeding logic | `roundTwoGroups[].seedingEntries` reference R1 group positions (A1, B2, etc.), not entry-order seeds |
| Finals logic | References R2 group standings, not team entry order |

## Build Order

Dependencies flow: types -> cheat sheet data -> domain function -> UI component -> tests.

| Step | What | Depends On | Unlocks |
|------|------|------------|---------|
| 1 | **Modify `src/domain/types.ts`** -- add `seedMap: number[]` to `TournamentStructure` | Nothing | TypeScript immediately flags all 29 cheat sheet files (compiler-driven completeness) |
| 2 | **Update all 29 `teams{N}.ts` files** -- add `seedMap` arrays from xlsx | Step 1 (type definition) | Compilation passes; domain function can use seedMap |
| 3 | **Create `src/domain/assignSlots.ts`** -- extracted function using `seedMap` | Steps 1-2 (type + data) | UI integration; testable in isolation |
| 4 | **Create `src/domain/__tests__/assignSlots.test.ts`** -- test correct mapping for representative counts (4, 8, 12, 18, 32) | Step 3 | Confidence in correctness |
| 5 | **Modify `TeamEntryView.tsx`** -- replace local `assignSlots` with import from domain | Step 3 | Integration complete |
| 6 | **Add parametric seedMap validation tests** -- for all 29 team counts, verify seedMap/group slot consistency | Steps 1-2 | Guards against data entry errors |

### R2 Race Order Fix (R2ORD-01) -- Same Data Pass, No Architecture Change

The R2 race order is defined in `roundTwoGroups[].races[]` within each cheat sheet file. If R2 race order does not match the xlsx, the fix is correcting those race arrays during the same Step 2 data correction pass. No new types, no new functions, no architectural change needed -- just corrected static data.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `seedMap` extracted incorrectly from xlsx | MEDIUM | HIGH -- wrong seeding defeats the entire purpose | Parametric validation tests for all 29 counts; cross-reference with xlsx during review |
| Existing scored events in localStorage have old slot assignments | LOW (app is pre-launch) | MEDIUM -- team-to-slot mapping would be stale | Document: resetting event data is expected when upgrading past this fix |
| Single-group counts (4-7) have non-trivial seed order in xlsx | LOW | LOW -- probably sequential, but verify | Still extract from xlsx rather than assuming |
| R2 `seedingEntries` reference group positions that shift meaning after seeding fix | VERY LOW | HIGH if it happened | seedingEntries reference group finishing positions (Winner A, Runner Up B), not entry-order seeds -- these are unaffected by how teams were initially placed into groups |

## Sources

- `src/domain/types.ts` lines 44-52 -- `TournamentStructure` interface (direct code read)
- `src/domain/cheatSheets/teams{4,5,8,12,18,32}.ts` -- representative cheat sheet structures (direct code read)
- `src/components/teams/TeamEntryView.tsx` lines 16-23 -- `assignSlots` implementation (direct code read)
- `src/domain/cheatSheets/index.ts` -- `getCheatSheet` lookup function (direct code read)
- `.planning/PROJECT.md` -- SEED-01, R2ORD-01, VALID-01 active requirements (direct doc read)

---
*Architecture research for: Kings Races Web v1.2 -- seed-to-slot mapping correction*
*Researched: 2026-03-30*
