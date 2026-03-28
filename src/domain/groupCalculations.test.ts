import { describe, it, expect } from 'vitest';
import { getGroupRaces, calculateAllGroupStandings } from './groupCalculations';
import type { RaceMatchup, Score, GroupDefinition } from './types';

describe('getGroupRaces', () => {
  const allRaces: RaceMatchup[] = [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },    // Group A
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },    // Group A
    { raceNum: 3, homeSlot: 11, awaySlot: 12 },  // Group B
    { raceNum: 4, homeSlot: 13, awaySlot: 14 },  // Group B
  ];

  it('returns only races where both teams are in the group', () => {
    const groupARaces = getGroupRaces(allRaces, [1, 2, 3, 4]);
    expect(groupARaces).toHaveLength(2);
    expect(groupARaces[0].raceNum).toBe(1);
    expect(groupARaces[1].raceNum).toBe(2);
  });

  it('excludes cross-group races', () => {
    const groupARaces = getGroupRaces(allRaces, [1, 2, 3, 4]);
    expect(groupARaces.every(r => [1, 2, 3, 4].includes(r.homeSlot))).toBe(true);
    expect(groupARaces.every(r => [1, 2, 3, 4].includes(r.awaySlot))).toBe(true);
  });
});

describe('calculateAllGroupStandings', () => {
  const groups: GroupDefinition[] = [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
    { letter: 'B', teamSlots: [11, 12, 13, 14] },
  ];

  it('returns standings keyed by group letter', () => {
    const scores: Score[] = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' },
      { raceId: 'r1-3', homeSlot: 11, awaySlot: 12, homeOutcome: 'win', awayOutcome: 'loss' },
    ];
    const result = calculateAllGroupStandings(scores, groups);
    expect(result['A']).toBeDefined();
    expect(result['B']).toBeDefined();
    expect(result['A']).toHaveLength(4);
    expect(result['B']).toHaveLength(4);
  });

  it('calculates standings independently per group', () => {
    const scores: Score[] = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' },
    ];
    const result = calculateAllGroupStandings(scores, groups);
    const teamA1 = result['A'].find(s => s.slot === 1)!;
    expect(teamA1.points).toBe(3);
    // Group B should be unaffected
    result['B'].forEach(s => expect(s.played).toBe(0));
  });
});
