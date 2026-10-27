import { describe, it, expect } from 'vitest';
import {
  computeRoundPlacings,
  isResultsOnly,
  isStoppedEarly,
  leaguePoints,
  roundResults,
} from './roundPlacings';
import {
  jointPlacings19,
  playedDiscipline,
  stoppedEarlyDiscipline,
  withUnplaceableTeams,
} from './__fixtures__/playedDiscipline';

describe('computeRoundPlacings', () => {
  it('is null until the discipline is complete', () => {
    expect(computeRoundPlacings(playedDiscipline(8, { phase: 'finals' }))).toBeNull();
  });

  it('places finalists from their final: winner on the higher place', () => {
    const state = playedDiscipline(4);
    const final = state.scores.find((s) => s.raceId === 'fin-1')!; // 1st/2nd
    const placings = computeRoundPlacings(state)!;

    expect(placings.find((p) => p.slot === final.homeSlot)!.place).toBe(1);
  });

  it('gives both teams the higher place when a final was not run', () => {
    const state = playedDiscipline(4);
    state.scores = state.scores.map((s) =>
      s.raceId === 'fin-0' ? { ...s, homeOutcome: 'not-run', awayOutcome: 'not-run' } : s
    );
    const placings = computeRoundPlacings(state)!;

    expect(placings.filter((p) => p.place === 3)).toHaveLength(2);
  });

  it('places teams without a final from their group position', () => {
    // 7 teams: finals decide 1st-4th; 5th-7th come from group II.
    const placings = computeRoundPlacings(playedDiscipline(7))!;
    expect(placings.filter((p) => p.source === 'group').map((p) => p.place)).toEqual([5, 6, 7]);
  });

  it('leaves a team nothing can place for an official', () => {
    const placings = computeRoundPlacings(withUnplaceableTeams(playedDiscipline(8), 2))!;
    expect(placings.filter((p) => p.place === null)).toHaveLength(2);
  });

  it('gives the last unplaced team the last free place', () => {
    // 5 teams: finals decide 1st-4th and the sheet lists no 5th.
    const placings = computeRoundPlacings(playedDiscipline(5))!;
    expect(placings.at(-1)).toMatchObject({ place: 5, source: 'group' });
  });

  it('counts a joint place as taking the place after it', () => {
    // 5 teams with 3rd/4th not run: joint 3rd takes 3rd and 4th, leaving 5th.
    const state = playedDiscipline(5);
    state.scores = state.scores.map((s) =>
      s.raceId === 'fin-0' ? { ...s, homeOutcome: 'not-run', awayOutcome: 'not-run' } : s
    );
    expect(computeRoundPlacings(state)!.map((p) => p.place)).toEqual([1, 2, 3, 3, 5]);
  });

  it("lets an official's place override the computed one", () => {
    const state = withUnplaceableTeams(playedDiscipline(8), 2);
    const unplaced = computeRoundPlacings(state)!.find((p) => p.place === null)!;
    state.placings = { [unplaced.slot]: 3 };

    const placing = computeRoundPlacings(state)!.find((p) => p.slot === unplaced.slot)!;
    expect(placing).toMatchObject({ place: 3, source: 'official', computedPlace: null });
  });

  it('lists teams best first with unplaced teams last', () => {
    const places = computeRoundPlacings(withUnplaceableTeams(playedDiscipline(4), 2))!.map(
      (p) => p.place
    );
    expect(places.slice(-2)).toEqual([null, null]);
    expect(places.slice(0, 2).every((p) => p !== null)).toBe(true);
  });

  // Finals plus the spreadsheet's refs place every team, for every count.
  const ALL_COUNTS = Array.from({ length: 28 }, (_, i) => i + 4);

  it.each(ALL_COUNTS)('places all %i teams automatically', (count) => {
    // Joint places (e.g. two teams 25th for 29+ teams) mean not always 1..N.
    const places = computeRoundPlacings(playedDiscipline(count))!.map((p) => p.place);
    expect(places.every((p) => p !== null && p >= 1 && p <= count)).toBe(true);
  });

  it.each(Array.from({ length: 28 }, (_, i) => i + 4))(
    'never gives two teams the same place from finals for %i teams',
    (count) => {
      const fromFinals = computeRoundPlacings(playedDiscipline(count))!
        .filter((p) => p.source === 'final')
        .map((p) => p.place);
      expect(new Set(fromFinals).size).toBe(fromFinals.length);
    }
  );
});

