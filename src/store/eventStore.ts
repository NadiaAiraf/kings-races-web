import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DisciplineKey, DisciplineState, Team, Score } from '../domain/types';
import type { EventStoreState, EventStoreActions } from './types';

const STORAGE_KEY = 'kings-races-event';
const STORAGE_VERSION = 1;

const createInitialDisciplineState = (): DisciplineState => ({
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
  persist(
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

      resetEvent: () => set(createInitialState()),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        disciplines: state.disciplines,
        activeDiscipline: state.activeDiscipline,
      }),
      migrate: (persistedState, _version) => {
        // v1: no migrations needed. Future schema changes add cases here.
        return persistedState as EventStoreState;
      },
    }
  )
);
