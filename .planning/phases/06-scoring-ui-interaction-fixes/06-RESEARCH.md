# Phase 6: Scoring UI & Interaction Fixes - Research

**Researched:** 2026-03-30
**Domain:** React UI refactoring -- merging tabs, expandable card pattern, one-tap scoring
**Confidence:** HIGH

## Summary

Phase 6 is a pure UI refactoring phase with no new dependencies, no external tools, and no data model changes. The work consolidates three separate views (RaceListView, ScoringFocusView, FinalsView) into a single unified Races tab with expandable inline scoring cards. The scoring interaction simplifies from a 3-button model (Win/Loss/DSQ) to a 2-button model (Win/DSQ) where every tap resolves the full matchup instantly, eliminating the SCORE-01 and SCORE-02 bugs by construction.

The existing codebase provides all the building blocks: `OutcomeButton` for styled buttons, `RaceCard` for outcome badges, `RoundHeader` for section dividers, `useCurrentRace` for auto-advance logic, `useFinalsState` for finals data, and `recordResult`/`clearResult` store actions. The `getComplement` helper already maps Win->Loss and handles DSQ. No new libraries, stores, or domain logic is needed.

**Primary recommendation:** Build one new `ExpandableRaceCard` component that handles collapsed display (with outcome badges) and expanded scoring (Win/DSQ buttons in left/right layout), then refactor `RaceListView` to manage expand/collapse state and render all rounds (R1, R2, Finals) as a single scrollable list.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Remove separate "Score" and "Finals" tabs. Single "Races" tab shows all races (R1, R2, Finals) in one scrollable list with expandable inline scoring.
- **D-02:** Left/right layout mirroring the spreadsheet -- home team left, away team right, "vs" between them.
- **D-03:** Cards are expandable -- tap unscored card to expand, only one card expanded at a time. Scored cards show outcome badges collapsed.
- **D-04:** Two buttons per team: Win and DSQ only. Win records Win+Loss. DSQ records DSQ+Win. Every tap resolves full matchup.
- **D-05:** Eliminates SCORE-01/SCORE-02 by construction -- no intermediate state possible.
- **D-06:** Auto-expand next unscored race on tab open and after each score.
- **D-07:** Auto-scroll to newly expanded card after scoring.
- **D-08:** Tap scored card to re-expand with current result pre-highlighted. Tap different button to change. Tap elsewhere to collapse.
- **D-09:** Collapsed scored cards show green W, amber L, red DSQ badges.
- **D-11:** Finals matchups appear as expandable cards under "Finals" round header, same Win/DSQ pattern.

### Claude's Discretion
- Round section header styling and active/inactive treatment (D-10)
- Scroll behavior implementation details (smooth scroll, scroll margin)
- Card expand/collapse animation (if any)
- How SubTabs component changes (removing Score and Finals tabs)
- Whether FinalsView is fully removed or refactored into the list

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | Merge Races and Score tabs into a single "Races" tab with inline scoring | SubTabs removes 'score' and 'finals', AppShell removes ScoringFocusView/FinalsView routing, RaceListView becomes the scoring surface |
| SCORE-01 | After selecting DSQ for a team, Win must be disabled for that team | Eliminated by construction: Win/DSQ-only model with single-tap resolution means no intermediate state where DSQ+Win could coexist |
| SCORE-02 | Outcome selection must be mutually exclusive per team | Eliminated by construction: every button tap resolves the full matchup immediately, no two-step outcome selection |
</phase_requirements>

## Standard Stack

No new packages required. This phase uses only existing project dependencies.

### Core (already installed)
| Library | Version | Purpose | Role in Phase |
|---------|---------|---------|---------------|
| React | 19.1.x | UI framework | Component state for expand/collapse, refs for scroll-to |
| Zustand | 5.0.x | State management | `recordResult`/`clearResult` actions unchanged |
| clsx | 2.x | Conditional classes | Outcome badge styling, card active/inactive states |
| Tailwind CSS | 4.2.x | Styling | Left/right layout, responsive spacing, touch targets |

No `npm install` needed.

## Architecture Patterns

### Recommended Component Structure

```
src/components/races/
  RaceListView.tsx         (MODIFY - becomes the unified scoring surface)
  ExpandableRaceCard.tsx   (NEW - replaces RaceCard for all matchup types)
  RaceCard.tsx             (KEEP temporarily or remove - replaced by ExpandableRaceCard)
  RoundHeader.tsx          (KEEP - unchanged)

src/components/scoring/
  OutcomeButton.tsx        (MODIFY - Win/DSQ only, remove Loss)
  ScoringFocusView.tsx     (REMOVE - absorbed into RaceListView)

src/components/finals/
  FinalsView.tsx           (REMOVE - absorbed into RaceListView)
  FinalsMatchupCard.tsx    (REMOVE - replaced by ExpandableRaceCard)
  FinalsBlockedBanner.tsx  (KEEP - render inline in RaceListView finals section)
  FinalsReadyBanner.tsx    (KEEP - render inline in RaceListView finals section)

src/components/layout/
  SubTabs.tsx              (MODIFY - remove 'score' and 'finals')
  AppShell.tsx             (MODIFY - remove ScoringFocusView/FinalsView routing)
```

