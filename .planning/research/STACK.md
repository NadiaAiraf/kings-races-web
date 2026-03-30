# Technology Stack: Cheat Sheet Accuracy Fixes (v1.2)

**Project:** Kings Races Web v1.2
**Researched:** 2026-03-30
**Scope:** Build-time tooling for xlsx data extraction, seed-to-group mapping, and cheat sheet validation
**Confidence:** HIGH

## Executive Answer

**No new dependencies needed.** Keep openpyxl (Python 3.1.5, already installed) for xlsx extraction. The existing `scripts/extractCheatSheets.py` already reads the xlsx correctly -- the fix is to the extraction logic (how seed ordering is interpreted), not the extraction tooling (which library reads the file). Do NOT rewrite the extraction script in Node.js.

## Recommended Stack (Build-Time Only)

### XLSX Extraction

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| openpyxl (Python) | 3.1.5 | Read xlsx cached formula values | Already installed, already proven. The existing `scripts/extractCheatSheets.py` uses openpyxl with `data_only=True` and successfully extracted all 29 team sheets. Switching to a Node.js library gains nothing and risks regressions in 617 lines of battle-tested extraction code. |

### Validation Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 4.1.x | Validate extracted data matches xlsx | Already in the project. Write test cases that encode expected serpentine patterns and compare against generated TypeScript const arrays. |
| openpyxl (Python) | 3.1.5 | Automated validation script | Same library for a `scripts/validateCheatSheets.py` that reads xlsx and compares to generated TS files programmatically across all 29 team counts. |

### Supporting (Already Installed -- No Changes)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| TypeScript | 6.0 | Type-check generated cheat sheet files | Generated files already import `TournamentStructure` type. |
| Vitest | 4.1.x | Run cheat sheet tests | `cheatSheets.test.ts` already has tests for all 29 team counts. |

## Why NOT Switch to Node.js for Extraction

### 1. openpyxl is already working

The extraction script at `scripts/extractCheatSheets.py` is 617 lines of Python that handles 15+ spreadsheet quirks: lowercase 'v' when letter V conflicts with separator, zero-for-O typos, trailing asterisks, missing group labels, varying column layouts (J/Q for R1, T/U for R2, K/L/M or L/M/N for seeding). Rewriting this in JavaScript would be pure risk for zero benefit.

### 2. SheetJS has distribution problems

The npm registry version of `xlsx` is stuck at **0.18.5** (published 4 years ago). Current version 0.20.3 is only available via CDN tarball at `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. This means:
- No standard `npm install xlsx` for current version
- Must use tarball URL in package.json
- Security scanning tools may not cover CDN-distributed packages
- Breaking the standard npm dependency model for a dev tool is not worth it

### 3. Formula resolution is identical across all libraries

Neither openpyxl, SheetJS, nor ExcelJS **evaluate** formulas. They all read the **cached values** that Excel stored when the file was last saved. Since `cheat-sheets-v1.4.xlsx` was saved from Excel, cached values exist and are reliable.

| Library | How It Reads Formula Cells | Result |
|---------|---------------------------|--------|
| openpyxl `data_only=True` | Returns cached computed value | The number/string Excel calculated |
| openpyxl `data_only=False` | Returns formula string | `='Enter Teams'!B5` |
| SheetJS (default) | Returns `cell.v` (cached value) | Same as openpyxl data_only=True |
| SheetJS `cellFormula: true` | Returns `cell.f` (formula) + `cell.v` (cached) | Both available |
| ExcelJS | Returns `cell.result` (cached value) | Same cached value |

There is no advantage to switching -- they all read the same cached data from the xlsx file.

### 4. This is a build-time script, not a runtime dependency

The extraction script runs once during development to generate static TypeScript files. It never ships to users. Python being "outside the Node stack" is irrelevant for a developer tool that produces `.ts` files.

## Understanding Column C Formulas

The xlsx column C contains formulas like `='Enter Teams'!B{row}` that map seed numbers to team names. These formulas are **irrelevant to the extraction task** because:

1. They reference the "Enter Teams" sheet which contains user-entered team names -- runtime data that varies per event
2. What we actually need is the **seed slot number** (column B) and **group assignment** (column A or column C "Group X" headers)
3. The extraction script already reads columns A and B to get group-to-seed mappings
4. Column C's formula-resolved values would just be team names like "Team 1", "Team 2" from the template -- not the structural data we need

**The real data flow:**
```
xlsx Column A: Group letter (A, B, C, ...)
xlsx Column B: Seed slot number (1, 2, 3, ..., N)
  --> Extraction script reads A+B
    --> Generates TypeScript: { letter: 'A', teamSlots: [1, 4, 5, 8] }
      --> App maps seed slots to entered team names at runtime
