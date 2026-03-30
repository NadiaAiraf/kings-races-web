import { describe, it, expect } from 'vitest';
import type { Score, TeamStanding, RoundTwoSeeding } from './types';
import {
  resolveR2TeamSlot,
  resolveR2GroupTeams,
  areAllR1RacesScored,
  areAllR2RacesScored,
} from './r2Seeding';
import { getCheatSheet } from './cheatSheets/index';

// Helper: create a TeamStanding
function standing(slot: number, points: number): TeamStanding {
  return { slot, points, wins: 0, losses: 0, dsqs: 0, played: 0 };
}

// Helper: create a score for a given raceId
function makeScore(raceId: string, homeSlot: number, awaySlot: number): Score {
  return { raceId, homeSlot, awaySlot, homeOutcome: 'win', awayOutcome: 'loss' };
}

describe('resolveR2TeamSlot', () => {
  it('Test 1: "Winner A" returns 1st ranked slot', () => {
    const entry: RoundTwoSeeding = { positionCode: 'A1', letter: 'A', label: 'Winner A' };
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(1);
  });

  it('Test 2: "Runner Up B" returns 2nd ranked slot', () => {
    const entry: RoundTwoSeeding = { positionCode: 'B2', letter: 'D', label: 'Runner Up B' };
    const r1Standings: Record<string, TeamStanding[]> = {
      B: [standing(11, 9), standing(12, 3)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(12);
  });

  it('Test 3: "Third A" returns 3rd ranked slot', () => {
    const entry: RoundTwoSeeding = { positionCode: 'A3', letter: 'E', label: 'Third A' };
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(3);
  });

  it('Test 4: "Loser A" returns last ranked slot (4-team group)', () => {
    const entry: RoundTwoSeeding = { positionCode: 'A4', letter: 'G', label: 'Loser A' };
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(4);
  });

  it('Test 5: manualTiebreaks override natural standings order', () => {
    const entry: RoundTwoSeeding = { positionCode: 'A1', letter: 'A', label: 'Winner A' };
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 6), standing(2, 6), standing(3, 3), standing(4, 0)],
    };
    // Manual tiebreak says slot 2 is 1st, slot 1 is 2nd
    const manualTiebreaks: Record<string, number[]> = { A: [2, 1, 3, 4] };
    expect(resolveR2TeamSlot(entry, r1Standings, manualTiebreaks)).toBe(2);
  });

  it('handles "2nd A" label (numeric position pattern)', () => {
    const entry: RoundTwoSeeding = { positionCode: 'A2', letter: 'C', label: '2nd A' };
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(2);
  });

  it('handles "3rd  A" label (double space anomaly from teams25)', () => {
    const entry: RoundTwoSeeding = { positionCode: '', letter: 'Q', label: '3rd  A' };
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(3);
  });

  it('handles "Winner f" label (lowercase group letter from teams24)', () => {
    const entry: RoundTwoSeeding = { positionCode: '', letter: 'F', label: 'Winner f' };
    const r1Standings: Record<string, TeamStanding[]> = {
      F: [standing(51, 9), standing(52, 6)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(51);
  });

  it('handles "Runner up B" label (lowercase u from teams24)', () => {
    const entry: RoundTwoSeeding = { positionCode: '', letter: 'J', label: 'Runner up B' };
    const r1Standings: Record<string, TeamStanding[]> = {
      B: [standing(11, 9), standing(12, 3)],
    };
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBe(12);
  });

  it('returns null when group standings not available', () => {
    const entry: RoundTwoSeeding = { positionCode: 'X1', letter: 'A', label: 'Winner X' };
    const r1Standings: Record<string, TeamStanding[]> = {};
    expect(resolveR2TeamSlot(entry, r1Standings, {})).toBeNull();
  });
});

describe('resolveR2GroupTeams', () => {
  it('Test 8: Full 8-team scenario resolves all R2 Group I and II teams', () => {
    const structure = getCheatSheet(8);
    const r1Standings: Record<string, TeamStanding[]> = {
      A: [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)],
      B: [standing(11, 9), standing(12, 6), standing(13, 3), standing(14, 0)],
    };

    // R2 Group I: Winner A=1, Winner B=11, Runner Up A=2, Runner Up B=12
    const groupI = structure.roundTwoGroups![0];
    const resolved = resolveR2GroupTeams(groupI, r1Standings, {});
    expect(resolved).toEqual({ A: 1, B: 11, C: 2, D: 12 });

    // R2 Group II: Third A=3, Third B=13, Loser A=4, Loser B=14
    const groupII = structure.roundTwoGroups![1];
    const resolvedII = resolveR2GroupTeams(groupII, r1Standings, {});
    expect(resolvedII).toEqual({ E: 3, F: 13, G: 4, H: 14 });
  });
});

describe('areAllR1RacesScored', () => {
  it('Test 6: returns false when 1 race missing, true when all present', () => {
    const structure = getCheatSheet(4);
    const partialScores: Score[] = [];
    for (let i = 1; i <= 11; i++) {
      partialScores.push(makeScore(`r1-${i}`, 1, 2));
    }
    expect(areAllR1RacesScored(partialScores, structure)).toBe(false);

    // Add last race
    partialScores.push(makeScore('r1-12', 1, 2));
    expect(areAllR1RacesScored(partialScores, structure)).toBe(true);
  });
});

describe('areAllR2RacesScored', () => {
  it('Test 7: returns true for R1-only structure (no roundTwoGroups)', () => {
    const structure = getCheatSheet(4);
    expect(areAllR2RacesScored([], structure)).toBe(true);
  });

  it('returns false when R2 races are missing scores', () => {
    const structure = getCheatSheet(8);
    expect(areAllR2RacesScored([], structure)).toBe(false);
  });

  it('returns true when all R2 races are scored', () => {
    const structure = getCheatSheet(8);
    const scores: Score[] = [];
    for (const group of structure.roundTwoGroups!) {
      for (const race of group.races) {
        scores.push(makeScore(`r2-${group.groupNum}-${race.raceNum}`, 1, 2));
      }
    }
    expect(areAllR2RacesScored(scores, structure)).toBe(true);
  });
});
