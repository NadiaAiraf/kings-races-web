# Phase 2: Core Event Flow - Research

**Researched:** 2026-03-28
**Domain:** React UI components, mobile-first touch interactions, Zustand store integration, Tailwind CSS 4 setup
**Confidence:** HIGH

## Summary

Phase 2 builds the complete group stage UI on top of Phase 1's domain logic and Zustand store. The existing codebase provides all data functions (`getCheatSheet`, `calculateGroupStandings`, `calculateAllGroupStandings`, `hasTies`) and store actions (`setTeams`, `recordResult`, `clearResult`, `setActiveDiscipline`). The UI layer needs to: (1) configure Tailwind CSS 4 (installed but not yet wired into Vite or CSS), (2) build ~18 custom components following the UI-SPEC's exact design contract, (3) implement auto-complement scoring logic and auto-advance behavior, and (4) derive race lists and standings reactively from store state using existing domain functions.

The current `App.tsx` and `index.css` are Vite scaffold boilerplate and must be replaced entirely. React Router is installed but unnecessary for Phase 2 -- all navigation is in-page tab state managed by Zustand or local component state. The `clsx` utility is already in devDependencies for conditional class composition.

**Primary recommendation:** Structure the phase as: (Wave 0) Tailwind CSS 4 setup + app shell with tab navigation, (Wave 1) Team Entry + Race List views, (Wave 2) Scoring Focus view with auto-complement/auto-advance, (Wave 3) Standings view with results grid. Each wave delivers a testable vertical slice.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Three buttons per team (Win / Loss / DSQ) -- explicit, no ambiguity. One winner, one loser or DSQ per race. Both teams cannot DSQ in the same race.
- D-02: After recording a result, auto-advance to the next unscored race immediately. No delay, no confirmation step.
- D-03: Touch targets must be at least 56px for gloved use. High contrast for outdoor readability.
- D-04: Top tabs for discipline switching (Mixed, Board, Ladies) -- always visible, one tap to switch.
- D-05: Free navigation -- all sections always accessible. No linear wizard flow.
- D-06: Four sections within each discipline: Team Entry, Race List, Scoring Focus, Standings -- accessed via sub-tabs below the discipline tabs.
- D-07: Team entry uses an "Add one at a time" pattern -- single input with Add Team button, builds the list incrementally.
- D-08: All rounds visible from the start for 8+ team events (Round 1, Round 2, Finals placeholder). Round 2 races greyed out until Round 1 completes, but visible so officials can see the full schedule.
- D-09: Full-screen toggle -- tap a button to flip to standings view, tap back to return to scoring position.
- D-10: Standings show: rank, team name, total points, race-by-race results grid (like the spreadsheet boxes), and tie indicators when teams are tied on points.

### Claude's Discretion
- Colour scheme, visual design, Tailwind theme setup
- Component library decisions (headless UI, custom components, etc.)
- Exact layout of scoring buttons, race cards, standings table
- Progress bar implementation and placement
- Undo/correct result UI pattern (button placement, confirmation)
- How sub-tabs are styled and whether they scroll

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-01 | Official can enter team names for each discipline independently | TeamEntryView + TeamInput components, store.setTeams action, discipline-scoped state |
| TEAM-03 | Official can switch between disciplines via tabs | DisciplineTabs component, store.setActiveDiscipline action |
| RACE-03 | Race list displays all matchups in correct order with team names | RaceListView + RaceCard components, getCheatSheet() for structure, team name resolution from store |
| RACE-04 | Current race focus mode with large action buttons and auto-advance | ScoringFocusView + OutcomeButton components, auto-complement logic, 300ms auto-advance |
| RACE-05 | Progress indicator shows position in event | ProgressBar component with role="progressbar" |
| RESL-01 | Record result: Win (3pts) / Loss (1pt) / DSQ (0pts) for each team | OutcomeButton + store.recordResult, Score type from domain/types |
| RESL-02 | Result entry max 2 taps, touch targets 56px+ | Auto-complement reduces to 1 tap typical; 64px button height per UI-SPEC |
| RESL-03 | Undo or correct a previously recorded result | Edit link on scored race cards, store.clearResult then re-record |
| RESL-04 | Correcting result cascades recalculation to standings | Standings are derived (calculateGroupStandings called on render), no explicit cascade needed |
| STND-01 | Group table updates live as results recorded | Reactive derivation: calculateAllGroupStandings(scores, groups) in render path |
| STND-02 | View standings without losing scoring position | Sub-tab navigation (D-06) preserves scoring state; StandingsView reads from same store |
| STND-03 | Teams ranked by total points within each group | calculateGroupStandings already sorts by points descending |
| MOBL-01 | Mobile-first design, 56px+ touch targets, high contrast, outdoor readability | UI-SPEC design contract with specific Tailwind classes, 64px scoring buttons, WCAG AA contrast |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.4 | UI framework | Already in package.json, component-based UI |
| Zustand | ^5.0.12 | State management | Already configured with persist middleware in Phase 1 |
| Tailwind CSS | ^4.2.2 | Utility-first styling | In devDependencies but NOT YET CONFIGURED -- needs Vite plugin + CSS import |
| @tailwindcss/vite | ^4.2.2 | Vite integration for Tailwind 4 | In devDependencies, must be added to vite.config.ts plugins |
| clsx | ^2.1.1 | Conditional CSS classes | In devDependencies, use for outcome button state toggling |
| Vitest | ^3.2.4 | Testing | Already configured with jsdom environment |
| @testing-library/react | ^16.3.2 | Component testing | Already in devDependencies |

