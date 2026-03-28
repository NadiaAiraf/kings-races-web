import { describe, it, expect } from 'vitest';
import { POINTS, calculateGroupStandings, hasTies } from './scoring';
import type { Score } from './types';

describe('POINTS', () => {
  it('assigns 3 points for win', () => { expect(POINTS.win).toBe(3); });
  it('assigns 1 point for loss', () => { expect(POINTS.loss).toBe(1); });
  it('assigns 0 points for dsq', () => { expect(POINTS.dsq).toBe(0); });
});

describe('calculateGroupStandings', () => {
  const groupSlots = [1, 2, 3, 4];

  it('returns all teams at 0 for empty scores', () => {
    const standings = calculateGroupStandings([], groupSlots);
    expect(standings).toHaveLength(4);
    standings.forEach(s => {
      expect(s.points).toBe(0);
      expect(s.wins).toBe(0);
      expect(s.losses).toBe(0);
      expect(s.dsqs).toBe(0);
      expect(s.played).toBe(0);
    });
  });

  it('awards 3pts to winner and 1pt to loser', () => {
    const scores: Score[] = [{
      raceId: 'r1-1', homeSlot: 1, awaySlot: 2,
      homeOutcome: 'win', awayOutcome: 'loss',
    }];
    const standings = calculateGroupStandings(scores, groupSlots);
    const team1 = standings.find(s => s.slot === 1)!;
    const team2 = standings.find(s => s.slot === 2)!;
    expect(team1.points).toBe(3);
    expect(team1.wins).toBe(1);
    expect(team2.points).toBe(1);
    expect(team2.losses).toBe(1);
  });

  it('awards 0pts for DSQ', () => {
    const scores: Score[] = [{
      raceId: 'r1-1', homeSlot: 1, awaySlot: 2,
      homeOutcome: 'dsq', awayOutcome: 'win',
    }];
    const standings = calculateGroupStandings(scores, groupSlots);
    const team1 = standings.find(s => s.slot === 1)!;
    expect(team1.points).toBe(0);
    expect(team1.dsqs).toBe(1);
  });

  it('sorts by points descending', () => {
    const scores: Score[] = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' },
      { raceId: 'r1-2', homeSlot: 3, awaySlot: 4, homeOutcome: 'win', awayOutcome: 'loss' },
      { raceId: 'r1-3', homeSlot: 1, awaySlot: 3, homeOutcome: 'win', awayOutcome: 'loss' },
    ];
    const standings = calculateGroupStandings(scores, groupSlots);
    expect(standings[0].slot).toBe(1);  // 6 pts (2 wins)
    expect(standings[0].points).toBe(6);
  });

  it('ignores scores for teams not in group', () => {
    const scores: Score[] = [{
      raceId: 'r1-1', homeSlot: 11, awaySlot: 12,
      homeOutcome: 'win', awayOutcome: 'loss',
    }];
    const standings = calculateGroupStandings(scores, groupSlots);
    standings.forEach(s => expect(s.played).toBe(0));
  });

  it('accumulates across multiple races correctly', () => {
    const scores: Score[] = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' },
      { raceId: 'r1-2', homeSlot: 1, awaySlot: 3, homeOutcome: 'loss', awayOutcome: 'win' },
      { raceId: 'r1-3', homeSlot: 1, awaySlot: 4, homeOutcome: 'win', awayOutcome: 'loss' },
    ];
    const standings = calculateGroupStandings(scores, groupSlots);
    const team1 = standings.find(s => s.slot === 1)!;
    expect(team1.points).toBe(7); // 3 + 1 + 3
    expect(team1.wins).toBe(2);
    expect(team1.losses).toBe(1);
    expect(team1.played).toBe(3);
  });
});

describe('hasTies', () => {
  it('returns true when two teams have equal points', () => {
    expect(hasTies([
      { slot: 1, points: 6, wins: 2, losses: 0, dsqs: 0, played: 2 },
      { slot: 2, points: 6, wins: 2, losses: 0, dsqs: 0, played: 2 },
      { slot: 3, points: 0, wins: 0, losses: 2, dsqs: 0, played: 2 },
    ])).toBe(true);
  });

  it('returns false when all points differ', () => {
    expect(hasTies([
      { slot: 1, points: 9, wins: 3, losses: 0, dsqs: 0, played: 3 },
      { slot: 2, points: 6, wins: 2, losses: 1, dsqs: 0, played: 3 },
      { slot: 3, points: 3, wins: 1, losses: 2, dsqs: 0, played: 3 },
    ])).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(hasTies([])).toBe(false);
  });

  it('returns false for single team', () => {
    expect(hasTies([{ slot: 1, points: 3, wins: 1, losses: 0, dsqs: 0, played: 1 }])).toBe(false);
  });
});
