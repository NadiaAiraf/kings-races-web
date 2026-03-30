# Phase 8: Ground Truth & Validation - Research

**Researched:** 2026-03-30
**Domain:** xlsx golden data extraction + Vitest validation tests
**Confidence:** HIGH

## Summary

This phase extracts golden data from `reference/cheat-sheets-v1.4.xlsx` using Python/openpyxl and writes automated Vitest tests that compare the current 29 TypeScript cheat sheet files against that golden data. The phase produces two deliverables: (1) a Python extraction script that outputs JSON fixtures, and (2) Vitest test files that import those fixtures and assert correctness across all 29 team counts for seed mappings, R1 race orders, and R2 race orders.

The xlsx structure is well-understood. Column C formulas (`='Enter Teams'!B{row}`) encode seed-to-slot mappings for all team counts 4-31. The 32-team sheet has no formulas (column C is empty) -- its seed map must be derived from the consistent pattern observed in 25-31 teams. R1 races live in column J (slot-based matchups like `1 V 2`), R2 races in column T (letter-based matchups like `A V B`). The existing `scripts/extractCheatSheets.py` (617 lines) provides proven parsing patterns for all these column layouts.

**Primary recommendation:** Write a focused Python extraction script that outputs a single combined JSON fixture file, then write parametric Vitest tests that loop `it.each` over all 29 team counts comparing against that fixture.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use Python with openpyxl (already installed) to extract seed-to-slot mappings, R1 race orders, and R2 race orders from all 29 xlsx sheets. The existing `scripts/extractCheatSheets.py` script is the reference for xlsx parsing patterns.
- **D-02:** Golden data should be written as JSON fixture files (one per team count or one combined file) that Vitest tests can import. Format: `{ teamCount: number, seedMap: number[], r1Races: {raceNum, home, away}[], r2Races: {raceNum, home, away}[] }`.
- **D-03:** Seed-to-slot mappings are extracted from column C formulas on each team sheet -- `='Enter Teams'!B{row}` where row 3 = seed 1, row 4 = seed 2, etc. The seed number maps to the slot number in column B of the same row.
- **D-04:** The 32-team sheet has no formula references in column C -- its seedMap must be derived from the slot pattern observed in 25-31 teams and manually verified.
- **D-05:** Write parametric Vitest tests that loop over all 29 team counts and compare each cheat sheet file's data against the golden fixtures.
- **D-06:** Three test suites: (1) seed mapping validation, (2) R1 race order validation, (3) R2 race order validation.
- **D-07:** Tests should report which specific team count and which race/slot is wrong, not just "18 teams failed".

### Claude's Discretion
- Whether to use one combined JSON fixture file or separate files per team count
- Python script structure and error handling
- Test file organization (one file or split by validation type)
- Whether to also extract and validate finals structure

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALID-01 | All 29 cheat sheet seed mappings must be validated against the xlsx source of truth with automated tests | Golden data extraction script reads column C formulas for seed-to-slot mappings; Vitest parametric tests compare against `getCheatSheet(n)` group structure |
| VALID-02 | R1 race order for all 29 team counts must be validated against the xlsx source of truth | Extraction script reads column J for `N V M` race pairs; tests compare `roundOneRaces` array against golden data |
| VALID-03 | R2 race order for all 29 team counts must be validated against the xlsx source of truth | Extraction script reads column T for letter-based race pairs; tests compare `roundTwoGroups[].races` against golden data |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openpyxl | 3.1.5 | Read xlsx formulas and values | Already installed, proven in existing extraction script |
| Vitest | 3.2.4 | Test runner for validation tests | Already configured in project, parametric test support |
| Python 3 | system | Run extraction script | Already used for existing scripts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| json (stdlib) | N/A | Write golden data as JSON | Output format for Python -> Vitest bridge |

No additional packages needed. Everything required is already installed.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  extractGoldenData.py           # New: extracts golden data from xlsx
src/domain/cheatSheets/
  __fixtures__/
    goldenData.json              # New: combined golden data for all 29 team counts
  cheatSheets.test.ts            # Existing structural tests (keep as-is)
  goldenDataValidation.test.ts   # New: xlsx-vs-code validation tests
