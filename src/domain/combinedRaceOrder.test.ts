import { describe, it, expect } from 'vitest';
import {
  COMBINED_ROUND_LABELS,
  FINALS_DISCIPLINE_ORDER,
  RACE_ORDER_LABELS,
  RACE_ORDER_OPTIONS,
  combinedProgress,
  combinedRaceKey,
  disciplineOrderFor,
  findNextUnscoredRace,
  isRaceOrderOption,
  orderCombinedRaces,
  orderRoundRaces,
  raceOrderBlocksFor,
  type RaceOrderOption,
  r1RacesByDiscipline,
  scheduledRaceIds,
  scoredCombinedKeys,
} from './combinedRaceOrder';
import { createInitialDisciplines } from '../store/initialState';
import { playedDiscipline } from './__fixtures__/playedDiscipline';
import { getCheatSheet } from './cheatSheets';

describe('orderCombinedRaces', () => {
  it('lists every Round 1, then every Round 2, then every Finals, with Finals run Board, Ladies, Mixed', () => {
    const result = orderCombinedRaces({
      mixed: { r1: ['r1-1', 'r1-2'], r2: ['r2-I-1'], finals: ['fin-0'] },
      ladies: { r1: ['r1-1'], r2: [], finals: ['fin-0'] },
      board: { r1: ['r1-1'] },
    });

    expect(result.map((r) => r.key)).toEqual([
      'mixed:r1-1',
      'mixed:r1-2',
      'ladies:r1-1',
      'board:r1-1',
      'mixed:r2-I-1',
      'ladies:fin-0',
      'mixed:fin-0',
    ]);
  });

  it('tags each entry with its discipline, round and raceId', () => {
    const [first] = orderCombinedRaces({ ladies: { r2: ['r2-II-3'] } });

    expect(first).toEqual({ key: 'ladies:r2-II-3', discipline: 'ladies', round: 'r2', raceId: 'r2-II-3' });
  });

  it('keeps the given id order within a discipline and round', () => {
    const result = orderCombinedRaces({ mixed: { r2: ['r2-II-1', 'r2-I-1', 'r2-I-2'] } });

    expect(result.map((r) => r.raceId)).toEqual(['r2-II-1', 'r2-I-1', 'r2-I-2']);
  });

  it('gives unique keys even when raceIds collide across disciplines', () => {
    const result = orderCombinedRaces({ mixed: { r1: ['r1-1'] }, ladies: { r1: ['r1-1'] } });

    expect(new Set(result.map((r) => r.key)).size).toBe(2);
  });

  it('returns an empty list for empty input', () => {
    expect(orderCombinedRaces({})).toEqual([]);
  });

  it('applies the given option and blocks to Round 1 and Round 2', () => {
    const result = orderCombinedRaces(
      {
        mixed: { r1: ['m1'], r2: ['mr2'] },
        ladies: { r1: ['l1', 'l2'], r2: ['lr2'] },
        board: { r1: ['b1', 'b2'], finals: ['bf'] },
      },
      'ladies-board-blocks',
      { ladies: { r1: [1, 1] }, board: { r1: [1, 1] } },
    );

    expect(result.map((r) => r.raceId)).toEqual(['m1', 'l1', 'b1', 'l2', 'b2', 'mr2', 'lr2', 'bf']);
  });
});

describe('COMBINED_ROUND_LABELS', () => {
  it('names each round', () => {
    expect(COMBINED_ROUND_LABELS).toEqual({ r1: 'Round 1', r2: 'Round 2', finals: 'Finals' });
  });
});

describe('combinedRaceKey', () => {
  it('joins discipline and raceId', () => {
    expect(combinedRaceKey('board', 'r1-3')).toBe('board:r1-3');
  });
});

describe('r1RacesByDiscipline', () => {
  it('uses the cheat sheet Round 1 races for a discipline with teams', () => {
    const disciplines = { ...createInitialDisciplines(), mixed: playedDiscipline(8, { phase: 'group-stage' }) };

    const result = r1RacesByDiscipline(disciplines);

    expect(result.mixed).toEqual(getCheatSheet(8).roundOneRaces);
  });

  it('leaves out a discipline with fewer than 4 teams', () => {
    const result = r1RacesByDiscipline(createInitialDisciplines());

    expect(result).toEqual({});
  });

  it('leaves out a results-only discipline', () => {
    const ladies = { ...playedDiscipline(6), scores: [] };
    const disciplines = { ...createInitialDisciplines(), ladies };

    const result = r1RacesByDiscipline(disciplines);

    expect(result.ladies).toBeUndefined();
  });

  it('includes a stopped-early discipline', () => {
    const played = playedDiscipline(8);
    const board = { ...played, scores: played.scores.slice(0, 3) };
    const disciplines = { ...createInitialDisciplines(), board };

    const result = r1RacesByDiscipline(disciplines);

    expect(result.board).toEqual(getCheatSheet(8).roundOneRaces);
  });
});

