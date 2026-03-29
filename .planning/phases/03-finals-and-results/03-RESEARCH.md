# Phase 3: Finals and Results - Research

**Researched:** 2026-03-28
**Domain:** Finals bracket generation, placement match scoring, results display, CSV export
**Confidence:** HIGH

## Summary

Phase 3 connects existing domain data (finals matchups in cheat sheets) and UI patterns (OutcomeButton, ScoringFocusView) to deliver the post-group-stage flow: finals transition, placement match scoring, results display, and CSV export. The core domain types (`FinalsMatchup`, `TournamentStructure.finals`) and scoring patterns already exist. The main work is: (1) a seeding resolver that maps `homeRef`/`awayRef` strings to actual team names from group/R2 standings, (2) new store actions for finals scoring and phase transitions, (3) new UI components for the finals sub-tab and results table, and (4) CSV generation with browser download.

All 29 cheat sheets (4-32 teams) have non-empty `finals` arrays. The smallest (4-5 teams) have 2 finals matches; the largest (32 teams) have 16. There are no edge cases of empty finals. The finals data references teams by position strings like "Winner Group I", "Second Group II", "3rd Group A" which must be resolved against computed standings.

**Primary recommendation:** Build a `resolveFinalsSeeding()` domain function that maps `FinalsMatchup.homeRef`/`awayRef` strings to slot numbers using group/R2 standings. Reuse existing `OutcomeButton` and scoring logic directly. Use `papaparse` (not installed yet) for CSV export. Add "Finals" and "Standings" as sub-tabs in the navigation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Auto-populate finals matchups with resolved team names when all group stage races are scored, but require a confirmation tap before finals scoring becomes active (both auto-detect and manual confirmation).
- **D-02:** If ties exist in group standings that affect finals seeding, block finals until the official resolves them. The tie resolution UI from Phase 2 (D-07 from Phase 1) is the mechanism -- standings must show no unresolved ties before finals can proceed.
- **D-03:** Simple matchup list style -- vertical list of placement matches (e.g., "1st/2nd: Team A vs Team B"). Not a tree bracket. Mobile-friendly, consistent with existing card-based UI patterns.
- **D-04:** Include seeding context -- show why teams are seeded (e.g., "Winner Group A vs Runner-up Group B") alongside the resolved team names.
- **D-05:** CSV contains final standings (position, team name, discipline) matching the format the spreadsheet outputs today.
- **D-06:** One combined CSV file for the whole event (all three disciplines in one export).

### Claude's Discretion
- Finals scoring reuses existing OutcomeButton and scoring patterns from Phase 2
- Results view layout and design
- How the "Confirm Finals" button is presented
- CSV filename format and download mechanism
- How the bracket integrates into the existing navigation (new sub-tab, section within existing view, etc.)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FINL-01 | Finals bracket auto-generates from group stage results with correct placement match seeding | `resolveFinalsSeeding()` function maps `FinalsMatchup.homeRef`/`awayRef` to actual team slots using standings. Cheat sheet data already provides the bracket structure. |
| FINL-02 | Finals include placement matches (1st/2nd, 3rd/4th, 5th/6th, etc.) matching the existing spreadsheet structure | All 29 cheat sheets have `finals[]` with correct placement labels. No generation needed -- use cheat sheet data directly. |
| FINL-03 | Official can record finals results using the same Win/Loss/DSQ interface | Reuse `OutcomeButton` component directly. Adapt `ScoringFocusView` auto-complement and constraint logic for finals scoring. Store finals scores with `fin-{index}` raceId pattern. |
| FINL-04 | Visual bracket display shows the finals structure graphically | D-03 specifies simple matchup list (not tree bracket). `FinalsMatchupCard` component shows placement label, seeding context, team names, and scoring buttons. |
| EXPR-01 | Final results view shows complete standings per discipline after all races are completed | `FinalResultsTable` component renders position/team/placement. Shown in Standings sub-tab when discipline phase is `'complete'`. |
| EXPR-02 | Official can export results as a CSV file | papaparse 5.5.3 for CSV generation. Browser download via Blob URL. Combined file for all 3 disciplines per D-06. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| React | ^19.2.4 | UI framework | Yes |
| Zustand | ^5.0.12 | State management with persist | Yes |
| clsx | ^2.1.1 | Conditional CSS classes | Yes |
| Tailwind CSS | ^4.2.2 | Styling | Yes |