### Not Needed for Phase 2
| Library | Reason |
|---------|--------|
| React Router | All navigation is in-page tab state. No URL routing needed for group stage flow. |
| Any icon library | UI-SPEC explicitly says "text labels + emoji-free SVG inline icons where needed". Minimal iconography. |
| Any component library | UI-SPEC says "custom Tailwind components". No shadcn, Headless UI, or MUI. |

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    layout/
      DisciplineTabs.tsx       # Top-level discipline switcher
      SubTabs.tsx              # Teams/Races/Score/Standings tabs
      AppShell.tsx             # Combines tabs + content area + progress bar
    teams/
      TeamEntryView.tsx        # Container: input + list + count
      TeamInput.tsx            # Single input + Add button
      TeamList.tsx             # Ordered list of TeamRows
      TeamRow.tsx              # Name + delete button
    races/
      RaceListView.tsx         # Container: round headers + race cards
      RaceCard.tsx             # Single matchup display
      RoundHeader.tsx          # "Round 1" section divider
    scoring/
      ScoringFocusView.tsx     # Current race + outcome buttons + undo
      OutcomeButton.tsx        # Win/Loss/DSQ button
    standings/
      StandingsView.tsx        # Container: per-group tables
      GroupStandingsTable.tsx   # Single group table
      ResultCell.tsx           # 24x24 colored cell (3/1/0)
      TieBadge.tsx             # "TIE" indicator
    shared/
      ProgressBar.tsx          # Race N of M
      Toast.tsx                # Dismissible notification
      ConfirmButton.tsx        # Two-phase destructive action button
  hooks/
    useDisciplineState.ts      # Derives current discipline's teams, scores, structure
    useCurrentRace.ts          # Finds next unscored race for focus view
    useStandings.ts            # Calls calculateAllGroupStandings reactively
  domain/                      # EXISTING -- do not modify
  store/                       # EXISTING -- do not modify
```

### Pattern 1: Derived State from Store (no duplication)
**What:** UI components derive race lists, standings, and progress from the store's raw state using existing domain functions. Never store derived data.
**When to use:** Every view that shows races, standings, or progress.
**Example:**
```typescript
// In a component or custom hook
import { useEventStore } from '../store/eventStore';
import { getCheatSheet } from '../domain/cheatSheets';
import { calculateAllGroupStandings } from '../domain/groupCalculations';

function useStandings(discipline: DisciplineKey) {
  const { teams, scores, teamCount } = useEventStore(
    (s) => s.disciplines[discipline]
  );

  if (teamCount < 4) return null;

  const structure = getCheatSheet(teamCount);
  return calculateAllGroupStandings(scores, structure.groups);
}
```

### Pattern 2: Auto-Complement Scoring
**What:** When one team's outcome is tapped, the other team's outcome is auto-inferred (Win<->Loss). DSQ requires explicit second tap since the other team could be Win or DSQ.
**When to use:** ScoringFocusView only.
**Example:**
```typescript
function getComplement(outcome: RaceOutcome): RaceOutcome | null {
  if (outcome === 'win') return 'loss';
  if (outcome === 'loss') return 'win';
  return null; // DSQ has no auto-complement
}

