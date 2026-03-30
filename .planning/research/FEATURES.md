# Feature Landscape: Cheat Sheet Seed-to-Slot Accuracy

**Domain:** Serpentine/snake draft seeding for parallel slalom tournament group assignment
**Researched:** 2026-03-30
**Source of truth:** `reference/cheat-sheets-v1.4.xlsx`

## Executive Summary

The xlsx master cheat sheet uses a modified serpentine draft to assign seeded teams to group slots. The current codebase assigns seeds to slots **sequentially** (`seed[i] -> allSlots[i]`), which is wrong. The xlsx uses a specific seed-to-slot mapping for each team count that determines which team lands in which group position. This is the root cause of SEED-01.

The R1 race orders (per-slot matchups) and R2 race orders (per-group matchups) in the existing TS files **already match the xlsx**. The R2 seeding codes (position codes like A1, B2) also match. The **only bug** is the `assignSlots` function in `TeamEntryView.tsx` that maps team entry order (seeds) to slot numbers.

## The Bug: `assignSlots` Sequential Mapping

**File:** `src/components/teams/TeamEntryView.tsx`, lines 16-23

```typescript
function assignSlots(names: string[]): Team[] {
  if (names.length >= 4) {
    const structure = getCheatSheet(names.length);
    const allSlots = structure.groups.flatMap((g) => g.teamSlots);
    return names.map((n, i) => ({ slot: allSlots[i], name: n }));
  }
  return names.map((n, i) => ({ slot: i + 1, name: n }));
}
```

This does `seed 1 -> first slot in flatMap, seed 2 -> second slot, ...` which produces sequential group filling rather than serpentine draft assignment.

**Example (8 teams):** `flatMap` gives `[1,2,3,4,11,12,13,14]`, so seeds 1-4 all go to Group A and seeds 5-8 all go to Group B. The xlsx puts seeds `[1,5,8,4]` in Group A and `[2,6,7,3]` in Group B.

## Table Stakes: Complete Seed-to-Slot Mappings

Features required to match xlsx for all 29 team counts. Missing = incorrect tournament seeding.

### Extracted Seed-to-Slot Mappings (All 29 Team Counts)

Each line shows `seed -> slot` for every team count. These are extracted directly from xlsx formula references (`='Enter Teams'!B{row}` where seed = row - 2).

**4 Teams** (1 group of 4):
```
seed 1->slot 1, seed 2->slot 4, seed 3->slot 3, seed 4->slot 2
```

**5 Teams** (1 group of 5):
```
seed 1->slot 1, seed 2->slot 5, seed 3->slot 4, seed 4->slot 2, seed 5->slot 3
```

**6 Teams** (1 group of 6):
```
seed 1->slot 1, seed 2->slot 6, seed 3->slot 3, seed 4->slot 2, seed 5->slot 4, seed 6->slot 5
```

