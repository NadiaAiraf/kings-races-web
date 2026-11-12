import { describe, it, expect } from 'vitest';
import { headToHeadDefault, headToHeadWinner } from './headToHead';
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

    expect(headToHeadWinner(scores, 1, 2)).toEqual({ winnerSlot: 2, loserSlot: 1, raceId: 'r1-7' });
  });

  it('returns the home team when the away team was disqualified', () => {
    const scores = [score('r1-3', 1, 2, 'win', 'dsq')];

    expect(headToHeadWinner(scores, 1, 2)).toEqual({ winnerSlot: 1, loserSlot: 2, raceId: 'r1-3' });
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

    expect(result.notes).toEqual([{ winnerSlot: 2, loserSlot: 1, raceNum: 7 }]);
  });

  it('keeps the order and still returns the note when the winner is already first', () => {
    const standings = [standing(1, 3), standing(2, 3)];
    const scores = [score('r1-4', 1, 2, 'win', 'loss')];

    const result = headToHeadDefault(standings, scores);

    expect(result.order.map((s) => s.slot)).toEqual([1, 2]);
    expect(result.notes).toEqual([{ winnerSlot: 1, loserSlot: 2, raceNum: 4 }]);
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
      { winnerSlot: 2, loserSlot: 1, raceNum: 2 },
      { winnerSlot: 4, loserSlot: 3, raceNum: 5 },
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

    expect(result.notes).toEqual([{ winnerSlot: 2, loserSlot: 1, raceNum: 5 }]);
  });

  it('falls back to the last segment of the race id when the caller has no number', () => {
    const standings = [standing(1, 3), standing(2, 3)];
    const scores = [score('r2-I-2', 1, 2, 'loss', 'win')];

    const result = headToHeadDefault(standings, scores, () => undefined);

    expect(result.notes).toEqual([{ winnerSlot: 2, loserSlot: 1, raceNum: 2 }]);
  });
});
