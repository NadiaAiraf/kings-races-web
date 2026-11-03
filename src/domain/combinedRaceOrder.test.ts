import { describe, it, expect } from 'vitest';
import {
  COMBINED_ROUND_LABELS,
  DEFAULT_COMBINED_ORDERING,
  combinedProgress,
  combinedRaceKey,
  findNextUnscoredRace,
  orderCombinedRaces,
  r1RacesByDiscipline,
  scheduledRaceIds,
  scoredCombinedKeys,
} from './combinedRaceOrder';
import { createInitialDisciplines } from '../store/initialState';
import { playedDiscipline } from './__fixtures__/playedDiscipline';
import { getCheatSheet } from './cheatSheets';

describe('orderCombinedRaces', () => {
  it('lists every Round 1, then every Round 2, then every Finals, Mixed, Ladies, Board within each', () => {
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
      'mixed:fin-0',
      'ladies:fin-0',
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

  it('follows a custom ordering and omits unlisted rounds and disciplines', () => {
    const result = orderCombinedRaces(
      {
        mixed: { r1: ['r1-1'], r2: ['r2-I-1'], finals: ['fin-0'] },
        ladies: { r1: ['r1-1'], finals: ['fin-0'] },
        board: { r1: ['r1-1'], finals: ['fin-0'] },
      },
      { kind: 'round-sequential', rounds: ['finals', 'r1'], disciplines: ['board', 'mixed'] },
    );

    expect(result.map((r) => r.key)).toEqual(['board:fin-0', 'mixed:fin-0', 'board:r1-1', 'mixed:r1-1']);
  });

  it('gives unique keys even when raceIds collide across disciplines', () => {
    const result = orderCombinedRaces({ mixed: { r1: ['r1-1'] }, ladies: { r1: ['r1-1'] } });

    expect(new Set(result.map((r) => r.key)).size).toBe(2);
  });

  it('returns an empty list for empty input', () => {
    expect(orderCombinedRaces({})).toEqual([]);
  });

  it('defaults to rounds in order and Mixed, Ladies, Board within each', () => {
    expect(DEFAULT_COMBINED_ORDERING).toEqual({
      kind: 'round-sequential',
      rounds: ['r1', 'r2', 'finals'],
      disciplines: ['mixed', 'ladies', 'board'],
    });
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
