# Phase 6: Scoring UI & Interaction Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 06-scoring-ui-interaction-fixes
**Areas discussed:** Merged tab layout, Scoring flow, Edit/re-score UX, Scored card appearance, Round transitions, Finals scoring

---

## Merged Tab Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Inline scoring on cards | Each RaceCard gets outcome buttons directly on it. Single scrollable list. | |
| Focused scorer at top + list below | Keep ScoringFocusView style at top, race list scrollable below. | |
| Expandable cards | Tapping an unscored card expands it to reveal outcome buttons inline. Only one card expanded at a time. | ✓ |

**User's choice:** Expandable cards with left/right team layout mirroring the xlsx spreadsheet format (home team left, away team right).
**Notes:** User specifically requested the left/right layout to match the xlsx race order document that officials already know. This was a user-initiated refinement, not a presented option.

---

## Scoring Buttons

| Option | Description | Selected |
|--------|-------------|----------|
| Win / Loss / DSQ per team | Three buttons per team (current design from Phase 2 D-01) | |
| Win / DSQ per team | Two buttons per team — Win auto-assigns Loss to opponent, DSQ auto-assigns Win to opponent | ✓ |

**User's choice:** Win / DSQ only — every tap resolves the full matchup instantly.
**Notes:** User-initiated simplification. Eliminates the SCORE-01/SCORE-02 bugs by design since there's no intermediate state. Loss is never explicitly selected — it's always the auto-complement of the opponent's Win.

---

## Scoring Flow — Auto-expand

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-expand next unscored | Next unscored race is already expanded when arriving or after scoring | ✓ |
| All collapsed by default | User always taps to expand | |

**User's choice:** Auto-expand next unscored (recommended)
**Notes:** Preserves the auto-advance feel from Phase 2 D-02.

---

## Scoring Flow — Auto-scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-scroll + auto-expand | Just-scored card collapses, next unscored expands, list scrolls to it | ✓ |
| Auto-expand but no scroll | Next unscored expands but user scrolls themselves | |
| You decide | Claude picks | |

**User's choice:** Auto-scroll + auto-expand
**Notes:** None.

---

## Edit/Re-score UX

| Option | Description | Selected |
|--------|-------------|----------|
| Tap card to re-expand | Tapping scored card expands it with current result pre-highlighted | ✓ |
| Explicit Edit button | Keep Edit button, tapping it expands for re-scoring | |
| You decide | Claude picks | |

**User's choice:** Tap card to re-expand (recommended)
**Notes:** Consistent with the expand-to-score pattern. No separate Edit button needed.

---

## Scored Card Appearance

| Option | Description | Selected |
|--------|-------------|----------|
| Outcome badges like today | Green W, amber L, red DSQ badges next to team names | ✓ |
| Winner highlighted, loser dimmed | Bold/green winner, dimmed loser, no badges | |
| You decide | Claude picks | |

**User's choice:** Outcome badges like today (recommended)
**Notes:** None.

---

## Round Transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current headers + greyed future | RoundHeader dividers, future rounds visible but greyed (D-08) | |
| Collapsible round sections | Each round is a collapsible accordion | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide
**Notes:** Claude's discretion — existing RoundHeader pattern and D-08 should guide.

---

## Finals Scoring

| Option | Description | Selected |
|--------|-------------|----------|
| Same pattern in the list | Finals as expandable cards under Finals header in Races list | ✓ |
| Keep separate Finals tab | Finals stay in their own tab | |
| You decide | Claude picks | |

**User's choice:** Same pattern in the list (recommended)
**Notes:** Removes the separate Finals tab entirely. One unified scoring surface for the whole event.

---

## Claude's Discretion

- Round section header styling and active/inactive treatment
- Scroll behavior implementation details
- Card expand/collapse animation
- SubTabs cleanup (removing Score and Finals)
- Whether FinalsView is fully removed or refactored

## Deferred Ideas

None — discussion stayed within phase scope.
