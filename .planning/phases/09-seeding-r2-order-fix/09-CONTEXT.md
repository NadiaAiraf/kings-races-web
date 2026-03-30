# Phase 9: Seeding & R2 Order Fix - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `seedMap` arrays to all 29 cheat sheet files, fix `assignSlots` to use serpentine seeding from the xlsx, and correct R2 race orders to match the xlsx source of truth. All fixes driven by the golden data fixture established in Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Type Change
- **D-01:** Add `seedMap: number[]` field to the `TournamentStructure` type in `src/domain/types.ts`. This is an ordered array where index `i` is the seed number (0-based) and the value is the slot number that seed should be assigned to. TypeScript will enforce all 29 cheat sheet files are updated.

### Cheat Sheet Data
- **D-02:** Populate `seedMap` in all 29 cheat sheet files (`teams4.ts` through `teams32.ts`) using the golden data from `src/domain/cheatSheets/__fixtures__/goldenData.json`. Each file's `seedMap` must exactly match the `seedMap` array in the golden data for that team count.
- **D-03:** Fix `roundTwoGroups[].races` arrays in all cheat sheet files where R2 race order doesn't match xlsx. Phase 8 validation identified 26 team counts with R2 discrepancies.

### Domain Function
- **D-04:** Extract `assignSlots` from `src/components/teams/TeamEntryView.tsx` to `src/domain/assignSlots.ts`. The function becomes: given team names and a team count, look up the `seedMap` from `getCheatSheet()` and assign `slot = seedMap[index]` for each team.
- **D-05:** Update `TeamEntryView.tsx` to import `assignSlots` from the new domain module instead of defining it inline.

### Validation
- **D-06:** After all fixes, all 87 golden data validation tests from Phase 8 must pass (including the 26 previously-failing R2 tests). Plus all 380+ existing tests must continue passing.

### Claude's Discretion
- Whether to update cheat sheet files via a script or manually
- Order of file updates (type first, then data, then function — or combined)
- Whether to update the extraction script to also generate seedMap data

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Golden Data (Source of Truth for fixes)
- `src/domain/cheatSheets/__fixtures__/goldenData.json` — Golden data extracted from xlsx in Phase 8. Contains `seedMap`, `r1Races`, `r2Races` for all 29 team counts.

### Type Definition
- `src/domain/types.ts` — `TournamentStructure` type that needs `seedMap` field added

### Cheat Sheet Files (29 files to update)
- `src/domain/cheatSheets/teams4.ts` through `src/domain/cheatSheets/teams32.ts`
- `src/domain/cheatSheets/index.ts` — `getCheatSheet()` lookup

### Current assignSlots
- `src/components/teams/TeamEntryView.tsx` — Lines 16-23, `assignSlots` function to extract and fix

### Validation Tests
- `src/domain/cheatSheets/goldenDataValidation.test.ts` — 87 parametric tests (target: all green after fixes)
- `src/domain/cheatSheets/cheatSheets.test.ts` — 288 structural integrity tests (must not regress)

### Research
- `.planning/research/ARCHITECTURE.md` — Proposed `seedMap` integration approach
- `.planning/research/FEATURES.md` — Contains extracted seed-to-slot mappings for all 29 team counts

</canonical_refs>

<code_context>
## Existing Code Insights

### Current assignSlots (the bug)
```typescript
function assignSlots(names: string[]): Team[] {
  const structure = getCheatSheet(names.length);
  const allSlots = structure.groups.flatMap((g) => g.teamSlots);
  return names.map((n, i) => ({ slot: allSlots[i], name: n }));
}
```
This fills groups sequentially. Fix: use `structure.seedMap[i]` instead of `allSlots[i]`.

### Established Patterns
- Cheat sheet files export named `TEAMS_N` consts of type `TournamentStructure`
- `getCheatSheet(n)` returns the structure for a given team count
- Golden data JSON uses string keys ("4" through "32") with `seedMap`, `r1Races`, `r2Races` arrays

### Integration Points
- `TeamEntryView.tsx` is the only consumer of `assignSlots`
- Adding `seedMap` to the type makes TypeScript enforce updates across all 29 files
- R2 race order fixes are pure data changes in `roundTwoGroups[].races` arrays

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all fixes are data-driven from the golden data fixture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-seeding-r2-order-fix*
*Context gathered: 2026-03-30*