### New Dependency
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| papaparse | 5.5.3 | CSV generation | Handles edge cases (commas in team names, unicode). Listed in STACK.md. Lightweight. |
| @types/papaparse | latest | TypeScript types | Type safety for papaparse API |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| papaparse | Manual CSV string building | papaparse handles escaping edge cases (commas, quotes in team names). Worth the ~7KB for correctness. |

**Installation:**
```bash
npm install papaparse && npm install -D @types/papaparse
```

**Version verification:** papaparse 5.5.3 is current stable (verified via npm registry).

## Architecture Patterns

### New Files Structure
```
src/
├── domain/
│   ├── finalsSeeding.ts          # resolveFinalsSeeding(), resolveFinalsRef()
│   ├── finalsSeeding.test.ts     # Tests for seeding resolution
│   └── csvExport.ts              # generateEventCSV(), triggerDownload()
├── hooks/
│   └── useFinalsState.ts         # Derived finals state (resolved matchups, completion)
├── components/
│   ├── finals/
│   │   ├── FinalsView.tsx        # Main finals sub-tab container
│   │   ├── FinalsReadyBanner.tsx  # "Group stage complete" banner with confirm button
│   │   ├── FinalsBlockedBanner.tsx # Blocked state explanations
│   │   └── FinalsMatchupCard.tsx  # Placement match card with scoring
│   └── results/
│       ├── FinalResultsTable.tsx  # Final standings table
│       └── ExportButton.tsx       # CSV export button with download icon
└── store/
    └── types.ts                   # Extended with new action types
```

### Pattern 1: Finals Seeding Resolution
**What:** Parse `homeRef`/`awayRef` strings like "Winner Group I", "Second Group II", "3rd Group A" to resolve actual team slot numbers from standings.
**When to use:** When transitioning from group stage to finals, and when displaying finals matchup cards.

The `homeRef`/`awayRef` strings follow patterns:
- For R1-only events (4-7 teams, single group): `"Winner Group A"`, `"2nd Group A"`, `"3rd Group A"`, `"Loser Group A"`, `"4th Group A"`
- For R2 events (8+ teams, multiple R2 groups): `"Winner Group I"`, `"Second Group I"`, `"Third Group I"`, `"Loser Group I"`, `"Winner Group II"`, etc.

The resolver must:
1. Parse the position (Winner/1st=1, Second/2nd/Runner Up=2, Third/3rd=3, Loser/Last=4, etc.) and group identifier
2. Look up the corresponding team from sorted standings (with tiebreaks applied)
3. Return the team slot number (or null if unresolvable)

**Example:**
```typescript
// Domain function
export function resolveFinalsRef(
  ref: string,
  r2Standings: Record<string, TeamStanding[]> | null,
  r1Standings: Record<string, TeamStanding[]>,
  manualTiebreaks: Record<string, number[]>
): number | null {
  // Parse "Winner Group I" -> { position: 1, group: 'I' }
  // Parse "3rd Group A" -> { position: 3, group: 'A' }
  // Look up standings[group][position - 1].slot
  // Apply manualTiebreaks if present
}
```

### Pattern 2: Finals Score Storage
**What:** Finals scores use the same `Score` type but with a distinct raceId prefix.
**When to use:** Recording and retrieving finals results.

```typescript
// Finals use raceId pattern: "fin-{index}" where index is position in finals array
// e.g., for 8-team event: "fin-0" (7th/8th), "fin-1" (5th/6th), "fin-2" (3rd/4th), "fin-3" (1st/2nd)
const finalsScore: Score = {
  raceId: `fin-${matchupIndex}`,
  homeSlot: resolvedHomeSlot,
  awaySlot: resolvedAwaySlot,
  homeOutcome: 'win',
  awayOutcome: 'loss',
};
```

This is important: the existing `recordResult` and `clearResult` store actions already work with any `raceId` string. No store schema changes needed for scoring -- just use the `fin-` prefix convention.

### Pattern 3: Phase Transition State Machine
**What:** DisciplineState.phase progresses: `'group-stage'` -> `'round-two'` -> `'finals'` -> `'complete'`
**When to use:** Controlling UI visibility and enabling/disabling finals scoring.

The existing `setDisciplinePhase` store action handles this. The transition logic:
1. All group/R2 races scored + no ties -> show "Confirm Finals" banner
2. Official taps confirm -> `setDisciplinePhase(discipline, 'finals')`
3. All finals scored -> `setDisciplinePhase(discipline, 'complete')`