### Pattern 1: Single Expanded Card State

**What:** Parent component (RaceListView) owns a single `expandedRaceId: string | null` state. Only one card can be expanded at a time. Expanding a new card implicitly collapses the previous one.

**When to use:** Accordion-style UI where mutual exclusion is required.

**Example:**
```typescript
const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);

// Auto-expand first unscored on mount and after scoring
useEffect(() => {
  const firstUnscored = findFirstUnscoredRaceId(allRaceIds, scoreMap);
  setExpandedRaceId(firstUnscored);
}, [scores]); // Re-run when scores change

function handleScore(raceId: string, homeOutcome: RaceOutcome, awayOutcome: RaceOutcome) {
  recordResult(discipline, { raceId, homeSlot, awaySlot, homeOutcome, awayOutcome });
  // expandedRaceId will update via the useEffect above when scores change
}

function handleExpand(raceId: string) {
  setExpandedRaceId(raceId === expandedRaceId ? null : raceId);
}
```

### Pattern 2: One-Tap Matchup Resolution (Win/DSQ Only)

**What:** Every button tap resolves the complete matchup. No intermediate state. Win sets Win+Loss. DSQ sets DSQ+Win. No Loss button exists.

**Why:** Eliminates SCORE-01 and SCORE-02 bugs by construction. The old 3-button model allowed a user to select DSQ for one team, then Win for the same team (bug), or select two outcomes for one team without clearing (bug). With one-tap resolution, neither scenario is possible.

**Example:**
```typescript
function handleScore(team: 'home' | 'away', outcome: 'win' | 'dsq') {
  let homeOutcome: RaceOutcome;
  let awayOutcome: RaceOutcome;

  if (team === 'home') {
    homeOutcome = outcome;
    awayOutcome = outcome === 'win' ? 'loss' : 'win'; // DSQ opponent gets Win
  } else {
    awayOutcome = outcome;
    homeOutcome = outcome === 'win' ? 'loss' : 'win';
  }

  recordResult(discipline, { raceId, homeSlot, awaySlot, homeOutcome, awayOutcome });
}
```

### Pattern 3: Auto-Scroll with Refs

**What:** After scoring, auto-expand the next unscored card and scroll it into view.

**Example:**
```typescript
const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

function scrollToCard(raceId: string) {
  const el = cardRefs.current.get(raceId);
  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// In ExpandableRaceCard:
<div ref={(el) => { if (el) cardRefs.current.set(raceId, el); }}
     style={{ scrollMarginTop: '92px' }}  // Clear DisciplineTabs (48px) + SubTabs (44px)
>
```

### Pattern 4: Re-scoring Scored Cards (D-08)

**What:** Tapping a scored collapsed card re-expands it with pre-highlighted buttons. The score is NOT cleared until a different outcome is selected.

**Key insight:** Unlike the old ScoringFocusView which called `clearResult` on edit start, the new pattern keeps the existing score visible as pre-highlighted buttons. Only when the user taps a different button is `recordResult` called to overwrite. Tapping outside collapses without changes.

**Example:**
```typescript
// In ExpandableRaceCard when re-expanding a scored card:
const existingScore = scoreMap.get(raceId);
// Show buttons with existing outcome highlighted
// Win button for home team shows "selected" if existingScore.homeOutcome === 'win'
// DSQ button for home team shows "selected" if existingScore.homeOutcome === 'dsq'

function handleRescore(team: 'home' | 'away', outcome: 'win' | 'dsq') {
  // Only call recordResult - it overwrites via filter + push in the store
  // No need to clearResult first
  handleScore(team, outcome);
}
```

### Anti-Patterns to Avoid

- **Two-step scoring with intermediate state:** The old model let users set one team's outcome then the other's, creating windows for invalid combinations. The new model resolves both sides in a single call.
- **Separate state for editing vs. scoring:** The old ScoringFocusView had separate `editingRaceId`, `homeOutcome`, `awayOutcome` local state. The new pattern needs only `expandedRaceId` at the parent level. Each card resolves scores atomically.
- **Clearing score on re-expand:** Don't call `clearResult` when re-expanding a scored card (D-08). The user might tap outside to cancel. Only overwrite when a different outcome is actively selected.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll position after expand | Custom scroll manager | `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` + `scroll-margin-top` | Browser native, handles edge cases (element already visible, keyboard focus) |
| Accordion state | Custom state machine | Single `expandedRaceId` useState | One piece of state controls the whole accordion |
| Outcome complement logic | New function | Existing `getComplement` from scoringHelpers.ts | Already maps Win->Loss. For DSQ, hardcode DSQ->Win since it's the only other case |

