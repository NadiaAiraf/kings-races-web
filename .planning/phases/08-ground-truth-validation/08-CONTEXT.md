# Phase 8: Ground Truth & Validation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract golden data from the master xlsx (`reference/cheat-sheets-v1.4.xlsx`) for all 29 team counts and write automated validation tests that compare the current cheat sheet TypeScript files against the xlsx source of truth. This establishes a regression safety net before Phase 9 makes code changes.

</domain>

<decisions>
## Implementation Decisions

### Golden Data Extraction
- **D-01:** Use Python with openpyxl (already installed) to extract seed-to-slot mappings, R1 race orders, and R2 race orders from all 29 xlsx sheets. The existing `scripts/extractCheatSheets.py` script is the reference for xlsx parsing patterns.
- **D-02:** Golden data should be written as JSON fixture files (one per team count or one combined file) that Vitest tests can import. Format: `{ teamCount: number, seedMap: number[], r1Races: {raceNum, home, away}[], r2Races: {raceNum, home, away}[] }`.
- **D-03:** Seed-to-slot mappings are extracted from column C formulas on each team sheet — `='Enter Teams'!B{row}` where row 3 = seed 1, row 4 = seed 2, etc. The seed number maps to the slot number in column B of the same row.
- **D-04:** The 32-team sheet has no formula references in column C — its seedMap must be derived from the slot pattern observed in 25-31 teams and manually verified.

### Validation Tests
- **D-05:** Write parametric Vitest tests that loop over all 29 team counts and compare each cheat sheet file's data against the golden fixtures.
- **D-06:** Three test suites: (1) seed mapping validation — does the cheat sheet's group structure match the xlsx serpentine seeding? (2) R1 race order — does `roundOneRaces` match xlsx? (3) R2 race order — does `roundTwoGroups[].races` match xlsx?
- **D-07:** Tests should report which specific team count and which race/slot is wrong, not just "18 teams failed". This makes Phase 9 fixes targeted.

### Claude's Discretion
- Whether to use one combined JSON fixture file or separate files per team count
- Python script structure and error handling
- Test file organization (one file or split by validation type)
- Whether to also extract and validate finals structure (already verified correct by research, but could be included for completeness)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source of Truth
- `reference/cheat-sheets-v1.4.xlsx` — Master xlsx with all 29 cheat sheet structures. Read with openpyxl data_only=False for formulas, data_only=True for cached values.

### Existing Extraction Script
- `scripts/extractCheatSheets.py` — Existing Python script (617 lines) that extracted the original cheat sheet data. Reference for xlsx parsing patterns and openpyxl usage.

### Current Cheat Sheet Files
- `src/domain/cheatSheets/` — 29 TypeScript files (teams4.ts through teams32.ts) with TournamentStructure consts
- `src/domain/cheatSheets/index.ts` — getCheatSheet() lookup function
- `src/domain/types.ts` — TournamentStructure type definition

### Research
- `.planning/research/FEATURES.md` — Contains extracted seed-to-slot mappings for all 29 team counts
- `.planning/research/PITFALLS.md` — Warns about openpyxl formula cache, test fixture risks
- `.planning/research/ARCHITECTURE.md` — Proposes seedMap field addition

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/extractCheatSheets.py` — Existing openpyxl-based extraction script, can be adapted for golden data extraction
- `.planning/research/FEATURES.md` — Already contains extracted seed mappings for all 29 team counts (can be cross-referenced)

### Established Patterns
- Vitest parametric tests with `describe.each` or `it.each` for looping over team counts
- Existing cheat sheet tests in `src/domain/` validate structural integrity (288 tests)
- JSON fixtures can live in `src/domain/cheatSheets/__fixtures__/` or `test/fixtures/`

### Integration Points
- Golden data fixtures consumed by validation tests in this phase AND by Phase 9 for implementing the actual fixes
- The extraction script runs at build time, not runtime — no dependency on xlsx at runtime

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the extraction and validation approach is mechanical.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-ground-truth-validation*
*Context gathered: 2026-03-30*
