# Phase 7: Standings & Finals Calculation Fixes - Research

**Researched:** 2026-03-30
**Domain:** Domain logic bug fixes (scoring/standings calculation scoping)
**Confidence:** HIGH

## Summary

This phase fixes two related bugs in the standings calculation and verifies finals placement logic. The primary bug is in `useStandings` which passes ALL scores (R1 + R2 + finals) to `calculateAllGroupStandings`, causing R1 standings to include R2 and finals results in the W/L/DSQ/Pts totals. The fix is straightforward: filter scores by `raceId` prefix before computing standings.

The finals placement logic in `computeFinalResults` is already correct -- it derives positions solely from finals matchup labels (winner of "1st/2nd" matchup gets 1st). However, the upstream `useStandings` bug means that R1 standings used for seeding may be polluted with R2/finals scores, which could affect who gets seeded where. Fixing `useStandings` fixes the seeding cascade too.

**Primary recommendation:** Add a `roundPrefix` filter parameter to `useStandings` (or filter scores before calling `calculateAllGroupStandings`) so R1 standings use only `r1-*` scores. R2 standings in `useR2State` already filter correctly. Verify `buildResultsForDiscipline` (CSV export) also filters R1 standings properly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Root cause is in `useStandings` -- it passes ALL `scores` to `calculateAllGroupStandings`. Fix: filter scores by `raceId` prefix before computing standings.
- **D-02:** R1 standings must use only scores with `raceId` starting with `r1-`. R2 standings must use only scores with `raceId` starting with `r2-`. The `GroupStandingsTable` grid display already filters via `raceIdPrefix` prop, but the W/L/DSQ/Pts totals in `calculateGroupStandings` currently don't filter.
- **D-03:** R1 and R2 are distinct rounds for seeding purposes -- not cumulative.
- **D-04:** `computeFinalResults` in `useFinalResults.ts` already derives final positions solely from finals matchup outcomes. Verify this is the only source of "final event positions." If any other code path derives positions from group stage totals, that's the bug to fix.
- **D-05:** Group stage results (R1 + R2) determine only seeding into finals brackets, not final placement. Verify `finalsSeeding.ts` and `computeFinalResults` are correctly separated.

### Claude's Discretion
- Whether to add a `roundFilter` parameter to `calculateGroupStandings` or filter scores before calling it
- Whether to refactor `useStandings` to accept a round parameter or create separate hooks
- Test strategy for verifying round-scoped standings

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAND-01 | Round 1 standings must only count Round 1 race results (not R2 or finals) | Root cause identified: `useStandings` line 13 passes unfiltered `scores` to `calculateAllGroupStandings`. Fix by filtering to `r1-*` prefix. |
| STAND-02 | Round 2 standings must only count Round 2 race results (not R1 or finals) | `useR2State` lines 89-92 already filters R2 scores correctly per group (`r2-{groupNum}-*`). Verified no bug here. |
| STAND-03 | R1 and R2 are distinct rounds used for seeding -- not cumulative point totals | Fixed automatically when STAND-01 is resolved. R1 standings will contain only R1 results, R2 standings already contain only R2 results. |
| FINAL-01 | Final event positions determined solely by finals matchup results | `computeFinalResults` (useFinalResults.ts) already correct -- derives positions from `parsePlacementLabel` on matchup labels. Winner of "1st/2nd" gets 1st, loser gets 2nd. Verified. |
| FINAL-02 | Group stage results determine only seeding, not final placement | `resolveAllFinalsMatchups` uses standings for seeding only. `computeFinalResults` uses only matchup outcomes. Correctly separated. Verify no other code path. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Pure client-side app, no backend
- React 19.1.x + TypeScript 6.0 + Vite + Zustand 5.0.x
- Vitest 4.1.x for testing
- Zustand stores per-domain: `useEventStore`, `useRaceStore`, `useResultsStore`
- Follow GSD workflow for all changes

## Architecture Patterns

### Bug Location Map

```
src/
  hooks/
    useStandings.ts         # THE BUG: passes all scores unfiltered (line 13)
    useR2State.ts           # CORRECT: filters r2 scores at lines 89-92
    useFinalsState.ts       # CORRECT: uses useStandings for seeding (inherits bug)
    useFinalResults.ts      # CORRECT: derives positions from matchup outcomes only
  domain/
    scoring.ts              # calculateGroupStandings -- pure function, no filtering responsibility
    groupCalculations.ts    # calculateAllGroupStandings -- wrapper, no filtering
    finalsSeeding.ts        # resolveAllFinalsMatchups -- seeding only, correct
  components/
    standings/
      StandingsView.tsx     # Calls useStandings (inherits bug); also has buildResultsForDiscipline for CSV export
      GroupStandingsTable.tsx # Display component, uses raceIdPrefix for grid cells correctly
```

### Recommended Fix Pattern: Filter Before Calling

Filter scores in `useStandings` before passing to `calculateAllGroupStandings`. This is the cleanest approach because:

