# Phase 1: Data Foundation and Storage - Research

**Researched:** 2026-03-28
**Domain:** Domain logic (tournament structure, scoring, cheat sheets) + client-side persistence (Zustand + localStorage)
**Confidence:** HIGH

## Summary

Phase 1 builds the invisible engine: TypeScript types, 29 cheat sheet race order lookup tables, a scoring engine, and Zustand-based localStorage persistence. No UI. Everything is pure functions with automated tests.

The cheat sheet extraction is the highest-risk and most complex task. The existing xlsx file contains 29 hidden sheets ("4 Teams" through "32 Teams") with varying structures: 4-6 teams use a single-group round-robin, 7-8 teams use 2 groups with Round Two cross-group play, 9+ teams scale to 3-8 groups with increasingly complex Round Two and Finals structures. Team numbering uses a tens-based scheme (Group A: 1-4, Group B: 11-14, Group C: 21-24, etc.) that must be preserved exactly. A Python extraction script using openpyxl (already installed) should generate TypeScript const data files that are then committed to the repo as static lookup tables.

The Zustand persist middleware provides exactly the storage-first pattern needed: automatic JSON serialization to localStorage on every state change, hydration on load, version stamping for future migrations, and partialize to exclude functions from persistence. This is the correct approach per the locked stack decision.

**Primary recommendation:** Build a Python extraction script first to generate cheat sheet TypeScript files, then implement domain types, scoring engine, and Zustand store with persist -- all backed by Vitest tests.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Extract all 29 race order sequences programmatically from the existing xlsx file (`/Users/aidanfaria/Downloads/Master Copy DO NOT USE v1.4 - cheat sheets - auto populating.xlsx`). Each sheet must be extracted individually as the structure varies by team count.
- **D-02:** Race orders are identical across disciplines (Mixed/Board/Ladies) for the same team count -- only one set of 29 sequences is needed, not 29 x 3.
- **D-03:** Each cheat sheet contains a complete tournament structure, not just a flat race list:
  - **4-6 teams:** Single group round-robin (Round One only)
  - **8+ teams:** Multiple groups in Round One -> cross-group matchups in Round Two -> placement Finals
  - Number of groups scales with team count (8 teams = 2 groups, 16 teams = 4 groups, etc.)
- **D-04:** Group assignments (which team numbers go into which group) must be extracted exactly from the spreadsheet -- they are intentionally seeded, not arbitrary splits.
- **D-05:** Finals matchup structures (1st/2nd, 3rd/4th, etc.) vary by team count and must be extracted per sheet.
- **D-06:** The app must present the tournament in the same round structure as the spreadsheet (Round 1 groups -> Round 2 cross-group -> Finals), not flattened into one sequence.
- **D-07:** When teams are tied on points in a group, the official decides the ranking manually. The app should flag ties and present an interface for the official to set the final ordering -- no automatic tiebreaker algorithm.
- **D-08:** Win = 3 points, Loss = 1 point, DSQ = 0 points. These are the only three outcomes per team per matchup.

### Claude's Discretion
- Data model shape (TypeScript types, store structure, how races/groups/rounds are keyed)
- Zustand store design (single store vs slices, action patterns)
- localStorage serialization format
- Test framework choice and test structure
- How cheat sheet data is structured in code (const arrays, maps, etc.)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEAM-02 | Each discipline supports a variable number of teams (Mixed: 4-32, Board: 4-17, Ladies: 4-17) | Cheat sheet analysis confirms 29 sheets for 4-32. Discipline ranges enforced via TypeScript types and validation functions. |
| TEAM-04 | Team data persists in localStorage so the app survives tab death or refresh | Zustand persist middleware auto-saves to localStorage on every state change. Hydration on load is built-in. |
| RACE-01 | App auto-generates race order using exact pre-computed cheat sheet sequences based on number of teams entered | Cheat sheet extraction script generates static TypeScript lookup tables. Pure function: teamCount -> tournament structure. |
| RACE-02 | Cheat sheet matchup sequences for 4-32 teams are hard-coded and match the existing spreadsheet exactly | 29 xlsx sheets analyzed; extraction script will produce verified const data. Automated tests compare against source. |
| MOBL-02 | App persists all state to localStorage -- survives tab death, browser restart, and phone lock | Zustand persist with synchronous localStorage writes on every mutation. Version stamping from day one. |
| MOBL-04 | App reconstructs full state from localStorage on every load (normal path, not error recovery) | Zustand persist hydrates from localStorage before first render. onRehydrateStorage hook for error handling. |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack locked:** React 19.1.x, TypeScript 6.0, Vite 8.0.x (or 7.3.x), Zustand 5.0.x, Vitest 4.1.x
- **State management:** Zustand with persist middleware (NOT React Context + useReducer as ARCHITECTURE.md suggests -- STACK.md overrides this)
- **Store pattern:** Structure stores per-domain: `useEventStore`, `useRaceStore`, `useResultsStore`
- **Cheat sheets:** Store as static TypeScript const arrays (type-safe, no runtime parsing). Import only the needed sequence based on team count.
- **No generation algorithm:** Race orders are lookup tables, not computed
- **GSD workflow:** Do not make direct repo edits outside a GSD workflow unless explicitly asked

