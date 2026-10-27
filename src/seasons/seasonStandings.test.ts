import { describe, it, expect } from 'vitest';
import { createInitialDisciplines } from '../store/initialState';
import {
  jointPlacings19,
  playedDiscipline,
  stoppedEarlyDiscipline,
  withUnplaceableTeams,
} from '../domain/__fixtures__/playedDiscipline';
import {
  computeSeasonStandings,
  seedingOrder,
  standingsPositions,
  teamKey,
  type StandingsRound,
} from './seasonStandings';

/**
 * A round whose mixed discipline finished with the given places. Places are
 * set as an official's placings so each test states them directly.
 */
function round(
  roundNumber: number,
  places: Record<string, number>,
  seasonId = '2026-27'
): StandingsRound {
  const names = Object.keys(places);
  const mixed = playedDiscipline(names.length);
  mixed.teams = mixed.teams.map((t, i) => ({ ...t, name: names[i] }));
  mixed.placings = Object.fromEntries(mixed.teams.map((t) => [t.slot, places[t.name]]));
  return {
    round: { seasonId, league: 'southern', roundNumber, venue: 'Hemel' },
    disciplines: { ...createInitialDisciplines(), mixed },
  };
}

const names = (rows: { name: string }[]) => rows.map((r) => r.name);

describe('computeSeasonStandings', () => {
  it('awards league points for each place', () => {
    const rows = computeSeasonStandings([round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 })], 'mixed');
    expect(rows.map((r) => r.total)).toEqual([30, 28, 26, 25]);
  });

  it('adds up points across rounds', () => {
    const rows = computeSeasonStandings(
      [round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 }), round(2, { Kings: 4, UCL: 1, LSE: 2, Bath: 3 })],
      'mixed'
    );
    expect(rows[0]).toMatchObject({ name: 'UCL', total: 58 });
  });

  it('matches a team across rounds ignoring case and spacing', () => {
    const rows = computeSeasonStandings(
      [round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 }), round(2, { ' kings ': 1, UCL: 2, LSE: 3, Bath: 4 })],
      'mixed'
    );
    expect(rows).toHaveLength(4);
  });

  it("shows the name from the team's most recent round", () => {
    const rows = computeSeasonStandings(
      [round(1, { kings: 1, UCL: 2, LSE: 3, Bath: 4 }), round(2, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 })],
      'mixed'
    );
    expect(rows[0].name).toBe('Kings');
  });

  it('records each round by its number', () => {
    const rows = computeSeasonStandings([round(3, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 })], 'mixed');
    expect(rows[0].results).toEqual({ 3: { place: 1, points: 30 } });
  });

  it('ignores a round where the discipline is not finished', () => {
    const unfinished = round(2, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 });
    unfinished.disciplines.mixed.phase = 'finals';
    const rows = computeSeasonStandings(
      [round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 }), unfinished],
      'mixed'
    );
    expect(rows[0].results[2]).toBeUndefined();
  });

  it("awards league points for a round stopped early from the officials' joint places", () => {
    const mixed = stoppedEarlyDiscipline(19, 42);
    mixed.placings = jointPlacings19(mixed);
    const stopped: StandingsRound = {
      round: { seasonId: '2026-27', league: 'southern', roundNumber: 2, venue: 'Hemel' },
      disciplines: { ...createInitialDisciplines(), mixed },
    };

    const totals = new Set(computeSeasonStandings([stopped], 'mixed').map((r) => r.total));
    expect([...totals]).toEqual([30, 22, 16]);
  });

  it('ignores rounds outside any season', () => {
    const loose = { ...round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 }), round: null };
    expect(computeSeasonStandings([loose], 'mixed')).toEqual([]);
  });

  it('breaks a points tie on the best single result', () => {
    // Kings 30 + 21 = 51 (best 30); UCL 26 + 25 = 51 (best 26).
    const rows = computeSeasonStandings(
      [
        round(1, { Kings: 1, UCL: 3, A: 2, B: 4, C: 5, D: 6, E: 7, F: 8 }),
        round(2, { Kings: 8, UCL: 4, A: 1, B: 2, C: 3, D: 5, E: 6, F: 7 }),
      ],
      'mixed'
    );
    const kings = rows.findIndex((r) => r.name === 'Kings');
    const ucl = rows.findIndex((r) => r.name === 'UCL');
    expect(rows[kings].total).toBe(rows[ucl].total);
    expect(kings).toBeLessThan(ucl);
  });

  it('breaks a full tie on the most recent round', () => {
    // Both score 30 + 28; Kings won the later round.
    const rows = computeSeasonStandings(
      [round(1, { Kings: 2, UCL: 1, LSE: 3, Bath: 4 }), round(2, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 })],
      'mixed'
    );
    expect(names(rows).slice(0, 2)).toEqual(['Kings', 'UCL']);
  });

  it("breaks a tie that is level on every round on last season's position", () => {
    const tied = round(1, { Kings: 1, UCL: 1, LSE: 3, Bath: 4 });
    const lastSeason = new Map([
      ['ucl', 1],
      ['kings', 2],
    ]);
    const rows = computeSeasonStandings([tied], 'mixed', lastSeason);
    expect(names(rows).slice(0, 2)).toEqual(['UCL', 'Kings']);
  });

  it('scores 0 for a team with no place set yet', () => {
    // Two teams nothing places until an official does.
    const mixed = withUnplaceableTeams(playedDiscipline(8), 2);
    const r: StandingsRound = {
      round: { seasonId: '2026-27', league: 'southern', roundNumber: 1, venue: 'Hemel' },
      disciplines: { ...createInitialDisciplines(), mixed },
    };
    const unplaced = computeSeasonStandings([r], 'mixed').filter((row) => row.results[1]!.place === null);
    expect(unplaced.map((row) => row.total)).toEqual([0, 0]);
  });
});

