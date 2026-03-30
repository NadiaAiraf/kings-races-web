# Milestones

## v1.0 MVP (Shipped: 2026-03-30)

**Phases completed:** 5 phases, 14 plans, 27 tasks

**Key accomplishments:**

- Vite + React + TypeScript project scaffolded with 29 cheat sheet race order sequences extracted programmatically from xlsx into typed TypeScript const files
- Pure scoring engine (Win=3/Loss=1/DSQ=0), group calculations, discipline validation, and 288 cheat sheet structural integrity tests via TDD
- Tailwind CSS 4 configured with app shell layout, discipline/sub-tab navigation, progress bar, 3 custom hooks, and shared utility components
- Race list view showing Round 1 matchups with team name resolution, outcome badges, and greyed-out Round 2/Finals placeholders for 8+ team events
- Auto-complement scoring with 1-tap Win/Loss recording, DSQ constraint enforcement, immediate auto-advance, and undo/re-score via Edit buttons
- Full-screen standings overlay with per-group tables showing rank, W/L/DSQ/Pts, race-by-race colored result cells, and tie indicators
- R2/finals seeding resolvers covering all 32 ref patterns across 29 cheat sheets, plus CSV export with papaparse
- R2 scoring flow with resolved team names from R1 standings, 5-tab navigation, auto phase transition, and R2 standings display
- Finals sub-tab with state machine rendering, placement matchup cards with seeding context, and Win/Loss/DSQ scoring with auto-advance
- Final results table with position/team/placement display, CSV export button with combined multi-discipline download, and StandingsView integration for complete event lifecycle
- VitePWA configured with autoUpdate, standalone display, and Workbox precaching for full offline support
- Fixed R2 phase transition guard for 8+ team events and added inline tiebreak resolution UI with UP/DOWN reorder buttons in the Finals tab

---