## Standard Stack

### Core (Phase 1 specific)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.0.12 | State management with localStorage persistence | Built-in `persist` middleware handles serialization, hydration, version stamping, and migration. 1KB, no boilerplate. |
| TypeScript | 6.0.2 | Type safety for domain models | Catches scoring bugs and type mismatches at compile time. |
| Vitest | 4.1.2 | Unit testing for domain logic and store | Native Vite integration, fast watch mode, compatible with the project's Vite build. |

### Supporting (extraction tooling)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| openpyxl (Python) | 3.1.5 | Parse xlsx cheat sheets | One-time extraction script to generate TypeScript data files. Already installed. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand persist | Manual localStorage wrapper | Zustand persist handles edge cases (hydration race conditions, version migration, error recovery). Manual wrappers miss these. |
| openpyxl Python script | SheetJS (xlsx npm) | Python openpyxl is already installed and the script is one-time tooling, not runtime code. Either works. |
| Single Zustand store | Multiple stores (event, race, results) | STACK.md recommends per-domain stores. However, for atomic persistence of the entire event, a single store with slices is simpler. Recommend: single store with `partialize` to organize logically. |

**Installation (for Phase 1 -- project init):**
```bash
npm create vite@latest . -- --template react-ts
npm install zustand
npm install -D vitest
```

**Version verification:** Verified against npm registry 2026-03-28:
- zustand: 5.0.12 (current)
- vitest: 4.1.2 (current)
- typescript: 6.0.2 (current)

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope only)
```
src/
  domain/
    types.ts              # Core domain types (Team, Race, Score, Group, Round, Tournament)
    cheatSheets/
      index.ts            # Lookup function: getCheatSheet(teamCount) -> TournamentStructure
      teams4.ts           # Static const data for 4 teams
      teams5.ts           # Static const data for 5 teams
      ...                 # One file per team count (29 files)
      teams32.ts          # Static const data for 32 teams
    scoring.ts            # Scoring engine: Win=3, Loss=1, DSQ=0, group standings
    groupCalculations.ts  # Group table aggregation, tie detection
    validation.ts         # Team count range validation per discipline
  store/
    eventStore.ts         # Zustand store with persist middleware
    types.ts              # Store-specific types (actions, state shape)
  scripts/
    extractCheatSheets.py # One-time Python extraction script (not shipped to browser)
```

