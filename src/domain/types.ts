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
  teamSlots: number[];  // e.g., [1, 2, 3, 4] for Group A
}

export interface RoundTwoGroupDefinition {
  groupNum: string;        // 'I', 'II', 'III', etc.
  seedingEntries: RoundTwoSeeding[];
  races: RoundTwoRace[];
}

export interface RoundTwoSeeding {
  positionCode: string;  // 'A1', 'B2', 'C3', etc.
  letter: string;        // Single letter used in R2 races
  label: string;         // 'Winner A', 'Runner Up B', etc.
}

export interface RoundTwoRace {
  raceNum: number;
  homeLetter: string;    // Letter reference (e.g., 'A')
  awayLetter: string;    // Letter reference (e.g., 'B')
}

export interface FinalsMatchup {
  label: string;          // '1st/2nd', '3rd/4th', etc.
  homeRef: string;        // Reference to R2 standing (e.g., 'Winner Group I')
  awayRef: string;        // Reference to R2 standing (e.g., 'Second Group I')
}

export interface TournamentStructure {
  teamCount: number;
  seedMap: number[];
  groups: GroupDefinition[];
  roundOneRaces: RaceMatchup[];
  roundTwoGroups?: RoundTwoGroupDefinition[];
  finals: FinalsMatchup[];
  roundOneRaceCount: number;     // Expected count from spreadsheet for verification
  roundTwoRaceCount?: number;    // Expected count from spreadsheet for verification
}

export interface Score {
  raceId: string;         // Unique key like "r1-3" (round 1, race 3)
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
  manualTiebreaks: Record<string, number[]>;  // groupKey -> ordered slot numbers (per D-07)
}

export interface EventState {
  disciplines: Record<DisciplineKey, DisciplineState>;
  activeDiscipline: DisciplineKey;
}

// Discipline team count ranges per TEAM-02
export const DISCIPLINE_TEAM_RANGES: Record<DisciplineKey, { min: number; max: number }> = {
  mixed: { min: 4, max: 32 },
  board: { min: 4, max: 17 },
  ladies: { min: 4, max: 17 },
};
