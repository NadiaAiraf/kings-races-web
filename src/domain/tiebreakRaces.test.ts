import { describe, it, expect } from 'vitest';
import {
  TIEBREAK_RACE_PREFIX,
  buildTiebreakRaces,
  isTiebreakRaceId,
  multiTeamTiedSlots,
  r1Meetings,
  r2Meetings,
  sameSlotSet,
  tiebreakRaceId,
  tiebreakRaceOutcome,
  tiebreakRacePrefix,
  type TiebreakRace,
} from './tiebreakRaces';
import type { RaceOutcome, Score, TeamStanding } from './types';
import { playedDiscipline } from './__fixtures__/playedDiscipline';
import { resolveCompletedDiscipline } from './disciplineResults';
import { calculateAllGroupStandings } from './groupCalculations';
import { areAllR1RacesScored, areAllR2RacesScored } from './r2Seeding';
import { areAllFinalsScored } from './finalsSeeding';
import { getCheatSheet } from './cheatSheets';

const standing = (slot: number, points: number): TeamStanding => ({
  slot,
  points,
  wins: 0,
  losses: 0,
  dsqs: 0,
  played: 0,
});

const score = (
  raceId: string,
  homeSlot: number,
  awaySlot: number,
  homeOutcome: RaceOutcome,
  awayOutcome: RaceOutcome
): Score => ({ raceId, homeSlot, awaySlot, homeOutcome, awayOutcome });

/** A tie-break score where `winner` (one of the two slots) wins. */
const tbWin = (race: TiebreakRace, winner: number): Score =>
  score(
    race.raceId,
    race.homeSlot,
    race.awaySlot,
    race.homeSlot === winner ? 'win' : 'loss',
    race.awaySlot === winner ? 'win' : 'loss'
  );

const slotsOf = (order: TeamStanding[]) => order.map((s) => s.slot);

describe('tie-break race ids', () => {
  it('prefixes the original race id with the group key', () => {
    expect(tiebreakRaceId('A', 'r1-7')).toBe('tb-A-r1-7');
  });

  it('builds ids for Round 2 group keys', () => {
    expect(tiebreakRaceId('r2-I', 'r2-I-3')).toBe('tb-r2-I-r2-I-3');
  });

  it('gives a group prefix ending in a dash', () => {
    expect(tiebreakRacePrefix('r2-I')).toBe('tb-r2-I-');
  });

  it('does not let group I match group II ids', () => {
    expect('tb-r2-II-r2-II-1'.startsWith(tiebreakRacePrefix('r2-I'))).toBe(false);
  });

  it('exports the shared tb- prefix', () => {
    expect(TIEBREAK_RACE_PREFIX).toBe('tb-');
  });

  it('recognises tie-break race ids', () => {
    expect(isTiebreakRaceId('tb-A-r1-1')).toBe(true);
  });

  it('does not treat round or finals ids as tie-break races', () => {
    expect(['r1-1', 'r2-I-1', 'fin-0'].map(isTiebreakRaceId)).toEqual([false, false, false]);
  });
});

