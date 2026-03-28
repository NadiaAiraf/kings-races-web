# Architecture Research

**Domain:** Client-side race/tournament management web app
**Researched:** 2026-03-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
+---------------------------------------------------------------+
|                       UI Layer (React)                        |
|  +----------+ +----------+ +----------+ +----------+          |
|  | Team     | | Race     | | Scoring  | | Results  |          |
|  | Entry    | | Schedule | | Console  | | & Export |          |
|  +----+-----+ +----+-----+ +----+-----+ +----+-----+          |
|       |            |            |            |                 |
+-------+------------+------------+------------+-----------------+
|                   State Layer (React Context + useReducer)     |
|  +-------------------+  +-------------------+                  |
|  | Event State       |  | UI State          |                  |
|  | (disciplines,     |  | (active view,     |                  |
|  |  teams, races,    |  |  selected disc.)  |                  |
|  |  scores, finals)  |  |                   |                  |
|  +---------+---------+  +-------------------+                  |
|            |                                                   |
+------------+---------------------------------------------------+
|                   Domain Logic Layer (Pure Functions)           |
|  +-----------+ +-----------+ +-----------+ +-----------+       |
|  | Race Order| | Scoring   | | Group     | | Finals    |       |
|  | Generator | | Engine    | | Table Calc| | Bracket   |       |
|  +-----------+ +-----------+ +-----------+ +-----------+       |
|                                                                |
+----------------------------------------------------------------+
|                   Data / Persistence Layer                      |
|  +---------------------------+  +-------------------+          |
|  | localStorage Adapter      |  | CSV Export         |          |
|  | (auto-save, hydration)    |  | (results output)   |          |
|  +---------------------------+  +-------------------+          |
+----------------------------------------------------------------+
|                   Static Data                                  |
|  +---------------------------+                                 |
|  | Cheat Sheets (4-32 teams) |                                 |
|  | Pre-computed race orders  |                                 |
|  +---------------------------+                                 |
+----------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Team Entry | Collect team names per discipline, validate counts (4-32) | Form with dynamic add/remove, maps names to numbered slots |
| Race Schedule | Display ordered matchups from cheat sheets | Read-only list rendered from pre-computed data + team name mapping |
| Scoring Console | Record Win/Loss/DSQ for each matchup in real time | Tap-friendly buttons per race, dispatches score actions |
| Group Table | Live standings within round-robin groups | Derived/computed view from scores -- points, W/L/D record |
| Finals Bracket | Placement matches after group stage (1v2, 3v4, etc.) | Sequential matchups seeded from group standings |
| Results & Export | Final standings display, CSV download | Computed from all scores, formatted for export |
| Race Order Generator | Look up pre-computed cheat sheet for N teams | Pure function: teamCount -> matchup sequence |
| Scoring Engine | Apply Win=3/Loss=1/DSQ=0 rules | Pure function: results -> point totals |
| Group Table Calculator | Aggregate scores into standings | Pure function: scores[] -> sorted standings[] |
| Finals Bracket Logic | Determine placement match seedings and results | Pure function: groupStandings -> finals matchups -> final positions |
| localStorage Adapter | Persist and hydrate event state | Serialize state to JSON on every change, restore on load |
| Cheat Sheets | Static lookup data for race orders | JSON data structure keyed by team count (4-32) |

## Recommended Project Structure

```
src/
  features/
    disciplines/         # Discipline selection and management
      DisciplineSelector.tsx
      DisciplineTabs.tsx
    teams/               # Team entry and management
      TeamEntry.tsx
      TeamList.tsx
    races/               # Race schedule display and scoring
      RaceSchedule.tsx
      RaceCard.tsx
      ScoringControls.tsx
    groups/              # Group table / standings
      GroupTable.tsx
      GroupStandings.tsx
    finals/              # Finals bracket and placement
      FinalsBracket.tsx
      PlacementMatch.tsx
    results/             # Final results and export
      ResultsView.tsx
      CsvExport.tsx
  domain/
    cheatSheets.ts       # Pre-computed race order data (4-32 teams)
    raceOrder.ts         # Race order lookup logic
    scoring.ts           # Scoring rules (Win=3, Loss=1, DSQ=0)
    groupCalculations.ts # Group table aggregation and sorting
    finalsLogic.ts       # Placement match seeding and bracket
    types.ts             # Core domain types (Team, Race, Score, etc.)
  state/
    eventReducer.ts      # Main reducer for event state
    eventContext.tsx      # React Context provider
    actions.ts           # Action type definitions
    selectors.ts         # Derived state computations
    persistence.ts       # localStorage save/load with auto-save
  shared/
    components/          # Reusable UI components (Button, Card, etc.)
    hooks/               # Shared hooks (useLocalStorage, etc.)
    utils/               # General utilities (CSV generation, etc.)
  App.tsx
  main.tsx
```