// When user taps Team A outcome:
const teamAOutcome = 'win';
const teamBOutcome = getComplement(teamAOutcome); // 'loss'
if (teamBOutcome) {
  // Auto-record both outcomes immediately
  store.recordResult(discipline, {
    raceId: `r1-${race.raceNum}`,
    homeSlot: race.homeSlot,
    awaySlot: race.awaySlot,
    homeOutcome: teamAOutcome,
    awayOutcome: teamBOutcome,
  });
}
```

### Pattern 3: Team Entry with Incremental Slot Assignment
**What:** When adding teams one at a time, assign slot numbers sequentially (1, 2, 3, 4 for first group, 11, 12, 13, 14 for second group, etc.). Slot numbers are positional identifiers from the cheat sheets.
**When to use:** TeamEntryView.
**Critical detail:** Slot numbers follow cheat sheet conventions. For small counts (4-7 teams, single group), slots are simply 1..N. For 8+ teams (multiple groups), the cheat sheets use slot numbering like 1-4 for Group A, 11-14 for Group B. The simplest approach: after the user enters N teams, call `getCheatSheet(N)` and use its `groups[].teamSlots` to assign slots. Each team gets the slot at its entry index position across all groups.
**Example:**
```typescript
function assignSlots(teamNames: string[]): Team[] {
  if (teamNames.length < 4) {
    // Not enough teams for a valid tournament, just use sequential slots
    return teamNames.map((name, i) => ({ slot: i + 1, name }));
  }
  const structure = getCheatSheet(teamNames.length);
  const allSlots = structure.groups.flatMap(g => g.teamSlots);
  return teamNames.map((name, i) => ({ slot: allSlots[i], name }));
}
```

### Pattern 4: Race ID Convention
**What:** Score objects use a `raceId` string key. The convention from the store is format like `r1-{raceNum}` for Round 1 races.
**When to use:** Anywhere creating or looking up Score objects.
**Critical detail:** The store's `recordResult` replaces any existing score with the same `raceId` (filter + append pattern), so re-recording is idempotent.

### Anti-Patterns to Avoid
- **Storing derived state:** Never put standings, race lists, or progress counts into the Zustand store. These are computed from `teams`, `scores`, and `getCheatSheet()` on every render. Zustand selectors with shallow equality prevent unnecessary re-renders.
- **Reimplementing domain logic:** The scoring engine, group calculations, and cheat sheet lookups are fully tested in Phase 1. UI code imports and calls them -- never duplicates the logic.
- **Using React Router for tab navigation:** The discipline tabs and sub-tabs are local UI state, not URL routes. Adding router complexity buys nothing here.
- **Custom CSS instead of Tailwind:** The UI-SPEC provides exact Tailwind classes. Do not write custom CSS files (except the minimal Tailwind import). The current `App.css` and `index.css` Vite boilerplate must be replaced.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional CSS classes | String concatenation | `clsx` (already installed) | Handles falsy values, cleaner than template literals |
| State persistence | Custom localStorage sync | Zustand persist (already configured) | Handles serialization, versioning, migration |
| Tournament structure | Race generation algorithm | `getCheatSheet(teamCount)` | 29 pre-computed structures, fully tested |
| Group standings calculation | Custom sorting/scoring | `calculateGroupStandings()` | Handles all edge cases, 335 tests |
| Tie detection | Manual point comparison | `hasTies()` | Already handles adjacent-pair comparison |
| Team count validation | Custom range checks | `validateTeamCount()` | Discipline-specific ranges built in |

**Key insight:** Phase 1 built the entire domain layer. Phase 2 is purely a presentation layer that calls existing functions. The temptation to "optimize" by caching or pre-computing should be resisted -- the domain functions are fast (pure array operations on small datasets, max 32 teams).

## Common Pitfalls

### Pitfall 1: Tailwind CSS 4 Not Configured
**What goes wrong:** Tailwind classes have zero effect. Components render with no styling.
**Why it happens:** Tailwind 4 is in `devDependencies` and `@tailwindcss/vite` is available, but neither is wired into the build. The `vite.config.ts` has no Tailwind plugin, and no CSS file imports Tailwind.
**How to avoid:** Wave 0 must: (1) add `@tailwindcss/vite` to `vite.config.ts` plugins, (2) replace `index.css` content with `@import "tailwindcss";`, (3) verify utility classes render.
**Warning signs:** No styling visible after adding Tailwind classes.

### Pitfall 2: Stale Cheat Sheet After Team Deletion
**What goes wrong:** User adds 8 teams, views races, then deletes one team. The race list still shows 8-team structure.
**Why it happens:** If the race structure is cached or derived once, it doesn't update when `teamCount` changes.
**How to avoid:** Always derive structure from current `teamCount`: `getCheatSheet(store.disciplines[discipline].teamCount)`. If teamCount drops below 4, show the "Add teams first" empty state.
**Warning signs:** Race list doesn't match team count after additions/deletions.

### Pitfall 3: Slot Assignment Mismatch
**What goes wrong:** Team names are assigned to wrong slots, causing race matchups to show wrong team names.
**Why it happens:** Cheat sheet slot numbers are NOT sequential for multi-group events (e.g., 8 teams use slots 1-4 and 11-14, not 1-8).
**How to avoid:** Always use `getCheatSheet(count).groups.flatMap(g => g.teamSlots)` to get the correct slot ordering. Map team entry order to these slots.
**Warning signs:** "Team A vs Team B" shows unexpected pairings.

### Pitfall 4: Auto-Advance Scroll Race Condition
**What goes wrong:** Auto-advance fires before the DOM updates with the new score, causing scroll to wrong position.
**Why it happens:** State update -> re-render -> DOM update is asynchronous. Scrolling immediately after `recordResult` targets stale DOM.
**How to avoid:** Use `useEffect` with dependency on the scores array length to trigger scroll after render, or use `requestAnimationFrame` / `setTimeout(fn, 0)` to defer scroll. The UI-SPEC specifies 300ms delay which naturally handles this.
**Warning signs:** Scroll lands on wrong race or doesn't scroll at all.

### Pitfall 5: Zustand Selector Re-render Storm
**What goes wrong:** Every score recording causes all components to re-render, not just the affected ones.
**Why it happens:** Using `useEventStore()` without a selector subscribes to the entire store. Every mutation triggers re-render.
**How to avoid:** Always use selectors: `useEventStore((s) => s.disciplines[discipline].scores)`. For objects, use `useShallow` from `zustand/react/shallow` to prevent re-renders when the selected object is structurally equal.
**Warning signs:** Visible lag when recording scores, especially with many teams.

### Pitfall 6: Both Teams Cannot DSQ in Same Race
**What goes wrong:** UI allows both teams to be marked DSQ, violating D-01.
**Why it happens:** Auto-complement doesn't handle DSQ (returns null), but manual selection of DSQ for both teams is possible if not guarded.
**How to avoid:** When Team A selects DSQ, Team B's options should be Win only (not Loss or DSQ). Enforce: if one team is DSQ, the other must be Win. The constraint is "one winner, one loser or DSQ per race" -- meaning valid combos are Win/Loss, Win/DSQ, Loss/Win, DSQ/Win.
**Warning signs:** Standings show impossible point totals.

## Code Examples

### Tailwind CSS 4 Setup (Wave 0)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

```css
/* src/index.css -- replace all existing content */
@import "tailwindcss";
```

### App Shell with Tab Navigation

```typescript
// src/components/layout/AppShell.tsx
import { useEventStore } from '../../store/eventStore';
import type { DisciplineKey } from '../../domain/types';