```

### Pattern 1: Single Combined JSON Fixture
**What:** One JSON file containing golden data for all 29 team counts, keyed by team count number.
**When to use:** Always -- simpler than 29 separate files, easy to import in Vitest.
**Why:** A single `import goldenData from './__fixtures__/goldenData.json'` keeps tests clean. The total data is small (29 entries, each with a seedMap array and race arrays -- under 100KB).

**Format:**
```json
{
  "4": {
    "teamCount": 4,
    "seedMap": [1, 4, 3, 2],
    "r1Races": [
      { "raceNum": 1, "homeSlot": 1, "awaySlot": 2 },
      { "raceNum": 2, "homeSlot": 3, "awaySlot": 4 }
    ],
    "r2Races": []
  },
  "8": {
    "teamCount": 8,
    "seedMap": [1, 11, 14, 4, 2, 12, 13, 3],
    "r1Races": [
      { "raceNum": 1, "homeSlot": 1, "awaySlot": 2 },
      ...
    ],
    "r2Races": [
      { "raceNum": 1, "homeLetter": "A", "awayLetter": "B" },
      ...
    ]
  }
}
```

**Key design choice:** `seedMap` is indexed by seed number (0-based array where `seedMap[0]` is the slot for seed 1, `seedMap[1]` is the slot for seed 2, etc.). This matches the D-02 format and the FEATURES.md data.

### Pattern 2: Parametric Vitest Tests with Descriptive Failures
**What:** Use `describe.each` or manual `for` loop over team counts with individual `it()` calls per validation dimension.
**When to use:** For all three validation suites.

**Example:**
```typescript
import goldenData from './__fixtures__/goldenData.json';
import { getCheatSheet } from './index';

describe('VALID-01: seed mapping matches xlsx', () => {
  for (let n = 4; n <= 32; n++) {
    const golden = goldenData[String(n)];
    const sheet = getCheatSheet(n);

    it(`${n} teams: seed-to-slot mapping matches xlsx`, () => {
      // Build actual seedMap from sheet.groups
      const allSlots = sheet.groups.flatMap(g => g.teamSlots);
      // Compare golden.seedMap against actual group structure
      for (let seed = 0; seed < golden.seedMap.length; seed++) {
        const expectedSlot = golden.seedMap[seed];
        // Find which group contains this slot
        const group = sheet.groups.find(g => g.teamSlots.includes(expectedSlot));
        expect(group, `seed ${seed + 1} -> slot ${expectedSlot}: slot not found in any group for ${n} teams`).toBeDefined();
      }
    });
  }
});
```

### Pattern 3: Seed Mapping Validation Strategy
**What:** The validation must check that the xlsx seed-to-slot mapping is consistent with the group structure in the TS files.
**Critical insight:** The current TS cheat sheet files do NOT have a `seedMap` field yet (that is added in Phase 9). What we validate in Phase 8 is:
1. Every slot in the golden `seedMap` exists in some group's `teamSlots` array
2. The total count of seeds matches `teamCount`
3. R1 race matchups (slot-based) match exactly
4. R2 race matchups (letter-based) match exactly

The seed mapping validation tests will initially PASS for slot existence (all slots are correctly defined in groups) but will serve as the ground truth for Phase 9 when `seedMap` is actually added to `TournamentStructure`.

### Anti-Patterns to Avoid
- **Co-modifying code and test expectations:** Never change cheat sheet data and test expectations in the same commit without the golden data as independent verification
- **Algorithmic re-derivation in tests:** Do not implement serpentine logic in tests to generate expected values -- use the xlsx-extracted golden data directly
- **Partial team count coverage:** Never test a subset; always validate all 29

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| xlsx formula parsing | Custom formula evaluator | openpyxl `data_only=False` + regex on `='Enter Teams'!B{row}` | Formulas are simple cell references, not computed expressions |
| R1 race parsing | Custom text parser | Regex `r'^(\d+)\s*V\s*(\d+)$'` from existing script | Proven pattern, handles edge cases (asterisks, missing spaces) |
| R2 race parsing | Custom text parser | Regex for letter-based races from existing script | Handles lowercase v, zero-for-O typo |
| 32-team seedMap | Algorithmic derivation | Manually verify against xlsx cached values + pattern extrapolation | Only 1 of 29 sheets; pattern is consistent for 25-31 teams |

## Common Pitfalls

### Pitfall 1: openpyxl Formula Cache Returns None
**What goes wrong:** Using `data_only=True` returns `None` for cells whose cached values were not saved by Excel.
**Why it happens:** openpyxl cannot evaluate formulas. It reads cached results only.
**How to avoid:** Use `data_only=False` and parse the formula string directly. For seed mapping, parse `='Enter Teams'!B{row}` to extract the row number. For R1/R2 races, the values are literal strings (not formulas), so `data_only` mode does not matter.
**Warning signs:** Any extracted value that is `None` for a cell you expect to have data.

### Pitfall 2: R2 Race Letter Casing and Spacing Inconsistencies
**What goes wrong:** The xlsx has inconsistent formatting: `"L V  I"` (double space), lowercase letters in some sheets for 22+ teams.
**Why it happens:** Manual data entry in the original xlsx.
**How to avoid:** Normalize whitespace (`strip()`, `split()`) and compare case-insensitively where appropriate. The existing extraction script handles these -- reuse its patterns.
**Warning signs:** Extracted race count does not match expected count for a team count.

### Pitfall 3: 32 Teams Has No Formula References
**What goes wrong:** Column C is empty for 32 Teams. The extraction script gets no seed-to-slot mapping.
**Why it happens:** The 32-team sheet was likely filled manually without formula references to the Enter Teams sheet.
**How to avoid:** Derive the 32-team seedMap from the consistent pattern in 25-31 teams. The FEATURES.md already has this derived mapping. Verify it matches the slot order in the xlsx's column B group structure.
**Warning signs:** Extraction produces empty seedMap for team count 32.

### Pitfall 4: R2 Races Only Exist for 7+ Teams
**What goes wrong:** Tests fail or error for 4-6 team counts expecting R2 data.
**Why it happens:** Teams 4-6 have only 1 group, so there is no R2 round.
**How to avoid:** Golden data should have empty `r2Races` array for 4-6 teams. Tests should skip R2 validation for these counts.
**Warning signs:** R2 extraction returns empty for team counts below 7.

### Pitfall 5: R2 Race Grouping Ambiguity
**What goes wrong:** R2 races in the xlsx are listed as a flat sequence (A V B, C V D, ...) but the TS files organize them into R2 groups (Group I, Group II, etc.). The golden data needs to preserve the grouping.
**Why it happens:** The xlsx column T has races in a flat list, with blank rows separating round-robin rounds (not groups). Group assignments come from a separate column.
**How to avoid:** For R2 validation, compare the flat sequence of letter-based races rather than trying to match group-by-group. The race ORDER matters; group assignment is verified through the seeding entries.
**Warning signs:** Group-level comparison fails but race-level comparison passes.

## Code Examples

### Python: Extract Seed Map from xlsx Formulas
```python
# Source: verified against reference/cheat-sheets-v1.4.xlsx
import openpyxl, re

