# Project Research Summary

**Project:** Kings Races Web v1.2
**Domain:** Cheat sheet seeding accuracy — serpentine draft seed-to-slot mapping
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

Kings Races Web v1.2 is a targeted accuracy fix to a single function — `assignSlots` in `TeamEntryView.tsx` — that incorrectly distributes seeded teams into tournament groups using a sequential fill instead of the xlsx master spreadsheet's serpentine (snake) draft. The fix requires adding a `seedMap: number[]` field to `TournamentStructure`, populating all 29 cheat sheet files with correct mappings extracted directly from `reference/cheat-sheets-v1.4.xlsx`, and replacing the three-line flatMap implementation with a single index lookup. Everything downstream (R1 race orders, R2 seeding codes, finals bracket) is already correct and must remain untouched.

The recommended approach is entirely data-driven: no new dependencies, no algorithmic computation at runtime, no Zustand store shape changes. The xlsx is the immutable source of truth for all 29 team counts. Static `seedMap` arrays are hard-coded per cheat sheet file, TypeScript compilation enforces completeness across all 29 files simultaneously, and parametric Vitest tests validate every mapping against xlsx-extracted golden data before any code ships. The existing openpyxl extraction infrastructure (617 lines, already proven) needs only a file path fix and targeted seed-ordering verification — not a rewrite.

The primary risks are data correctness risks, not engineering risks: extracting wrong values from the xlsx due to stale formula cache, shipping partial updates that leave some team counts unfixed, and inadvertently changing existing slot numbers in `teamSlots` arrays which would silently corrupt localStorage for any in-progress events. All three risks are mitigated by establishing xlsx golden data before writing any code, treating all 29 team counts as a single atomic change, and preserving existing slot numbers so no storage migration is required.

## Key Findings

### Recommended Stack

No new dependencies are needed for v1.2. The existing build-time Python script (`scripts/extractCheatSheets.py`) using openpyxl 3.1.5 handles all xlsx reading correctly — the only required fix is the file path hardcoded to a developer machine path (change to `reference/cheat-sheets-v1.4.xlsx`). SheetJS is not a viable alternative: the npm registry version is 4 years stale, the current version requires a CDN tarball, and all xlsx libraries read the same cached formula values regardless of language. The existing runtime stack (React 19.1, Vite, Zustand, Tailwind CSS 4, vite-plugin-pwa, Vitest 4.1) is fully intact and unchanged.

**Build-time tools (no changes):**
- openpyxl 3.1.5 (Python): xlsx data extraction — already installed, proven across 15+ spreadsheet quirks
- Vitest 4.1.x: golden data validation tests — already in project, native Vite integration
- TypeScript 6.0: compiler-enforced completeness — `seedMap: number[]` as a required field forces all 29 files to be updated before the project compiles

### Expected Features

Research identified a single root-cause bug and clearly bounded what needs fixing versus what must not change.

**Must fix (SEED-01 root cause):**
- `assignSlots` function — replace sequential flatMap with `seedMap[i]` index lookup
- `TournamentStructure` type — add required `seedMap: number[]` field
- All 29 `teams{N}.ts` cheat sheet files — add xlsx-extracted `seedMap` arrays

**Verified correct — do not touch:**
- R1 race orders (slot matchups per group) — verified correct for all tested team counts
- R2 within-group race sequences — verified correct for 8, 12, 16, 24, 32 teams
- R2 seeding codes (positionCodes A1, B2, etc.) — verified correct for 8 representative counts
- Finals bracket structure — verified correct from v1.0/v1.1 validation

**Defer to later milestone:**
- `positionCode` field cleanup — vestigial dead field with no runtime usage; safe to ignore now
- Multi-event storage history, runtime stack upgrades, any new UI features

### Architecture Approach

The fix is entirely confined to the domain layer: one type change, 29 data files, one extracted function, and new tests. No Zustand store shape changes are needed because seeding is static cheat sheet data, not runtime state. Once `assignSlots` maps teams to slots using `seedMap[i]`, all downstream logic (race matchups, scoring, standings, R2 seeding, finals) operates on slot numbers which are unchanged and already correct. Extracting `assignSlots` from the UI component to `src/domain/assignSlots.ts` is a structural improvement that makes the fix independently testable without mounting React.

**Components and changes:**

1. `src/domain/types.ts` — add `seedMap: number[]` to `TournamentStructure`; TypeScript immediately flags all 29 cheat sheet files as incomplete (compiler-driven completeness)
2. `src/domain/cheatSheets/teams{4-32}.ts` (29 files) — add `seedMap` array extracted from xlsx; purely additive data field, no structural changes
3. `src/domain/assignSlots.ts` (new) — extracted domain function; `names[i]` maps to `structure.seedMap[i]`
4. `src/domain/__tests__/assignSlots.test.ts` (new) — parametric tests using xlsx golden data
5. `src/components/teams/TeamEntryView.tsx` — remove local `assignSlots`, import from domain layer