type SubTab = 'teams' | 'races' | 'score' | 'standings';

export function AppShell() {
  const activeDiscipline = useEventStore((s) => s.activeDiscipline);
  const setActiveDiscipline = useEventStore((s) => s.setActiveDiscipline);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('teams');

  return (
    <div className="flex flex-col min-h-screen max-w-[430px] mx-auto">
      <DisciplineTabs active={activeDiscipline} onSelect={setActiveDiscipline} />
      <SubTabs active={activeSubTab} onSelect={setActiveSubTab} />
      <main className="flex-1 overflow-y-auto">
        {/* Render active sub-tab view */}
      </main>
      <ProgressBar discipline={activeDiscipline} />
    </div>
  );
}
```

### Outcome Button with Accessibility

```typescript
// src/components/scoring/OutcomeButton.tsx
import { clsx } from 'clsx';
import type { RaceOutcome } from '../../domain/types';

const OUTCOME_STYLES: Record<RaceOutcome, { active: string; inactive: string }> = {
  win:  { active: 'bg-green-600 text-white ring-2 ring-green-300', inactive: 'bg-slate-100 text-slate-600' },
  loss: { active: 'bg-amber-600 text-white ring-2 ring-amber-300', inactive: 'bg-slate-100 text-slate-600' },
  dsq:  { active: 'bg-red-600 text-white ring-2 ring-red-300',     inactive: 'bg-slate-100 text-slate-600' },
};