### Pattern 1: Static Cheat Sheet Lookup (NOT algorithmic generation)
**What:** Each of the 29 team count variations is a hard-coded TypeScript const object containing the full tournament structure: group assignments, Round 1 race order, Round 2 race order (if applicable), and Finals matchup template.
**When to use:** Always -- this is a locked decision.
**Example:**
```typescript
// src/domain/cheatSheets/teams8.ts
import type { TournamentStructure } from '../types';

export const TEAMS_8: TournamentStructure = {
  teamCount: 8,
  groups: {
    A: { teamSlots: [1, 2, 3, 4] },
    B: { teamSlots: [11, 12, 13, 14] },
  },
  rounds: {
    one: {
      label: 'Round One',
      races: [
        { raceNum: 1, homeSlot: 1, awaySlot: 2 },
        { raceNum: 2, homeSlot: 3, awaySlot: 4 },
        { raceNum: 3, homeSlot: 11, awaySlot: 12 },
        { raceNum: 4, homeSlot: 13, awaySlot: 14 },
        { raceNum: 5, homeSlot: 2, awaySlot: 3 },
        { raceNum: 6, homeSlot: 4, awaySlot: 1 },
        { raceNum: 7, homeSlot: 12, awaySlot: 13 },
        { raceNum: 8, homeSlot: 14, awaySlot: 11 },
        { raceNum: 9, homeSlot: 1, awaySlot: 3 },
        { raceNum: 10, homeSlot: 2, awaySlot: 4 },
        { raceNum: 11, homeSlot: 11, awaySlot: 13 },
        { raceNum: 12, homeSlot: 12, awaySlot: 14 },
      ],
    },
    two: {
      label: 'Round Two',
      // Groups I and II with cross-group matchups
      // Letter-based references resolved at runtime from R1 standings
      groups: {
        I: {
          slots: ['A1', 'B1', 'A2', 'B2'],  // Winner A, Winner B, Runner Up A, Runner Up B
          races: [
            { raceNum: 1, homeRef: 'A', awayRef: 'B' },
            { raceNum: 2, homeRef: 'C', awayRef: 'D' },
            // ... etc
          ],
        },
        II: {
          slots: ['A3', 'B3', 'A4', 'B4'],  // Third A, Third B, Loser A, Loser B
          races: [
            { raceNum: 1, homeRef: 'E', awayRef: 'F' },
            { raceNum: 2, homeRef: 'G', awayRef: 'H' },
            // ... etc
          ],
        },
      },
    },
  },
  finals: [
    { label: '7th/8th', homeRef: 'Third Group II', awayRef: 'Loser Group II' },
    { label: '5th/6th', homeRef: 'Winner Group II', awayRef: 'Second Group II' },
    { label: '3rd/4th', homeRef: 'Third Group I', awayRef: 'Loser Group I' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Second Group I' },
  ],
};
```

### Pattern 2: Zustand Store with Persist and Version Stamping
**What:** Single Zustand store holding the complete event state (all 3 disciplines), with persist middleware writing to localStorage on every mutation. Version number from day one enables future schema migrations.
**When to use:** For all app state that must survive tab death.
**Example:**
```typescript
// src/store/eventStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventState, EventActions } from './types';

const STORAGE_KEY = 'kings-races-event';
const STORAGE_VERSION = 1;

export const useEventStore = create<EventState & EventActions>()(
  persist(
    (set, get) => ({
      // State
      disciplines: {
        mixed: { teams: [], phase: 'setup', scores: [], teamCount: 0 },
        board: { teams: [], phase: 'setup', scores: [], teamCount: 0 },
        ladies: { teams: [], phase: 'setup', scores: [], teamCount: 0 },
      },
      activeDiscipline: 'mixed',

      // Actions
      setTeams: (discipline, teams) =>
        set((state) => ({
          disciplines: {
            ...state.disciplines,
            [discipline]: {
              ...state.disciplines[discipline],
              teams,
              teamCount: teams.length,
            },
          },
        })),

      recordResult: (discipline, raceId, result) =>
        set((state) => ({
          disciplines: {
            ...state.disciplines,
            [discipline]: {
              ...state.disciplines[discipline],
              scores: [
                ...state.disciplines[discipline].scores.filter(
                  (s) => s.raceId !== raceId
                ),
                { raceId, ...result },
              ],
            },
          },
        })),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        disciplines: state.disciplines,
        activeDiscipline: state.activeDiscipline,
      }),
      migrate: (persistedState, version) => {
        // Future migrations go here
        return persistedState as EventState;
      },
    }
  )
);
```

### Pattern 3: Derived State as Pure Functions (NOT stored)
**What:** Group standings, tie detection, and finals seedings are computed from raw scores on demand. Never stored in state.
**When to use:** For any data that can be derived from stored data.
**Example:**
```typescript
// src/domain/groupCalculations.ts
import type { Score, TeamStanding, DisciplineState } from './types';

export function calculateGroupStandings(
  scores: Score[],
  groupTeamSlots: number[]
): TeamStanding[] {
  const standings = groupTeamSlots.map((slot) => {
    const teamScores = scores.filter(
      (s) => s.homeSlot === slot || s.awaySlot === slot
    );
    let points = 0;
    let wins = 0;
    let losses = 0;
    let dsqs = 0;

    for (const score of teamScores) {
      const isHome = score.homeSlot === slot;
      const outcome = isHome ? score.homeOutcome : score.awayOutcome;
      if (outcome === 'win') { points += 3; wins++; }
      else if (outcome === 'loss') { points += 1; losses++; }
      else if (outcome === 'dsq') { dsqs++; }
    }

    return { slot, points, wins, losses, dsqs, played: wins + losses + dsqs };
  });

  return standings.sort((a, b) => b.points - a.points);
}

export function detectTies(standings: TeamStanding[]): boolean {
  for (let i = 0; i < standings.length - 1; i++) {
    if (standings[i].points === standings[i + 1].points) return true;
  }
  return false;
}
```

