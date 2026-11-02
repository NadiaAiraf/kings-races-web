import { describe, it, expect } from 'vitest';
import type { RaceMatchup } from './types';
import {
  DEFAULT_COMBINED_ORDERING,
  combinedR1Progress,
  combinedRaceKey,
  findNextUnscoredRace,
  orderCombinedRaces,
  r1RacesByDiscipline,
} from './combinedRaceOrder';
import { createInitialDisciplines } from '../store/initialState';
import { playedDiscipline } from './__fixtures__/playedDiscipline';
import { getCheatSheet } from './cheatSheets';

const race = (raceNum: number, homeSlot = 1, awaySlot = 2): RaceMatchup => ({
  raceNum,
  homeSlot,
  awaySlot,
});

const m1 = race(1);
const m2 = race(2, 3, 4);
const l1 = race(1, 5, 6);
const b1 = race(1, 7, 8);

describe('orderCombinedRaces', () => {
  it('lists Mixed, then Ladies, then Board by default', () => {
    const result = orderCombinedRaces({ mixed: [m1, m2], ladies: [l1], board: [b1] });

    expect(result.map((r) => r.key)).toEqual([
      'mixed:r1-1',
      'mixed:r1-2',
      'ladies:r1-1',
      'board:r1-1',
    ]);
  });

  it('keeps each discipline in its own race order', () => {
    const result = orderCombinedRaces({ mixed: [m2, m1] });

    expect(result.map((r) => r.race)).toEqual([m2, m1]);
  });

  it('builds the raceId from the race number and tags the discipline', () => {
    const [first] = orderCombinedRaces({ ladies: [race(7)] });

    expect(first).toEqual({
      key: 'ladies:r1-7',
      discipline: 'ladies',
      raceId: 'r1-7',
      race: race(7),
    });
  });

  it('skips a discipline missing from the input', () => {
    const result = orderCombinedRaces({ mixed: [m1], board: [b1] });

    expect(result.map((r) => r.discipline)).toEqual(['mixed', 'board']);
  });

  it('returns an empty list for empty input', () => {
    expect(orderCombinedRaces({})).toEqual([]);
  });

  it('follows a custom sequential ordering and omits unlisted disciplines', () => {
    const result = orderCombinedRaces(
      { mixed: [m1], ladies: [l1], board: [b1] },
      { kind: 'discipline-sequential', disciplines: ['board', 'mixed'] },
    );

    expect(result.map((r) => r.key)).toEqual(['board:r1-1', 'mixed:r1-1']);
  });

  it('gives unique keys even when raceIds collide across disciplines', () => {
    const result = orderCombinedRaces({ mixed: [m1], ladies: [l1], board: [b1] });

    expect(new Set(result.map((r) => r.key)).size).toBe(3);
    expect(new Set(result.map((r) => r.raceId)).size).toBe(1);
  });

  it('defaults to the Mixed, Ladies, Board ordering', () => {
    expect(DEFAULT_COMBINED_ORDERING).toEqual({
      kind: 'discipline-sequential',
      disciplines: ['mixed', 'ladies', 'board'],
    });
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

describe('findNextUnscoredRace', () => {
  const races = orderCombinedRaces({ mixed: [m1, m2], ladies: [l1], board: [b1] });

  it('returns the first unscored race when there is no anchor', () => {
    const next = findNextUnscoredRace(races, new Set(['mixed:r1-1']), null);

    expect(next?.key).toBe('mixed:r1-2');
  });

  it('searches only after the anchor key', () => {
    const next = findNextUnscoredRace(races, new Set(), 'mixed:r1-2');

    expect(next?.key).toBe('ladies:r1-1');
  });

  it('crosses from the last unscored Mixed race to the first unscored Ladies race', () => {
    const scored = new Set(['mixed:r1-1', 'mixed:r1-2']);

    const next = findNextUnscoredRace(races, scored, 'mixed:r1-2');

    expect(next?.key).toBe('ladies:r1-1');
  });

  it('returns null when nothing after the anchor is unscored', () => {
    const scored = new Set(['ladies:r1-1', 'board:r1-1']);

    expect(findNextUnscoredRace(races, scored, 'mixed:r1-2')).toBeNull();
  });

  it('returns null when every race is scored', () => {
    const scored = new Set(races.map((r) => r.key));

    expect(findNextUnscoredRace(races, scored, null)).toBeNull();
  });
});

describe('combinedR1Progress', () => {
  it('counts scored and total races in the list only', () => {
    const races = orderCombinedRaces({ mixed: [m1, m2], ladies: [l1] });
    const scored = new Set(['mixed:r1-1', 'ladies:r1-1', 'board:r1-1', 'mixed:r2-1-1']);

    expect(combinedR1Progress(races, scored)).toEqual({ scored: 2, total: 3 });
  });
});