describe('multiTeamTiedSlots', () => {
  it('returns the slots of a three-team points level in standings order', () => {
    const standings = [standing(5, 9), standing(1, 3), standing(2, 3), standing(3, 3)];

    expect(multiTeamTiedSlots(standings)).toEqual([1, 2, 3]);
  });

  it('ignores a level shared by only two teams', () => {
    const standings = [standing(1, 6), standing(2, 3), standing(3, 3), standing(4, 0)];

    expect(multiTeamTiedSlots(standings)).toEqual([]);
  });

  it('returns every slot from two separate three-team levels', () => {
    const standings = [
      standing(1, 6),
      standing(2, 6),
      standing(3, 6),
      standing(4, 3),
      standing(5, 3),
      standing(6, 3),
    ];

    expect(multiTeamTiedSlots(standings)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('returns nothing when no teams are level', () => {
    const standings = [standing(1, 9), standing(2, 6), standing(3, 3), standing(4, 0)];

    expect(multiTeamTiedSlots(standings)).toEqual([]);
  });
});

describe('sameSlotSet', () => {
  it('matches the same slots in any order', () => {
    expect(sameSlotSet([3, 1, 2], [1, 2, 3])).toBe(true);
  });

  it('does not match different slots', () => {
    expect(sameSlotSet([1, 2, 4], [1, 2, 3])).toBe(false);
  });

  it('does not match a different number of slots', () => {
    expect(sameSlotSet([1, 2], [1, 2, 3])).toBe(false);
  });

  it('does not match undefined', () => {
    expect(sameSlotSet(undefined, [1, 2, 3])).toBe(false);
  });
});

describe('r1Meetings', () => {
  it('lists every Round 1 race with its r1- id', () => {
    const structure = getCheatSheet(4);
    const first = structure.roundOneRaces[0];

    expect(r1Meetings(structure)[0]).toEqual({
      raceId: `r1-${first.raceNum}`,
      homeSlot: first.homeSlot,
      awaySlot: first.awaySlot,
    });
  });
});

describe('r2Meetings', () => {
  it('keeps only the group\'s races whose teams are known', () => {
    const races = [
      { raceId: 'r2-I-1', groupNum: 'I', homeSlot: 1, awaySlot: 2 },
      { raceId: 'r2-I-2', groupNum: 'I', homeSlot: 3, awaySlot: null },
      { raceId: 'r2-II-1', groupNum: 'II', homeSlot: 4, awaySlot: 5 },
    ];

    expect(r2Meetings(races, 'I')).toEqual([{ raceId: 'r2-I-1', homeSlot: 1, awaySlot: 2 }]);
  });
});

describe('buildTiebreakRaces', () => {
  const threeLevel = [standing(1, 3), standing(2, 3), standing(3, 3), standing(4, 0), standing(5, 0)];

  it('swaps home and away for each meeting between tied teams, in race order', () => {
    const meetings = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 2 },
      { raceId: 'r1-2', homeSlot: 4, awaySlot: 5 },
      { raceId: 'r1-3', homeSlot: 2, awaySlot: 3 },
      { raceId: 'r1-4', homeSlot: 3, awaySlot: 1 },
    ];

    expect(buildTiebreakRaces('A', meetings, threeLevel)).toEqual([
      { raceId: 'tb-A-r1-1', originalRaceId: 'r1-1', homeSlot: 2, awaySlot: 1 },
      { raceId: 'tb-A-r1-3', originalRaceId: 'r1-3', homeSlot: 3, awaySlot: 2 },
      { raceId: 'tb-A-r1-4', originalRaceId: 'r1-4', homeSlot: 1, awaySlot: 3 },
    ]);
  });

  it('skips meetings with a team outside the tie', () => {
    const meetings = [{ raceId: 'r1-1', homeSlot: 1, awaySlot: 4 }];

    expect(buildTiebreakRaces('A', meetings, threeLevel)).toEqual([]);
  });

  it('gives a pair that met twice two tie-break races', () => {
    const meetings = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 2 },
      { raceId: 'r1-5', homeSlot: 2, awaySlot: 1 },
    ];

    expect(buildTiebreakRaces('A', meetings, threeLevel).map((r) => r.raceId)).toEqual([
      'tb-A-r1-1',
      'tb-A-r1-5',
    ]);
  });

  it('includes every meeting among four tied teams', () => {
    const standings = [standing(1, 3), standing(2, 3), standing(3, 3), standing(4, 3)];
    const meetings = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 2 },
      { raceId: 'r1-2', homeSlot: 3, awaySlot: 4 },
      { raceId: 'r1-3', homeSlot: 1, awaySlot: 3 },
      { raceId: 'r1-4', homeSlot: 2, awaySlot: 4 },
      { raceId: 'r1-5', homeSlot: 1, awaySlot: 4 },
      { raceId: 'r1-6', homeSlot: 2, awaySlot: 3 },
    ];

    expect(buildTiebreakRaces('A', meetings, standings)).toHaveLength(6);
  });

  it('skips a meeting between teams in two different tied levels', () => {
    const standings = [
      standing(1, 6),
      standing(2, 6),
      standing(3, 6),
      standing(4, 3),
      standing(5, 3),
      standing(6, 3),
    ];
    const meetings = [
      { raceId: 'r1-1', homeSlot: 1, awaySlot: 4 },
      { raceId: 'r1-2', homeSlot: 5, awaySlot: 6 },
    ];

    expect(buildTiebreakRaces('A', meetings, standings).map((r) => r.originalRaceId)).toEqual([
      'r1-2',
    ]);
  });
});