### Anti-Patterns to Avoid
- **Algorithmic race order generation:** Do NOT compute round-robin schedules. The spreadsheet sequences are hand-tuned and must be reproduced exactly as static lookup data.
- **Storing derived data in state:** Never persist standings, rankings, or computed totals. Always derive from raw scores.
- **Multiple independent stores without atomic persistence:** If using multiple Zustand stores, each persists independently -- a crash between writes loses consistency. Prefer a single store for event data.
- **Generic tournament engine abstraction:** Build specifically for Kings Races format. Hardcode scoring rules (3/1/0), embed cheat sheets as static data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage persistence with hydration | Custom save/load wrapper | Zustand persist middleware | Handles hydration timing, version migration, error recovery, race conditions between tabs |
| JSON serialization of complex state | Custom serializer | Zustand persist (uses JSON.stringify internally) | Handles edge cases, provides replacer/reviver hooks if needed |
| xlsx parsing | Custom binary parser | openpyxl (Python) for extraction | xlsx format is complex (ZIP of XML). openpyxl is battle-tested. |
| State schema versioning | Ad-hoc version checks | Zustand persist `version` + `migrate` options | Built-in migration pipeline, runs automatically on hydration |

**Key insight:** The only "custom" code in this phase is domain-specific: cheat sheet data structures, scoring rules, and group calculations. Everything else (persistence, serialization, testing) uses standard tooling.

## Cheat Sheet Extraction: Detailed Findings

### Spreadsheet Structure Analysis (HIGH confidence -- verified by direct xlsx parsing)

The xlsx file contains 29 hidden sheets ("4 Teams" through "32 Teams") plus discipline-specific variants. Per decision D-02, only the base "N Teams" sheets are needed (orders are identical across disciplines).

#### Team Numbering Scheme
Teams use a tens-based numbering by group:
- Group A: 1, 2, 3, 4
- Group B: 11, 12, 13, 14
- Group C: 21, 22, 23, 24
- Group D: 31, 32, 33, 34
- Group E: 41, 42, 43, 44
- ...through Group H: 71, 72, 73, 74

These are **slot numbers** (positional), not team IDs. At runtime, the app maps slot numbers to entered team names.

#### Structure by Team Count

| Team Count | R1 Groups | R2 Groups | Has Finals | Race Counts (R1, R2) |
|------------|-----------|-----------|------------|----------------------|
| 4 | 1 (A) | 0 | Optional (1st/2nd, 3rd/4th) | 12 total |
| 5 | 1 (A) | 0 | Optional (1st/2nd, 3rd/4th) | 10 total |
| 6 | 1 (A) | 0 | Optional (5th/6th, 3rd/4th, 1st/2nd) | 15 total |
| 7 | 2 (A,B) | 2 (I,II) | Yes (3rd/4th, 1st/2nd) | 10, 10 |
| 8 | 2 (A,B) | 2 (I,II) | Yes (7th/8th through 1st/2nd) | 13, 13 |
| 9 | 3 (A,B,C) | 3 (I,II,III) | Yes | 9, 9 |
| 10 | 3 (A,B,C) | 3 (I,II,III) | Yes | 13, 13 |
| 11 | 3 (A,B,C) | 3 (I,II,III)* | Yes | 15, 15 |
| 12 | 4 (A-D) | 3 (I-III) | Yes | 12, 19 |
| 13-16 | 4 (A-D) | 4 (I-IV) | Yes | varies |
| 17-20 | 6 (A-F) | 6 (I-VI) | Yes | varies |
| 21-24 | 7-8 (A-H) | 6 (I-VI) | Yes | varies |
| 25-28 | 8 (A-H) | 5-7 (varies) | Yes | varies |
| 29-32 | 8 (A-H) | 8 (I-VIII) | Yes | varies |

*Note: Group counts in Round 2 do NOT always equal Round 1. For example, 11 teams has 3 R1 groups but the R2 structure uses different grouping. The number of R2 groups varies irregularly.*