wb = openpyxl.load_workbook('reference/cheat-sheets-v1.4.xlsx', data_only=False)

def extract_seed_map(ws, team_count):
    """Extract seed-to-slot mapping from column C formulas.
    Returns list where index i = slot for seed (i+1)."""
    seed_slot_pairs = []
    for row in range(1, 100):
        c = ws[f'C{row}'].value
        b = ws[f'B{row}'].value
        if c and isinstance(c, str) and "'Enter Teams'!B" in c:
            m = re.search(r"'Enter Teams'!B(\d+)", c)
            if m and isinstance(b, (int, float)):
                enter_row = int(m.group(1))
                seed = enter_row - 2  # Row 3 = seed 1, row 4 = seed 2, ...
                slot = int(b)
                seed_slot_pairs.append((seed, slot))

    # Sort by seed number, return slots in seed order
    seed_slot_pairs.sort(key=lambda x: x[0])
    return [slot for _, slot in seed_slot_pairs]
```

### Python: Extract R1 Races from Column J
```python
# Source: existing pattern from scripts/extractCheatSheets.py
def extract_r1_races(ws):
    """Extract R1 race matchups from column J."""
    races = []
    race_num = 1
    for row in range(1, 100):
        val = ws[f'J{row}'].value
        if val and isinstance(val, str):
            cleaned = val.strip().rstrip('* ')
            m = re.match(r'^(\d+)\s*V\s*(\d+)$', cleaned)
            if m:
                races.append({
                    'raceNum': race_num,
                    'homeSlot': int(m.group(1)),
                    'awaySlot': int(m.group(2)),
                })
                race_num += 1
    return races
```

### Python: Extract R2 Races from Column T
```python
# Source: existing pattern from scripts/extractCheatSheets.py
def extract_r2_races(ws):
    """Extract R2 race matchups from column T."""
    races = []
    race_num = 1
    for row in range(1, 150):
        val = ws[f'T{row}'].value
        if val and isinstance(val, str):
            cleaned = val.strip().rstrip('* ')
            m = re.match(r'^([A-Za-z0-9]+)\s+V\s+([A-Za-z0-9]+)\s*$', cleaned)
            if m:
                home = m.group(1).strip()
                away = m.group(2).strip()
                if home == '0': home = 'O'
                if away == '0': away = 'O'
                races.append({
                    'raceNum': race_num,
                    'homeLetter': home,
                    'awayLetter': away,
                })
                race_num += 1
    return races