describe('scheduledRaceIds', () => {
  const sheet8 = getCheatSheet(8);
  const r2Count8 = (sheet8.roundTwoGroups ?? []).reduce((n, g) => n + g.races.length, 0);

  it('lists Round 1 ids from the cheat sheet', () => {
    const disciplines = { ...createInitialDisciplines(), mixed: playedDiscipline(8, { phase: 'group-stage' }) };

    const result = scheduledRaceIds(disciplines);

    expect(result.mixed?.r1).toEqual(sheet8.roundOneRaces.map((r) => `r1-${r.raceNum}`));
  });

  it('lists every Round 2 race of every group', () => {
    const disciplines = { ...createInitialDisciplines(), mixed: playedDiscipline(8, { phase: 'group-stage' }) };

    const result = scheduledRaceIds(disciplines);

    expect(r2Count8).toBeGreaterThan(0);
    expect(result.mixed?.r2).toHaveLength(r2Count8);
    expect(result.mixed?.r2?.every((id) => /^r2-[^-]+-\d+$/.test(id))).toBe(true);
  });

  it('has no Round 2 ids for a format without Round 2', () => {
    const disciplines = { ...createInitialDisciplines(), ladies: playedDiscipline(4, { phase: 'group-stage' }) };

    const result = scheduledRaceIds(disciplines);

    expect(result.ladies?.r1).toHaveLength(getCheatSheet(4).roundOneRaces.length);
    expect(result.ladies?.r2 ?? []).toEqual([]);
  });

  it('never lists finals ids', () => {
    const disciplines = { ...createInitialDisciplines(), mixed: playedDiscipline(8) };

    expect(scheduledRaceIds(disciplines).mixed?.finals).toBeUndefined();
  });

  it('leaves out disciplines with fewer than 4 teams and results-only ones', () => {
    const disciplines = { ...createInitialDisciplines(), ladies: { ...playedDiscipline(6), scores: [] } };

    expect(scheduledRaceIds(disciplines)).toEqual({});
  });

  it('includes a stopped-early discipline', () => {
    const played = playedDiscipline(8);
    const board = { ...played, scores: played.scores.slice(0, 3) };

    const result = scheduledRaceIds({ ...createInitialDisciplines(), board });

    expect(result.board?.r1).toHaveLength(sheet8.roundOneRaces.length);
  });
});

describe('scoredCombinedKeys', () => {
  it('keys every score of every discipline', () => {
    const mixed = { ...playedDiscipline(4), scores: playedDiscipline(4).scores.slice(0, 2) };
    const disciplines = { ...createInitialDisciplines(), mixed };

    const keys = scoredCombinedKeys(disciplines);

    expect([...keys]).toEqual(mixed.scores.map((s) => `mixed:${s.raceId}`));
  });
});

describe('findNextUnscoredRace', () => {
  const races = orderCombinedRaces({
    mixed: { r1: ['r1-1', 'r1-2'], r2: ['r2-I-1'] },
    ladies: { r1: ['r1-1'] },
    board: { r1: ['r1-1'] },
  });

  it('returns the first unscored race when there is no anchor', () => {
    const next = findNextUnscoredRace(races, new Set(['mixed:r1-1']), null);

    expect(next?.key).toBe('mixed:r1-2');
  });

  it('searches only after the anchor key', () => {
    const next = findNextUnscoredRace(races, new Set(), 'mixed:r1-2');

    expect(next?.key).toBe('ladies:r1-1');
  });

  it('crosses from the last Round 1 race into Round 2', () => {
    const scored = new Set(['mixed:r1-1', 'mixed:r1-2', 'ladies:r1-1', 'board:r1-1']);

    const next = findNextUnscoredRace(races, scored, 'board:r1-1');

    expect(next?.key).toBe('mixed:r2-I-1');
  });

  it('returns null when nothing after the anchor is unscored', () => {
    const scored = new Set(['ladies:r1-1', 'board:r1-1', 'mixed:r2-I-1']);

    expect(findNextUnscoredRace(races, scored, 'mixed:r1-2')).toBeNull();
  });

  it('returns null when every race is scored', () => {
    const scored = new Set(races.map((r) => r.key));

    expect(findNextUnscoredRace(races, scored, null)).toBeNull();
  });
});