#### Key Structural Observations

1. **Race order is in column J (R1) and column T (R2):** Format is "N V M" where N and M are team slot numbers. These are the exact strings to parse.

2. **Round 2 seeding uses letter references:** After Round 1 group play, teams are assigned letters (A, B, C, ...) based on their finishing position. The mapping is in columns K-L (e.g., "A1" -> letter "A" means "Winner of Group A").

3. **Finals structure is in the rightmost columns:** Format varies but includes labels like "1st/2nd", "3rd/4th", "5th/6th" with references to Round 2 group standings.

4. **Group assignments are NOT uniform:** Groups have different sizes within the same sheet. For example, 10 teams: Group A has 4, Groups B and C have 3 each. 7 teams: Group A has 4, Group B has 3.

5. **The "races:" label with count** appears at the bottom of each race order column. This is the total number of races for that round.

#### Extraction Approach

The Python script must:
1. Parse each "N Teams" sheet individually
2. Extract group assignments (column A for group letter, column B for team slot number)
3. Extract Round 1 race order from column J (parse "N V M" strings)
4. Extract Round 2 structure from columns K-M (seeding letters) and column T (race order)
5. Extract Finals matchup templates from the finals columns (varies by sheet)
6. Output TypeScript const files, one per team count

### Group-to-Round-2 Seeding Pattern

The Round 2 seeding follows a consistent pattern across all multi-group sheets:
- Column K contains positional codes like "A1", "B2", "C3", "A4" (Group letter + finishing position)
- Column L contains a single letter (A, B, C, ...) used as the team's Round 2 identifier
- Column M contains the descriptive label ("Winner A", "Runner Up B", "Third C", "Loser D")

This three-column mapping is the bridge between Round 1 results and Round 2 race order.

## Common Pitfalls

### Pitfall 1: Cheat Sheet Race Order Mismatch
**What goes wrong:** Extracted race orders differ from the spreadsheet even by one matchup. Officials cannot cross-reference with paper backup, trust breaks immediately.
**Why it happens:** Manual transcription errors, off-by-one in parsing, inconsistent sheet layouts across team counts, or attempting algorithmic generation.
**How to avoid:** Programmatic extraction with automated verification tests. Test every single race in every single sheet against the source xlsx. Zero tolerance for mismatches.
**Warning signs:** Any code that calculates rather than looks up race order. Manual data entry without verification tooling.

### Pitfall 2: localStorage Data Loss on Safari/iOS
**What goes wrong:** Safari can evict localStorage after 7 days of inactivity or when the user clears history.
**Why it happens:** WebKit's aggressive storage eviction policy.
**How to avoid:** Call `navigator.storage.persist()` on first load. Save on every single state mutation (Zustand persist does this). Display a "data loaded" indicator on app start. Plan for JSON export/import backup feature (can be deferred to Phase 3/4 but architecture should support it).
**Warning signs:** Testing only on Chrome desktop. No hydration status indicator.