### Pattern 4: CSV Export via Browser Download
**What:** Generate CSV blob and trigger download using standard browser APIs.
**When to use:** "Export CSV" button tap.

```typescript
import Papa from 'papaparse';

export function generateEventCSV(
  disciplines: Record<DisciplineKey, FinalResult[]>
): string {
  const rows: string[][] = [];
  for (const [key, results] of Object.entries(disciplines)) {
    rows.push([`--- ${key.charAt(0).toUpperCase() + key.slice(1)} ---`]);
    rows.push(['#', 'Team', 'Placement']);
    for (const r of results) {
      rows.push([String(r.position), r.teamName, r.placementLabel]);
    }
    rows.push([]); // blank row separator
  }
  return Papa.unparse(rows);
}

export function triggerCSVDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

### Anti-Patterns to Avoid
- **Storing resolved team names in state:** Compute from standings at render time. If a previous result is corrected, standings change, and finals seeding must update automatically.
- **Generating bracket structure in code:** The cheat sheets already define the exact finals matchups. Use them as-is, only resolving team references.
- **Separate finals store:** Keep finals scores in the same `DisciplineState.scores` array alongside group scores. The `fin-` prefix distinguishes them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV generation | Manual string concatenation | papaparse `unparse()` | Team names can contain commas, quotes, unicode. Manual escaping is error-prone. |
| File download | Complex download handling | Blob URL + createElement('a') | Standard pattern, works on all mobile browsers. No library needed. |
| Bracket data structure | Algorithm to compute finals from standings | Cheat sheet `finals[]` array | Data already extracted from spreadsheet. Algorithm would be complex and fragile. |

**Key insight:** The hardest part of this phase is NOT the UI or scoring (both are reuse patterns) -- it's the seeding resolution. The `homeRef`/`awayRef` string parsing must handle all the naming variations across 29 cheat sheets correctly.

## Common Pitfalls

### Pitfall 1: Inconsistent Seeding Reference Strings
**What goes wrong:** The `homeRef`/`awayRef` strings in cheat sheets use inconsistent naming. Some say "Winner", others "1st". Some say "Runner Up", others "2nd" or "Second".
**Why it happens:** Data extracted from spreadsheet with human-written labels.
**How to avoid:** Audit ALL 29 cheat sheets to catalog every unique ref pattern. Build a parser with explicit pattern matching, not substring search.
**Warning signs:** Finals showing "Unknown Team" for some team counts.

### Pitfall 2: R2 vs R1-Only Seeding
**What goes wrong:** Events with 4-7 teams have no Round 2. Finals reference group standings directly (e.g., "Winner Group A"). Events with 8+ teams have Round 2 groups (I, II, III...) and finals reference R2 standings.
**Why it happens:** Two different tournament structures depending on team count.
**How to avoid:** The resolver must check whether `roundTwoGroups` exists. If yes, resolve against R2 group standings. If no, resolve against R1 group standings.
**Warning signs:** Working for 8-team events but broken for 4-team events (or vice versa).

### Pitfall 3: Ties Blocking Finals Incorrectly
**What goes wrong:** Ties that DON'T affect finals seeding still block the transition. For example, a tie for 3rd/4th in a group where only 1st and 2nd advance to R2 shouldn't block finals.
**Why it happens:** Overly aggressive tie detection.
**How to avoid:** Per D-02, the existing hasTies check is the mechanism. The current implementation checks adjacent standings which is correct -- if any ties exist in any group, block. This is the conservative approach and is what the user decided. Don't try to optimize which ties "matter."
**Warning signs:** Attempting to add complex "relevant tie" logic when the simple approach is the decided behavior.

### Pitfall 4: Score Prefix Collision
**What goes wrong:** Finals scores with `fin-` prefix could theoretically collide if other phases use similar patterns.
**Why it happens:** Shared scores array in DisciplineState.
**How to avoid:** Use clear, unique prefixes. Current prefixes: `r1-` for round 1. Round 2 would use `r2-`. Finals use `fin-`. No collision possible.
**Warning signs:** Scores filtering returning wrong results.

### Pitfall 5: CSV Export on Mobile Safari
**What goes wrong:** `URL.createObjectURL` + click approach may not trigger download on some mobile browsers.
**Why it happens:** Mobile Safari has quirks with programmatic link clicks.
**How to avoid:** Use `window.open(url)` as fallback if `link.click()` doesn't trigger download. Test on iOS Safari specifically.
**Warning signs:** Export button appears to do nothing on iPhone.

### Pitfall 6: SubTabs Overflow with 5 Items
**What goes wrong:** Adding "Finals" and "Standings" to the sub-tab bar means 5 tabs on a narrow screen.
**Why it happens:** Original design had 3 sub-tabs; now needs 5.
**How to avoid:** The UI spec already accounts for this -- sub-tabs scroll horizontally with `overflow-x-auto`. Labels may abbreviate on narrow screens: "Stds" for "Standings".
**Warning signs:** Tabs wrapping to second line or being cut off.

## Code Examples

### Existing Patterns to Reuse

#### OutcomeButton (direct reuse)
```typescript
// Source: src/components/scoring/OutcomeButton.tsx
// No changes needed. Use as-is in FinalsMatchupCard.
<OutcomeButton
  outcome="win"
  selected={homeOutcome === 'win'}
  disabled={homeDisabled.has('win')}
  onSelect={handleHomeSelect}