const LABELS: Record<RaceOutcome, string> = { win: 'Win', loss: 'Loss', dsq: 'DSQ' };

interface OutcomeButtonProps {
  outcome: RaceOutcome;
  selected: boolean;
  disabled?: boolean;
  onSelect: (outcome: RaceOutcome) => void;
}

export function OutcomeButton({ outcome, selected, disabled, onSelect }: OutcomeButtonProps) {
  const styles = OUTCOME_STYLES[outcome];
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(outcome)}
      className={clsx(
        'h-16 flex-1 font-semibold text-base rounded-lg',
        'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        selected ? styles.active : styles.inactive,
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {LABELS[outcome]}
    </button>
  );
}
```

### Reactive Standings Hook

```typescript
// src/hooks/useStandings.ts
import { useMemo } from 'react';
import { useEventStore } from '../store/eventStore';
import { getCheatSheet } from '../domain/cheatSheets';
import { calculateAllGroupStandings } from '../domain/groupCalculations';
import { hasTies } from '../domain/scoring';
import type { DisciplineKey, TeamStanding } from '../domain/types';

export function useStandings(discipline: DisciplineKey) {
  const { scores, teamCount, teams } = useEventStore(
    (s) => s.disciplines[discipline]
  );

  return useMemo(() => {
    if (teamCount < 4) return null;
    const structure = getCheatSheet(teamCount);
    const standings = calculateAllGroupStandings(scores, structure.groups);
    const tiesByGroup: Record<string, boolean> = {};
    for (const [letter, groupStandings] of Object.entries(standings)) {
      tiesByGroup[letter] = hasTies(groupStandings);
    }
    return { standings, tiesByGroup, groups: structure.groups, teams };
  }, [scores, teamCount, teams]);
}
```

### Score Validation (enforce D-01 constraints)

```typescript
// Valid outcome combinations per race
type OutcomePair = [RaceOutcome, RaceOutcome];
const VALID_PAIRS: OutcomePair[] = [
  ['win', 'loss'],
  ['loss', 'win'],
  ['win', 'dsq'],
  ['dsq', 'win'],
];

