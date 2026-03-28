---
phase: 01-data-foundation-and-storage
plan: 01
subsystem: domain
tags: [vite, react, typescript, zustand, vitest, openpyxl, cheat-sheets, tournament-structure]

requires: []
provides:
  - "Vite + React + TypeScript project scaffold with all core dependencies"
  - "29 cheat sheet TypeScript const files (teams4.ts through teams32.ts)"
  - "Domain type definitions (TournamentStructure, RaceMatchup, GroupDefinition, etc.)"
  - "getCheatSheet(teamCount) lookup function for all valid team counts (4-32)"
  - "Python extraction script for xlsx parsing (scripts/extractCheatSheets.py)"
affects: [02-ui-and-interaction, 03-progressive-enhancement]

tech-stack:
  added: [react, react-dom, react-router, zustand, vite, typescript, vitest, tailwindcss, "@tailwindcss/vite", "@testing-library/react", "@testing-library/jest-dom", jsdom, clsx]
  patterns: [static-cheat-sheet-lookup, tens-based-team-numbering, tournament-structure-types]

key-files:
  created:
    - src/domain/types.ts
    - src/domain/cheatSheets/index.ts
    - src/domain/cheatSheets/teams4.ts through teams32.ts (29 files)
    - scripts/extractCheatSheets.py
    - vitest.config.ts
    - package.json
  modified: []

key-decisions:
  - "Used COUNTA-based race counts from spreadsheet as reference only (includes headers), verified actual race counts by data extraction"
  - "Handled spreadsheet quirks: lowercase 'v' as team letter (avoids V separator conflict), zero-for-O typo, trailing asterisks on conditional races"
  - "Group extraction uses column C headers as fallback when column A labels are incomplete (24 Teams)"

patterns-established:
  - "Static cheat sheet lookup: getCheatSheet(teamCount) returns TournamentStructure"
  - "Tens-based team numbering: Group A = 1-4, Group B = 11-14, ..., Group H = 71-74"
  - "R2 seeding uses letter references resolved from R1 standings at runtime"
  - "Finals matchups reference R2 group standings (e.g., 'Winner Group I' V 'Second Group I')"

requirements-completed: [RACE-01, RACE-02, TEAM-02]

duration: 13min
completed: 2026-03-28
---

# Phase 01 Plan 01: Project Scaffold and Cheat Sheet Extraction Summary

**Vite + React + TypeScript project scaffolded with 29 cheat sheet race order sequences extracted programmatically from xlsx into typed TypeScript const files**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-28T18:58:38Z
- **Completed:** 2026-03-28T19:11:38Z
- **Tasks:** 2
- **Files modified:** 52

## Accomplishments
- Scaffolded Vite 8 + React 19 + TypeScript project with zustand, vitest, tailwindcss, and all dev dependencies
- Extracted all 29 cheat sheet race order sequences (4-32 teams) from xlsx into typed TypeScript const files
- Created domain type system (TournamentStructure, RaceMatchup, GroupDefinition, RoundTwoGroupDefinition, FinalsMatchup, etc.)
- Built getCheatSheet() lookup function mapping team count to tournament structure

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite project and install dependencies** - `8634e66` (feat)
2. **Task 2: Create domain types and extract all 29 cheat sheets from xlsx** - `1f40b20` (feat)

## Files Created/Modified
- `package.json` - Project manifest with react, zustand, vitest, tailwindcss dependencies
- `vitest.config.ts` - Test config with jsdom environment
- `src/domain/types.ts` - Core domain types: TournamentStructure, RaceMatchup, GroupDefinition, DisciplineKey, DISCIPLINE_TEAM_RANGES
- `src/domain/cheatSheets/index.ts` - getCheatSheet() and isValidTeamCount() lookup functions
- `src/domain/cheatSheets/teams4.ts` through `teams32.ts` - 29 static cheat sheet files
- `scripts/extractCheatSheets.py` - Python extraction script using openpyxl

## Decisions Made
- Spreadsheet COUNTA-based race counts include header rows; verified actual race counts by parsing the "N V M" data directly
- Handled 3 spreadsheet quirks automatically: lowercase 'v' as team letter (22+ teams), '0' typo for 'O' (15 Teams), trailing asterisks on conditional races (17, 23, 26, 29 Teams)
- Used column C "Group X" headers for group extraction when column A labels are incomplete (24 Teams has only A/B in column A but 8 groups in column C)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lowercase 'v' team letter not matched by uppercase-only regex**
- **Found during:** Task 2 (cheat sheet extraction)
- **Issue:** Sheets for 22+ teams use lowercase 'v' as a team letter to avoid conflict with the 'V' separator. Initial regex only matched `[A-Z]+`.
- **Fix:** Updated regex to `[A-Za-z0-9]+` and added zero-to-O correction
- **Files modified:** scripts/extractCheatSheets.py
- **Committed in:** 1f40b20

**2. [Rule 3 - Blocking] Trailing asterisks on conditional race entries**
- **Found during:** Task 2 (cheat sheet extraction)
- **Issue:** Some race entries have trailing asterisks (e.g., "51 V 52*") indicating conditional races. Regex didn't match.
- **Fix:** Added `.rstrip('* ')` before regex matching for both numeric and letter races
- **Files modified:** scripts/extractCheatSheets.py
- **Committed in:** 1f40b20

**3. [Rule 3 - Blocking] Incomplete group labels in column A for 24 Teams**
- **Found during:** Task 2 (cheat sheet extraction)
- **Issue:** 24 Teams sheet only has group letters A/B in column A, but has 8 groups (A-H) identified by column C headers.
- **Fix:** Added fallback logic to use column C "Group X" headers when column A is incomplete
- **Files modified:** scripts/extractCheatSheets.py
- **Committed in:** 1f40b20

---

**Total deviations:** 3 auto-fixed (3 blocking issues)
**Impact on plan:** All auto-fixes necessary for correct cheat sheet extraction. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all cheat sheet data is fully wired from the xlsx source.

## Next Phase Readiness
- Domain types and cheat sheet data ready for scoring engine (Plan 01-02) and Zustand store (Plan 01-03)
- getCheatSheet() provides the lookup function that the race order display will use in Phase 2
- All 29 tournament structures include groups, R1 races, R2 groups/races, and finals

## Self-Check: PASSED

All files exist, all commits verified, 29/29 cheat sheet files confirmed.

---
*Phase: 01-data-foundation-and-storage*
*Completed: 2026-03-28*
