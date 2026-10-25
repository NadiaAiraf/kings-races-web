import { describe, it, expect } from 'vitest';
import type { DisciplineState } from './types';
import { assignSlots } from './assignSlots';
import { computeRoundPlacings, isResultsOnly, roundResults } from './roundPlacings';
import { computeSeasonStandings } from '../seasons/seasonStandings';
import { createInitialDisciplines } from '../store/initialState';

/** Ladies R1 from the sheet: three teams joint 5th. */
function ladiesEntered(): DisciplineState {
  const places: [string, number][] = [
    ['Surrey 1', 1],
    ['Kings', 2],
    ['Southampton 1', 3],
    ['UCL 1', 4],
    ['Sussex', 5],
    ['Imperial', 5],
    ['UCL 2', 5],
  ];
  const teams = assignSlots(places.map(([name]) => name));
  return {
    teams,
    teamCount: teams.length,
    phase: 'complete',
    scores: [],
    manualTiebreaks: {},
    placings: Object.fromEntries(teams.map((t, i) => [String(t.slot), places[i][1]])),
    notes: {},
  };
}

describe('results-only disciplines', () => {
  it('recognises a finished discipline with places but no races', () => {
    expect(isResultsOnly(ladiesEntered())).toBe(true);
  });

  it('does not treat a discipline still being raced as results-only', () => {
    expect(isResultsOnly({ ...ladiesEntered(), phase: 'group-stage' })).toBe(false);
  });

  it('places every team as entered, joint places included', () => {
    expect(computeRoundPlacings(ladiesEntered())!.map((p) => p.place)).toEqual([1, 2, 3, 4, 5, 5, 5]);
  });

  it('does not label entered places as corrections', () => {
    expect(computeRoundPlacings(ladiesEntered())!.every((p) => p.source === 'entered')).toBe(true);
  });

  it('exports joint places as joint', () => {
    expect(roundResults(ladiesEntered())!.filter((r) => r.placementLabel === 'Joint 5th')).toHaveLength(3);
  });

  it('counts in the season standings with league points for each place', () => {
    const round = {
      round: { seasonId: '2026-27', league: 'southern' as const, roundNumber: 1, venue: 'Aldershot' },
      disciplines: { ...createInitialDisciplines(), ladies: ladiesEntered() },
    };
    const rows = computeSeasonStandings([round], 'ladies');
    expect(rows.map((r) => r.total)).toEqual([15, 13, 11, 10, 9, 9, 9]);
  });
});
