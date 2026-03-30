---
phase: 06-scoring-ui-interaction-fixes
verified: 2026-03-30T13:30:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification: false
human_verification:
  - test: "Tab count: open the app, verify only 3 tabs appear — Teams, Races, Stds (no Score, no Finals)"
    expected: "Exactly 3 tabs visible in the sub-tab bar"
    why_human: "DOM rendering cannot be verified programmatically without a headless browser"
  - test: "Auto-expand: after entering 4+ teams and switching to Races tab, verify the first unscored card is automatically expanded with Win/DSQ buttons visible"
    expected: "First unscored race card is expanded on mount, showing Win/DSQ buttons for both teams"
    why_human: "useEffect on mount behaviour and scroll position require visual inspection"
  - test: "One-tap scoring: tap Win for home team on an unscored card and verify the card collapses immediately with W/L badges and the next card auto-expands and scrolls into view"
    expected: "Single tap resolves matchup (no intermediate state), next card expands, view scrolls"
    why_human: "Animation, scroll, and timing behaviour requires visual inspection"
  - test: "Re-scoring: tap a scored (collapsed) card to re-expand it and verify current result is pre-highlighted; tap a different outcome and verify score updates without flash"
    expected: "Current Win/DSQ buttons show as selected (highlighted); tapping alternate resolves cleanly"
    why_human: "Visual highlight state and absence of flicker requires visual inspection"
  - test: "DSQ-then-Win impossible: on an unscored card, tap DSQ for home team — verify home is DSQ and away is W; there must be no way to then also mark home as Win in the same step"
    expected: "One-tap resolution means the matchup is fully resolved immediately; no second-step Win button for the DSQ'd team is reachable in the same action"
    why_human: "Interaction constraint (absence of intermediate state) must be confirmed manually"
  - test: "Standings reflect Races-tab scores: score a race from the Races tab, open the Standings overlay, verify the result is reflected"
    expected: "Standings update with points matching the recorded result"
    why_human: "Cross-component data flow correctness confirmed visually"
---

# Phase 6: Scoring UI Interaction Fixes — Verification Report