describe('teamKey', () => {
  it('ignores case and extra spaces', () => {
    expect(teamKey('  Kings   College ')).toBe(teamKey('kings college'));
  });
});

describe('standingsPositions', () => {
  it('numbers teams from 1 in standings order', () => {
    const rows = computeSeasonStandings([round(1, { Kings: 2, UCL: 1, LSE: 3, Bath: 4 })], 'mixed');
    expect(standingsPositions(rows).get('ucl')).toBe(1);
  });
});

describe('seedingOrder', () => {
  const lastSeason = [round(1, { Bath: 1, LSE: 2, UCL: 3, Kings: 4 }, '2025-26')];

  it("seeds R1 from last season's final table", () => {
    expect(seedingOrder(1, [], lastSeason, 'mixed')).toEqual(['Bath', 'LSE', 'UCL', 'Kings']);
  });

  it("seeds R2 from this season's R1 standings", () => {
    const r1 = round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 });
    expect(seedingOrder(2, [r1], lastSeason, 'mixed')).toEqual(['Kings', 'UCL', 'LSE', 'Bath']);
  });

  it('ignores the round being entered and later rounds', () => {
    const r1 = round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 });
    const r2 = round(2, { Bath: 1, LSE: 2, UCL: 3, Kings: 4 });
    expect(seedingOrder(2, [r1, r2], [], 'mixed')).toEqual(['Kings', 'UCL', 'LSE', 'Bath']);
  });

  it("ranks last season's teams who have not raced yet below teams with points", () => {
    const r1 = round(1, { Kings: 1, UCL: 2, LSE: 3, Exeter: 4 });
    expect(seedingOrder(2, [r1], lastSeason, 'mixed').at(-1)).toBe('Bath');
  });

  it("adds teams from the league's team list that have no standing, in list order", () => {
    const r1 = round(1, { Kings: 1, UCL: 2, LSE: 3, Bath: 4 });
    expect(seedingOrder(2, [r1], [], 'mixed', ['Exeter', 'ucl', 'Brighton'])).toEqual([
      'Kings',
      'UCL',
      'LSE',
      'Bath',
      'Exeter',
      'Brighton',
    ]);
  });

  it('is empty for a new league with no history', () => {
    expect(seedingOrder(1, [], [], 'mixed')).toEqual([]);
  });
});