describe('combinedProgress', () => {
  it('counts scored and total races in the list only', () => {
    const races = orderCombinedRaces({ mixed: { r1: ['r1-1', 'r1-2'] }, ladies: { r1: ['r1-1'] } });
    const scored = new Set(['mixed:r1-1', 'ladies:r1-1', 'board:r1-1', 'mixed:r2-1-1']);

    expect(combinedProgress(races, scored)).toEqual({ scored: 2, total: 3 });
  });
});

/** Ids per discipline for one round, written as short strings like 'm1'. */
function roundIds(
  round: 'r1' | 'r2' | 'finals',
  ids: Partial<Record<'mixed' | 'ladies' | 'board', string[]>>,
) {
  return Object.fromEntries(Object.entries(ids).map(([d, list]) => [d, { [round]: list }]));
}

const range = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);

describe('orderRoundRaces', () => {
  it('runs Round 1 Mixed, then Ladies, then Board under standard', () => {
    const ids = roundIds('r1', { board: ['b1'], ladies: ['l1'], mixed: ['m1'] });

    const result = orderRoundRaces('r1', ids, 'standard');

    expect(result.map((r) => r.key)).toEqual(['mixed:m1', 'ladies:l1', 'board:b1']);
  });

  it.each(['standard', 'ladies-board-blocks', 'northern'] as RaceOrderOption[])(
    'runs Finals Board, then Ladies, then Mixed under %s',
    (option) => {
      const ids = roundIds('finals', { mixed: ['m1', 'm2'], ladies: ['l1'], board: ['b1', 'b2'] });

      const result = orderRoundRaces('finals', ids, option, { board: { r1: [1, 1] } });

      expect(result.map((r) => r.raceId)).toEqual(['b1', 'b2', 'l1', 'm1', 'm2']);
    },
  );

  it('tags each entry with its discipline, round and raceId', () => {
    const [first] = orderRoundRaces('r2', roundIds('r2', { ladies: ['l1'] }), 'northern');

    expect(first).toEqual({ key: 'ladies:l1', discipline: 'ladies', round: 'r2', raceId: 'l1' });
  });

  describe('ladies-board-blocks', () => {
    it('runs Mixed first, then alternates Ladies and Board blocks, with the leftover Board blocks last', () => {
      const ids = roundIds('r1', { mixed: ['m1', 'm2'], ladies: range('l', 4), board: range('b', 6) });

      const result = orderRoundRaces('r1', ids, 'ladies-board-blocks', {
        ladies: { r1: [2, 2] },
        board: { r1: [2, 2, 2] },
      });

      expect(result.map((r) => r.raceId)).toEqual([
        'm1', 'm2', 'l1', 'l2', 'b1', 'b2', 'l3', 'l4', 'b3', 'b4', 'b5', 'b6',
      ]);
    });

    it('runs Mixed then the Ladies blocks in order when there is no Board', () => {
      const ids = roundIds('r1', { mixed: ['m1'], ladies: range('l', 4) });

      const result = orderRoundRaces('r1', ids, 'ladies-board-blocks', { ladies: { r1: [2, 2] } });

      expect(result.map((r) => r.raceId)).toEqual(['m1', 'l1', 'l2', 'l3', 'l4']);
    });

    it('treats a discipline with no blocks as one block', () => {
      const ids = roundIds('r1', { mixed: ['m1'], ladies: range('l', 3), board: range('b', 2) });

      const result = orderRoundRaces('r1', ids, 'ladies-board-blocks', { board: { r1: [1, 1] } });

      expect(result.map((r) => r.raceId)).toEqual(['m1', 'l1', 'l2', 'l3', 'b1', 'b2']);
    });

    it('uses the Round 2 blocks in Round 2', () => {
      const ids = roundIds('r2', { ladies: range('l', 4), board: range('b', 4) });

      const result = orderRoundRaces('r2', ids, 'ladies-board-blocks', {
        ladies: { r1: [4], r2: [1, 3] },
        board: { r1: [4], r2: [3, 1] },
      });

      expect(result.map((r) => r.raceId)).toEqual(['l1', 'b1', 'b2', 'b3', 'l2', 'l3', 'l4', 'b4']);
    });

    it('puts ids beyond the block total in one last block', () => {
      const ids = roundIds('r1', { ladies: range('l', 5), board: range('b', 3) });

      const result = orderRoundRaces('r1', ids, 'ladies-board-blocks', {
        ladies: { r1: [2] },
        board: { r1: [1, 1, 1] },
      });

      expect(result.map((r) => r.raceId)).toEqual(['l1', 'l2', 'b1', 'l3', 'l4', 'l5', 'b2', 'b3']);
    });

    it('truncates blocks larger than the ids', () => {
      const ids = roundIds('r1', { ladies: ['l1'], board: [] });

      const result = orderRoundRaces('r1', ids, 'ladies-board-blocks', {
        ladies: { r1: [4, 4] },
        board: { r1: [2, 2] },
      });

      expect(result.map((r) => r.raceId)).toEqual(['l1']);
    });

    it('gives nothing for empty lists', () => {
      expect(orderRoundRaces('r1', {}, 'ladies-board-blocks', { ladies: { r1: [2, 2] } })).toEqual([]);
    });
  });

  describe('northern', () => {
    it('runs Mixed and Ladies in thirds and Board in sixths, earlier chunks taking the extra races', () => {
      const ids = roundIds('r1', { mixed: range('m', 7), ladies: range('l', 3), board: range('b', 6) });

      const result = orderRoundRaces('r1', ids, 'northern');

      expect(result.map((r) => r.raceId)).toEqual([
        'm1', 'm2', 'm3', 'b1', 'l1', 'b2', 'm4', 'm5', 'b3', 'l2', 'b4', 'm6', 'm7', 'b5', 'l3', 'b6',
      ]);
    });

    it('skips empty Board chunks', () => {
      const ids = roundIds('r1', { mixed: range('m', 3), ladies: range('l', 3), board: range('b', 4) });

      const result = orderRoundRaces('r1', ids, 'northern');

      expect(result.map((r) => r.raceId)).toEqual(['m1', 'b1', 'l1', 'b2', 'm2', 'b3', 'l2', 'b4', 'm3', 'l3']);
    });

    it('interleaves Mixed and Ladies thirds when there is no Board', () => {
      const ids = roundIds('r1', { mixed: range('m', 6), ladies: range('l', 3) });

      const result = orderRoundRaces('r1', ids, 'northern');

      expect(result.map((r) => r.raceId)).toEqual(['m1', 'm2', 'l1', 'm3', 'm4', 'l2', 'm5', 'm6', 'l3']);
    });

    it('keeps a lone discipline in order', () => {
      const ids = roundIds('r1', { board: range('b', 8) });

      const result = orderRoundRaces('r1', ids, 'northern');

      expect(result.map((r) => r.raceId)).toEqual(range('b', 8));
    });

    it('follows the same pattern in Round 2', () => {
      const ids = roundIds('r2', { mixed: range('m', 3), ladies: range('l', 3), board: range('b', 6) });

      const result = orderRoundRaces('r2', ids, 'northern');

      expect(result.map((r) => r.raceId)).toEqual([
        'm1', 'b1', 'l1', 'b2', 'm2', 'b3', 'l2', 'b4', 'm3', 'b5', 'l3', 'b6',
      ]);
    });
  });
});