describe('tiebreakRaceOutcome', () => {
  // Kings (1) clear on 9, then 2, 3, 4 level on 3.
  const base = [standing(1, 9), standing(2, 3), standing(3, 3), standing(4, 3)];
  const races: TiebreakRace[] = [
    { raceId: 'tb-A-r1-1', originalRaceId: 'r1-1', homeSlot: 3, awaySlot: 2 },
    { raceId: 'tb-A-r1-2', originalRaceId: 'r1-2', homeSlot: 4, awaySlot: 3 },
    { raceId: 'tb-A-r1-3', originalRaceId: 'r1-3', homeSlot: 2, awaySlot: 4 },
  ];

  it('is incomplete with the base order until every race is scored', () => {
    const scores = [tbWin(races[0], 3)];

    expect(tiebreakRaceOutcome(base, races, scores)).toMatchObject({
      complete: false,
      stillLevel: [],
    });
  });

  it('keeps the base order while incomplete', () => {
    const scores = [tbWin(races[0], 3)];

    expect(slotsOf(tiebreakRaceOutcome(base, races, scores).order)).toEqual([1, 2, 3, 4]);
  });

  it('treats a score with the wrong slots as missing', () => {
    const scores = [
      tbWin(races[0], 3),
      tbWin(races[1], 4),
      score('tb-A-r1-3', 4, 2, 'win', 'loss'),
    ];

    expect(tiebreakRaceOutcome(base, races, scores).complete).toBe(false);
  });

  it('orders the tied level by tie-break wins when they separate every team', () => {
    // 4 beats 3, 4 beats 2, 3 beats 2: wins 4=2, 3=1, 2=0.
    const scores = [tbWin(races[0], 3), tbWin(races[1], 4), tbWin(races[2], 4)];

    const outcome = tiebreakRaceOutcome(base, races, scores);

    expect(slotsOf(outcome.order)).toEqual([1, 4, 3, 2]);
  });

  it('records tie-break wins by slot for the tied teams', () => {
    const scores = [tbWin(races[0], 3), tbWin(races[1], 4), tbWin(races[2], 4)];

    expect(tiebreakRaceOutcome(base, races, scores).wins).toEqual({ 2: 0, 3: 1, 4: 2 });
  });

  it('reports no still-level teams when the wins decide the order', () => {
    const scores = [tbWin(races[0], 3), tbWin(races[1], 4), tbWin(races[2], 4)];

    expect(tiebreakRaceOutcome(base, races, scores)).toMatchObject({
      complete: true,
      stillLevel: [],
    });
  });

  it('reports teams still level when each wins once, keeping the base order', () => {
    // 3 beats 2, 4 beats 3, 2 beats 4: one win each.
    const scores = [tbWin(races[0], 3), tbWin(races[1], 4), tbWin(races[2], 2)];

    const outcome = tiebreakRaceOutcome(base, races, scores);

    expect({ order: slotsOf(outcome.order), stillLevel: outcome.stillLevel }).toEqual({
      order: [1, 2, 3, 4],
      stillLevel: [[2, 3, 4]],
    });
  });

  it('puts a four-team leader first and keeps the other three level', () => {
    const four = [standing(1, 3), standing(2, 3), standing(3, 3), standing(4, 3)];
    const fourRaces: TiebreakRace[] = [
      { raceId: 'tb-A-a', originalRaceId: 'a', homeSlot: 2, awaySlot: 1 },
      { raceId: 'tb-A-b', originalRaceId: 'b', homeSlot: 4, awaySlot: 3 },
      { raceId: 'tb-A-c', originalRaceId: 'c', homeSlot: 3, awaySlot: 1 },
      { raceId: 'tb-A-d', originalRaceId: 'd', homeSlot: 4, awaySlot: 2 },
      { raceId: 'tb-A-e', originalRaceId: 'e', homeSlot: 4, awaySlot: 1 },
      { raceId: 'tb-A-f', originalRaceId: 'f', homeSlot: 3, awaySlot: 2 },
    ];
    // 4 beats everyone (3 wins); 1 beats 2, 2 beats 3, 3 beats 1 (1 win each).
    const scores = [
      tbWin(fourRaces[0], 1),
      tbWin(fourRaces[1], 4),
      tbWin(fourRaces[2], 3),
      tbWin(fourRaces[3], 4),
      tbWin(fourRaces[4], 4),
      tbWin(fourRaces[5], 2),
    ];

    const outcome = tiebreakRaceOutcome(four, fourRaces, scores);

    expect({ order: slotsOf(outcome.order), stillLevel: outcome.stillLevel }).toEqual({
      order: [4, 1, 2, 3],
      stillLevel: [[1, 2, 3]],
    });
  });

  it('counts only wins, not disqualifications of the rival', () => {
    // 2 wins by the rival being disqualified would still be a win for 2;
    // here both are disqualified, so nobody gets the win.
    const scores = [
      score('tb-A-r1-1', 3, 2, 'dsq', 'dsq'),
      tbWin(races[1], 4),
      tbWin(races[2], 4),
    ];

    expect(tiebreakRaceOutcome(base, races, scores).wins).toEqual({ 2: 0, 3: 0, 4: 2 });
  });

  it('keeps teams outside the tied level in place', () => {
    const withLast = [...base, standing(5, 0)];
    const scores = [tbWin(races[0], 3), tbWin(races[1], 4), tbWin(races[2], 4)];

    const outcome = tiebreakRaceOutcome(withLast, races, scores);

    expect([outcome.order[0].slot, outcome.order[4].slot]).toEqual([1, 5]);
  });

  it('does not mutate its inputs', () => {
    const baseCopy = base.map((s) => ({ ...s }));
    const scores = [tbWin(races[0], 3), tbWin(races[1], 4), tbWin(races[2], 4)];

    tiebreakRaceOutcome(base, races, scores);

    expect(base).toEqual(baseCopy);
  });
});