/>
```

#### Auto-complement Logic (adapt from ScoringFocusView)
```typescript
// Source: src/components/scoring/ScoringFocusView.tsx lines 8-25
// getComplement() and getDisabledOutcomes() should be extracted to a shared utility
// so both ScoringFocusView and FinalsMatchupCard can use them.
```

#### Store recordResult (direct reuse)
```typescript
// Source: src/store/eventStore.ts
// recordResult already handles deduplication via filter + push.
// Works with any raceId string, including "fin-0", "fin-1", etc.
recordResult(discipline, {
  raceId: `fin-${matchupIndex}`,
  homeSlot: resolvedHomeSlot,
  awaySlot: resolvedAwaySlot,
  homeOutcome: 'win',
  awayOutcome: 'loss',
});
```

### Seeding Reference Patterns Found in Cheat Sheets

After auditing the cheat sheet files, here are the reference patterns used:

**R1-only events (4-7 teams, single group):**
- `"Winner Group A"`, `"2nd Group A"`, `"3rd Group A"`, `"Loser Group A"`
- `"4th Group A"`, `"5th Group A"` (for 5+ team groups)

**R2 events (8+ teams, R2 groups I, II, III, IV):**
- `"Winner Group I"`, `"Second Group I"`, `"Third Group I"`, `"Loser Group I"`
- Same pattern for Group II, III, IV

The parser must handle: "Winner" (=1st), "Second"/"2nd"/"Runner Up" (=2nd), "Third"/"3rd" (=3rd), "Loser"/"Last"/"4th" (=last in group).

### SubTabs Extension Pattern
```typescript
// Current: src/components/layout/SubTabs.tsx
// SubTabKey = 'teams' | 'races' | 'score'
// Extend to: 'teams' | 'races' | 'score' | 'finals' | 'standings'
export type SubTabKey = 'teams' | 'races' | 'score' | 'finals' | 'standings';
```

### Finals Completion Detection
```typescript
// Check if all finals matchups are scored
function areAllFinalsScored(
  finalsMatchups: FinalsMatchup[],
  scores: Score[]
): boolean {
  const scoredIds = new Set(scores.map(s => s.raceId));
  return finalsMatchups.every((_, i) => scoredIds.has(`fin-${i}`));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Standings as floating button overlay | Add "Standings" as sub-tab | Phase 3 | Cleaner navigation with 5 sub-tabs. Standings overlay coexists (floating button still works from Score tab). |
| Round 2 placeholder text | Will need R2 scoring in future | Not yet | Phase 3 finals refs R2 standings, so R2 scoring must complete before finals for 8+ team events. The current code shows R2 as placeholder only -- this needs investigation. |

**Critical finding:** The current codebase has NO round 2 scoring implementation. Round 2 is shown as placeholder text. For events with 8+ teams, finals reference R2 group standings ("Winner Group I", etc.). This means either:
1. R2 scoring must be built as part of Phase 3 (significant scope increase), OR
2. R2 scoring was already planned for Phase 2 and is incomplete, OR
3. For v1, events with R2 (8+ teams with multiple groups) handle R2 scoring through the same pattern, and this phase needs to account for it.

Looking at the `DisciplineState.phase` type: `'setup' | 'group-stage' | 'round-two' | 'finals' | 'complete'` -- the `'round-two'` phase exists in the type but is never set in current code. The `useCurrentRace` hook only looks at `roundOneRaces`. This is a **significant gap** that the planner must address. Finals seeding for 8+ team events depends on R2 results.

**Recommendation:** The planner should include R2 scoring as a prerequisite within this phase, or scope Phase 3 to handle the full flow. The scoring UI pattern (OutcomeButton, auto-complement) already exists and can be reused. The main work is: resolving R2 team names from R1 standings, R2 race tracking, and R2 standings calculation.

## Open Questions

1. **Round 2 Scoring Gap**
   - What we know: R2 types exist (`RoundTwoGroupDefinition`, `RoundTwoRace`), cheat sheets have R2 data, `DisciplineState.phase` includes `'round-two'`, but no R2 scoring UI or race tracking exists.
   - What's unclear: Was R2 intentionally deferred? Is it expected in Phase 3?
   - Recommendation: Include R2 scoring in Phase 3 scope. Without it, finals cannot work for 8+ team events (which is the majority of real events). The UI pattern is identical to R1 scoring -- just different data sources.

2. **Manual Tiebreak for R2 Groups**
   - What we know: `manualTiebreaks` exists in `DisciplineState` and works for R1 groups. R2 groups also need tie resolution before finals.
   - What's unclear: Does the existing tiebreak UI work for R2 group keys?
   - Recommendation: Use the same tiebreak pattern with R2 group keys (e.g., `'r2-I'`, `'r2-II'`). Should work with the existing `setManualTiebreak` action.

3. **All Cheat Sheet Ref String Variations**
   - What we know: Sampled several cheat sheets (4, 5, 8, 12, 16 teams).
   - What's unclear: Whether all 29 cheat sheets use only the patterns documented above, or if there are additional variations.
   - Recommendation: Write a test that extracts all unique `homeRef`/`awayRef` strings across all 29 cheat sheets and verify the parser handles all of them.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| papaparse | CSV export (EXPR-02) | Not installed | 5.5.3 (npm) | Manual CSV string building (not recommended) |
| Node.js | Build tooling | Yes | (available via Vite) | -- |
| Vitest | Testing | Yes | ^3.2.4 | -- |

**Missing dependencies with no fallback:**
- None (papaparse has a manual fallback)

**Missing dependencies with fallback:**
- papaparse: Not yet installed but listed in STACK.md. Install with `npm install papaparse && npm install -D @types/papaparse`.

## Project Constraints (from CLAUDE.md)

- GSD workflow enforcement: Use `/gsd:execute-phase` for planned phase work
- No direct repo edits outside GSD workflow unless user explicitly asks
- Stack defined in STACK.md: React 19, Zustand 5, Tailwind 4, Vite 8, Vitest
- Mobile-first design, client-side only (localStorage)
- Cheat sheet data is static lookup tables, not generated

## Sources

### Primary (HIGH confidence)
- `src/domain/types.ts` -- FinalsMatchup type, DisciplineState phase union
- `src/domain/cheatSheets/teams*.ts` -- Finals data for all 29 team counts
- `src/store/eventStore.ts` -- Store actions (recordResult works for any raceId)
- `src/components/scoring/OutcomeButton.tsx` -- Reusable scoring button
- `src/components/scoring/ScoringFocusView.tsx` -- Auto-complement and constraint patterns
- `src/components/layout/SubTabs.tsx` -- Current 3-tab navigation to extend
- `src/components/layout/AppShell.tsx` -- Main layout integration point
- `.planning/phases/03-finals-and-results/03-CONTEXT.md` -- User decisions D-01 through D-06
- `.planning/phases/03-finals-and-results/03-UI-SPEC.md` -- UI design contract

### Secondary (MEDIUM confidence)
- npm registry -- papaparse 5.5.3 current version (verified)
- `.planning/research/STACK.md` -- papaparse recommended in stack

### Tertiary (LOW confidence)
- Mobile Safari Blob download behavior -- known to have quirks, needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use except papaparse (verified on npm)
- Architecture: HIGH -- patterns established in Phase 1-2 codebase, just extending
- Seeding resolution: MEDIUM -- reference string patterns sampled but not exhaustively verified across all 29 sheets
- R2 scoring gap: HIGH -- verified by code inspection that R2 scoring doesn't exist yet
- Pitfalls: MEDIUM -- mobile Safari CSV download needs real-device testing

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain, no external API changes)
