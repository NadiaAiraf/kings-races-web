import { describe, it, expect } from 'vitest';
import {
  headToHeadDefault,
  headToHeadReason,
  headToHeadWinner,
  seedOfSlot,
  seededTieLines,
} from './headToHead';
import type { RaceOutcome, Score, TeamStanding } from './types';

const score = (
  raceId: string,
  homeSlot: number,
  awaySlot: number,
  homeOutcome: RaceOutcome,
  awayOutcome: RaceOutcome
): Score => ({ raceId, homeSlot, awaySlot, homeOutcome, awayOutcome });

const standing = (slot: number, points: number): TeamStanding => ({
  slot,
  points,
  wins: 0,
  losses: 0,
  dsqs: 0,
  played: 0,
});

describe('headToHeadWinner', () => {
  it('returns the away team when it won the race between the pair', () => {
    const scores = [score('r1-7', 1, 2, 'loss', 'win')];

    expect(headToHeadWinner(scores, 1, 2)).toEqual({ winnerSlot: 2, loserSlot: 1, raceIds: ['r1-7'], wins: 1, losses: 0 });
  });

  it('returns the home team when the away team was disqualified', () => {
    const scores = [score('r1-3', 1, 2, 'win', 'dsq')];

    expect(headToHeadWinner(scores, 1, 2)).toEqual({ winnerSlot: 1, loserSlot: 2, raceIds: ['r1-3'], wins: 1, losses: 0 });
  });

  it('gives the same winner whichever order the slots are passed in', () => {
    const scores = [score('r1-7', 1, 2, 'loss', 'win')];

    expect(headToHeadWinner(scores, 2, 1)).toEqual(headToHeadWinner(scores, 1, 2));
  });

  it('returns null when no race involves both teams', () => {
    const scores = [score('r1-1', 1, 3, 'win', 'loss'), score('r1-2', 2, 4, 'win', 'loss')];

    expect(headToHeadWinner(scores, 1, 2)).toBeNull();
  });

  it('returns null when the race between them was not run', () => {
    const scores = [score('r1-7', 1, 2, 'not-run', 'not-run')];

    expect(headToHeadWinner(scores, 1, 2)).toBeNull();
  });

  it('returns null when both teams were disqualified', () => {
    const scores = [score('r1-7', 1, 2, 'dsq', 'dsq')];

    expect(headToHeadWinner(scores, 1, 2)).toBeNull();
  });

  it('returns null when a race matches only one of the two teams', () => {
    const scores = [score('r1-7', 1, 5, 'win', 'loss')];

    expect(headToHeadWinner(scores, 1, 2)).toBeNull();
  });

  it('returns null when the pair split their two races', () => {
    const scores = [score('r1-1', 1, 2, 'win', 'loss'), score('r1-7', 2, 1, 'win', 'loss')];

    expect(headToHeadWinner(scores, 1, 2)).toBeNull();
  });

  it('returns the team that won both races between the pair', () => {
    const scores = [score('r1-1', 1, 2, 'loss', 'win'), score('r1-7', 2, 1, 'win', 'loss')];

    expect(headToHeadWinner(scores, 1, 2)).toEqual({
      winnerSlot: 2,
      loserSlot: 1,
      raceIds: ['r1-1', 'r1-7'],
      wins: 2,
      losses: 0,
    });
  });

  it('counts only the decisive race when the other meeting was not run', () => {
    const scores = [score('r1-1', 1, 2, 'not-run', 'not-run'), score('r1-7', 2, 1, 'loss', 'win')];

    expect(headToHeadWinner(scores, 1, 2)).toEqual({
      winnerSlot: 1,
      loserSlot: 2,
      raceIds: ['r1-7'],
      wins: 1,
      losses: 0,
    });
  });
});