1. `calculateGroupStandings` is a pure function that should work on any score set -- it should not know about round prefixes
2. `useR2State` already follows this pattern (filters `r2-{groupNum}-*` before calling `calculateGroupStandings`)
3. Filtering at the call site keeps the domain functions reusable

```typescript
// useStandings.ts -- FIXED
export function useStandings(discipline: DisciplineKey) {
  const { scores, teamCount, teams, structure } = useDisciplineState(discipline);

  return useMemo(() => {
    if (!structure) return null;

    // Filter to R1 scores only
    const r1Scores = scores.filter((s) => s.raceId.startsWith('r1-'));
    const standings = calculateAllGroupStandings(r1Scores, structure.groups);
    const tiesByGroup: Record<string, boolean> = {};

    for (const [letter, groupStandings] of Object.entries(standings)) {
      tiesByGroup[letter] = hasTies(groupStandings);
    }

    return { standings, tiesByGroup, groups: structure.groups, teams };
  }, [scores, teamCount, teams, structure]);
}
```

### Why NOT Add a Parameter to `calculateGroupStandings`

Adding a `raceIdPrefix` filter parameter to the pure domain function would:
- Mix filtering concerns with calculation logic
- Break the existing clean API that `useR2State` uses (it already pre-filters)
- Add complexity where none is needed

### CSV Export Fix in `buildResultsForDiscipline`

`StandingsView.tsx` line 41 has the same bug in `buildResultsForDiscipline`:
```typescript
const r1Standings = calculateAllGroupStandings(
  disciplineState.scores as any,  // BUG: passes ALL scores
  structure.groups
);
```

This must also be fixed to filter `r1-*` scores before computing R1 standings for CSV export.

## Cascade Analysis

### Consumers of `useStandings` (6 call sites)

| File | Line | Purpose | Impact of Fix |
|------|------|---------|---------------|
| `StandingsView.tsx` | 102 | Display R1 standings | Direct fix -- R1 standings will be correct |
| `useR2State.ts` | 39 | R1 standings for R2 seeding | Fix corrects seeding -- R1 standings used to determine who goes to which R2 group |
| `useFinalsState.ts` | 22 | R1 standings for finals seeding & tie detection | Fix corrects seeding -- R1 standings used for finals bracket resolution |
| `RaceListView.tsx` | 48 | Standings for tie detection in race list | Fix corrects tie detection accuracy |
| `FinalsView.tsx` | 32 | Standings display in finals view | Fix corrects displayed standings |
| `AppShell.tsx` | 28 | Tie detection for discipline tab badges | Fix corrects tie badge accuracy |

All 6 consumers benefit from the fix. No consumer expects unfiltered scores -- the current behavior is universally wrong.

### `buildResultsForDiscipline` (1 call site)

This standalone function in `StandingsView.tsx` (line 31-99) reconstructs standings from raw store data for CSV export. It has the same unfiltered R1 standings bug at line 41-44. The R2 standings calculation within it (lines 52-74) correctly filters by `r2-{groupNum}-*`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score filtering | Custom filtering in `calculateGroupStandings` | `Array.filter` at call site before invoking pure function | Keeps domain logic pure; matches existing R2 pattern |
| Round detection | Parse raceId format in calculation layer | Established `raceId` prefix convention (`r1-`, `r2-`, `fin-`) | Convention already exists and is used everywhere |

## Common Pitfalls

### Pitfall 1: Forgetting `buildResultsForDiscipline`
**What goes wrong:** Fix `useStandings` but forget the standalone CSV export function that has the same bug.
**Why it happens:** `buildResultsForDiscipline` doesn't use `useStandings` -- it calls `calculateAllGroupStandings` directly to avoid hook rules (it's a callback, not a component).
**How to avoid:** Fix both `useStandings` AND `buildResultsForDiscipline` line 41-44. Add a test for both paths.
**Warning signs:** CSV export shows different standings than the UI.

### Pitfall 2: Breaking R2 Seeding by Changing `useStandings` Return Shape
**What goes wrong:** If the fix changes the return type or structure of `useStandings`, all 6 consumers break.
**Why it happens:** Overzealous refactoring (e.g., adding round parameter that changes the API).
**How to avoid:** The fix is internal only -- filter scores before passing to `calculateAllGroupStandings`. The return shape stays identical.
**Warning signs:** TypeScript compilation errors in consumers.

### Pitfall 3: Assuming R2 Standings Are Also Broken
**What goes wrong:** Wasting time "fixing" `useR2State` which is already correct.
**Why it happens:** Not reading the code carefully -- `useR2State` lines 89-92 already filter `r2-{groupNum}-*` scores.
**How to avoid:** Verified in research. `useR2State` is correct. Only `useStandings` and `buildResultsForDiscipline` need fixes.