### Critical Pitfalls

1. **Changing `teamSlots` slot numbers breaks localStorage** — stored `Score.homeSlot`/`awaySlot` values become orphaned if slot numbers change; the Zustand `migrate` function is currently a no-op. Mitigation: the seeding fix only changes which seed index maps to which existing slot; the slot number scheme (1-4 for Group A; 11-14 for Group B; etc.) is preserved in full.

2. **Stale xlsx formula cache produces wrong extracted values** — openpyxl `data_only=True` returns `None` for formula cells when Excel did not cache results on last save. Mitigation: open xlsx in Excel, force recalculate (Ctrl+Shift+F9), save, then run extraction. Validate extracted values against manual inspection for at least 5 representative counts before writing any TypeScript.

3. **R1 groups and R2 seeding must be updated atomically** — R2 `seedingEntries` labels reference R1 group letters; if R1 changes without R2 updates, R2 resolves teams from wrong groups. Mitigation: for any team count touched, verify R2 seeding entries still reference valid R1 group letters; add a structural cross-reference test to `cheatSheets.test.ts`.

4. **Co-updating tests and data creates false confidence** — if cheat sheet data and test expected values change in the same commit without xlsx golden data as an external ground truth, tests prove internal consistency, not correctness. Mitigation: extract xlsx golden data BEFORE modifying any code; write verification tests asserting code matches golden data, not the other way around.

5. **Partial update across 29 team counts ships inconsistent state** — fixing team counts 8-16 but not 17-32 leaves large events broken. Mitigation: treat all 29 as a single atomic change; the existing parameterized test loop in `cheatSheets.test.ts` must enforce seeding correctness for all 29 counts, not just structural integrity.

## Implications for Roadmap

The v1.2 work decomposes into three phases with clear dependency order. The phasing is driven by the data-first risk mitigation strategy: wrong values cause wrong downstream behavior regardless of how correct the code structure is.

### Phase 1: Establish Ground Truth

**Rationale:** All subsequent work depends on having verified xlsx seed-to-slot mappings. Without this, code changes could encode the same wrong values and tests would provide false confidence. This phase is pure data extraction and verification — no code risk, but the highest value-add work in the milestone.
**Delivers:** Validated `seedMap` arrays for all 29 team counts stored as xlsx golden data fixture; fixed extraction script file path; confirmed R1/R2/finals structures are correct for all 29 team counts as a baseline.
**Addresses:** VALID-01 (cheat sheet validation), SEED-01 (data side)
**Avoids:** Pitfall 2 (formula caching), Pitfall 5 (false test confidence), Pitfall 6 (partial team count updates)

### Phase 2: Type + Data Changes

**Rationale:** TypeScript-driven: adding `seedMap: number[]` to `TournamentStructure` immediately makes all 29 cheat sheet files fail compilation, creating a compiler-enforced checklist. The data additions are mechanical and low-risk once Phase 1 golden data exists. Parametric validation tests provide correctness guarantees before any UI change.
**Delivers:** Passing TypeScript compilation with all 29 `seedMap` arrays from Phase 1 golden data; parametric tests validating every mapping against golden data; seedMap integrity validator ensuring no slot appears in two groups.
**Uses:** TypeScript 6.0 required-field enforcement; Vitest parametric tests (already in project)
**Implements:** `TournamentStructure` type extension + all 29 `teams{N}.ts` data files
**Avoids:** Pitfall 4 (off-by-one via explicit lookup vs algorithm), Pitfall 6 (all 29 counts updated atomically)

### Phase 3: Function Fix + Integration

**Rationale:** With verified data in place, the `assignSlots` fix is trivial (three-line change). Extracting it to the domain layer enables isolated unit testing. The integration is the final step, touching only `TeamEntryView.tsx` as a one-line import swap.
**Delivers:** Correct serpentine seeding across all 29 team counts; `assignSlots` extracted to `src/domain/assignSlots.ts`; full test suite passing.
**Implements:** `src/domain/assignSlots.ts` (new), `src/domain/__tests__/assignSlots.test.ts` (new), `TeamEntryView.tsx` (import swap)
**Avoids:** Pitfall 1 (localStorage breakage — slot numbers unchanged), Pitfall 3 (R1/R2 coupling — verified in Phase 1)

### Phase Ordering Rationale