function isValidOutcomePair(home: RaceOutcome, away: RaceOutcome): boolean {
  return VALID_PAIRS.some(([h, a]) => h === home && a === away);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 config file | Tailwind v4 `@import "tailwindcss"` (no config file) | Jan 2025 | Setup is CSS import + Vite plugin only. No tailwind.config.js. |
| Zustand v4 `create()` | Zustand v5 `create<T>()(...)` | Dec 2024 | Double invocation for TypeScript. Already used in Phase 1 store. |
| `useEventStore()` no selector | `useEventStore((s) => s.specific.path)` + `useShallow` | Zustand v5 | Required to avoid re-render storms. Import `useShallow` from `zustand/react/shallow`. |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Not needed in Tailwind v4. Configuration happens in CSS with `@theme` directive if customization is needed.
- `@apply` directive: Still works in v4 but discouraged. Use utility classes directly in JSX.

## Open Questions

1. **Round 2 race display in Phase 2 scope?**
   - What we know: D-08 says "all rounds visible from the start for 8+ team events" including Round 2 greyed out. The cheat sheet has `roundTwoGroups` data.
   - What's unclear: Round 2 races reference abstract positions ("Winner A", "Runner Up B"), not concrete teams. Should the race list show these abstract labels, or only show Round 1 with a "Round 2" placeholder?
   - Recommendation: Show Round 2 section headers with placeholder text ("Round 2 -- 6 races, seeded from Round 1 results") greyed out. Don't render individual Round 2 race cards since team names can't be resolved until Round 1 is scored. This matches the spirit of D-08 (officials can see the full schedule) without confusing abstract slot references.

2. **Team deletion after scoring has started**
   - What we know: TeamRow has a delete button. Scores reference teams by slot number.
   - What's unclear: Should team deletion be allowed after races have been scored? Deleting a team invalidates the entire tournament structure.
   - Recommendation: Disable individual team deletion once the discipline phase moves past 'setup'. The "Reset {discipline}" action (with confirmation) is the only way to clear teams after scoring begins. This prevents data corruption.

3. **Sub-tab persistence across discipline switches (D-04 + D-06)**
   - What we know: D-04 says discipline switching should preserve sub-tab selection.
   - What's unclear: Should each discipline remember its own last sub-tab, or should one global sub-tab apply to all?
   - Recommendation: One global sub-tab state. If the user is on "Score" tab in Mixed, switching to Board should also show "Score" tab. This is simpler and matches the mental model of "I'm scoring, let me check the other discipline's scoring."

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | Assumed (Vite project exists) | -- | -- |
| Tailwind CSS | Styling | Installed (npm) but NOT CONFIGURED | ^4.2.2 | Must configure in Wave 0 |
| @tailwindcss/vite | Vite integration | Installed (npm) but NOT in vite.config.ts | ^4.2.2 | Must add to plugins in Wave 0 |
| clsx | Class composition | Installed (npm) | ^2.1.1 | -- |
| @testing-library/react | Component tests | Installed (npm) | ^16.3.2 | -- |

**Missing dependencies with no fallback:**
- None. All npm packages are installed. Only configuration is missing.

**Missing dependencies with fallback:**
- None.

**Setup required (not missing, just unconfigured):**
- Tailwind CSS 4 must be added to `vite.config.ts` and `index.css` before any styling work begins.
- Current `App.css` and `App.tsx` are Vite boilerplate that must be replaced.

## Project Constraints (from CLAUDE.md)

- **Stack:** React 19, Vite, TypeScript, Zustand, Tailwind CSS 4 (from STACK.md embedded in CLAUDE.md)
- **No heavy component libraries:** Bootstrap, MUI explicitly forbidden (from STACK.md "What NOT to Use")
- **No server-side frameworks:** Next.js, Remix forbidden
- **Client-side only:** localStorage via Zustand persist, no network calls
- **Testing:** Vitest with jsdom environment, @testing-library/react for component tests
- **GSD Workflow:** Use GSD commands for all file changes
- **Conventions:** Not yet established -- Phase 2 will establish UI component conventions

## Sources

### Primary (HIGH confidence)
- `src/domain/types.ts` -- All type definitions (Team, Score, RaceMatchup, TournamentStructure, etc.)
- `src/store/eventStore.ts` -- Zustand store with all actions (setTeams, recordResult, clearResult, etc.)
- `src/store/types.ts` -- EventStoreActions interface (exact action signatures)
- `src/domain/scoring.ts` -- POINTS map, calculateGroupStandings, hasTies
- `src/domain/groupCalculations.ts` -- getGroupRaces, calculateAllGroupStandings
- `src/domain/cheatSheets/index.ts` -- getCheatSheet lookup, verified with teams8.ts for structure shape
- `src/domain/validation.ts` -- validateTeamCount, getValidTeamCountRange
- `package.json` -- Verified all dependencies are installed (react, zustand, tailwindcss, clsx, etc.)
- `vite.config.ts` -- Confirmed Tailwind plugin is NOT yet added
- `vitest.config.ts` -- Confirmed jsdom environment, test file patterns
- `.planning/phases/02-core-event-flow/02-UI-SPEC.md` -- Complete design contract
- `.planning/phases/02-core-event-flow/02-CONTEXT.md` -- Locked decisions D-01 through D-10

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 setup pattern (CSS import + Vite plugin) -- based on official Tailwind v4 announcement and STACK.md notes
- Zustand v5 `useShallow` import path -- based on Zustand v5 documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified in package.json with exact versions
- Architecture: HIGH -- component structure derived directly from UI-SPEC component inventory + existing domain code interfaces
- Pitfalls: HIGH -- identified from direct code inspection (unconfigured Tailwind, slot numbering, store patterns)
- Integration points: HIGH -- all store actions and domain functions read and verified

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- no external dependencies expected to change)