```

### Vitest: Parametric Validation
```typescript
// Source: project vitest.config.ts pattern + D-05/D-07
import goldenData from './__fixtures__/goldenData.json';
import { getCheatSheet } from './index';

const teamCounts = Array.from({ length: 29 }, (_, i) => i + 4);

describe('VALID-02: R1 race order matches xlsx', () => {
  teamCounts.forEach((n) => {
    const golden = (goldenData as Record<string, any>)[String(n)];

    it(`${n} teams: R1 races match xlsx (${golden.r1Races.length} races)`, () => {
      const sheet = getCheatSheet(n);
      expect(sheet.roundOneRaces.length).toBe(golden.r1Races.length);

      for (let i = 0; i < golden.r1Races.length; i++) {
        const expected = golden.r1Races[i];
        const actual = sheet.roundOneRaces[i];
        expect(actual.homeSlot,
          `${n} teams, race ${i + 1}: expected home=${expected.homeSlot}, got ${actual.homeSlot}`
        ).toBe(expected.homeSlot);
        expect(actual.awaySlot,
          `${n} teams, race ${i + 1}: expected away=${expected.awaySlot}, got ${actual.awaySlot}`
        ).toBe(expected.awaySlot);
      }
    });
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual xlsx comparison | Automated golden data extraction + parametric tests | This phase | Regression safety net for Phase 9 code changes |
| Hardcoded test expectations | xlsx-derived golden fixtures as independent source of truth | This phase | Prevents Pitfall 5 (false confidence from co-updated tests) |

## Open Questions

1. **R2 Race Numbering: Global vs Per-Group**
   - What we know: The xlsx lists R2 races as a flat sequence in column T. The TS files number races per-group (each R2 group starts at race 1).
   - What's unclear: Whether validation should compare flat sequence order or per-group order.
   - Recommendation: Extract as flat sequence from xlsx. In tests, flatten the TS `roundTwoGroups[].races` arrays and compare the letter matchups in order. Race numbers are per-group in TS, so compare matchup content rather than race numbers.

2. **32 Teams Seed Map Verification**
   - What we know: No formulas exist. FEATURES.md derives: `[1,11,21,31,41,51,61,71,74,64,54,44,34,24,14,4,2,12,22,32,42,52,62,72,63,53,43,33,23,13,3,73]`
   - What's unclear: Whether the xlsx cached values (data_only=True) can serve as verification.
   - Recommendation: Check `data_only=True` for 32 Teams to see if cached team name values exist. If they do, cross-reference. If not, the pattern derivation is the best available evidence.

3. **R2 Group Assignment from xlsx**
   - What we know: R2 races in xlsx are flat; R2 group headers are in column M/N.
   - What's unclear: Whether to validate R2 group assignment (which races belong to which R2 group) or just the flat race order.
   - Recommendation: Validate the flat race order first (simpler, covers R2ORD-01). Group assignment validation is bonus but not required by VALID-03.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | Extraction script | Yes | system | -- |
| openpyxl | xlsx reading | Yes | 3.1.5 | -- |
| Vitest | Test runner | Yes | 3.2.4 | -- |
| reference/cheat-sheets-v1.4.xlsx | Source of truth | Yes | v1.4 | -- |

No missing dependencies.

## Sources

### Primary (HIGH confidence)
- `reference/cheat-sheets-v1.4.xlsx` -- directly inspected via openpyxl for formula structure, column layouts, R1/R2 race patterns, and 32-team formula absence
- `scripts/extractCheatSheets.py` -- existing 617-line extraction script with proven xlsx parsing patterns
- `src/domain/cheatSheets/teams8.ts` -- verified TS structure against xlsx data
- `src/domain/types.ts` -- TournamentStructure type definition (no seedMap field yet)
- `vitest.config.ts` -- existing test configuration with jsdom environment

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` -- extracted seed-to-slot mappings for all 29 team counts (verified 8-team mapping against direct xlsx read)
- `.planning/research/PITFALLS.md` -- openpyxl formula cache warnings, test fixture risks

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools already installed and proven in project
- Architecture: HIGH - extraction patterns verified against actual xlsx structure
- Pitfalls: HIGH - directly verified formula/caching behavior and column layouts

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- xlsx file is static, tools are established)