### Structure Rationale

- **features/:** Feature-based grouping keeps UI components close to their domain concern. Each feature folder is self-contained and maps to a visible section of the app. A developer working on scoring does not need to touch group table files.
- **domain/:** Pure functions with zero React dependencies. This is the heart of the business logic -- race order lookup, scoring math, group calculations, finals seeding. Being pure functions means they are trivially testable and can be developed and verified before any UI exists.
- **state/:** Centralized state management using React Context + useReducer. Single source of truth for the entire event. Keeps state shape and mutation logic in one place.
- **shared/:** Cross-cutting concerns that multiple features use. Kept thin -- most logic belongs in domain/ or a specific feature.

## Architectural Patterns

### Pattern 1: Single Reducer with Discipline Partitioning

**What:** One useReducer manages the entire event state, with each discipline (Mixed, Board, Ladies) as a partition within that state. The active discipline is a UI-level selector, not a separate state tree.
**When to use:** When the app manages a bounded, predictable data set (one event at a time with 3 disciplines).
**Trade-offs:** Simple mental model, single source of truth, easy to persist. Reducer can grow large but is manageable for this domain size.

**Example:**
```typescript
interface EventState {
  disciplines: {
    mixed: DisciplineState;
    board: DisciplineState;
    ladies: DisciplineState;
  };
  activeDiscipline: 'mixed' | 'board' | 'ladies';
}

interface DisciplineState {
  teams: Team[];
  races: Race[];       // Generated from cheat sheet
  scores: Score[];     // Recorded results
  phase: 'setup' | 'group-stage' | 'finals' | 'complete';
}

type EventAction =
  | { type: 'ADD_TEAM'; discipline: DisciplineKey; name: string }
  | { type: 'GENERATE_RACES'; discipline: DisciplineKey }
  | { type: 'RECORD_RESULT'; discipline: DisciplineKey; raceId: string; result: RaceResult }
  | { type: 'START_FINALS'; discipline: DisciplineKey }
  | { type: 'RECORD_FINAL_RESULT'; discipline: DisciplineKey; matchId: string; result: RaceResult }
  | { type: 'SET_ACTIVE_DISCIPLINE'; discipline: DisciplineKey }
  | { type: 'LOAD_STATE'; state: EventState };
```

### Pattern 2: Derived State via Selectors (Not Stored)

**What:** Group tables, standings, and bracket seedings are computed on-the-fly from scores, never stored in state. This prevents stale data and eliminates sync bugs between "raw results" and "computed standings."
**When to use:** When derived data is cheap to compute (it is -- max 32 teams, under 500 races).
**Trade-offs:** Slight recomputation cost (negligible at this scale) vs. guaranteed consistency. Use `useMemo` to avoid unnecessary recalculations.

**Example:**
```typescript
// selector -- pure function, not stored in state
function getGroupStandings(discipline: DisciplineState): TeamStanding[] {
  const pointsMap = new Map<string, number>();
  for (const score of discipline.scores) {
    const current = pointsMap.get(score.teamId) ?? 0;
    pointsMap.set(score.teamId, current + score.points);
  }
  return Array.from(pointsMap.entries())
    .map(([teamId, points]) => ({ teamId, points }))
    .sort((a, b) => b.points - a.points);
}

// In component
const standings = useMemo(
  () => getGroupStandings(currentDiscipline),
  [currentDiscipline.scores]
);
```

### Pattern 3: Auto-Persist on State Change

