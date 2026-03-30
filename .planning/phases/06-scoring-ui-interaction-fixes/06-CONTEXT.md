# Phase 6: Scoring UI & Interaction Fixes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Merge the Races and Score tabs into a single unified "Races" tab with inline scoring, fix DSQ-then-Win scoring bugs, and consolidate finals scoring into the same list. The result is one scrollable view where officials can see all races and score them in place.

</domain>

<decisions>
## Implementation Decisions

### Merged Tab Layout
- **D-01:** Remove the separate "Score" tab and "Finals" tab. A single "Races" tab shows all races (R1, R2, Finals) in one scrollable list with expandable inline scoring.
- **D-02:** Race cards use a left/right layout mirroring the spreadsheet — home team on the left, away team on the right, with "vs" between them. This matches the xlsx race order format officials already know.
- **D-03:** Cards are expandable — tapping an unscored card expands it to reveal scoring buttons. Only one card expanded at a time. Scored cards show outcome badges in collapsed state.

### Scoring Buttons
- **D-04:** Two buttons per team: **Win** and **DSQ** only (no Loss button). Tapping "Win" on a team records Win for that team and Loss for the other automatically. Tapping "DSQ" records DSQ for that team and Win for the other automatically. Every tap is a single action that resolves the full matchup instantly.
- **D-05:** This design eliminates the SCORE-01/SCORE-02 bugs by construction — there is no intermediate state where one team has DSQ and the other's buttons are still active.

### Scoring Flow
- **D-06:** Auto-expand: the next unscored race in the active round is automatically expanded when the Races tab opens and after each score is recorded. Preserves the auto-advance feel from Phase 2 D-02.
- **D-07:** Auto-scroll: after recording a score, the just-scored card collapses, the next unscored card expands, and the list scrolls to bring it into view.

### Edit/Re-score
- **D-08:** Tapping a scored (collapsed) card re-expands it to show Win/DSQ buttons, pre-highlighted with the current result. Tap a different button to change the result, or tap elsewhere to collapse without changes. No separate Edit button needed.

### Scored Card Appearance
- **D-09:** Scored cards in collapsed state show colored outcome badges next to each team name — green W, amber L, red DSQ. Same visual language as current RaceCard badges.

### Round Transitions
- **D-10:** Claude's Discretion — round section headers and greyed-out future round treatment. The existing RoundHeader pattern and D-08 from Phase 2 (all rounds visible, future rounds greyed out) should guide the approach.

### Finals in Races List
- **D-11:** Finals matchups appear as expandable cards in the Races list under a "Finals" round header, using the same Win/DSQ scoring pattern. The separate Finals tab is removed. This gives one unified scoring surface for the entire event.

### Claude's Discretion
- Round section header styling and active/inactive treatment
- Scroll behavior implementation details (smooth scroll, scroll margin)
- Card expand/collapse animation (if any)
- How the SubTabs component changes (removing Score and Finals tabs)
- Whether FinalsView is fully removed or refactored into the list

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scoring & Race Logic
- `src/domain/scoringHelpers.ts` — getComplement and getDisabledOutcomes (will need updating for Win/DSQ-only model)
- `src/domain/types.ts` — RaceOutcome type definition

### Current UI Components (to refactor)
- `src/components/scoring/ScoringFocusView.tsx` — Current focused scoring view (being merged into Races)
- `src/components/scoring/OutcomeButton.tsx` — Current 3-button outcome component (reducing to 2 buttons)
- `src/components/races/RaceListView.tsx` — Current read-only race list (becoming the scoring surface)
- `src/components/races/RaceCard.tsx` — Current display-only card (needs expandable + left/right layout)
- `src/components/layout/SubTabs.tsx` — Tab definitions (removing Score and Finals tabs)
- `src/components/layout/AppShell.tsx` — Main layout routing tabs to views

### Finals (consolidating into Races list)
- `src/components/finals/FinalsView.tsx` — Current separate finals view (being absorbed into Races list)
- `src/components/finals/FinalsMatchupCard.tsx` — Finals matchup card pattern
- `src/hooks/useFinalsState.ts` — Finals state hook

### Round Structure
- `src/components/races/RoundHeader.tsx` — Round section header component
- `src/hooks/useCurrentRace.ts` — Auto-advance logic (adapt for auto-expand)
- `src/hooks/useR2State.ts` — Round 2 state and races
- `src/hooks/useDisciplineState.ts` — Phase and structure state

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OutcomeButton` — has disabled/selected state support, can be adapted to Win/DSQ only
- `RaceCard` — has outcome badge rendering, needs expansion to support left/right layout and expandable state
- `RoundHeader` — round section dividers with active/inactive indicators
- `getComplement`/`getDisabledOutcomes` in scoringHelpers — complement logic maps directly to Win/DSQ auto-resolution

### Established Patterns
- Zustand store with `recordResult` and `clearResult` actions for score persistence
- `useCurrentRace` hook tracks next unscored race index — adapt for auto-expand
- Left/right layout is new but consistent with the spreadsheet format officials know
- Phase-based rendering (group-stage, round-two, finals) already in RaceListView

### Integration Points
- `SubTabs` component: remove 'score' and 'finals' from the tab array
- `AppShell`: remove ScoringFocusView and FinalsView tab routing, consolidate into RaceListView
- `useFinalsState` hook: finals data needs to render as expandable cards in the race list
- `FinalsMatchupCard` pattern: adapt to match the new expandable card pattern

</code_context>

<specifics>
## Specific Ideas

- Left/right team layout mirrors the xlsx spreadsheet race order format — officials will immediately recognize the layout
- One-tap scoring: every button press resolves the entire matchup, no two-step process
- The entire event lifecycle (R1 → R2 → Finals) is scoreable from one scrollable view

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-scoring-ui-interaction-fixes*
*Context gathered: 2026-03-30*
