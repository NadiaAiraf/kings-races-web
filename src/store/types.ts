import type { DisciplineKey, DisciplineState, Team, Score } from '../domain/types';
import type { EventState } from '../domain/types';

export type EventStoreState = EventState;

export interface EventStoreActions {
  setTeams: (discipline: DisciplineKey, teams: Team[]) => void;
  recordResult: (discipline: DisciplineKey, score: Score) => void;
  clearResult: (discipline: DisciplineKey, raceId: string) => void;
  setActiveDiscipline: (discipline: DisciplineKey) => void;
  setDisciplinePhase: (discipline: DisciplineKey, phase: DisciplineState['phase']) => void;
  setManualTiebreak: (discipline: DisciplineKey, groupKey: string, orderedSlots: number[]) => void;
  /** place null removes the official's place so the computed one applies. */
  setPlacing: (discipline: DisciplineKey, slot: number, place: number | null) => void;
  /** Empty or whitespace-only text removes the note. */
  setNote: (discipline: DisciplineKey, raceId: string, note: string) => void;
  resetDiscipline: (discipline: DisciplineKey) => void;
  resetEvent: () => void;
}
