# Phase 1: Data Foundation and Storage - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the invisible engine: pure domain logic (cheat sheet race orders, scoring engine, group calculations, tournament structure), TypeScript types, and the storage-first persistence layer (Zustand + localStorage). No UI. Everything is tested pure functions that Phase 2 will plug a UI into.

Requirements: TEAM-02, TEAM-04, RACE-01, RACE-02, MOBL-02, MOBL-04

</domain>

<decisions>
## Implementation Decisions

### Cheat Sheet Data Extraction
- **D-01:** Extract all 29 race order sequences programmatically from the existing xlsx file (`/Users/aidanfaria/Downloads/Master Copy DO NOT USE v1.4 - cheat sheets - auto populating.xlsx`). Each sheet must be extracted individually as the structure varies by team count.
- **D-02:** Race orders are identical across disciplines (Mixed/Board/Ladies) for the same team count — only one set of 29 sequences is needed, not 29 x 3.
- **D-03:** Each cheat sheet contains a complete tournament structure, not just a flat race list:
  - **4-6 teams:** Single group round-robin (Round One only)
  - **8+ teams:** Multiple groups in Round One → cross-group matchups in Round Two → placement Finals
  - Number of groups scales with team count (8 teams = 2 groups, 16 teams = 4 groups, etc.)
- **D-04:** Group assignments (which team numbers go into which group) must be extracted exactly from the spreadsheet — they are intentionally seeded, not arbitrary splits.
- **D-05:** Finals matchup structures (1st/2nd, 3rd/4th, etc.) vary by team count and must be extracted per sheet.
- **D-06:** The app must present the tournament in the same round structure as the spreadsheet (Round 1 groups → Round 2 cross-group → Finals), not flattened into one sequence.

### Tiebreaker Rules
- **D-07:** When teams are tied on points in a group, the official decides the ranking manually. The app should flag ties and present an interface for the official to set the final ordering — no automatic tiebreaker algorithm.

### Scoring
- **D-08:** Win = 3 points, Loss = 1 point, DSQ = 0 points. These are the only three outcomes per team per matchup.

### Claude's Discretion
- Data model shape (TypeScript types, store structure, how races/groups/rounds are keyed)
- Zustand store design (single store vs slices, action patterns)
- localStorage serialization format
- Test framework choice and test structure
- How cheat sheet data is structured in code (const arrays, maps, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cheat Sheet Source Data
- `/Users/aidanfaria/Downloads/Master Copy DO NOT USE v1.4 - cheat sheets - auto populating.xlsx` — The master spreadsheet containing all 29 race order cheat sheets (hidden tabs named "4 Teams" through "32 Teams"), plus discipline-specific variants ("N Teams Board", "N Teams Ladies"). Extract race orders, group assignments, finals matchups, and team-to-group mappings from the "N Teams" sheets (Mixed variant is sufficient — orders are identical across disciplines).

### Project Context
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — v1 requirements with phase mapping
- `.planning/research/STACK.md` — Stack recommendations (React 19, Vite 7.3, TypeScript, Zustand, Tailwind)
- `.planning/research/ARCHITECTURE.md` — Suggested architecture (domain layer, state layer, UI layer)
- `.planning/research/PITFALLS.md` — Key risks (Safari storage eviction, tab death, cheat sheet accuracy)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
None — greenfield project, no existing code.

### Established Patterns
None — patterns will be established in this phase.

### Integration Points
- Zustand store created here will be consumed by all UI phases (Phase 2, 3)
- Cheat sheet data structures will be referenced by race order display (Phase 2) and finals bracket (Phase 3)
- localStorage persistence pattern established here must survive tab death — this is the normal load path for all subsequent phases

</code_context>

<specifics>
## Specific Ideas

- The xlsx file is available locally for programmatic extraction — use openpyxl or similar to parse all 29 "N Teams" sheets
- Each cheat sheet has: group assignments (which team numbers in which group), round-robin race order within groups, Round 2 cross-group matchups, and finals placement match structure
- The "RO data R1" hidden sheets show how the spreadsheet resolves team numbers to names — the app should follow the same pattern (teams entered by position number, resolved to names)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-foundation-and-storage*
*Context gathered: 2026-03-28*
