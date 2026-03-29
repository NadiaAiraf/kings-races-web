# Phase 2: Core Event Flow - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the complete group stage UI — the main interaction loop officials use on race day. Enter teams, view race schedule, record results with gloved hands, check live group standings. All on a phone, slope-side.

Requirements: TEAM-01, TEAM-03, RACE-03, RACE-04, RACE-05, RESL-01, RESL-02, RESL-03, RESL-04, STND-01, STND-02, STND-03, MOBL-01

</domain>

<decisions>
## Implementation Decisions

### Scoring Interface
- **D-01:** Three buttons per team (Win / Loss / DSQ) — explicit, no ambiguity. One winner, one loser or DSQ per race. Both teams cannot DSQ in the same race.
- **D-02:** After recording a result, auto-advance to the next unscored race immediately. No delay, no confirmation step.
- **D-03:** Touch targets must be at least 56px for gloved use. High contrast for outdoor readability.

### Navigation Flow
- **D-04:** Top tabs for discipline switching (Mixed, Board, Ladies) — always visible, one tap to switch.
- **D-05:** Free navigation — all sections always accessible. No linear wizard flow.
- **D-06:** Four sections within each discipline: Team Entry, Race List, Scoring Focus, Standings — accessed via sub-tabs below the discipline tabs.
- **D-07:** Team entry uses an "Add one at a time" pattern — single input with Add Team button, builds the list incrementally.
- **D-08:** All rounds visible from the start for 8+ team events (Round 1, Round 2, Finals placeholder). Round 2 races greyed out until Round 1 completes, but visible so officials can see the full schedule.

### Standings Overlay
- **D-09:** Full-screen toggle — tap a button to flip to standings view, tap back to return to scoring position.
- **D-10:** Standings show: rank, team name, total points, race-by-race results grid (like the spreadsheet boxes), and tie indicators when teams are tied on points.

### Claude's Discretion
- Colour scheme, visual design, Tailwind theme setup
- Component library decisions (headless UI, custom components, etc.)
- Exact layout of scoring buttons, race cards, standings table
- Progress bar implementation and placement
- Undo/correct result UI pattern (button placement, confirmation)
- How sub-tabs are styled and whether they scroll

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Domain Code (build UI on top of these)
- `src/domain/types.ts` — Core type definitions (DisciplineKey, Team, Score, TournamentStructure, etc.)
- `src/domain/cheatSheets/index.ts` — `getCheatSheet(teamCount)` lookup function
- `src/domain/scoring.ts` — `POINTS`, `calculateGroupStandings()`, `hasTies()`
- `src/domain/groupCalculations.ts` — `getGroupRaces()`, `calculateAllGroupStandings()`
- `src/domain/validation.ts` — `validateTeamCount()`, `getValidTeamCountRange()`
- `src/store/eventStore.ts` — Zustand store with `setTeams`, `recordScore`, `setActiveDiscipline`, `undoScore`, `resetDiscipline`, `resetAll`, `setManualTiebreak`
- `src/store/types.ts` — EventStoreState and EventStoreActions interfaces

### Project Context
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — v1 requirements with phase mapping
- `.planning/research/STACK.md` — Stack: React 19, Vite, TypeScript, Zustand, Tailwind CSS 4

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useEventStore` — Zustand store with all state management actions. UI just calls store actions and reads state.
- `getCheatSheet(teamCount)` — Returns full tournament structure for any team count (4-32)
- `calculateGroupStandings(scores, teams)` — Returns sorted standings with points
- `hasTies(standings)` — Detects ties for manual resolution
- `validateTeamCount(discipline, count)` — Validates team count per discipline

### Established Patterns
- Pure domain functions in `src/domain/` — UI should import and call these, not reimplement logic
- Zustand persist middleware — state auto-saves to localStorage on every mutation
- TDD with Vitest — 335 tests covering all domain logic

### Integration Points
- `useEventStore` is the single source of truth — all UI components read from and write to this store
- Store already has actions for: setTeams, recordScore, undoScore, setActiveDiscipline, resetDiscipline, resetAll, setManualTiebreak
- `src/App.tsx` and `src/main.tsx` exist as minimal scaffolds from Phase 1

</code_context>

<specifics>
## Specific Ideas

- The scoring interface should feel like "tap and go" — officials are watching the next race start while recording the previous result
- The standings view should replicate the "boxes" feel from the spreadsheet — race-by-race grid showing 3/1/0 results
- Round structure visibility (all rounds shown but greyed out) helps officials plan ahead and answer "how many races left?" questions from participants

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-event-flow*
*Context gathered: 2026-03-29*
