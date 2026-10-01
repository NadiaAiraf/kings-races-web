// Kept out of eventStore.ts so eventDoc and the rules tests can build initial
// state without creating the zustand store.
import type { DisciplineKey, DisciplineState } from '../domain/types';

export type EventDisciplines = Record<DisciplineKey, DisciplineState>;

export const createInitialDisciplineState = (): DisciplineState => ({
  teams: [],
  teamCount: 0,
  phase: 'setup',
  scores: [],
  manualTiebreaks: {},
});

export const createInitialDisciplines = (): EventDisciplines => ({
  mixed: createInitialDisciplineState(),
  board: createInitialDisciplineState(),
  ladies: createInitialDisciplineState(),
});