### Pitfall 4: Finals Verification Scope Creep
**What goes wrong:** Spending time refactoring `computeFinalResults` when it's already correct.
**Why it happens:** FINAL-01 and FINAL-02 requirements sound like they need fixes, but verification confirms the logic is correct.
**How to avoid:** Write a verification test that proves `computeFinalResults` derives positions from matchup labels only. Don't change the implementation.

## Code Examples

### The One-Line Fix (useStandings.ts)

```typescript
// BEFORE (line 13):
const standings = calculateAllGroupStandings(scores, structure.groups);

// AFTER:
const r1Scores = scores.filter((s) => s.raceId.startsWith('r1-'));
const standings = calculateAllGroupStandings(r1Scores, structure.groups);
```

### The CSV Export Fix (StandingsView.tsx, buildResultsForDiscipline)

```typescript
// BEFORE (line 41-44):
const r1Standings = calculateAllGroupStandings(
  disciplineState.scores as any,
  structure.groups
);

// AFTER:
const r1Scores = disciplineState.scores.filter((s) => s.raceId.startsWith('r1-'));
const r1Standings = calculateAllGroupStandings(
  r1Scores as any,
  structure.groups
);
```

### Test: R1 Standings Exclude R2 Scores

```typescript
import { calculateGroupStandings } from './scoring';
import type { Score } from './types';

it('R1 standings exclude R2 and finals scores when pre-filtered', () => {
  const allScores: Score[] = [
    // R1 score
    { raceId: 'r1-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' },
    // R2 score (should be excluded from R1 standings)
    { raceId: 'r2-I-1', homeSlot: 1, awaySlot: 3, homeOutcome: 'win', awayOutcome: 'loss' },
    // Finals score (should be excluded from R1 standings)
    { raceId: 'fin-0', homeSlot: 1, awaySlot: 4, homeOutcome: 'win', awayOutcome: 'loss' },
  ];

  const r1Scores = allScores.filter((s) => s.raceId.startsWith('r1-'));
  const standings = calculateGroupStandings(r1Scores, [1, 2, 3, 4]);

  const team1 = standings.find((s) => s.slot === 1)!;
  expect(team1.wins).toBe(1);   // Only the R1 win
  expect(team1.played).toBe(1); // Only 1 R1 race
  expect(team1.points).toBe(3); // Only R1 points
});
```

### Test: computeFinalResults Uses Only Matchup Outcomes

```typescript
it('final positions come from matchup labels, not group stage totals', () => {
  const finalsWithNames = [
    {
      label: '1st/2nd',
      homeSlot: 5,    // seeded higher from group stage
      awaySlot: 3,    // seeded lower
      score: { raceId: 'fin-0', homeSlot: 5, awaySlot: 3, homeOutcome: 'loss', awayOutcome: 'win' },
    },
  ];
  const teams = [
    { slot: 3, name: 'Underdog' },
    { slot: 5, name: 'Favorite' },
  ];

  const results = computeFinalResults(finalsWithNames, teams, 'all-scored');

  // Underdog won the matchup, so gets 1st despite lower seed
  expect(results![0].position).toBe(1);
  expect(results![0].teamName).toBe('Underdog');
  expect(results![1].position).toBe(2);
  expect(results![1].teamName).toBe('Favorite');
});
```

## Verification Summary

| Requirement | Status | Evidence |
|-------------|--------|----------|
| STAND-01 | Bug confirmed | `useStandings` line 13 passes unfiltered scores |
| STAND-02 | Already correct | `useR2State` lines 89-92 filter `r2-{groupNum}-*` |
| STAND-03 | Fixed by STAND-01 | Once R1 scores are filtered, rounds are distinct |
| FINAL-01 | Already correct | `computeFinalResults` uses `parsePlacementLabel` on matchup outcomes |
| FINAL-02 | Already correct | `resolveAllFinalsMatchups` uses standings for seeding; `computeFinalResults` uses matchup outcomes for placement |

**Total code changes needed:** 2 locations (both adding 1 line of score filtering)
**Total test additions:** 2-3 tests confirming round-scoped behavior and finals independence

## Sources

### Primary (HIGH confidence)
- Direct code reading of all 10 canonical reference files listed in CONTEXT.md
- `src/hooks/useStandings.ts` -- confirmed unfiltered scores at line 13
- `src/hooks/useR2State.ts` -- confirmed correct filtering at lines 89-92
- `src/hooks/useFinalResults.ts` -- confirmed correct position derivation from matchup labels
- `src/domain/finalsSeeding.ts` -- confirmed seeding-only logic
- `src/components/standings/StandingsView.tsx` -- confirmed same bug in `buildResultsForDiscipline` line 41
- `src/domain/scoring.test.ts` -- confirmed existing test coverage for `calculateGroupStandings`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, pure domain logic fixes
- Architecture: HIGH -- fix pattern matches existing R2 implementation
- Pitfalls: HIGH -- complete cascade analysis of all 6 `useStandings` consumers + CSV export path

**Research date:** 2026-03-30
**Valid until:** Indefinite (domain logic, not library-dependent)