**What:** A useEffect in the Context provider serializes the full event state to localStorage on every state change. On app load, the provider checks localStorage first and hydrates if data exists.
**When to use:** Client-only apps where data loss is catastrophic (race official mid-event).
**Trade-offs:** Simple and reliable. The 5MB localStorage limit is more than sufficient (event data is measured in KB). No need for IndexedDB complexity at this scale.

**Example:**
```typescript
const STORAGE_KEY = 'kings-races-event';

function EventProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(eventReducer, null, () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  );
}
```

### Pattern 4: Phase-Based UI Flow per Discipline

**What:** Each discipline progresses through phases: setup -> group-stage -> finals -> complete. The UI shows different views based on the current phase. This prevents invalid actions (cannot score a race before teams are entered).
**When to use:** When the workflow has a clear linear progression.
**Trade-offs:** Clear UX guardrails. Slightly rigid -- but matches the real-world event flow exactly. Disciplines can be at different phases independently.

## Data Flow

### Core Data Flow

```
[User taps "Record Result"]
    |
    v
[ScoringControls] dispatches RECORD_RESULT action
    |
    v
[eventReducer] updates scores[] in discipline state
    |
    v
[useEffect] auto-persists full state to localStorage
    |
    v
[GroupTable] re-renders via useMemo selector on scores
    |
    v
[User sees updated standings immediately]
```

### Race Generation Flow

```
[User finishes entering teams]
    |
    v
[TeamEntry] dispatches GENERATE_RACES
    |
    v
[eventReducer] calls raceOrder.generate(teamCount)
    |
    v
[raceOrder] looks up cheatSheets[teamCount]
    |
    v
[Returns matchup sequence with team number slots]
    |
    v
[Reducer maps team numbers to entered team names]
    |
    v
[discipline.races populated, phase -> 'group-stage']
```

### Finals Transition Flow

```
[All group races scored]
    |
    v
[User triggers "Start Finals"]
    |
    v
[eventReducer] dispatches START_FINALS
    |
    v
[finalsLogic] takes getGroupStandings() output
    |
    v
[Generates placement matches: 1v2, 3v4, 5v6, etc.]
    |
    v
[discipline.phase -> 'finals', finals matches populated]
```

### Key Data Flows

1. **Team entry -> Race generation:** Teams are entered by name, assigned numbers. Team count triggers cheat sheet lookup which populates the race schedule. This is a one-way transformation -- changing teams after generation should regenerate (with warning).
2. **Score recording -> Group standings:** Each scored race updates the scores array. Group table is always recomputed from scores, never cached. Display updates are immediate.
3. **Group completion -> Finals seeding:** Once all group races have results, finals can begin. Group standings determine seeding for placement matches.
4. **State -> localStorage:** Every state mutation triggers a persist. On reload, state is hydrated from localStorage. This is the only persistence mechanism.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 event, 1 device (v1) | localStorage + useReducer is perfect. No changes needed. |
| Multiple events saved | Add event list with date/name. Store as array of events in localStorage. Consider cleanup of old events. |
| Multi-device sync (future) | Would require a server or P2P sync. Fundamentally different architecture. Out of scope per PROJECT.md. |
| Season tracking (future) | Add a layer above events. Export event results, import into season tracker. Keep event management isolated. |

### Scaling Priorities

1. **First concern (not a bottleneck):** localStorage 5MB limit. A single event with 32 teams across 3 disciplines produces well under 100KB of JSON. This will never be an issue for v1.
2. **Second concern:** If multiple past events accumulate, provide a "clear old events" option. Simple UX, no architectural change needed.

## Anti-Patterns

### Anti-Pattern 1: Storing Derived Data in State

**What people do:** Store group standings, computed totals, or "current leader" in the reducer state alongside raw scores.
**Why it is wrong:** Creates two sources of truth. If a score is corrected, you must remember to recompute all derived data. Inevitably, standings and scores drift out of sync.
**Do this instead:** Compute standings from scores every render using `useMemo`. With max 32 teams and ~500 races, this is effectively free.

### Anti-Pattern 2: Separate State per Discipline

