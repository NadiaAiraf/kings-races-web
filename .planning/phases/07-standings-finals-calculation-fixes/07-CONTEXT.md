# Phase 7: Standings & Finals Calculation Fixes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix standings calculation to scope results by round (R1 standings count only R1 races, R2 standings count only R2 races), and verify that final event positions are determined solely by finals matchup outcomes. Pure domain logic fixes — no UI changes.

</domain>

<decisions>
## Implementation Decisions

### Standings Scoping (STAND-01, STAND-02, STAND-03)
- **D-01:** The root cause is in `useStandings` — it passes ALL `scores` (R1 + R2 + finals) to `calculateAllGroupStandings`. The `calculateGroupStandings` function then counts points from every score matching a team's slot, regardless of round. Fix: filter scores by `raceId` prefix before computing standings.
- **D-02:** R1 standings must use only scores with `raceId` starting with `r1-`. R2 standings must use only scores with `raceId` starting with `r2-`. The `GroupStandingsTable` grid display already filters via `raceIdPrefix` prop, but the W/L/DSQ/Pts totals in `calculateGroupStandings` currently don't filter.
- **D-03:** R1 and R2 are distinct rounds for seeding purposes — not cumulative. This is already the conceptual model but the code doesn't enforce it in the standings calculation.

### Finals Placement (FINAL-01, FINAL-02)
- **D-04:** `computeFinalResults` in `useFinalResults.ts` already derives final positions solely from finals matchup outcomes — winner of "1st/2nd" matchup gets 1st place, loser gets 2nd. Verify this is the only source of "final event positions" shown to the user. If any other code path derives positions from group stage totals, that's the bug to fix.
- **D-05:** Group stage results (R1 + R2) must affect only seeding into finals brackets (who races who), not final placement. The seeding logic in `finalsSeeding.ts` and the position derivation in `computeFinalResults` should be verified as correctly separated.

### Claude's Discretion
- Whether to add a `roundFilter` parameter to `calculateGroupStandings` or filter scores before calling it
- Whether to refactor `useStandings` to accept a round parameter or create separate hooks
- Test strategy for verifying round-scoped standings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Standings Calculation
- `src/domain/scoring.ts` — `calculateGroupStandings` function that counts W/L/DSQ/Pts from scores (THE BUG: doesn't filter by round)
- `src/domain/groupCalculations.ts` — `calculateAllGroupStandings` wrapper that iterates groups
- `src/hooks/useStandings.ts` — Hook that passes unfiltered scores to standings calculation (THE ENTRY POINT for the fix)
- `src/components/standings/GroupStandingsTable.tsx` — Table component with `raceIdPrefix` prop (grid display already filters, but totals don't)
- `src/components/standings/StandingsView.tsx` — View that renders R1 and R2 standings sections

### Finals Placement
- `src/hooks/useFinalResults.ts` — `computeFinalResults` derives positions from finals matchup labels
- `src/domain/finalsSeeding.ts` — `resolveAllFinalsMatchups` and `areAllFinalsScored` for seeding logic
- `src/components/results/FinalResultsTable.tsx` — Displays final placement positions

### R2 State
- `src/hooks/useR2State.ts` — R2 standings calculation (may have same bug — uses `r2Scores` but need to verify)
- `src/hooks/useFinalsState.ts` — Finals state management

### Existing Tests
- `src/domain/scoring.test.ts` — Existing scoring tests (extend for round-scoped filtering)
- `src/domain/groupCalculations.test.ts` — Existing group calculation tests
- `src/domain/finalsSeeding.test.ts` — Existing finals seeding tests

</canonical_refs>

<code_context>
## Existing Code Insights

### Root Cause Analysis
- `useStandings` line 13: `calculateAllGroupStandings(scores, structure.groups)` — passes ALL scores without filtering
- `calculateGroupStandings` iterates ALL provided scores and counts any score matching a team's slot
- `GroupStandingsTable` uses `raceIdPrefix` for the race-by-race grid cells but the W/L/DSQ/Pts totals come from `standings` which was computed with unfiltered scores
- R2 standings in `StandingsView` (line 219): `scores.filter((s) => s.raceId.startsWith(\`r2-${group.groupNum}-\`))` — this filters for grid display but the `r2State.r2Standings` may not be filtered

### Established Patterns
- `raceId` convention: `r1-{raceNum}` for R1, `r2-{groupNum}-{raceNum}` for R2, `fin-{index}` for finals
- `calculateGroupStandings` takes `scores[]` and `groupTeamSlots[]` — filtering by raceId prefix before calling is the cleanest fix
- `useR2State` hook computes R2 standings separately — verify it filters correctly

### Integration Points
- `useStandings` is called in `AppShell` (for tie detection) and `StandingsView` (for display)
- `calculateAllGroupStandings` is also called in `StandingsView.buildResultsForDiscipline` (for CSV export)
- Any fix must ensure CSV export also uses round-scoped standings for seeding

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the fixes are mechanical domain logic corrections with clear root causes identified in the code.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-standings-finals-calculation-fixes*
*Context gathered: 2026-03-30*