**7 Teams** (2 groups: A=4, B=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 13, seed 4->slot 4, seed 5->slot 2, seed 6->slot 12, seed 7->slot 3
```

**8 Teams** (2 groups of 4):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 14, seed 4->slot 4, seed 5->slot 2, seed 6->slot 12, seed 7->slot 13, seed 8->slot 3
```

**9 Teams** (3 groups of 3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 23, seed 5->slot 13, seed 6->slot 3, seed 7->slot 2, seed 8->slot 12, seed 9->slot 22
```

**10 Teams** (3 groups: A=4, B=3, C=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 23, seed 5->slot 13, seed 6->slot 4, seed 7->slot 2, seed 8->slot 12, seed 9->slot 22, seed 10->slot 3
```

**11 Teams** (3 groups: A=4, B=4, C=3):
```
seed 1->slot 1, seed 2->slot 21, seed 3->slot 31, seed 4->slot 33, seed 5->slot 24, seed 6->slot 4, seed 7->slot 2, seed 8->slot 22, seed 9->slot 32, seed 10->slot 23, seed 11->slot 3
```

> **NOTE:** 11 teams maps to slot ranges in the 20s and 30s despite having only 3 logical groups. This means the TS file's group slot structure may use different base offsets than expected. Verify the existing `teams11.ts` group definitions match these slot numbers during implementation.

**12 Teams** (4 groups of 3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 33, seed 6->slot 23, seed 7->slot 13, seed 8->slot 3, seed 9->slot 2, seed 10->slot 12, seed 11->slot 22, seed 12->slot 32
```

**13 Teams** (4 groups: A=4, B=3, C=3, D=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 33, seed 6->slot 23, seed 7->slot 13, seed 8->slot 4, seed 9->slot 2, seed 10->slot 12, seed 11->slot 22, seed 12->slot 32, seed 13->slot 3
```

**14 Teams** (4 groups: A=4, B=4, C=3, D=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 33, seed 6->slot 23, seed 7->slot 14, seed 8->slot 4, seed 9->slot 2, seed 10->slot 12, seed 11->slot 22, seed 12->slot 32, seed 13->slot 13, seed 14->slot 3
```

**15 Teams** (4 groups: A=4, B=4, C=4, D=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 33, seed 6->slot 24, seed 7->slot 14, seed 8->slot 4, seed 9->slot 2, seed 10->slot 12, seed 11->slot 22, seed 12->slot 32, seed 13->slot 23, seed 14->slot 13, seed 15->slot 3
```

**16 Teams** (4 groups of 4):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 34, seed 6->slot 24, seed 7->slot 14, seed 8->slot 4, seed 9->slot 2, seed 10->slot 12, seed 11->slot 22, seed 12->slot 32, seed 13->slot 33, seed 14->slot 23, seed 15->slot 13, seed 16->slot 3
```

**17 Teams** (6 groups: 5x3 + 1x2):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 52, seed 8->slot 43, seed 9->slot 33, seed 10->slot 23, seed 11->slot 13, seed 12->slot 3, seed 13->slot 2, seed 14->slot 12, seed 15->slot 22, seed 16->slot 32, seed 17->slot 42
```

**18 Teams** (6 groups of 3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 53, seed 8->slot 43, seed 9->slot 33, seed 10->slot 23, seed 11->slot 13, seed 12->slot 3, seed 13->slot 2, seed 14->slot 12, seed 15->slot 22, seed 16->slot 32, seed 17->slot 42, seed 18->slot 52
```

**19 Teams** (6 groups: A=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 53, seed 8->slot 43, seed 9->slot 33, seed 10->slot 23, seed 11->slot 13, seed 12->slot 4, seed 13->slot 2, seed 14->slot 12, seed 15->slot 22, seed 16->slot 32, seed 17->slot 42, seed 18->slot 52, seed 19->slot 3
```

**20 Teams** (6 groups: A=4, D=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 53, seed 8->slot 43, seed 9->slot 33, seed 10->slot 23, seed 11->slot 14, seed 12->slot 4, seed 13->slot 2, seed 14->slot 12, seed 15->slot 22, seed 16->slot 32, seed 17->slot 42, seed 18->slot 52, seed 19->slot 13, seed 20->slot 3
```

**21 Teams** (7 groups of 3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 63, seed 9->slot 53, seed 10->slot 43, seed 11->slot 33, seed 12->slot 23, seed 13->slot 13, seed 14->slot 3, seed 15->slot 2, seed 16->slot 12, seed 17->slot 22, seed 18->slot 32, seed 19->slot 42, seed 20->slot 52, seed 21->slot 62
```

**22 Teams** (7 groups: D=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 64, seed 9->slot 63, seed 10->slot 62, seed 11->slot 53, seed 12->slot 43, seed 13->slot 33, seed 14->slot 23, seed 15->slot 13, seed 16->slot 3, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52
```

**23 Teams** (8 groups: 6x3 + 1x3 + 1x2):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 72, seed 10->slot 63, seed 11->slot 53, seed 12->slot 43, seed 13->slot 33, seed 14->slot 23, seed 15->slot 13, seed 16->slot 3, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62
```

**24 Teams** (8 groups of 3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 63, seed 11->slot 53, seed 12->slot 43, seed 13->slot 33, seed 14->slot 23, seed 15->slot 13, seed 16->slot 3, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72
```

**25 Teams** (8 groups: A=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 63, seed 11->slot 53, seed 12->slot 43, seed 13->slot 33, seed 14->slot 23, seed 15->slot 13, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 3
```

**26 Teams** (8 groups: A=4, E=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 63, seed 11->slot 53, seed 12->slot 43, seed 13->slot 33, seed 14->slot 23, seed 15->slot 14, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 13, seed 26->slot 3
```

**27 Teams** (8 groups: A,B,E=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 63, seed 11->slot 53, seed 12->slot 43, seed 13->slot 33, seed 14->slot 24, seed 15->slot 14, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 23, seed 26->slot 13, seed 27->slot 3
```

**28 Teams** (8 groups: A,B,E,F=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 63, seed 11->slot 53, seed 12->slot 43, seed 13->slot 34, seed 14->slot 24, seed 15->slot 14, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 33, seed 26->slot 23, seed 27->slot 13, seed 28->slot 3
```

**29 Teams** (8 groups: A,B,C,E,F=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 63, seed 11->slot 53, seed 12->slot 44, seed 13->slot 34, seed 14->slot 24, seed 15->slot 14, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 43, seed 26->slot 33, seed 27->slot 23, seed 28->slot 13, seed 29->slot 3
```

**30 Teams** (8 groups: A,B,C,E,F,G=4, rest=3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 63, seed 11->slot 54, seed 12->slot 44, seed 13->slot 34, seed 14->slot 24, seed 15->slot 14, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 53, seed 26->slot 43, seed 27->slot 33, seed 28->slot 23, seed 29->slot 13, seed 30->slot 3
```

**31 Teams** (8 groups: 7x4 + 1x3):
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 73, seed 10->slot 64, seed 11->slot 54, seed 12->slot 44, seed 13->slot 34, seed 14->slot 24, seed 15->slot 14, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 63, seed 26->slot 53, seed 27->slot 43, seed 28->slot 33, seed 29->slot 23, seed 30->slot 13, seed 31->slot 3
```

**32 Teams** (8 groups of 4) -- **derived from pattern, no xlsx formulas**:
```
seed 1->slot 1, seed 2->slot 11, seed 3->slot 21, seed 4->slot 31, seed 5->slot 41, seed 6->slot 51, seed 7->slot 61, seed 8->slot 71, seed 9->slot 74, seed 10->slot 64, seed 11->slot 54, seed 12->slot 44, seed 13->slot 34, seed 14->slot 24, seed 15->slot 14, seed 16->slot 4, seed 17->slot 2, seed 18->slot 12, seed 19->slot 22, seed 20->slot 32, seed 21->slot 42, seed 22->slot 52, seed 23->slot 62, seed 24->slot 72, seed 25->slot 63, seed 26->slot 53, seed 27->slot 43, seed 28->slot 33, seed 29->slot 23, seed 30->slot 13, seed 31->slot 3, seed 32->slot 73
```

> **Confidence:** HIGH for 4-31 teams (directly extracted from xlsx formulas). MEDIUM for 32 teams (derived from consistent pattern -- xlsx has no team name formulas for 32 teams sheet).

## Pattern Analysis

### The Seeding Algorithm Has Two Phases

**Phase 1: Group Assignment (which seeds go to which group)**

For **2-4 groups** (7-16 teams): Standard serpentine draft.
- Row 1 (down): seeds go to groups A, B, C, D in order
- Row 2 (up): seeds go to groups D, C, B, A (reversed)
- Repeat alternating direction

For **6-8 groups** (17-32 teams): Two-half serpentine.
- Odd seeds (1, 3, 5, 7, ...) fill first half of groups (A, B, C, D) via serpentine
- Even seeds (2, 4, 6, 8, ...) fill second half of groups (E, F, G, H) via serpentine
- Within each half, standard serpentine applies

For **uneven counts**, extras fill groups in order A, E, B, F, C, G, D, H (alternating between halves).

**Phase 2: Within-Group Position Reordering**

After serpentine assigns seeds to groups, the position WITHIN each group is reordered:

| Group Size | Serpentine Row Order | xlsx Slot Order | Reorder Indices |
|-----------|---------------------|-----------------|-----------------|
| 2 | [row1, row2] | [row1, row2] | [0, 1] |
| 3 | [row1, row2, row3] | [row1, row3, row2] | [0, 2, 1] |
| 4 | [row1, row2, row3, row4] | [row1, row3, row4, row2] | [0, 2, 3, 1] |

This means the highest seed and lowest seed in each group occupy the 1st and last positions, while middle seeds are reordered so that the first matchup (pos 1 vs pos 2) pits seed 1 against a mid-strength opponent rather than seed 2.

### Pattern is NOT Purely Algorithmic

While the pattern has recognizable structure, implementing it as a pure algorithm would be fragile:
1. The two-half split at 6+ groups is a distinct rule from standard serpentine
2. The within-group reordering varies by group size
3. The 11-team and 22-team cases have quirks (slot range assignments differ from expected)
4. The 32-team sheet has no formulas to validate against

**Recommendation: Use explicit lookup tables.** The data is small (29 arrays, max 32 entries each), deterministic, and directly validated against the xlsx.

## What Already Matches the xlsx (No Changes Needed)

| Feature | Status | Confidence | Notes |
|---------|--------|------------|-------|
| R1 race order (slot matchups) | CORRECT | HIGH | Verified 8 teams: xlsx and TS identical |
| R2 within-group race order | CORRECT | HIGH | Verified 8, 12, 16, 24, 32 teams |
| R2 seeding codes (positionCodes) | CORRECT | HIGH | Verified 8, 9, 10, 12, 16, 17, 20, 28 teams |
| R2 group structure | CORRECT | HIGH | Group counts and sizes match xlsx |
| Finals bracket structure | CORRECT | HIGH | Already validated in v1.0/v1.1 |
| Group slot numbering scheme | CORRECT | HIGH | Base offsets (1, 11, 21, ...) match xlsx |

## What Needs Fixing

| Feature | Current Behavior | Correct Behavior | Complexity | Notes |
|---------|-----------------|-------------------|------------|-------|
| Seed-to-slot mapping | Sequential (`seed[i] -> allSlots[i]`) | xlsx serpentine lookup | Low | Single function change + lookup data |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Algorithmic serpentine generator | Too many edge cases (2-half split, within-group reorder, uneven distribution) | Use explicit lookup tables per team count |
| Dynamic group size calculation | Already encoded in TS cheat sheet files | Keep existing group definitions, only fix seed-to-slot mapping |
| R1 race order regeneration | Already correct in TS files | Leave untouched |
| R2 structure changes | Already correct in TS files | Leave untouched |

## Implementation Approach

### Option A: Lookup Table in Each Cheat Sheet File (Recommended)

Add a `seedToSlot` array to each `TournamentStructure`:

```typescript
// In teams8.ts
export const TEAMS_8: TournamentStructure = {
  teamCount: 8,
  seedToSlot: [1, 11, 14, 4, 2, 12, 13, 3], // seedToSlot[0] = slot for seed 1
  groups: [...]
  // ... rest unchanged
};
```

Then fix `assignSlots`:

```typescript
function assignSlots(names: string[]): Team[] {
  if (names.length >= 4) {
    const structure = getCheatSheet(names.length);
    return names.map((n, i) => ({ slot: structure.seedToSlot[i], name: n }));
  }
  return names.map((n, i) => ({ slot: i + 1, name: n }));
}
```

**Pros:** Simple, explicit, directly validated against xlsx, no algorithmic risk.
**Cons:** 29 arrays to add (but they are small and static).

### Option B: Centralized Lookup Module

Single file `seedMappings.ts` with all 29 mappings, imported by `assignSlots`.

**Pros:** All mapping data in one place for easy auditing.
**Cons:** Separates mapping data from the structure it belongs to.

### Recommendation: Option A

Each cheat sheet already owns its group/race data. Adding `seedToSlot` keeps all structure data together. The `TournamentStructure` type gets one new field.

## Feature Dependencies

```
seedToSlot data (new) -> assignSlots fix -> correct team placement -> all downstream correct
                                                                    (R1 races, R2 seeding, finals)
```

R1 race orders, R2 structures, and finals are already correct. Only the seed-to-slot mapping feeds incorrect data into the correct pipeline.

## MVP Recommendation

1. Add `seedToSlot` field to `TournamentStructure` type
2. Add the 29 lookup arrays to each cheat sheet file (data in this document)
3. Fix `assignSlots` to use `seedToSlot` instead of `flatMap` sequential
4. Add tests: for each team count, verify `assignSlots` produces the xlsx-expected mapping
5. Verify 32 Teams mapping against a manual xlsx check (since no formulas exist)

## Sources

- `reference/cheat-sheets-v1.4.xlsx` -- all seed-to-slot mappings extracted via openpyxl formula parsing (HIGH confidence for 4-31 teams)
- `src/components/teams/TeamEntryView.tsx` lines 16-23 -- current `assignSlots` implementation
- `src/domain/cheatSheets/teams*.ts` -- existing cheat sheet structures (R1 races, R2 groups, finals all verified correct)