**What people do:** Create three independent React contexts or reducers, one per discipline.
**Why it is wrong:** Makes it harder to persist the whole event atomically, harder to implement cross-discipline features (overall event results, CSV export of all disciplines), and triples the boilerplate.
**Do this instead:** Single event state with discipline partitions. One persist call, one hydration call, one context.

### Anti-Pattern 3: Over-Engineering the Storage Layer

**What people do:** Reach for IndexedDB, PouchDB, or RxDB for a client-side-only app with kilobytes of data.
**Why it is wrong:** Adds complexity, async APIs, migration headaches. localStorage is synchronous, simple, and has 5MB capacity -- orders of magnitude more than needed.
**Do this instead:** `JSON.stringify` + `localStorage.setItem`. Wrap in a thin adapter if you want to swap later, but do not over-abstract.

### Anti-Pattern 4: Building a Generic Tournament Engine

**What people do:** Abstract everything into a generic tournament framework that handles any sport, any format, any scoring system.
**Why it is wrong:** This app has one very specific format (parallel slalom, specific scoring, specific cheat sheets). Generalization adds complexity without value and makes the cheat sheet integration harder.
**Do this instead:** Build exactly for Kings Races. Hardcode the scoring rules (3/1/0). Embed the cheat sheets as static data. The specificity is a feature, not a limitation.

### Anti-Pattern 5: Allowing State Edits Without Phase Guards

**What people do:** Let users modify teams after races have started, or score finals before groups are complete.
**Why it is wrong:** Invalidates generated race schedules, creates impossible state. Race order depends on team count -- changing teams means the schedule is wrong.
**Do this instead:** Enforce phases. Once races are generated, teams are locked (allow reset with explicit confirmation). Finals only available when all group races are scored.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None for v1 | Client-side only | No APIs, no server, no external dependencies at runtime |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI features <-> State | React Context + dispatch | All mutations go through actions. Components read state via context + selectors. |
| State <-> Domain logic | Pure function calls from reducer | Reducer calls domain functions (raceOrder, scoring, finalsLogic) during action processing. Domain functions have zero React dependency. |
| State <-> Persistence | useEffect auto-save | Provider handles save/load. Components are unaware of persistence. |
| Domain <-> Cheat Sheets | Static import | Cheat sheet data is imported as a constant. No runtime loading. |

## Build Order (Dependency Chain)

This ordering reflects technical dependencies -- each layer builds on what comes before.

| Phase | What to Build | Depends On | Unlocks |
|-------|---------------|------------|---------|
| 1 | Domain types + cheat sheet data | Nothing | Everything else |
| 2 | Domain logic (scoring, race order, group calc) | Types + cheat sheets | State layer, testing |
| 3 | State layer (reducer, context, persistence) | Domain logic | All UI features |
| 4 | Team Entry UI + Race Schedule display | State layer | Scoring |
| 5 | Scoring Console + Live Group Tables | State + scoring engine | Finals |
| 6 | Finals Bracket + Placement Matches | State + finals logic + group calc | Results |
| 7 | Results View + CSV Export | All above | Complete app |

This order means domain logic can be fully tested before any UI is built, and each UI feature can be developed and tested independently once the state layer exists.

## Sources

- [Coronate: open-source chess tournament manager](https://dev.to/johnridesabike/building-coronate-an-open-source-chess-tournament-manager-46i8) -- client-side-only tournament app architecture reference
- [brackets-manager.js](https://github.com/Drarig29/brackets-manager.js/) -- storage-agnostic tournament bracket library demonstrating separation of domain logic from persistence
- [React folder structure best practices (Robin Wieruch)](https://www.robinwieruch.de/react-folder-structure/) -- feature-based organization patterns
- [bulletproof-react project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) -- feature-based React architecture reference
- [State management for offline-first web applications](https://blog.pixelfreestudio.com/state-management-for-offline-first-web-applications/) -- localStorage persistence patterns
- [Managing complex state with useReducer](https://www.aleksandrhovhannisyan.com/blog/managing-complex-state-react-usereducer/) -- useReducer patterns for multi-value state

---
*Architecture research for: Kings Races Web -- client-side race management*
*Researched: 2026-03-28*
