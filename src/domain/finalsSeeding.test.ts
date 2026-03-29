import { describe, it, expect } from 'vitest';
import type { Score, TeamStanding, FinalsMatchup } from './types';
import {
  resolveFinalsRef,
  resolveAllFinalsMatchups,
  areAllFinalsScored,
} from './finalsSeeding';
import { getCheatSheet } from './cheatSheets/index';

// Helper: create a TeamStanding
function standing(slot: number, points: number): TeamStanding {
  return { slot, points, wins: 0, losses: 0, dsqs: 0, played: 0 };
}

// Helper: create a score
function makeScore(raceId: string, homeSlot: number, awaySlot: number): Score {
  return { raceId, homeSlot, awaySlot, homeOutcome: 'win', awayOutcome: 'loss' };
}

describe('resolveFinalsRef', () => {
  it('Test 1: "Winner Group A" against R1 standings returns correct slot', () => {
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    expect(resolveFinalsRef('Winner Group A', null, r1Standings, {})).toBe(1);
  });

  it('Test 2: "2nd Group A" returns 2nd ranked slot', () => {
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    expect(resolveFinalsRef('2nd Group A', null, r1Standings, {})).toBe(2);
  });

  it('Test 3: "Loser Group A" returns last ranked slot', () => {
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    expect(resolveFinalsRef('Loser Group A', null, r1Standings, {})).toBe(4);
  });

  it('Test 4: "Winner Group I" against R2 standings returns correct slot', () => {
    const r2Standings: Record<string, TeamStanding[]> = {
      I: [standing(1, 9), standing(11, 6), standing(2, 3), standing(12, 0)],
    };
    expect(resolveFinalsRef('Winner Group I', r2Standings, {}, {})).toBe(1);
  });

  it('Test 5: "Second Group II" returns 2nd in R2 Group II', () => {
    const r2Standings: Record<string, TeamStanding[]> = {
      II: [standing(3, 9), standing(13, 6), standing(4, 3), standing(14, 0)],
    };
    expect(resolveFinalsRef('Second Group II', r2Standings, {}, {})).toBe(13);
  });

  it('Test 6: "Winner I" (teams7 anomaly) returns 1st in R2 Group I', () => {
    const r2Standings: Record<string, TeamStanding[]> = {
      I: [standing(1, 9), standing(11, 6), standing(2, 3), standing(12, 0)],
    };
    expect(resolveFinalsRef('Winner I', r2Standings, {}, {})).toBe(1);
  });

  it('Test 7: "Runner up I" (teams7 anomaly) returns 2nd in R2 Group I', () => {
    const r2Standings: Record<string, TeamStanding[]> = {
      I: [standing(1, 9), standing(11, 6), standing(2, 3), standing(12, 0)],
    };
    expect(resolveFinalsRef('Runner up I', r2Standings, {}, {})).toBe(11);
  });

  it('handles "3rd Group A" for R1-only events', () => {
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    expect(resolveFinalsRef('3rd Group A', null, r1Standings, {})).toBe(3);
  });

  it('handles "4th Group A" for 5-team events', () => {
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 12), standing(2, 9), standing(3, 6), standing(4, 3), standing(5, 0)],
    };
    expect(resolveFinalsRef('4th Group A', null, r1Standings, {})).toBe(4);
  });

  it('handles "5th Group A" for 6-team events', () => {
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 15), standing(2, 12), standing(3, 9), standing(4, 6), standing(5, 3), standing(6, 0)],
    };
    expect(resolveFinalsRef('5th Group A', null, r1Standings, {})).toBe(5);
  });

  it('handles "Third Group I" for R2 events', () => {
    const r2Standings: Record<string, TeamStanding[]> = {
      I: [standing(1, 9), standing(11, 6), standing(2, 3), standing(12, 0)],
    };
    expect(resolveFinalsRef('Third Group I', r2Standings, {}, {})).toBe(2);
  });

  it('handles "Loser Group I" for R2 events', () => {
    const r2Standings: Record<string, TeamStanding[]> = {
      I: [standing(1, 9), standing(11, 6), standing(2, 3), standing(12, 0)],
    };
    expect(resolveFinalsRef('Loser Group I', r2Standings, {}, {})).toBe(12);
  });

  it('returns null for unresolvable ref', () => {
    expect(resolveFinalsRef('Unknown Ref', null, {}, {})).toBeNull();
  });
});