## Common Pitfalls

### Pitfall 1: Score Flash on Re-expand
**What goes wrong:** Clearing the score when re-expanding a scored card causes the standings to briefly recalculate without that score, creating a visual flash.
**Why it happens:** The old pattern (ScoringFocusView.startEdit) calls `clearResult` immediately.
**How to avoid:** Per D-08, keep the score in the store when re-expanding. Only call `recordResult` (which overwrites) when a new outcome is tapped. Never call `clearResult` for re-scoring.
**Warning signs:** Standings flicker when tapping a scored card.

### Pitfall 2: Auto-expand Fires Before Score Is Persisted
**What goes wrong:** The useEffect that auto-expands the next unscored card runs before Zustand has persisted the new score, so it re-expands the same card.
**Why it happens:** React batching and Zustand's synchronous updates can race with effect timing.
**How to avoid:** Compute the next unscored race ID inside the score handler (before the effect runs) and set it directly, rather than relying solely on a derived effect.
**Warning signs:** After scoring, the same card stays expanded instead of advancing.

### Pitfall 3: Finals Tiebreak/Blocked State Not Rendered
**What goes wrong:** Absorbing FinalsView into RaceListView but forgetting to include the FinalsBlockedBanner, FinalsReadyBanner, and TiebreakResolver components that gate the transition to finals.
**Why it happens:** RaceListView currently has no finals scoring logic -- it only showed a placeholder.
**How to avoid:** The finals section in RaceListView must check `finalsState.finalsPhase` and render blocked/ready/tiebreak UI before showing expandable finals cards.
**Warning signs:** Finals cards appear immediately without waiting for group stage completion.

### Pitfall 4: SubTabKey Type Mismatch After Removing Tabs
**What goes wrong:** TypeScript errors because SubTabKey still includes 'score' | 'finals' but those are removed from the array.
**Why it happens:** The type and the array must be updated together.
**How to avoid:** Update `SubTabKey` type to `'teams' | 'races' | 'standings'` and update all downstream references (AppShell state, tab panel rendering).
**Warning signs:** TypeScript compilation errors about exhaustive checks or invalid tab keys.

### Pitfall 5: Scroll Margin Not Accounting for Both Tab Bars
**What goes wrong:** Auto-scrolled card is partially hidden behind the sticky DisciplineTabs + SubTabs headers.
**Why it happens:** Only accounting for one header bar instead of both.
**How to avoid:** Use `scroll-margin-top: 92px` (DisciplineTabs ~48px at top-12/h-12 + SubTabs ~44px at h-11). Verify in UI spec: the SubTabs is sticky at `top-12`.
**Warning signs:** Top of expanded card is clipped under the sticky headers.

## Code Examples

### ExpandableRaceCard Collapsed State
```typescript
// Source: UI-SPEC.md card layout contract + existing RaceCard.tsx OUTCOME_BADGE
<div className={clsx(
  'bg-white border border-slate-200 rounded-lg p-4 mb-2',
  disabled && 'opacity-40 pointer-events-none'
)}
  style={{ scrollMarginTop: '92px' }}
  aria-expanded={isExpanded}
  aria-label={`Race ${raceNum}: ${homeTeamName} versus ${awayTeamName}`}
  onClick={() => !disabled && onExpand(raceId)}
>
  {/* Header: race number + group label */}
  <div className="text-sm text-slate-500 mb-1 flex items-center gap-2">
    <span>Race {raceNum}</span>
    {groupLabel && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{groupLabel}</span>}
  </div>
  {/* Left/right team layout */}
  <div className="flex items-center gap-2">
    <span className="flex-1 text-base font-semibold text-slate-900">
      {homeTeamName} {score && <OutcomeBadge outcome={score.homeOutcome} />}
    </span>
    <span className="text-slate-500">vs</span>
    <span className="flex-1 text-base font-semibold text-slate-900 text-right">
      {score && <OutcomeBadge outcome={score.awayOutcome} />} {awayTeamName}
    </span>
  </div>
</div>
```

