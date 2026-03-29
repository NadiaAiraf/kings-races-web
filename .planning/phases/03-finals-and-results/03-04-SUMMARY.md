---
phase: 03-finals-and-results
plan: 04
subsystem: ui
tags: [react, zustand, csv, papaparse, results, export]

# Dependency graph
requires:
  - phase: 03-finals-and-results/01
    provides: csvExport domain logic (generateEventCSV, triggerCSVDownload, FinalResult type)
  - phase: 03-finals-and-results/03
    provides: useFinalsState hook with resolved matchups and finals phase
provides:
  - FinalResultsTable component showing positions 1-N with team names and placement
  - ExportButton component with CSV download and disabled state
  - useFinalResults hook deriving final standings from scored finals
  - computeFinalResults pure function for non-hook CSV export usage
  - StandingsView integration showing results and export when discipline is complete
affects: [phase-04, event-lifecycle]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure function extraction for hook logic reuse in export handlers]

key-files:
  created:
    - src/hooks/useFinalResults.ts
    - src/components/results/FinalResultsTable.tsx
    - src/components/results/ExportButton.tsx
  modified:
    - src/components/standings/StandingsView.tsx

key-decisions:
  - "Extracted computeFinalResults as pure function alongside useFinalResults hook for reuse in CSV export handler without hook constraints"
  - "StandingsView supports both overlay and sub-tab rendering via asTab prop"

patterns-established:
  - "Pure function extraction: export both hook and pure function from same module for reuse in event handlers"

requirements-completed: [EXPR-01, EXPR-02]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 3 Plan 4: Final Results and CSV Export Summary

**Final results table with position/team/placement display, CSV export button with combined multi-discipline download, and StandingsView integration for complete event lifecycle**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T11:31:56Z
- **Completed:** 2026-03-29T21:57:31Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- FinalResultsTable renders semantic table with position, team name, and ordinal placement for completed disciplines
- ExportButton provides full-width download button with inline SVG icon, disabled state with aria attributes, and CSV generation via papaparse
- useFinalResults hook derives final placements from scored finals matchups with parsePlacementLabel and formatOrdinal helpers
- StandingsView conditionally renders results table and export button when discipline phase is complete
- CSV export combines all three disciplines into a single kings-races-YYYY-MM-DD.csv file
- Human verification confirmed full end-to-end flow: team entry through finals through results and export

## Task Commits

Each task was committed atomically:

1. **Task 1: Final results derivation hook, results table, and export button** - `84eac55` (feat)
2. **Task 2: Wire results and export into StandingsView** - `6ab3c7b` (feat)
3. **Task 3: Verify complete event flow** - checkpoint approved (no commit)

## Files Created/Modified
- `src/hooks/useFinalResults.ts` - Hook and pure function deriving final placements from scored finals matchups
- `src/components/results/FinalResultsTable.tsx` - Semantic table with position, team, placement columns and alternating row colors
- `src/components/results/ExportButton.tsx` - Full-width export button with download SVG icon and disabled/enabled states
- `src/components/standings/StandingsView.tsx` - Integrated final results table, export button, and asTab prop for dual rendering modes

## Decisions Made
- Extracted `computeFinalResults` as pure function alongside `useFinalResults` hook so export handler can compute results for all 3 disciplines without hook constraints
- StandingsView supports both overlay mode (with header/close) and sub-tab mode (via `asTab` prop) for flexible integration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data sources are wired to live store state. Export CSV generates real data from scored finals.

## Next Phase Readiness
- Phase 03 (finals-and-results) is fully complete: all 4 plans executed
- Complete event lifecycle works end-to-end: team entry -> race order -> R1 scoring -> R2 scoring -> finals -> results -> CSV export
- Ready for Phase 04 (polish and deployment)

## Self-Check: PASSED

All 4 key files verified on disk. Both task commits (84eac55, 6ab3c7b) verified in git log.

---
*Phase: 03-finals-and-results*
*Completed: 2026-03-29*
