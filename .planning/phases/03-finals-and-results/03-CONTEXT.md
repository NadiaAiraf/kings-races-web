# Phase 3: Finals and Results - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the post-group-stage flow: finals bracket generation from group results, placement match scoring, visual bracket display, final results view, and CSV export. Builds on all existing UI components and domain logic from Phases 1 and 2.

Requirements: FINL-01, FINL-02, FINL-03, FINL-04, EXPR-01, EXPR-02

</domain>

<decisions>
## Implementation Decisions

### Finals Transition
- **D-01:** Auto-populate finals matchups with resolved team names when all group stage races are scored, but require a confirmation tap before finals scoring becomes active (both auto-detect and manual confirmation).
- **D-02:** If ties exist in group standings that affect finals seeding, block finals until the official resolves them. The tie resolution UI from Phase 2 (D-07 from Phase 1) is the mechanism — standings must show no unresolved ties before finals can proceed.

### Bracket Display
- **D-03:** Simple matchup list style — vertical list of placement matches (e.g., "1st/2nd: Team A vs Team B"). Not a tree bracket. Mobile-friendly, consistent with existing card-based UI patterns.
- **D-04:** Include seeding context — show why teams are seeded (e.g., "Winner Group A vs Runner-up Group B") alongside the resolved team names.

### CSV Export
- **D-05:** CSV contains final standings (position, team name, discipline) matching the format the spreadsheet outputs today.
- **D-06:** One combined CSV file for the whole event (all three disciplines in one export).

### Claude's Discretion
- Finals scoring reuses existing OutcomeButton and scoring patterns from Phase 2
- Results view layout and design
- How the "Confirm Finals" button is presented
- CSV filename format and download mechanism
- How the bracket integrates into the existing navigation (new sub-tab, section within existing view, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Domain Code (finals data structures)
- `src/domain/types.ts` — `TournamentStructure` type includes `finals` field with placement match definitions
- `src/domain/cheatSheets/index.ts` — `getCheatSheet(teamCount)` returns full structure including finals
- `src/domain/scoring.ts` — `calculateGroupStandings()`, `hasTies()` for determining seeding readiness
- `src/store/eventStore.ts` — Zustand store actions, persist middleware

### Phase 2 UI Components (reusable)
- `src/components/scoring/OutcomeButton.tsx` — Win/Loss/DSQ buttons (reuse for finals scoring)
- `src/components/scoring/ScoringFocusView.tsx` — Scoring interface pattern (adapt for finals)
- `src/components/standings/StandingsView.tsx` — Full-screen overlay pattern (D-09)
- `src/components/standings/GroupStandingsTable.tsx` — Table rendering pattern
- `src/components/races/RaceCard.tsx` — Matchup card pattern (adapt for bracket matchups)
- `src/components/layout/AppShell.tsx` — Main layout with tabs and sub-tabs
- `src/hooks/useDisciplineState.ts` — Derived discipline state
- `src/hooks/useStandings.ts` — Standings with tie detection

### Project Context
- `.planning/PROJECT.md` — Project vision, constraints
- `.planning/REQUIREMENTS.md` — v1 requirements
- `.planning/research/STACK.md` — Stack decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OutcomeButton` — Reuse directly for finals scoring (same Win/Loss/DSQ pattern)
- `ScoringFocusView` — Adapt pattern for finals (different race source: finals matchups instead of group races)
- `RaceCard` — Adapt for bracket display (add seeding context label)
- `StandingsView` — Full-screen overlay pattern reusable for final results view
- `GroupStandingsTable` — Table rendering pattern reusable for final standings
- `useCurrentRace` — Adapt to find next unscored finals match
- `ConfirmButton` — Reuse for "Confirm Finals" action

### Established Patterns
- Full-screen overlay toggle (D-09 from Phase 2) — reuse for results view
- Sub-tabs navigation within discipline
- Zustand store with persist middleware — all state management through store
- Auto-complement scoring and auto-advance (Phase 2 D-01, D-02)

### Integration Points
- Store needs new actions for: finals scoring, confirming finals transition
- Cheat sheet `finals` data needs to be resolved with actual team names from group results
- AppShell needs finals/results navigation additions
- CSV export triggers browser download

</code_context>

<specifics>
## Specific Ideas

- The finals matchups should appear in the race list (greyed out per D-08 from Phase 2) from the start, but become scorable only after group stage completion + tie resolution + confirmation
- The "Copy Paste Into Website" format from the spreadsheet should be studied when building the CSV — replicate the column structure officials are used to seeing
- For small events (4-6 teams with optional finals), the finals section should be clearly optional and not block the results/export flow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-finals-and-results*
*Context gathered: 2026-03-29*