**Phase Goal:** Race officials can view races and score them in a single unified tab with correct, mutually exclusive outcome selection
**Verified:** 2026-03-30
**Status:** human_needed — all automated checks pass; visual/interaction behaviour requires human confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ExpandableRaceCard renders collapsed state with left/right team layout, outcome badges, and race info | VERIFIED | Lines 120-132 of ExpandableRaceCard.tsx: conditional `!isExpanded` block renders home/vs/away layout with OutcomeBadge components when score exists |
| 2 | ExpandableRaceCard renders expanded state with Win/DSQ buttons per team in left/right columns | VERIFIED | Lines 135-178: `isExpanded` block renders two columns each with exactly two OutcomeButton renders (`outcome="win"` and `outcome="dsq"`) — no loss button |
| 3 | Every button tap resolves the full matchup in a single action (no intermediate state) | VERIFIED | `handleScore` function (lines 62-82) resolves both homeOutcome and awayOutcome synchronously and calls `onScore` immediately; no local state for outcomes |
| 4 | Scored cards can be re-expanded with pre-highlighted buttons, no clearResult called | VERIFIED | `selected` prop derives from `score` prop (lines 148, 152, 166, 170); `clearResult` absent from file; grep confirmed no matches |
| 5 | SubTabs shows only 3 tabs: Teams, Races, Stds | VERIFIED | SubTabs.tsx line 3: `export type SubTabKey = 'teams' \| 'races' \| 'standings'`; SUB_TABS array line 5 has exactly 3 items; LABELS line 6-10 has 3 entries |
| 6 | AppShell no longer routes to ScoringFocusView or FinalsView | VERIFIED | AppShell.tsx has no import or reference to ScoringFocusView or FinalsView; grep confirmed zero matches |
| 7 | User sees all races (R1, R2, Finals) in a single scrollable list under the Races tab | VERIFIED | RaceListView.tsx (299 lines) renders Round 1 (line 138), Round 2 (line 174), and Finals (line 211) sections; AppShell routes `activeSubTab === 'races'` to RaceListView |
| 8 | DSQ-then-Win bug is impossible by construction | VERIFIED | ExpandableRaceCard.tsx `handleScore` resolves both sides atomically with no local outcome state; each OutcomeButton tap calls `onScore` with a fully-resolved pair |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/races/ExpandableRaceCard.tsx` | Expandable card with collapsed display and expanded Win/DSQ scoring | VERIFIED | 181 lines; exports `ExpandableRaceCard`; substantive implementation |
| `src/components/layout/SubTabs.tsx` | 3-tab navigation (teams, races, standings) | VERIFIED | SubTabKey type is `'teams' \| 'races' \| 'standings'`; 3-item SUB_TABS array |
| `src/components/layout/AppShell.tsx` | Main layout with Score/Finals tab routing removed | VERIFIED | No ScoringFocusView or FinalsView imports; routes only teams/races/standings |
| `src/components/races/RaceListView.tsx` | Unified scoring surface with expandable cards | VERIFIED | 299 lines (well above 100-line minimum); full rewrite confirmed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| ExpandableRaceCard.tsx | OutcomeButton.tsx | Renders OutcomeButton for win and dsq only | VERIFIED | Lines 146-154 (home) and 164-172 (away): exactly `outcome="win"` and `outcome="dsq"` per column; no `outcome="loss"` |
| SubTabs.tsx | AppShell.tsx | SubTabKey type constrains tab state | VERIFIED | AppShell.tsx line 5 imports `SubTabKey` from SubTabs; line 21 `useState<SubTabKey>('teams')` — type is 3-value union |
| RaceListView.tsx | ExpandableRaceCard.tsx | Renders ExpandableRaceCard for every race | VERIFIED | Lines 152, 186, 266: three distinct ExpandableRaceCard render sites (R1, R2, Finals) |
| RaceListView.tsx | eventStore.ts | Calls recordResult to persist scores | VERIFIED | Line 49 selects `recordResult` from store; line 98 calls `recordResult(discipline, result)` in handleScore |
| RaceListView.tsx | useFinalsState.ts | Renders finals matchups and gate components | VERIFIED | Line 6 imports useFinalsState; line 47 calls it; lines 217-288 consume finalsState |
| RaceListView.tsx | FinalsBlockedBanner.tsx | Renders blocked banner in finals section | VERIFIED | Lines 217-219: `finalsPhase === 'blocked-incomplete'` renders `<FinalsBlockedBanner reason="incomplete" />`; lines 221-243: `blocked-ties` renders banner + TiebreakResolver |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| RaceListView.tsx | `scores` (→ scoreMap) | `useDisciplineState(discipline)` → Zustand store `disciplines[discipline].scores` | Yes — store is populated by `recordResult` which filter+pushes to `scores` array | FLOWING |
| RaceListView.tsx | `structure` | `useDisciplineState(discipline)` → derived from teams in store | Yes — computed from team count | FLOWING |
| RaceListView.tsx | `r2State.r2Races` | `useR2State(discipline)` | Yes — seeded from R1 scores | FLOWING |
| RaceListView.tsx | `finalsState.finalsWithNames` | `useFinalsState(discipline)` | Yes — resolved from standings | FLOWING |
| ExpandableRaceCard.tsx | `score` prop | Passed from RaceListView via `scoreMap.get(raceId)` | Yes — scoreMap built from live store | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles clean | `npx tsc --noEmit` | Zero errors (no output) | PASS |
| ExpandableRaceCard exports function | `grep "^export function ExpandableRaceCard"` | Match on line 45 | PASS |
| SubTabKey is 3-value union (no score/finals) | `grep "SubTabKey"` in SubTabs.tsx | `'teams' \| 'races' \| 'standings'` | PASS |
| AppShell has no legacy routing | grep for ScoringFocusView/FinalsView in AppShell.tsx | Zero matches | PASS |
| RaceListView > 100 lines (not a stub) | `wc -l` | 299 lines | PASS |
| No `clearResult` in new components | grep ExpandableRaceCard.tsx + RaceListView.tsx | Zero matches | PASS |
| No `outcome="loss"` in ExpandableRaceCard | grep ExpandableRaceCard.tsx | Zero matches | PASS |
| Commits documented in SUMMARY exist | `git log --oneline` | deff940, 4262704, 0a9155e confirmed | PASS |

Step 7b runtime checks: SKIPPED — requires running dev server (visual PWA app, no CLI entry points).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NAV-01 | 06-01-PLAN.md, 06-02-PLAN.md | Merge Races and Score tabs into a single "Races" tab with inline scoring | SATISFIED | SubTabs reduced to 3 tabs; RaceListView is unified scoring surface; AppShell routes races→RaceListView only |
| SCORE-01 | 06-01-PLAN.md, 06-02-PLAN.md | After selecting DSQ, Win button must be disabled for same team | SATISFIED | One-tap resolution eliminates intermediate state; no Win+DSQ combination possible for same team in single atomic call |
| SCORE-02 | 06-01-PLAN.md, 06-02-PLAN.md | Outcome selection must be mutually exclusive per team | SATISFIED | `handleScore` computes both outcomes atomically; no local outcome state; overwrite semantics in recordResult (filter+push) |

No orphaned requirements: REQUIREMENTS.md maps NAV-01, SCORE-01, SCORE-02 to Phase 6 and marks all three Complete. No Phase 6 requirements appear in REQUIREMENTS.md that are absent from the plan frontmatter.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | — |

No anti-patterns found in new/modified Phase 6 files:
- No TODO/FIXME/placeholder comments in ExpandableRaceCard.tsx, SubTabs.tsx, AppShell.tsx, RaceListView.tsx
- No `return null` / empty array stubs
- No hardcoded empty data passed to rendering paths
- Legacy files (ScoringFocusView.tsx, FinalsMatchupCard.tsx) retain `clearResult` and `outcome="loss"` but these files are now unreachable from AppShell routing — not a blocker for phase goal

---

### Human Verification Required

#### 1. Tab Count

**Test:** Run `npm run dev`, open app, count sub-tabs.
**Expected:** Exactly 3 tabs — Teams, Races, Stds. No Score or Finals tab.
**Why human:** Tab rendering requires a browser; cannot be confirmed without DOM evaluation.

#### 2. Auto-Expand on Mount

**Test:** Enter 4+ teams on Teams tab, switch to Races tab.
**Expected:** First unscored race card is automatically expanded showing Win/DSQ buttons for both teams.
**Why human:** useEffect-on-mount behaviour and resulting DOM state requires visual inspection.

#### 3. One-Tap Scoring and Auto-Advance

**Test:** Tap "Win" for the home team on an expanded card.
**Expected:** Card immediately collapses showing W/L badges; next unscored card auto-expands; view scrolls to it.
**Why human:** Timing, animation, and scroll behaviour require visual inspection.

#### 4. Re-Scoring Pre-Highlight

**Test:** Tap a scored (collapsed) card to re-expand it.
**Expected:** The button matching the current result is highlighted (selected state). Tapping a different button updates the result without visual flicker.
**Why human:** Visual highlight state and absence of flicker requires visual inspection.

#### 5. DSQ-Then-Win Elimination

**Test:** On an unscored card, tap DSQ for the home team.
**Expected:** Matchup resolves in one action — home is DSQ, away is W. There is no opportunity to also tap Win for home in the same action.
**Why human:** Confirming the absence of a second-step opportunity requires exercising the interaction.

#### 6. Standings Reflect Races-Tab Scores

**Test:** Score a race from the Races tab; open the Standings overlay.
**Expected:** Standings show points consistent with the recorded result.
**Why human:** Cross-component reactive update correctness best confirmed by manual inspection.

---

### Gaps Summary

No gaps found. All 8 must-have truths are verified by code inspection. All artifacts exist, are substantive, are wired, and carry real data. TypeScript compiles without errors. Requirements NAV-01, SCORE-01, and SCORE-02 are all satisfied.

The only remaining items are human-verifiable behaviours (visual appearance, timing, scroll, interactive feedback) that cannot be confirmed programmatically without a headless browser.

---

_Verified: 2026-03-30_
_Verifier: Claude (gsd-verifier)_
