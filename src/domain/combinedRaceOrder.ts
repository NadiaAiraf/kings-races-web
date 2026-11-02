// Orders the Round 1 races of every discipline into one list, so officials
// running all three disciplines on one slope can work down a single list.
import type { DisciplineKey, DisciplineState, RaceMatchup } from './types';
import { getCheatSheet } from './cheatSheets';
import { isResultsOnly } from './roundPlacings';

/** Mixed, then Ladies, then Board. Differs from the tab order on purpose. */
export const DEFAULT_COMBINED_ORDER: readonly DisciplineKey[] = ['mixed', 'ladies', 'board'];

/**
 * How the combined list is ordered. Future strategies (e.g. interleaved)
 * are added as new members of this union and a new case in orderCombinedRaces.
 */
export type CombinedRaceOrdering = {
  kind: 'discipline-sequential';
  disciplines: readonly DisciplineKey[];
};

export const DEFAULT_COMBINED_ORDERING: CombinedRaceOrdering = {
  kind: 'discipline-sequential',
  disciplines: DEFAULT_COMBINED_ORDER,
};

export interface CombinedRace {
  /** Unique across disciplines, unlike raceId. */
  key: string;
  discipline: DisciplineKey;
  raceId: string;
  race: RaceMatchup;
}

export function combinedRaceKey(discipline: DisciplineKey, raceId: string): string {
  return `${discipline}:${raceId}`;
}

export function orderCombinedRaces(
  racesByDiscipline: Partial<Record<DisciplineKey, readonly RaceMatchup[]>>,
  ordering: CombinedRaceOrdering = DEFAULT_COMBINED_ORDERING,
): CombinedRace[] {
  switch (ordering.kind) {
    case 'discipline-sequential':
      return ordering.disciplines.flatMap((discipline) =>
        (racesByDiscipline[discipline] ?? []).map((race) => {
          const raceId = `r1-${race.raceNum}`;
          return { key: combinedRaceKey(discipline, raceId), discipline, raceId, race };
        }),
      );
  }
}

/**
 * Round 1 races of every discipline that has a race schedule. Results-only
 * disciplines have none; stopped-early ones still show their races read-only.
 */
export function r1RacesByDiscipline(
  disciplines: Record<DisciplineKey, DisciplineState>,
): Partial<Record<DisciplineKey, readonly RaceMatchup[]>> {
  const result: Partial<Record<DisciplineKey, readonly RaceMatchup[]>> = {};
  for (const [discipline, state] of Object.entries(disciplines) as [DisciplineKey, DisciplineState][]) {
    if (state.teamCount < 4 || isResultsOnly(state)) continue;
    result[discipline] = getCheatSheet(state.teamCount).roundOneRaces;
  }
  return result;
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

export function combinedR1Progress(
  races: readonly CombinedRace[],
  scoredKeys: ReadonlySet<string>,
): { scored: number; total: number } {
  return {
    scored: races.filter((r) => scoredKeys.has(r.key)).length,
    total: races.length,
  };
}