describe('headToHeadDefault', () => {
  it('places the head-to-head winner first within a two-team points level', () => {
    const standings = [standing(3, 6), standing(1, 3), standing(2, 3), standing(4, 0)];
    const scores = [score('r1-7', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([3, 2, 1, 4]);
  });

  it('returns a note naming the winner, loser and race number', () => {
    const standings = [standing(3, 6), standing(1, 3), standing(2, 3), standing(4, 0)];
    const scores = [score('r1-7', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores);

    expect(result.notes).toEqual([{ winnerSlot: 2, loserSlot: 1, raceNums: [7], wins: 1, losses: 0 }]);
  });

  it('keeps the order and still returns the note when the winner is already first', () => {
    const standings = [standing(1, 3), standing(2, 3)];
    const scores = [score('r1-4', 1, 2, 'win', 'loss')];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([1, 2]);
    expect(result.notes).toEqual([{ winnerSlot: 1, loserSlot: 2, raceNums: [4], wins: 1, losses: 0 }]);
  });

  it('leaves a three-team points level unchanged with no note', () => {
    const standings = [standing(1, 3), standing(2, 3), standing(3, 3)];
    const scores = [
      score('r1-1', 1, 2, 'loss', 'win'),
      score('r1-2', 2, 3, 'loss', 'win'),
      score('r1-3', 3, 1, 'loss', 'win'),
    ];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([1, 2, 3]);
    expect(result.notes).toEqual([]);
  });

  it('resolves two separate two-team levels independently, in position order', () => {
    const standings = [standing(1, 6), standing(2, 6), standing(3, 2), standing(4, 2)];
    const scores = [score('r1-2', 1, 2, 'loss', 'win'), score('r1-5', 3, 4, 'dsq', 'win')];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([2, 1, 4, 3]);
    expect(result.notes).toEqual([
      { winnerSlot: 2, loserSlot: 1, raceNums: [2], wins: 1, losses: 0 },
      { winnerSlot: 4, loserSlot: 3, raceNums: [5], wins: 1, losses: 0 },
    ]);
  });

  it('leaves a pair with no head-to-head winner unchanged with no note', () => {
    const standings = [standing(1, 3), standing(2, 3)];
    const scores = [score('r1-4', 1, 2, 'not-run', 'not-run')];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([1, 2]);
    expect(result.notes).toEqual([]);
  });

  it('does not mutate the input standings', () => {
    const standings = [standing(1, 3), standing(2, 3)];
    const scores = [score('r1-7', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores);

    expect(standings.map((s) => s.slot)).toEqual([1, 2]);
    expect(result.order).not.toBe(standings);
  });

  it('uses the race number supplied by the caller', () => {
    const standings = [standing(1, 3), standing(2, 3)];
    const scores = [score('r2-I-2', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, (id) => (id === 'r2-I-2' ? 5 : undefined));

    expect(result.notes).toEqual([{ winnerSlot: 2, loserSlot: 1, raceNums: [5], wins: 1, losses: 0 }]);
  });

  it('falls back to the last segment of the race id when the caller has no number', () => {
    const standings = [standing(1, 3), standing(2, 3)];
    const scores = [score('r2-I-2', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, () => undefined);

    expect(result.notes).toEqual([{ winnerSlot: 2, loserSlot: 1, raceNums: [2], wins: 1, losses: 0 }]);
  });
});

describe('headToHeadDefault with repeat meetings', () => {
  it('keeps the order with no note when the pair split their races', () => {
    const standings = [standing(1, 4), standing(2, 4)];
    const scores = [score('r1-1', 2, 1, 'win', 'loss'), score('r1-7', 1, 2, 'win', 'loss')];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([1, 2]);
    expect(result.notes).toEqual([]);
  });

  it('lists every race the winner took when they won both meetings', () => {
    const standings = [standing(1, 4), standing(2, 4)];
    const scores = [score('r1-1', 1, 2, 'loss', 'win'), score('r1-7', 2, 1, 'win', 'loss')];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([2, 1]);
    expect(result.notes).toEqual([{ winnerSlot: 2, loserSlot: 1, raceNums: [1, 7], wins: 2, losses: 0 }]);
  });
});

describe('headToHeadReason', () => {
  it('names the single race the winner took', () => {
    const note = { winnerSlot: 2, loserSlot: 1, raceNums: [7], wins: 1, losses: 0 };

    expect(headToHeadReason(note)).toBe('won their head-to-head race (Race 7)');
  });

  it('says both races when the winner took both meetings', () => {
    const note = { winnerSlot: 2, loserSlot: 1, raceNums: [1, 7], wins: 2, losses: 0 };

    expect(headToHeadReason(note)).toBe('won both head-to-head races (Races 1 and 7)');
  });

  it('gives the record when the winner took more races but not all', () => {
    const note = { winnerSlot: 2, loserSlot: 1, raceNums: [1, 5, 9], wins: 2, losses: 1 };

    expect(headToHeadReason(note)).toBe('won their head-to-head races 2-1 (Races 1, 5 and 9)');
  });
});

// Seeds equal slots in these tests: slot 1 is the top seed.
const bySlot = (slot: number) => slot;

describe('headToHeadDefault with the seeded rule for three or four tied teams', () => {
  it('puts the lowest seed 3rd in a three-way tie and the top two seeds by their race', () => {
    const standings = [standing(3, 3), standing(1, 3), standing(2, 3)];
    const scores = [score('r1-5', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, undefined, bySlot);

    expect(result.order.map((s) => s.slot)).toEqual([2, 1, 3]);
  });

  it('describes a three-way suggestion with the deciding race and the lowest seed', () => {
    const standings = [standing(3, 3), standing(1, 3), standing(2, 3)];
    const scores = [score('r1-5', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, undefined, bySlot);

    expect(result.seeded).toEqual([
      {
        slots: [2, 1, 3],
        firstPlace: 1,
        top: { winnerSlot: 2, loserSlot: 1, raceNums: [5], wins: 1, losses: 0 },
        lowestSeedSlot: 3,
      },
    ]);
  });

  it('settles a four-way tie with the top two seeds racing for the higher places and the bottom two for the lower', () => {
    const standings = [standing(1, 3), standing(2, 3), standing(3, 3), standing(4, 3)];
    const scores = [score('r1-1', 1, 2, 'loss', 'win'), score('r1-2', 3, 4, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, undefined, bySlot);

    expect(result.order.map((s) => s.slot)).toEqual([2, 1, 4, 3]);
    expect(result.seeded?.[0].bottom).toEqual({
      winnerSlot: 4,
      loserSlot: 3,
      raceNums: [2],
      wins: 1,
      losses: 0,
    });
  });

  it('orders by seed, not by slot number, when the caller maps slots to seeds', () => {
    const standings = [standing(1, 3), standing(2, 3), standing(3, 3)];
    // Slot 3 is the top seed, slot 1 second, slot 2 the lowest.
    const seeds = new Map([[3, 1], [1, 2], [2, 3]]);
    const scores = [score('r1-1', 3, 1, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, undefined, (slot) => seeds.get(slot));

    expect(result.order.map((s) => s.slot)).toEqual([1, 3, 2]);
  });

  it('gives the places the tie covers when it is not at the top of the group', () => {
    const standings = [standing(5, 9), standing(1, 3), standing(2, 3), standing(3, 3)];
    const scores = [score('r1-5', 1, 2, 'win', 'loss')];

    const result = headToHeadDefault(standings, scores, undefined, bySlot);

    expect(result.order.map((s) => s.slot)).toEqual([5, 1, 2, 3]);
    expect(result.seeded?.[0].firstPlace).toBe(2);
  });

  it('makes no suggestion when a deciding pair has no winner', () => {
    const standings = [standing(1, 3), standing(2, 3), standing(3, 3), standing(4, 3)];
    const scores = [score('r1-1', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, undefined, bySlot);

    expect(result.order.map((s) => s.slot)).toEqual([1, 2, 3, 4]);
    expect(result.seeded).toEqual([]);
  });

  it('makes no suggestion for five or more tied teams', () => {
    const standings = [1, 2, 3, 4, 5].map((slot) => standing(slot, 3));
    const scores = [score('r1-1', 1, 2, 'loss', 'win'), score('r1-2', 4, 5, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, undefined, bySlot);

    expect(result.order.map((s) => s.slot)).toEqual([1, 2, 3, 4, 5]);
    expect(result.seeded).toEqual([]);
  });
});

describe('seedOfSlot', () => {
  it('gives the seed whose slot it is, from the cheat sheet seed map', () => {
    const seedOf = seedOfSlot([1, 4, 3, 2]);

    expect([1, 4, 3, 2].map(seedOf)).toEqual([1, 2, 3, 4]);
  });

  it('returns undefined for a slot not in the seed map', () => {
    expect(seedOfSlot([1, 4, 3, 2])(9)).toBeUndefined();
  });
});

describe('seededTieLines', () => {
  const names = new Map([[1, 'Kings'], [2, 'Imperial'], [3, 'Bristol'], [4, 'Bath']]);
  const name = (slot: number) => names.get(slot)!;

  it('explains a three-way suggestion and says it is optional', () => {
    const lines = seededTieLines(
      {
        slots: [1, 2, 3],
        firstPlace: 1,
        top: { winnerSlot: 1, loserSlot: 2, raceNums: [5], wins: 1, losses: 0 },
        lowestSeedSlot: 3,
      },
      name
    );

    expect(lines).toEqual([
      'Suggested by seeding for this 3-way tie:',
      'Kings v Imperial decides 1st and 2nd: Kings won their head-to-head race (Race 5).',
      'Bristol is the lowest seed, so 3rd.',
      'This is only a suggestion. You can run tie-break races instead, or move teams yourself.',
    ]);
  });

  it('explains both deciding races of a four-way tie lower down the group', () => {
    const lines = seededTieLines(
      {
        slots: [2, 1, 4, 3],
        firstPlace: 2,
        top: { winnerSlot: 2, loserSlot: 1, raceNums: [1], wins: 1, losses: 0 },
        bottom: { winnerSlot: 4, loserSlot: 3, raceNums: [2], wins: 1, losses: 0 },
      },
      name
    );

    expect(lines.slice(0, 3)).toEqual([
      'Suggested by seeding for this 4-way tie:',
      'Imperial v Kings decides 2nd and 3rd: Imperial won their head-to-head race (Race 1).',
      'Bath v Bristol decides 4th and 5th: Bath won their head-to-head race (Race 2).',
    ]);
  });
});
