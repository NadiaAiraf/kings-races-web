import { create } from 'zustand';
import type { DisciplineKey, DisciplineState, Team, Score } from '../domain/types';
import type { EventStoreState, EventStoreActions } from './types';

// The store holds the currently open event. It is hydrated from Firestore by
// startEventSync (src/events/eventSync.ts) and is deliberately not persisted
// to localStorage: Firestore's persistent cache provides offline storage, and
// the pre-Firebase app's 'kings-races-event' localStorage key is left intact.

export const createInitialDisciplineState = (): DisciplineState => ({
  teams: [],
  teamCount: 0,
  phase: 'setup',
  scores: [],
  manualTiebreaks: {},
});

const createInitialState = (): EventStoreState => ({
  disciplines: {
    mixed: createInitialDisciplineState(),
    board: createInitialDisciplineState(),
    ladies: createInitialDisciplineState(),
  },
  activeDiscipline: 'mixed',
});

export const useEventStore = create<EventStoreState & EventStoreActions>()(
  (set) => ({
    ...createInitialState(),

    setTeams: (discipline: DisciplineKey, teams: Team[]) =>
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

    recordResult: (discipline: DisciplineKey, score: Score) =>
      set((state) => ({
        disciplines: {
          ...state.disciplines,
          [discipline]: {
            ...state.disciplines[discipline],
            scores: [
              ...state.disciplines[discipline].scores.filter(
                (s) => s.raceId !== score.raceId
              ),
              score,
            ],
          },
        },
      })),

    clearResult: (discipline: DisciplineKey, raceId: string) =>
      set((state) => ({
        disciplines: {
          ...state.disciplines,
          [discipline]: {
            ...state.disciplines[discipline],
            scores: state.disciplines[discipline].scores.filter(
              (s) => s.raceId !== raceId
            ),
          },
        },
      })),

    setActiveDiscipline: (discipline: DisciplineKey) =>
      set({ activeDiscipline: discipline }),

    setDisciplinePhase: (
      discipline: DisciplineKey,
      phase: DisciplineState['phase']
    ) =>
      set((state) => ({
        disciplines: {
          ...state.disciplines,
          [discipline]: {
            ...state.disciplines[discipline],
            phase,
          },
        },
      })),

    setManualTiebreak: (
      discipline: DisciplineKey,
      groupKey: string,
      orderedSlots: number[]
    ) =>
      set((state) => ({
        disciplines: {
          ...state.disciplines,
          [discipline]: {
            ...state.disciplines[discipline],
            manualTiebreaks: {
              ...state.disciplines[discipline].manualTiebreaks,
              [groupKey]: orderedSlots,
            },
          },
        },
      })),

    resetDiscipline: (discipline: DisciplineKey) =>
      set((state) => ({
        disciplines: {
          ...state.disciplines,
          [discipline]: createInitialDisciplineState(),
        },
      })),

    resetEvent: () => set(createInitialState()),
  })
);