describe('disciplineOrderFor', () => {
  it('runs Round 1 and Round 2 Mixed, Ladies, Board and Finals Board, Ladies, Mixed', () => {
    expect(disciplineOrderFor('r1')).toEqual(['mixed', 'ladies', 'board']);
    expect(disciplineOrderFor('r2')).toEqual(['mixed', 'ladies', 'board']);
    expect(disciplineOrderFor('finals')).toEqual(FINALS_DISCIPLINE_ORDER);
    expect(FINALS_DISCIPLINE_ORDER).toEqual(['board', 'ladies', 'mixed']);
  });
});

describe('race order options', () => {
  it('lists the three options with their labels', () => {
    expect(RACE_ORDER_OPTIONS).toEqual(['standard', 'ladies-board-blocks', 'northern']);
    expect(RACE_ORDER_LABELS).toEqual({
      standard: 'Standard',
      'ladies-board-blocks': 'Ladies/Board mixed',
      northern: 'Northern',
    });
  });

  it.each(['standard', 'ladies-board-blocks', 'northern'])('accepts %s', (value) => {
    expect(isRaceOrderOption(value)).toBe(true);
  });

  it.each(['Standard', '', 1, null, undefined])('rejects %s', (value) => {
    expect(isRaceOrderOption(value)).toBe(false);
  });
});

describe('raceOrderBlocksFor', () => {
  it('gives the cheat sheet blocks of every scheduled discipline', () => {
    const disciplines = {
      ...createInitialDisciplines(),
      mixed: playedDiscipline(8, { phase: 'group-stage' }),
      ladies: playedDiscipline(4, { phase: 'group-stage' }),
    };

    expect(raceOrderBlocksFor(disciplines)).toEqual({
      mixed: { r1: [4, 4, 4], r2: [4, 4, 4] },
      ladies: { r1: [2, 2, 2, 2, 2, 2], r2: [] },
    });
  });

  it('leaves out results-only disciplines and those with under 4 teams', () => {
    const disciplines = { ...createInitialDisciplines(), ladies: { ...playedDiscipline(6), scores: [] } };

    expect(raceOrderBlocksFor(disciplines)).toEqual({});
  });
});