describe('resolveAllFinalsMatchups', () => {
  it('Test 8: Full 4-team event resolves both finals matchups correctly', () => {
    const structure = getCheatSheet(4);
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    const result = resolveAllFinalsMatchups(structure, null, r1Standings, {});
    expect(result).toHaveLength(2);
    // 3rd/4th: 3rd Group A vs Loser Group A
    expect(result[0]).toMatchObject({ label: '3rd/4th', homeSlot: 3, awaySlot: 4 });
    // 1st/2nd: Winner Group A vs 2nd Group A
    expect(result[1]).toMatchObject({ label: '1st/2nd', homeSlot: 1, awaySlot: 2 });
  });

  it('Test 9: Full 8-team event resolves all 4 finals matchups correctly', () => {
    const structure = getCheatSheet(8);
    const r2Standings: Record<string, TeamStanding[]> = {
      I: [standing(1, 9), standing(11, 6), standing(2, 3), standing(12, 0)],
      II: [standing(3, 9), standing(13, 6), standing(4, 3), standing(14, 0)],
    };
    const result = resolveAllFinalsMatchups(structure, r2Standings, {}, {});
    expect(result).toHaveLength(4);
    // 7th/8th: Third Group II vs Loser Group II
    expect(result[0]).toMatchObject({ label: '7th/8th', homeSlot: 4, awaySlot: 14 });
    // 5th/6th: Winner Group II vs Second Group II
    expect(result[1]).toMatchObject({ label: '5th/6th', homeSlot: 3, awaySlot: 13 });
    // 3rd/4th: Third Group I vs Loser Group I
    expect(result[2]).toMatchObject({ label: '3rd/4th', homeSlot: 2, awaySlot: 12 });
    // 1st/2nd: Winner Group I vs Second Group I
    expect(result[3]).toMatchObject({ label: '1st/2nd', homeSlot: 1, awaySlot: 11 });
  });
});

describe('Exhaustive cheat sheet test', () => {
  it('Test 10: resolveFinalsRef returns non-null for every homeRef/awayRef across all 29 cheat sheets', () => {
    for (let teamCount = 4; teamCount <= 32; teamCount++) {
      const structure = getCheatSheet(teamCount);

      // Build mock R1 standings: each group gets standings with unique points
      const r1Standings: Record<string, TeamStanding[]> = {};
      for (const group of structure.groups) {
        r1Standings[group.letter] = group.teamSlots.map((slot, i) =>
          standing(slot, (group.teamSlots.length - i) * 3)
        );
      }

      // Build mock R2 standings if R2 groups exist
      let r2Standings: Record<string, TeamStanding[]> | null = null;
      if (structure.roundTwoGroups && structure.roundTwoGroups.length > 0) {
        r2Standings = {};
        for (const r2Group of structure.roundTwoGroups) {
          // Use sequential slot numbers for mock R2 standings
          r2Standings[r2Group.groupNum] = r2Group.seedingEntries.map((entry, i) =>
            standing(100 + i, (r2Group.seedingEntries.length - i) * 3)
          );
        }
      }

      // Verify every finals ref resolves
      for (const matchup of structure.finals) {
        const homeSlot = resolveFinalsRef(matchup.homeRef, r2Standings, r1Standings, {});
        const awaySlot = resolveFinalsRef(matchup.awayRef, r2Standings, r1Standings, {});
        expect(homeSlot, `teams=${teamCount} homeRef="${matchup.homeRef}" resolved to null`).not.toBeNull();
        expect(awaySlot, `teams=${teamCount} awayRef="${matchup.awayRef}" resolved to null`).not.toBeNull();
      }
    }
  });
});

describe('areAllFinalsScored', () => {
  it('Test 11: returns true/false correctly', () => {
    const matchups: FinalsMatchup[] = [
      { label: '3rd/4th', homeRef: '3rd Group A', awayRef: 'Loser Group A' },
      { label: '1st/2nd', homeRef: 'Winner Group A', awayRef: '2nd Group A' },
    ];

    // No scores
    expect(areAllFinalsScored(matchups, [])).toBe(false);

    // Partial scores
    expect(areAllFinalsScored(matchups, [makeScore('fin-0', 3, 4)])).toBe(false);

    // All scores
    expect(areAllFinalsScored(matchups, [
      makeScore('fin-0', 3, 4),
      makeScore('fin-1', 1, 2),
    ])).toBe(true);
  });
});