describe('leaguePoints', () => {
  // Spot checks against the "League Points Lookup" sheet.
  it.each([
    ['mixed', 1, 30],
    ['mixed', 3, 26],
    ['mixed', 4, 25],
    ['mixed', 27, 2],
    ['mixed', 30, 1],
    ['ladies', 1, 15],
    ['ladies', 4, 10],
    ['ladies', 13, 1],
    ['board', 2, 8],
    ['board', 8, 1],
    ['board', 17, 1],
  ] as const)('%s place %i scores %i', (discipline, place, points) => {
    expect(leaguePoints(discipline, place)).toBe(points);
  });

  it('scores 1 point beyond the 30 places the sheet lists', () => {
    expect(leaguePoints('mixed', 31)).toBe(1);
  });
});

describe('roundResults (CSV export)', () => {
  it('lists every team, not only finalists, matching the placings', () => {
    // 9 teams: 7th-9th are placed from Group III, not by a final.
    const results = roundResults(playedDiscipline(9))!;
    expect(results.map((r) => r.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("uses an official's corrected place", () => {
    const state = playedDiscipline(4);
    const team = state.teams[0];
    state.placings = { [team.slot]: 4 };
    const row = roundResults(state)!.find((r) => r.teamName === team.name)!;
    expect(row.position).toBe(4);
  });

  it('marks shared places as joint', () => {
    const state = playedDiscipline(4);
    state.scores = state.scores.map((s) =>
      s.raceId === 'fin-0' ? { ...s, homeOutcome: 'not-run', awayOutcome: 'not-run' } : s
    );
    expect(roundResults(state)!.filter((r) => r.placementLabel === 'Joint 3rd')).toHaveLength(2);
  });
});

describe('a round stopped early', () => {
  /** 19 teams stopped after 42 races (mid round two), as in production. */
  function mixedStoppedEarly() {
    const state = stoppedEarlyDiscipline(19, 42);
    return { ...state, placings: jointPlacings19(state) };
  }

  it('is stopped early when complete with some results and finals not all scored', () => {
    expect(isStoppedEarly(stoppedEarlyDiscipline(8, 5))).toBe(true);
  });

  it('is not stopped early when every race including the finals was run', () => {
    expect(isStoppedEarly(playedDiscipline(8))).toBe(false);
  });

  it('is not stopped early when it has no race results (results only)', () => {
    expect(isStoppedEarly(playedDiscipline(8, { scores: [] }))).toBe(false);
  });

  it('is not stopped early while the discipline is still being raced', () => {
    const racing = { ...stoppedEarlyDiscipline(8, 5), phase: 'round-two' as const };
    expect(isStoppedEarly(racing)).toBe(false);
  });

  it('takes its places from the officials, not null', () => {
    const state = stoppedEarlyDiscipline(8, 5);
    const slot = state.teams[0].slot;
    state.placings = { [slot]: 2 };

    const placing = computeRoundPlacings(state)!.find((p) => p.slot === slot)!;
    expect(placing).toMatchObject({ place: 2, source: 'entered', computedPlace: 2 });
  });

  it('keeps joint places: six on 1st, six on 7th, seven on 13th', () => {
    const places = computeRoundPlacings(mixedStoppedEarly())!.map((p) => p.place);
    expect(places).toEqual([...Array(6).fill(1), ...Array(6).fill(7), ...Array(7).fill(13)]);
  });

  it('lists a team without an entered place last with no place', () => {
    const state = stoppedEarlyDiscipline(8, 5, {});
    const first = state.teams[0];
    state.placings = Object.fromEntries(
      state.teams.filter((t) => t.slot !== first.slot).map((t, i) => [t.slot, i + 1])
    );

    expect(computeRoundPlacings(state)!.at(-1)).toMatchObject({ slot: first.slot, place: null });
  });

  it('labels the shared places as joint in the CSV export', () => {
    const labels = new Set(roundResults(mixedStoppedEarly())!.map((r) => r.placementLabel));
    expect([...labels]).toEqual(['Joint 1st', 'Joint 7th', 'Joint 13th']);
  });

  it('is not a results-only discipline', () => {
    expect(isResultsOnly(mixedStoppedEarly())).toBe(false);
  });
});