- Phase 1 before Phase 2 because incorrect golden data produces incorrect code. The extraction and verification step is the most important and most irreversible part of this milestone — it cannot be shortcut or parallelized with code changes.
- Phase 2 before Phase 3 because TypeScript compilation gates Phase 3. The compiler enforces that all 29 files are populated before `assignSlots` can even be compiled and tested.
- Phase 3 is intentionally small. By the time it executes, all data is verified and tested. The logic change is three lines and the extraction to domain layer is a standard pattern.
- Slot numbers are preserved throughout, eliminating any need for a storage migration or version bump.

### Research Flags

Phases needing careful verification gates during execution (internal, not external research):

- **Phase 1:** Extract all 29 `seedMap` arrays and cross-check at least 5 representative counts (4, 8, 12, 18, 32) by manual xlsx inspection before writing any TypeScript. The 32-team sheet has no formula references in xlsx — its mapping must be derived from the serpentine pattern and validated manually. The 11-team case has anomalous slot ranges (20s and 30s for 3 groups) that require explicit verification against `teams11.ts`.

Phases with standard patterns (mechanical execution once Phase 1 is complete):

- **Phase 2:** Additive data changes to 29 files are mechanical. TypeScript enforces completeness. No architectural decisions needed.
- **Phase 3:** The function change itself is three lines. Domain extraction is a standard pattern already established in the codebase.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new dependencies. All tools already in project. openpyxl decision is definitively correct — SheetJS npm is 4 years stale with CDN-only current version. |
| Features | HIGH | Root cause isolated to single function and single data gap. All 29 seed-to-slot mappings extracted directly from xlsx formulas (4-31 teams). Correct/incorrect boundary clearly established with representative team count verification. |
| Architecture | HIGH | Based entirely on direct codebase code reading. `seedMap` approach is definitively superior to all alternatives — TypeScript enforces completeness, no runtime risk, no store changes, no downstream impacts. |
| Pitfalls | HIGH | Based on direct codebase analysis of store, scoring, seeding, and test files. localStorage slot-number risk is fully understood and mitigated by design (slot numbers unchanged). Formula-caching risk is well-documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **32-team `seedMap`:** The xlsx has no team name formula references for the 32-team sheet, so the mapping was derived from the consistent serpentine pattern rather than direct xlsx extraction. Treat as MEDIUM confidence; verify manually against the xlsx during Phase 1 before encoding in TypeScript.
- **11-team slot offsets:** The 11-team case uses slot ranges in the 20s and 30s, which is anomalous for 3 groups. Verify `teams11.ts` group definitions match extracted slot numbers before finalizing Phase 2 data.
- **xlsx formula cache freshness:** Research notes cached values may be absent if the xlsx was last saved by a non-Excel tool (Google Sheets, LibreOffice). Phase 1 execution must confirm `data_only=True` returns actual numeric values (not `None`) before trusting the extraction output.

## Sources

### Primary (HIGH confidence)

- `reference/cheat-sheets-v1.4.xlsx` — all 29 seed-to-slot mappings extracted via openpyxl formula parsing (HIGH for 4-31 teams; MEDIUM for 32 teams)
- `src/components/teams/TeamEntryView.tsx` lines 16-23 — current `assignSlots` implementation (direct code read)
- `src/domain/types.ts` lines 44-52 — `TournamentStructure` interface (direct code read)
- `src/domain/cheatSheets/teams{4,5,8,12,18,32}.ts` — representative cheat sheet structures (direct code read)
- `scripts/extractCheatSheets.py` — 617-line extraction script with openpyxl (direct code read)
- [SheetJS npm registry](https://www.npmjs.com/package/xlsx) — v0.18.5 latest on npm, 4 years stale
- [SheetJS CDN distribution](https://cdn.sheetjs.com/xlsx/) — v0.20.3 via tarball only, non-standard dependency model
- [openpyxl data_only documentation](https://openpyxl.readthedocs.io/en/3.1/api/openpyxl.reader.excel.html) — reads cached formula results when `data_only=True`
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) — browser mode stable, native Vite integration

### Secondary (MEDIUM confidence)

- [SheetJS vs ExcelJS vs node-xlsx (2026)](https://www.pkgpulse.com/blog/sheetjs-vs-exceljs-vs-node-xlsx-excel-files-node-2026) — ecosystem comparison confirming parity on cached value reading
- [Zustand persist middleware docs](https://docs.pmnd.rs/zustand/integrations/persisting-store-data#version) — version bump and migration pattern
- [openpyxl formula value guide](https://copyprogramming.com/howto/python-read-value-formula-from-xlsx) — cached values require file saved by Excel

### Tertiary (LOW confidence / derived)

- 32-team `seedMap` — derived from consistent serpentine pattern, no xlsx formula validation available; needs manual verification during Phase 1 execution

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
