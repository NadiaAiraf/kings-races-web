// Orders the races of every discipline into one list, so officials running
// all three disciplines on one slope can work down a single list. Round 1 and
// Round 2 follow the event's race order option (Standard, Ladies/Board mixed
// or Northern); Finals always run Board, Ladies, Mixed.
import type { DisciplineKey, DisciplineState, RaceMatchup } from './types';
import { getCheatSheet } from './cheatSheets';
import { getRaceOrderBlocks } from './cheatSheets/raceOrderBlocks';
import { isResultsOnly } from './roundPlacings';
import { DEFAULT_RACE_ORDER, type RaceOrderOption } from './raceOrderOption';

export type CombinedRound = 'r1' | 'r2' | 'finals';

export const DEFAULT_COMBINED_ROUNDS: readonly CombinedRound[] = ['r1', 'r2', 'finals'];

export const COMBINED_ROUND_LABELS: Record<CombinedRound, string> = {
  r1: 'Round 1',
  r2: 'Round 2',
  finals: 'Finals',
};

/** Mixed, then Ladies, then Board. Differs from the tab order on purpose. */
export const DEFAULT_COMBINED_ORDER: readonly DisciplineKey[] = ['mixed', 'ladies', 'board'];

/** Finals run Board, then Ladies, then Mixed in every race order option (the user's choice). */
export const FINALS_DISCIPLINE_ORDER: readonly DisciplineKey[] = ['board', 'ladies', 'mixed'];

/** The discipline order a round's sections are shown in. */
export function disciplineOrderFor(round: CombinedRound): readonly DisciplineKey[] {
  return round === 'finals' ? FINALS_DISCIPLINE_ORDER : DEFAULT_COMBINED_ORDER;
}

export {
  DEFAULT_RACE_ORDER,
  RACE_ORDER_LABELS,
  RACE_ORDER_OPTIONS,
  isRaceOrderOption,
  type RaceOrderOption,
} from './raceOrderOption';

/** Race ids per discipline and round, each list in the order it is run. */
export type RaceIdsByDiscipline = Partial<
  Record<DisciplineKey, Partial<Record<CombinedRound, readonly string[]>>>
>;

/** Cheat sheet block sizes per discipline for Round 1 and Round 2. */
export type RaceBlocksByDiscipline = Partial<
  Record<DisciplineKey, Partial<Record<'r1' | 'r2', readonly number[]>>>
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

/**
 * Consecutive slices of `ids` by `sizes`, with any remainder as a last block.
 * Empty blocks are dropped; no sizes means one block.
 */
function splitIntoBlocks(ids: readonly string[], sizes: readonly number[] | undefined): string[][] {
  if (!sizes || sizes.length === 0) return ids.length > 0 ? [[...ids]] : [];
  const blocks: string[][] = [];
  let start = 0;
  for (const size of sizes) {
    blocks.push(ids.slice(start, start + size));
    start += size;
  }
  blocks.push(ids.slice(start));
  return blocks.filter((b) => b.length > 0);
}

/** `parts` chunks in order, the first ones taking the extra ids. Empty chunks are kept. */
function splitEvenly(ids: readonly string[], parts: number): string[][] {
  const base = Math.floor(ids.length / parts);
  const extra = ids.length % parts;
  const chunks: string[][] = [];
  let start = 0;
  for (let i = 0; i < parts; i++) {
    const size = base + (i < extra ? 1 : 0);
    chunks.push(ids.slice(start, start + size));
    start += size;
  }
  return chunks;
}

/** One round's races across disciplines in the order they are run. */
export function orderRoundRaces(
  round: CombinedRound,
  ids: RaceIdsByDiscipline,
  option: RaceOrderOption = DEFAULT_RACE_ORDER,
  blocks: RaceBlocksByDiscipline = {},
): CombinedRace[] {
  const idsOf = (d: DisciplineKey) => ids[d]?.[round] ?? [];
  const tag = (d: DisciplineKey, list: readonly string[]): CombinedRace[] =>
    list.map((raceId) => ({ key: combinedRaceKey(d, raceId), discipline: d, round, raceId }));

  if (round === 'finals') {
    return FINALS_DISCIPLINE_ORDER.flatMap((d) => tag(d, idsOf(d)));
  }

  switch (option) {
    case 'standard':
      return DEFAULT_COMBINED_ORDER.flatMap((d) => tag(d, idsOf(d)));
    case 'ladies-board-blocks': {
      const ladies = splitIntoBlocks(idsOf('ladies'), blocks.ladies?.[round]);
      const board = splitIntoBlocks(idsOf('board'), blocks.board?.[round]);
      const result = tag('mixed', idsOf('mixed'));
      for (let i = 0; i < Math.max(ladies.length, board.length); i++) {
        if (ladies[i]) result.push(...tag('ladies', ladies[i]));
        if (board[i]) result.push(...tag('board', board[i]));
      }
      return result;
    }
    case 'northern': {
      const m = splitEvenly(idsOf('mixed'), 3);
      const l = splitEvenly(idsOf('ladies'), 3);
      const b = splitEvenly(idsOf('board'), 6);
      const sequence: [DisciplineKey, string[]][] = [
        ['mixed', m[0]], ['board', b[0]], ['ladies', l[0]], ['board', b[1]],
        ['mixed', m[1]], ['board', b[2]], ['ladies', l[1]], ['board', b[3]],
        ['mixed', m[2]], ['board', b[4]], ['ladies', l[2]], ['board', b[5]],
      ];
      return sequence.flatMap(([d, chunk]) => tag(d, chunk));
    }
    default: {
      const unknown: never = option;
      throw new Error(`Unknown race order: ${String(unknown)}`);
    }
  }
}

/** Every Round 1, then every Round 2, then every Finals race, each round ordered by `option`. */
export function orderCombinedRaces(
  ids: RaceIdsByDiscipline,
  option: RaceOrderOption = DEFAULT_RACE_ORDER,
  blocks: RaceBlocksByDiscipline = {},
): CombinedRace[] {
  return DEFAULT_COMBINED_ROUNDS.flatMap((round) => orderRoundRaces(round, ids, option, blocks));
}

/** Disciplines with a race schedule: at least 4 teams and not results-only. */
function scheduledDisciplines(
  disciplines: Record<DisciplineKey, DisciplineState>,
): [DisciplineKey, DisciplineState][] {
  return (Object.entries(disciplines) as [DisciplineKey, DisciplineState][]).filter(
    ([, state]) => state.teamCount >= 4 && !isResultsOnly(state),
  );
}

/** Cheat sheet block sizes of every discipline that has a race schedule. */
export function raceOrderBlocksFor(
  disciplines: Record<DisciplineKey, DisciplineState>,
): RaceBlocksByDiscipline {
  const result: RaceBlocksByDiscipline = {};
  for (const [discipline, state] of scheduledDisciplines(disciplines)) {
    const blocks = getRaceOrderBlocks(state.teamCount);
    if (blocks) result[discipline] = { r1: blocks.r1, r2: blocks.r2 };
  }
  return result;
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
