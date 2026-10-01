import { describe, it, expect } from 'vitest';
import { computeFinalResults } from './useFinalResults';
import type { Score, Team } from '../domain/types';

describe('computeFinalResults', () => {
  const teams: Team[] = [
    { slot: 3, name: 'Underdog' },
    { slot: 5, name: 'Favorite' },
    { slot: 7, name: 'Third' },
    { slot: 9, name: 'Fourth' },
  ];

  const awayWinScore: Score = {
    raceId: 'fin-0',
    homeSlot: 5,
    awaySlot: 3,
    homeOutcome: 'loss',
    awayOutcome: 'win',
  };

  it('final positions come from matchup labels, not group stage totals', () => {
    const finalsWithNames = [
      { label: '1st/2nd', homeSlot: 5, awaySlot: 3, score: awayWinScore },
    ];

    const results = computeFinalResults(finalsWithNames, teams, 'all-scored');
    expect(results).not.toBeNull();
    expect(results![0].position).toBe(1);
    expect(results![0].teamName).toBe('Underdog');
  });

  it('loser of 1st/2nd matchup gets 2nd place', () => {
    const finalsWithNames = [
      { label: '1st/2nd', homeSlot: 5, awaySlot: 3, score: awayWinScore },
    ];

    const results = computeFinalResults(finalsWithNames, teams, 'all-scored');
    expect(results).not.toBeNull();
    expect(results![1].position).toBe(2);
    expect(results![1].teamName).toBe('Favorite');
  });

  it('3rd/4th matchup determines 3rd and 4th positions independently', () => {
    const thirdFourthScore: Score = {
      raceId: 'fin-1',
      homeSlot: 7,
      awaySlot: 9,
      homeOutcome: 'win',
      awayOutcome: 'loss',
    };
    const finalsWithNames = [
      { label: '3rd/4th', homeSlot: 7, awaySlot: 9, score: thirdFourthScore },
    ];

    const results = computeFinalResults(finalsWithNames, teams, 'all-scored');
    expect(results).not.toBeNull();
    expect(results![0].position).toBe(3);
    expect(results![0].teamName).toBe('Third');
    expect(results![1].position).toBe(4);
    expect(results![1].teamName).toBe('Fourth');
  });

  it('returns null when finals not all scored', () => {
    const finalsWithNames = [
      { label: '1st/2nd', homeSlot: 5, awaySlot: 3, score: awayWinScore },
    ];

    const results = computeFinalResults(finalsWithNames, teams, 'in-progress');
    expect(results).toBeNull();
  });

  it('handles multiple matchups and sorts by position', () => {
    const thirdFourthScore: Score = {
      raceId: 'fin-1',
      homeSlot: 9,
      awaySlot: 7,
      homeOutcome: 'win',
      awayOutcome: 'loss',
    };
    const finalsWithNames = [
      { label: '3rd/4th', homeSlot: 9, awaySlot: 7, score: thirdFourthScore },
      { label: '1st/2nd', homeSlot: 5, awaySlot: 3, score: awayWinScore },
    ];

    const results = computeFinalResults(finalsWithNames, teams, 'all-scored');
    expect(results).not.toBeNull();
    expect(results).toHaveLength(4);
    expect(results![0].position).toBe(1);
    expect(results![1].position).toBe(2);
    expect(results![2].position).toBe(3);
    expect(results![3].position).toBe(4);
  });

  describe('race not run', () => {
    const notRunThirdFourth: Score = {
      raceId: 'fin-0',
      homeSlot: 7,
      awaySlot: 9,
      homeOutcome: 'not-run',
      awayOutcome: 'not-run',
    };
    const finalsWithNames = [
      { label: '3rd/4th', homeSlot: 7, awaySlot: 9, score: notRunThirdFourth },
      { label: '1st/2nd', homeSlot: 5, awaySlot: 3, score: awayWinScore },
    ];

    it('places both teams on the higher position', () => {
      const results = computeFinalResults(finalsWithNames, teams, 'all-scored')!;
      const third = results.filter((r) => r.position === 3).map((r) => r.teamName);
      expect(third.sort()).toEqual(['Fourth', 'Third']);
    });

    it('labels both teams as joint', () => {
      const results = computeFinalResults(finalsWithNames, teams, 'all-scored')!;
      const labels = results.filter((r) => r.position === 3).map((r) => r.placementLabel);
      expect(labels).toEqual(['Joint 3rd', 'Joint 3rd']);
    });

    it('leaves no one in the lower position', () => {
      const results = computeFinalResults(finalsWithNames, teams, 'all-scored')!;
      expect(results.some((r) => r.position === 4)).toBe(false);
    });

    it('keeps other finals unaffected', () => {
      const results = computeFinalResults(finalsWithNames, teams, 'all-scored')!;
      expect(results.slice(0, 2).map((r) => [r.position, r.teamName])).toEqual([
        [1, 'Underdog'],
        [2, 'Favorite'],
      ]);
    });
  });
});