### ExpandableRaceCard Expanded State (Win/DSQ Buttons)
```typescript
// Source: UI-SPEC.md expanded card layout + D-04 button model
{isExpanded && (
  <div className="flex gap-4 mt-3" onClick={(e) => e.stopPropagation()}>
    {/* Home team column */}
    <div className="flex-1">
      <p className="text-base font-semibold text-slate-900 mb-2">{homeTeamName}</p>
      <div className="flex gap-2">
        <OutcomeButton outcome="win" selected={preSelected?.homeOutcome === 'win'}
          onSelect={() => handleScore('home', 'win')} />
        <OutcomeButton outcome="dsq" selected={preSelected?.homeOutcome === 'dsq'}
          onSelect={() => handleScore('home', 'dsq')} />
      </div>
    </div>
    {/* Away team column */}
    <div className="flex-1">
      <p className="text-base font-semibold text-slate-900 mb-2">{awayTeamName}</p>
      <div className="flex gap-2">
        <OutcomeButton outcome="win" selected={preSelected?.awayOutcome === 'win'}
          onSelect={() => handleScore('away', 'win')} />
        <OutcomeButton outcome="dsq" selected={preSelected?.awayOutcome === 'dsq'}
          onSelect={() => handleScore('away', 'dsq')} />
      </div>
    </div>
  </div>
)}
```

### One-Tap Score Resolution
```typescript
// Source: D-04, D-05 decision + getComplement from scoringHelpers.ts
function handleScore(team: 'home' | 'away', outcome: 'win' | 'dsq') {
  const homeOutcome: RaceOutcome = team === 'home' ? outcome : (outcome === 'win' ? 'loss' : 'win');
  const awayOutcome: RaceOutcome = team === 'away' ? outcome : (outcome === 'win' ? 'loss' : 'win');
  onScore({ raceId, homeSlot, awaySlot, homeOutcome, awayOutcome });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3 buttons (Win/Loss/DSQ) per team | 2 buttons (Win/DSQ) per team | Phase 6 | Eliminates SCORE-01, SCORE-02 bugs by construction |
| Separate Score tab (focused view) | Inline expandable cards in Races tab | Phase 6 | Single surface for viewing + scoring |
| Separate Finals tab | Finals section in Races list | Phase 6 | Unified event lifecycle view |
| 5 sub-tabs (Teams/Races/Score/Finals/Stds) | 3 sub-tabs (Teams/Races/Stds) | Phase 6 | Simpler navigation |

## Project Constraints (from CLAUDE.md)

- **Stack:** React 19.1.x, TypeScript 6.0, Vite 8.0.x, Tailwind CSS 4.2.x, Zustand 5.0.x
- **No new dependencies** for this phase
- **localStorage only** via Zustand persist -- no backend
- **Mobile-first:** Min 44x44px touch targets, h-14 (56px) for scoring buttons
- **PWA:** Offline-capable (no changes needed for this phase)
- **Store pattern:** Domain stores with `recordResult`/`clearResult` actions
- **Testing:** Vitest 4.1.x with @testing-library/react 16.x (nyquist_validation disabled for this project)

## Open Questions

1. **OutcomeButton reuse or replace?**
   - What we know: OutcomeButton currently supports win/loss/dsq with disabled/selected states. Phase 6 removes the Loss button.
   - What's unclear: Whether to modify OutcomeButton to conditionally hide Loss, or let callers simply not render it for 'loss'.
   - Recommendation: Callers render only Win and DSQ OutcomeButtons. No changes needed to OutcomeButton itself -- just don't render the Loss variant. Keep the component generic in case Loss is needed elsewhere (e.g., future features). The `disabled` prop handling can be simplified since the 2-button model makes disabling unnecessary.

2. **FinalsView lifecycle components (banners, tiebreaker)**
   - What we know: FinalsView renders FinalsBlockedBanner, FinalsReadyBanner, TiebreakResolver based on finalsPhase.
   - What's unclear: Exact placement within the unified RaceListView scroll.
   - Recommendation: Render these components between the "Finals" RoundHeader and the finals ExpandableRaceCards. They gate visibility of the finals cards just as they did in FinalsView.

3. **Click-outside to collapse expanded card**
   - What we know: D-08 says "tap elsewhere to collapse without changes."
   - What's unclear: Whether "elsewhere" means outside the card or outside any interactive element.
   - Recommendation: Clicking any non-expanded card (or empty space) triggers collapse. Simplest: `onExpand(raceId)` toggles expansion, and clicking a different card naturally collapses the current one. A click handler on the parent container can collapse when clicking non-card areas.

## Sources

### Primary (HIGH confidence)
- Codebase audit of all canonical reference files listed in CONTEXT.md
- `06-UI-SPEC.md` -- approved visual/interaction contract
- `06-CONTEXT.md` -- locked decisions D-01 through D-11

### Secondary (MEDIUM confidence)
- React `scrollIntoView` API -- standard DOM API, well-supported across all browsers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages, all existing code audited
- Architecture: HIGH - clear refactoring path from existing components, UI spec provides exact layout contracts
- Pitfalls: HIGH - identified from direct code analysis of current scoring bugs and interaction patterns

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- no external dependency changes)
