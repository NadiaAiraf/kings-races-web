import type { DisciplineKey, DisciplineState, Team, Score } from '../domain/types';
import type { EventState } from '../domain/types';

export interface EventStoreState extends EventState {}

export interface EventStoreActions {
  setTeams: (discipline: DisciplineKey, teams: Team[]) => void;
  recordResult: (discipline: DisciplineKey, score: Score) => void;
  clearResult: (discipline: DisciplineKey, raceId: string) => void;
  setActiveDiscipline: (discipline: DisciplineKey) => void;
  setDisciplinePhase: (discipline: DisciplineKey, phase: DisciplineState['phase']) => void;
  setManualTiebreak: (discipline: DisciplineKey, groupKey: string, orderedSlots: number[]) => void;
  resetDiscipline: (discipline: DisciplineKey) => void;
  resetEvent: () => void;
}