describe('tie-break results leave points and progress unchanged', () => {
  /** Extra tie-break scores where the away team (the original home) loses every race. */
  const withTiebreakScores = (scores: Score[]): Score[] => [
    ...scores,
    ...scores
      .filter((s) => s.raceId.startsWith('r1-'))
      .map((s) =>
        score(`tb-A-${s.raceId}`, s.awaySlot, s.homeSlot, 'win', 'loss')
      ),
  ];

  it('gives the same completed discipline with and without tie-break scores', () => {
    const played = playedDiscipline(8);
    const withTb = { ...played, scores: withTiebreakScores(played.scores) };

    expect(resolveCompletedDiscipline(withTb)).toEqual(resolveCompletedDiscipline(played));
  });

  it('gives the same Round 1 standings with and without tie-break scores', () => {
    const played = playedDiscipline(8);
    const groups = getCheatSheet(8).groups;
    const r1 = (scores: Score[]) =>
      calculateAllGroupStandings(scores.filter((s) => s.raceId.startsWith('r1-')), groups);

    expect(r1(withTiebreakScores(played.scores))).toEqual(r1(played.scores));
  });

  it('does not count tie-break scores as Round 1 progress', () => {
    const structure = getCheatSheet(4);
    const tbOnly = withTiebreakScores(playedDiscipline(4).scores).filter((s) =>
      isTiebreakRaceId(s.raceId)
    );

    expect(areAllR1RacesScored(tbOnly, structure)).toBe(false);
  });

  it('does not count tie-break scores as Round 2 progress', () => {
    const structure = getCheatSheet(8);
    const tbOnly = withTiebreakScores(playedDiscipline(8).scores).filter((s) =>
      isTiebreakRaceId(s.raceId)
    );

    expect(areAllR2RacesScored(tbOnly, structure)).toBe(
      areAllR2RacesScored([], structure)
    );
  });

  it('does not count tie-break scores as finals progress', () => {
    const structure = getCheatSheet(8);
    const tbOnly = withTiebreakScores(playedDiscipline(8).scores).filter((s) =>
      isTiebreakRaceId(s.raceId)
    );

    expect(areAllFinalsScored(structure.finals, tbOnly)).toBe(
      areAllFinalsScored(structure.finals, [])
    );
  });
});