```

## What the Extraction Script Needs Fixed

The existing script needs two targeted fixes (not a rewrite):

1. **Update file path:** Currently hardcoded to `/Users/aidanfaria/Downloads/Master Copy...`. Change to `reference/cheat-sheets-v1.4.xlsx` (relative to project root).

2. **Verify seed ordering:** Confirm the `teamSlots` arrays in each group preserve the xlsx's insertion order (serpentine draft pattern), not just contain the right numbers. The serpentine pattern for N groups distributes seeds as:
   - Forward pass: seeds 1, 2, 3, ..., N to groups A, B, C, ..., N
   - Reverse pass: seeds N+1, N+2, ..., 2N to groups N, ..., C, B, A
   - Repeat

3. **R2 race order validation:** Verify extracted R2 race sequences match xlsx for all applicable team counts (7-32).

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| openpyxl (Python) | SheetJS (Node.js) | npm version 4 years stale, CDN-only for current version, would require rewriting 617 lines of working code |
| openpyxl (Python) | ExcelJS (Node.js) | Same formula limitation (cached values only), no advantage, slower for read-only tasks |
| openpyxl (Python) | xlwings (Python) | Requires running Excel installation for formula evaluation. Overkill -- we don't need formula evaluation. Not available on CI/Linux. |
| openpyxl `data_only=True` | openpyxl `data_only=False` | `data_only=False` returns formula strings instead of values. We want cached computed values. |
| Python validation script | Manual spot-checking | 29 team counts x multiple data points = too error-prone to verify manually |
| Keep Python script | Rewrite as Node.js script with tsx | No benefit. Python script works, openpyxl is mature, rewriting risks introducing bugs in quirk-handling logic |

## Installation

```bash
# Nothing new to install for the project

# For developer machine (likely already present):
pip install openpyxl  # Already installed (3.1.5)
```

**Zero new npm dependencies. Zero new Python dependencies.**

## Existing Runtime Stack (Unchanged)

The v1.0/v1.1 stack remains fully intact. This research covers only the build-time tooling for cheat sheet extraction and validation. See the previous STACK.md research (2026-03-28) for the complete runtime stack: React 19.1, Vite, Zustand, Tailwind CSS 4, vite-plugin-pwa, papaparse, Vitest, etc.

## Sources

- [SheetJS npm registry](https://www.npmjs.com/package/xlsx) -- v0.18.5 is latest on npm, 4 years old (HIGH confidence)
- [SheetJS CDN distribution](https://cdn.sheetjs.com/xlsx/) -- v0.20.3 via tarball only (HIGH confidence)
- [SheetJS formula documentation](https://docs.sheetjs.com/docs/csf/features/formulae/) -- community edition reads cached values, does not evaluate (HIGH confidence)
- [openpyxl data_only documentation](https://openpyxl.readthedocs.io/en/3.1/api/openpyxl.reader.excel.html) -- reads cached formula results when data_only=True (HIGH confidence)
- [openpyxl formula value guide](https://copyprogramming.com/howto/python-read-value-formula-from-xlsx) -- cached values require file to have been saved by Excel (HIGH confidence)
- [SheetJS vs ExcelJS vs node-xlsx (2026)](https://www.pkgpulse.com/blog/sheetjs-vs-exceljs-vs-node-xlsx-excel-files-node-2026) -- ecosystem comparison (MEDIUM confidence)
- Existing codebase: `scripts/extractCheatSheets.py` -- 617 lines of working extraction with openpyxl (HIGH confidence, verified by reading source)
- Existing codebase: `src/domain/cheatSheets/` -- 29 generated TypeScript files with TournamentStructure types (HIGH confidence, verified)

---
*Stack research for: Kings Races Web v1.2 -- cheat sheet accuracy fixes*
*Researched: 2026-03-30*