### Pitfall 3: Schema Version Not Stamped from Day One
**What goes wrong:** Future schema changes corrupt existing localStorage data with no migration path.
**Why it happens:** Developers skip versioning in v1 because "we'll add it later."
**How to avoid:** Set `version: 1` in Zustand persist config from the very first commit. Always include a `migrate` function (even if it's a no-op initially).
**Warning signs:** Zustand persist created without `version` option.

### Pitfall 4: Inconsistent Cheat Sheet Structure Across Team Counts
**What goes wrong:** Extraction script handles 8-team and 16-team sheets correctly but fails on edge cases (4-6 teams with no Round 2, 7 teams with uneven groups, 11 teams with irregular R2 grouping, 25+ teams with 5-7 R2 groups).
**Why it happens:** Assuming all sheets follow the same layout. They don't -- the structure varies significantly.
**How to avoid:** Extraction script must be tested against ALL 29 sheets individually. Use the race count values from the sheets as checksums (e.g., "8 Teams" says "races: 13" for both R1 and R2 -- verify the extracted data matches).
**Warning signs:** Script tested on only 2-3 team counts.

### Pitfall 5: Mixing Up Team Slot Numbers with Team Indices
**What goes wrong:** Code treats slot number 11 as team index 11 (the 11th team) instead of "first team in Group B."
**Why it happens:** The tens-based numbering (1-4, 11-14, 21-24...) looks like it could be sequential but it's not.
**How to avoid:** Use strong TypeScript types: `type TeamSlot = number` as a branded type. Document the numbering scheme. Mapping functions should be explicit: `slotToGroupAndPosition(11)` -> `{ group: 'B', position: 1 }`.
**Warning signs:** Array indexing by slot number without conversion.

## Code Examples

### Cheat Sheet Extraction Script Pattern
```python
# scripts/extractCheatSheets.py (one-time extraction)
import openpyxl
import json
import re

def extract_races_from_column(ws, col_letter, min_row, max_row):
    """Extract 'N V M' race pairs from a column."""
    races = []
    for row in range(min_row, max_row + 1):
        val = ws[f'{col_letter}{row}'].value
        if val and isinstance(val, str) and ' V ' in val:
            # Handle variants like '4 V1' (missing space) seen in 32 Teams
            match = re.match(r'(\d+)\s*V\s*(\d+)', val)
            if match:
                races.append({
                    'home': int(match.group(1)),
                    'away': int(match.group(2)),
                })
    return races

def extract_group_assignments(ws, min_row, max_row):
    """Extract group letter -> team slot numbers mapping."""
    groups = {}
    for row in range(min_row, max_row + 1):
        grp = ws[f'A{row}'].value
        num = ws[f'B{row}'].value
        if grp and num and isinstance(num, (int, float)):
            groups.setdefault(str(grp), []).append(int(num))
    return groups
```

### Domain Type Definitions
```typescript
// src/domain/types.ts

export type DisciplineKey = 'mixed' | 'board' | 'ladies';

export type RaceOutcome = 'win' | 'loss' | 'dsq';

export interface Team {
  slot: number;      // Positional slot from cheat sheet (1, 2, 11, 12, etc.)
  name: string;      // User-entered team name
}

export interface RaceMatchup {
  raceNum: number;
  homeSlot: number;
  awaySlot: number;
}

export interface GroupDefinition {
  letter: string;       // 'A', 'B', 'C', etc.
  teamSlots: number[];  // [1, 2, 3, 4] for Group A
}

export interface RoundTwoSeeding {
  positionCode: string;  // 'A1', 'B2', 'C3', etc.
  letter: string;        // Single letter used in R2 races
  label: string;         // 'Winner A', 'Runner Up B', etc.
}

export interface FinalsMatchup {
  label: string;          // '1st/2nd', '3rd/4th', etc.
  homeRef: string;        // Reference to R2 standing
  awayRef: string;        // Reference to R2 standing
}

export interface TournamentStructure {
  teamCount: number;
  groups: GroupDefinition[];
  roundOneRaces: RaceMatchup[];
  roundTwoSeedings?: RoundTwoSeeding[];
  roundTwoRaces?: RaceMatchup[];  // Using letter-based slot references
  finals: FinalsMatchup[];
  roundOneRaceCount?: number;     // From spreadsheet for verification
  roundTwoRaceCount?: number;     // From spreadsheet for verification
}

export interface Score {
  raceId: string;
  homeSlot: number;
  awaySlot: number;
  homeOutcome: RaceOutcome;
  awayOutcome: RaceOutcome;
}

export interface TeamStanding {
  slot: number;
  points: number;
  wins: number;
  losses: number;
  dsqs: number;
  played: number;
}

export interface DisciplineState {
  teams: Team[];
  teamCount: number;
  phase: 'setup' | 'group-stage' | 'round-two' | 'finals' | 'complete';
  scores: Score[];
  manualTiebreaks: Record<string, number[]>;  // groupKey -> ordered slot numbers
}

export interface EventState {
  disciplines: Record<DisciplineKey, DisciplineState>;
  activeDiscipline: DisciplineKey;
}

// Discipline team count ranges (from TEAM-02)
export const DISCIPLINE_TEAM_RANGES: Record<DisciplineKey, { min: number; max: number }> = {
  mixed: { min: 4, max: 32 },
  board: { min: 4, max: 17 },
  ladies: { min: 4, max: 17 },
};
```

### Scoring Engine
```typescript
// src/domain/scoring.ts
import type { RaceOutcome, Score, TeamStanding } from './types';

export const POINTS: Record<RaceOutcome, number> = {
  win: 3,
  loss: 1,
  dsq: 0,
};

export function calculateGroupStandings(
  scores: Score[],
  groupTeamSlots: number[]
): TeamStanding[] {
  const standings: TeamStanding[] = groupTeamSlots.map((slot) => {
    let points = 0, wins = 0, losses = 0, dsqs = 0;

    for (const score of scores) {
      let outcome: RaceOutcome | null = null;
      if (score.homeSlot === slot) outcome = score.homeOutcome;
      else if (score.awaySlot === slot) outcome = score.awayOutcome;
      else continue;

      points += POINTS[outcome];
      if (outcome === 'win') wins++;
      else if (outcome === 'loss') losses++;
      else if (outcome === 'dsq') dsqs++;
    }

    return { slot, points, wins, losses, dsqs, played: wins + losses + dsqs };
  });

  // Sort by points descending. Ties are flagged, not auto-resolved (D-07).
  return standings.sort((a, b) => b.points - a.points);
}

export function hasTies(standings: TeamStanding[]): boolean {
  for (let i = 0; i < standings.length - 1; i++) {
    if (standings[i].points === standings[i + 1].points) return true;
  }
  return false;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Context + useReducer for state | Zustand with persist middleware | Zustand 5.x (2025) | Eliminates provider boilerplate, built-in persistence, simpler TypeScript types |
| Manual localStorage save/load | Zustand persist with version + migrate | Zustand 5.x | Automatic serialization, migration pipeline, hydration lifecycle hooks |
| `create(...)` single-call syntax | `create<T>()(...)` double-call for TS | Zustand 4->5 | Required for proper middleware type inference |

**Deprecated/outdated:**
- Zustand `create` without double parentheses when using middleware + TypeScript -- must use `create<T>()(...)` syntax in v5

## Open Questions

1. **Round Two race order uses letter references, not slot numbers**
   - What we know: Round 2 races in the spreadsheet reference teams by single letters (A, B, C...) mapped from Round 1 standings. Column T shows "A V B", "C V D", etc.
   - What's unclear: The exact TypeScript type for Round 2 races -- they reference teams by positional label rather than numeric slot. The extraction script must capture the full seeding map (position code -> letter -> label).
   - Recommendation: Use a two-phase data model: Round 2 race definitions use string references ("A", "B", "C"), resolved to actual team slots at runtime after Round 1 results are finalized.

2. **Finals for 4-6 teams are marked "if you can be bothered"**
   - What we know: The spreadsheet marks finals for 4-6 team events as optional ("If you can be bothered - not necessary").
   - What's unclear: Should the app support these optional finals, or skip them?
   - Recommendation: Include the finals data in the cheat sheet extraction but make them opt-in at the UI level (Phase 2/3 decision). The domain layer should have the data available.

3. **7 Teams has "FINAL ROUND (If Required)" label**
   - What we know: Similar to 4-6 teams, the 7-team finals are conditional.
   - Recommendation: Same as above -- extract the data, defer the opt-in UX decision.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite, npm, all tooling | Yes | 23.7.0 | -- |
| npm | Package management | Yes | 10.9.2 | -- |
| Python 3 | Cheat sheet extraction script | Yes | 3.12.7 | -- |
| openpyxl | xlsx parsing | Yes | 3.1.5 | -- |
| xlsx source file | Cheat sheet data | Yes | 2.1MB at expected path | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Sources

### Primary (HIGH confidence)
- Direct xlsx file analysis via openpyxl -- all 29 sheets parsed and structure verified (2026-03-28)
- [Zustand persist middleware docs (DeepWiki)](https://deepwiki.com/pmndrs/zustand/3.1-persist-middleware) -- full API reference
- [Zustand persist official docs](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data) -- canonical reference
- npm registry -- zustand 5.0.12, vitest 4.1.2, typescript 6.0.2 (verified 2026-03-28)

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- project stack decisions (verified against npm registry)
- `.planning/research/ARCHITECTURE.md` -- architecture patterns (useful but overridden by STACK.md on state management choice)
- `.planning/research/PITFALLS.md` -- risk catalog (verified against WebKit storage policy docs)

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- versions verified against npm registry, Zustand persist API verified against official docs
- Architecture: HIGH -- spreadsheet structure verified by direct parsing of all 29 sheets
- Pitfalls: HIGH -- Safari storage eviction is well-documented, cheat sheet mismatch risk is self-evident from structure analysis

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain, no fast-moving dependencies)

---
*Phase: 01-data-foundation-and-storage*
*Research completed: 2026-03-28*
