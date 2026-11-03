// Orders the races of every discipline into one list, so officials running
// all three disciplines on one slope can work down a single list.
import type { DisciplineKey, DisciplineState, RaceMatchup } from './types';
import { getCheatSheet } from './cheatSheets';
import { isResultsOnly } from './roundPlacings';

export type CombinedRound = 'r1' | 'r2' | 'finals';

export const DEFAULT_COMBINED_ROUNDS: readonly CombinedRound[] = ['r1', 'r2', 'finals'];

export const COMBINED_ROUND_LABELS: Record<CombinedRound, string> = {
  r1: 'Round 1',
  r2: 'Round 2',
  finals: 'Finals',
};

/** Mixed, then Ladies, then Board. Differs from the tab order on purpose. */
export const DEFAULT_COMBINED_ORDER: readonly DisciplineKey[] = ['mixed', 'ladies', 'board'];

/**
 * How the combined list is ordered. Future strategies (e.g. interleaved)
 * are added as new members of this union and a new case in orderCombinedRaces.
 */
export type CombinedRaceOrdering = {
  kind: 'round-sequential';
  rounds: readonly CombinedRound[];
  disciplines: readonly DisciplineKey[];
};

export const DEFAULT_COMBINED_ORDERING: CombinedRaceOrdering = {
  kind: 'round-sequential',
  rounds: DEFAULT_COMBINED_ROUNDS,
  disciplines: DEFAULT_COMBINED_ORDER,
};

/** Race ids per discipline and round, each list in the order it is run. */
export type RaceIdsByDiscipline = Partial<
  Record<DisciplineKey, Partial<Record<CombinedRound, readonly string[]>>>
>;

export interface CombinedRace {
  /** Unique across disciplines, unlike raceId. */
  key: string;
  discipline: DisciplineKey;
  round: CombinedRound;
  raceId: string;
}

export function combinedRaceKey(discipline: DisciplineKey, raceId: string): string {
  return `${discipline}:${raceId}`;
}

export function orderCombinedRaces(
  ids: RaceIdsByDiscipline,
  ordering: CombinedRaceOrdering = DEFAULT_COMBINED_ORDERING,
): CombinedRace[] {
  switch (ordering.kind) {
    case 'round-sequential':
      return ordering.rounds.flatMap((round) =>
        ordering.disciplines.flatMap((discipline) =>
          (ids[discipline]?.[round] ?? []).map((raceId) => ({
            key: combinedRaceKey(discipline, raceId),
            discipline,
            round,
            raceId,
          })),
        ),
      );
  }
}

/** Disciplines with a race schedule: at least 4 teams and not results-only. */
function scheduledDisciplines(
  disciplines: Record<DisciplineKey, DisciplineState>,
): [DisciplineKey, DisciplineState][] {
  return (Object.entries(disciplines) as [DisciplineKey, DisciplineState][]).filter(
    ([, state]) => state.teamCount >= 4 && !isResultsOnly(state),
  );
}

/**
 * Round 1 races of every discipline that has a race schedule. Results-only
 * disciplines have none; stopped-early ones still show their races read-only.
 */
export function r1RacesByDiscipline(
  disciplines: Record<DisciplineKey, DisciplineState>,
): Partial<Record<DisciplineKey, readonly RaceMatchup[]>> {
  const result: Partial<Record<DisciplineKey, readonly RaceMatchup[]>> = {};
  for (const [discipline, state] of scheduledDisciplines(disciplines)) {
    result[discipline] = getCheatSheet(state.teamCount).roundOneRaces;
  }
  return result;
}

/**
 * Round 1 and Round 2 race ids of every discipline with a race schedule, for
 * progress. Finals are left out, as in a discipline's own progress bar.
 */
export function scheduledRaceIds(
  disciplines: Record<DisciplineKey, DisciplineState>,
): RaceIdsByDiscipline {
  const result: RaceIdsByDiscipline = {};
  for (const [discipline, state] of scheduledDisciplines(disciplines)) {
    const structure = getCheatSheet(state.teamCount);
    result[discipline] = {
      r1: structure.roundOneRaces.map((r) => `r1-${r.raceNum}`),
      r2: (structure.roundTwoGroups ?? []).flatMap((g) =>
        g.races.map((r) => `r2-${g.groupNum}-${r.raceNum}`),
      ),
    };
  }
  return result;
}

/** Combined keys of every recorded score in every discipline. */
export function scoredCombinedKeys(
  disciplines: Record<DisciplineKey, DisciplineState>,
): Set<string> {
  const keys = new Set<string>();
  for (const [discipline, state] of Object.entries(disciplines) as [DisciplineKey, DisciplineState][]) {
    for (const score of state.scores) keys.add(combinedRaceKey(discipline, score.raceId));
  }
  return keys;
}

/** The first unscored race, after `afterKey` when given. */
export function findNextUnscoredRace(
  races: readonly CombinedRace[],
  scoredKeys: ReadonlySet<string>,
  afterKey: string | null,
): CombinedRace | null {
  const start = afterKey === null ? 0 : races.findIndex((r) => r.key === afterKey) + 1;
  for (let i = start; i < races.length; i++) {
    if (!scoredKeys.has(races[i].key)) return races[i];
  }
  return null;
}

export function combinedProgress(
  races: readonly CombinedRace[],
  scoredKeys: ReadonlySet<string>,
): { scored: number; total: number } {
  return {
    scored: races.filter((r) => scoredKeys.has(r.key)).length,
    total: races.length,
  };
}
