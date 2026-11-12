// End-to-end checks of the head-to-head tiebreak default through the race
// list officials use, with the real store, cheat sheets and hooks.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { createInitialDisciplines } from '../store/initialState';
import { assignSlots } from '../domain/assignSlots';
import { getCheatSheet } from '../domain/cheatSheets';
import { calculateGroupStandings } from '../domain/scoring';
import { playedDiscipline } from '../domain/__fixtures__/playedDiscipline';
import { useR2State } from '../hooks/useR2State';
import { RaceListView } from './races/RaceListView';
import type { DisciplineState, Score } from '../domain/types';

const store = () => useEventStore.getState();

const renderRaceList = (canEdit = true) =>
  render(
    <EditAccessContext.Provider value={canEdit}>
      <RaceListView discipline="mixed" />
    </EditAccessContext.Provider>
  );

const TEAMS = ['Kings', 'Imperial', 'Bristol', 'Bath'];

/**
 * A 4-team round (every pair meets twice) scored by naming each race's
 * winner. Unlisted races are left unscored.
 */
function fourTeamRound(winners: Record<number, string>): DisciplineState {
  const teams = assignSlots(TEAMS);
  const slotOf = new Map(teams.map((t) => [t.name, t.slot]));
  const structure = getCheatSheet(4);
  const scores: Score[] = [];
  for (const race of structure.roundOneRaces) {
    const winner = winners[race.raceNum];
    if (!winner) continue;
    const homeWon = slotOf.get(winner) === race.homeSlot;
    if (!homeWon && slotOf.get(winner) !== race.awaySlot) {
      throw new Error(`${winner} is not in race ${race.raceNum}`);
    }
    scores.push({
      raceId: `r1-${race.raceNum}`,
      homeSlot: race.homeSlot,
      awaySlot: race.awaySlot,
      homeOutcome: homeWon ? 'win' : 'loss',
      awayOutcome: homeWon ? 'loss' : 'win',
    });
  }
  return {
    teams,
    teamCount: 4,
    phase: 'group-stage',
    scores,
    manualTiebreaks: {},
    placings: {},
    notes: {},
  };
}

/** Race number -> winner for a 4-team round, using the real race order. */
function winnersFor(beats: Array<[string, string, number]>): Record<number, string> {
  // beats: [winner, loser, which meeting (1st or 2nd)]
  const teams = assignSlots(TEAMS);
  const slotOf = new Map(teams.map((t) => [t.name, t.slot]));
  const meetings = new Map<string, number[]>();
  for (const race of getCheatSheet(4).roundOneRaces) {
    const key = [race.homeSlot, race.awaySlot].sort((a, b) => a - b).join('-');
    meetings.set(key, [...(meetings.get(key) ?? []), race.raceNum]);
  }
  const out: Record<number, string> = {};
  for (const [winner, loser, meeting] of beats) {
    const key = [slotOf.get(winner)!, slotOf.get(loser)!].sort((a, b) => a - b).join('-');
    out[meetings.get(key)![meeting - 1]] = winner;
  }
  return out;
}

function load(mixed: DisciplineState) {
  useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed } });
}

/** The team names in the resolver, top to bottom. */
function resolverOrder(): string[] {
  const panel = screen.getByRole('heading', { name: /Resolve tie: Group A/ }).parentElement!;
  return within(panel)
    .getAllByText(new RegExp(`^(${TEAMS.join('|')})$`))
    .map((el) => el.textContent!);
}

// Imperial and Kings both win 4 (Imperial beats Kings twice); Bath and
// Bristol both win 2 (they split their two races).
const TWO_PAIRS = winnersFor([
  ['Imperial', 'Kings', 1],
  ['Imperial', 'Kings', 2],
  ['Kings', 'Bath', 1],
  ['Kings', 'Bath', 2],
  ['Kings', 'Bristol', 1],
  ['Kings', 'Bristol', 2],
  ['Imperial', 'Bath', 1],
  ['Bath', 'Imperial', 2],
  ['Imperial', 'Bristol', 1],
  ['Bristol', 'Imperial', 2],
  ['Bath', 'Bristol', 1],
  ['Bristol', 'Bath', 2],
]);

describe('head-to-head tiebreak default in the race list', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    store().resetEvent();
  });

  afterEach(() => cleanup());

  it('puts the team that won both meetings first and explains why', () => {
    load(fourTeamRound(TWO_PAIRS));
    renderRaceList();

    expect(resolverOrder()).toEqual(['Imperial', 'Kings', 'Bath', 'Bristol']);
    const [first, second] = Object.entries(TWO_PAIRS)
      .filter(([, w]) => w === 'Imperial')
      .map(([n]) => Number(n))
      .filter((n) => {
        const race = getCheatSheet(4).roundOneRaces.find((r) => r.raceNum === n)!;
        return [race.homeSlot, race.awaySlot].includes(1); // Kings is slot 1
      });
    expect(
      screen.getByText(
        `Imperial placed above Kings: won both head-to-head races (Races ${first} and ${second})`
      )
    ).toBeTruthy();
  });

  it('gives no note to a pair that split their meetings', () => {
    load(fourTeamRound(TWO_PAIRS));
    renderRaceList();

    expect(screen.queryByText(/Bath placed above|Bristol placed above/)).toBeNull();
  });

  it('keeps the group unresolved until the official confirms', () => {
    load(fourTeamRound(TWO_PAIRS));
    renderRaceList();

    expect(screen.getByText('Resolve tied standings below to proceed to finals.')).toBeTruthy();
    expect(store().disciplines.mixed.manualTiebreaks).toEqual({});
  });

  it('saves the suggested order on confirm and unblocks the finals', () => {
    const round = fourTeamRound(TWO_PAIRS);
    load(round);
    renderRaceList();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));

    const slotOf = new Map(round.teams.map((t) => [t.name, t.slot]));
    expect(store().disciplines.mixed.manualTiebreaks.A).toEqual(
      ['Imperial', 'Kings', 'Bath', 'Bristol'].map((n) => slotOf.get(n))
    );
    expect(screen.queryByText('Resolve tied standings below to proceed to finals.')).toBeNull();
  });

  it('lets the official override the suggestion before confirming', () => {
    const round = fourTeamRound(TWO_PAIRS);
    load(round);
    renderRaceList();

    fireEvent.click(screen.getByRole('button', { name: 'Move Kings up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));

    const slotOf = new Map(round.teams.map((t) => [t.name, t.slot]));
    expect(store().disciplines.mixed.manualTiebreaks.A.slice(0, 2)).toEqual([
      slotOf.get('Kings'),
      slotOf.get('Imperial'),
    ]);
  });

  it('shows viewers who cannot edit only the waiting message', () => {
    load(fourTeamRound(TWO_PAIRS));
    renderRaceList(false);

    expect(screen.getByText('Waiting for an official to set the finishing order.')).toBeTruthy();
    expect(screen.queryByText(/placed above/)).toBeNull();
  });

  it('leaves a three-way tie in points-only order with no note', () => {
    // Kings wins all 6. Imperial, Bristol and Bath each win 2 (each beats
    // each of the other two once), so all three are level.
    load(
      fourTeamRound(
        winnersFor([
          ['Kings', 'Imperial', 1],
          ['Kings', 'Imperial', 2],
          ['Kings', 'Bristol', 1],
          ['Kings', 'Bristol', 2],
          ['Kings', 'Bath', 1],
          ['Kings', 'Bath', 2],
          ['Imperial', 'Bristol', 1],
          ['Bristol', 'Imperial', 2],
          ['Bristol', 'Bath', 1],
          ['Bath', 'Bristol', 2],
          ['Bath', 'Imperial', 1],
          ['Imperial', 'Bath', 2],
        ])
      )
    );
    renderRaceList();

    const round = store().disciplines.mixed;
    const pointsOnly = calculateGroupStandings(round.scores, getCheatSheet(4).groups[0].teamSlots)
      .map((s) => round.teams.find((t) => t.slot === s.slot)!.name);
    expect(pointsOnly[0]).toBe('Kings');
    expect(resolverOrder()).toEqual(pointsOnly);
    expect(screen.queryByText(/placed above/)).toBeNull();
  });

  it('asks again when a changed result breaks the saved order', () => {
    const round = fourTeamRound(TWO_PAIRS);
    load(round);
    const { unmount } = renderRaceList();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));
    unmount();

    // Flip Bath's win over Imperial, so Imperial pulls clear of Kings.
    const slotOf = new Map(round.teams.map((t) => [t.name, t.slot]));
    const flip = getCheatSheet(4).roundOneRaces.find(
      (r) =>
        TWO_PAIRS[r.raceNum] === 'Bath' &&
        [r.homeSlot, r.awaySlot].includes(slotOf.get('Imperial')!)
    )!;
    const imperialHome = flip.homeSlot === slotOf.get('Imperial');
    store().recordResult('mixed', {
      raceId: `r1-${flip.raceNum}`,
      homeSlot: flip.homeSlot,
      awaySlot: flip.awaySlot,
      homeOutcome: imperialHome ? 'win' : 'loss',
      awayOutcome: imperialHome ? 'loss' : 'win',
    });
    renderRaceList();

    // Imperial 5 wins, Kings 4, Bath 1, Bristol 2: no ties left.
    expect(screen.queryByRole('heading', { name: /Resolve tie/ })).toBeNull();
  });
});

/**
 * 8 teams with Round 1 played (home team wins) and its ties settled the way
 * an official would, by confirming the points-only order, so Round 2 can run.
 */
function startRoundTwo() {
  const mixed = playedDiscipline(8, { phase: 'round-two' });
  mixed.scores = mixed.scores.filter((s) => s.raceId.startsWith('r1-'));
  for (const group of getCheatSheet(8).groups) {
    mixed.manualTiebreaks[group.letter] = calculateGroupStandings(mixed.scores, group.teamSlots).map(
      (s) => s.slot
    );
  }
  useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed } });
  return mixed;
}

/** Score a Round 2 group, naming the winning letter for each pairing. */
function scoreR2Group(groupNum: string, winnerLetter: (home: string, away: string) => string) {
  const r2 = renderHook(() => useR2State('mixed')).result.current!;
  const letters = r2.r2Groups.find((g) => g.groupNum === groupNum)!.resolvedTeams;
  const group = getCheatSheet(8).roundTwoGroups!.find((g) => g.groupNum === groupNum)!;
  for (const race of group.races) {
    const homeWins = winnerLetter(race.homeLetter, race.awayLetter) === race.homeLetter;
    store().recordResult('mixed', {
      raceId: `r2-${groupNum}-${race.raceNum}`,
      homeSlot: letters[race.homeLetter]!,
      awaySlot: letters[race.awayLetter]!,
      homeOutcome: homeWins ? 'win' : 'loss',
      awayOutcome: homeWins ? 'loss' : 'win',
    });
  }
  return { letters, r2Races: r2.r2Races };
}

// Group II is E, F, G, H. F beats E and G; E beats G and H; G beats H; H
// beats F. E and F finish on 2 wins, G and H on 1, and each pair has one
// decisive race: EF (group race 1) and GH (group race 2).
const GROUP_II_WINNER: Record<string, string> = {
  EF: 'F', GH: 'G', FG: 'F', HE: 'E', EG: 'E', FH: 'H',
};

describe('head-to-head tiebreak default in Round 2', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    store().resetEvent();
  });

  afterEach(() => cleanup());

  it('names each race by the running Round 2 number officials see', () => {
    const mixed = startRoundTwo();
    scoreR2Group('I', (home) => home);
    const { letters, r2Races } = scoreR2Group('II', (h, a) => GROUP_II_WINNER[h + a]);

    const shown = (inGroup: number) => r2Races.find((r) => r.raceId === `r2-II-${inGroup}`)!.raceNum;
    const name = (letter: string) => mixed.teams.find((t) => t.slot === letters[letter])!.name;
    renderRaceList();

    // The groups are interleaved, so group II's first race is not race 1.
    expect(shown(1)).not.toBe(1);
    expect(
      screen.getByText(
        `${name('F')} placed above ${name('E')}: won their head-to-head race (Race ${shown(1)})`
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        `${name('G')} placed above ${name('H')}: won their head-to-head race (Race ${shown(2)})`
      )
    ).toBeTruthy();
  });

  it('only counts Round 2 races, not an earlier Round 1 meeting', () => {
    // With Round 1 played home-wins, E beat G and F beat H in Round 1. In
    // Round 2, G beats E and H beats F, and both pairs finish level (E and G
    // on 2 wins, F and H on 1). Counting the Round 1 races too would make
    // both pairs a 1-1 split with no suggestion.
    const mixed = startRoundTwo();
    const r1Winner = (a: number, b: number) =>
      mixed.scores.find((s) => [s.homeSlot, s.awaySlot].includes(a) && [s.homeSlot, s.awaySlot].includes(b))
        ?.homeSlot;
    scoreR2Group('I', (home) => home);
    const { letters, r2Races } = scoreR2Group(
      'II',
      (h, a) => ({ EF: 'E', GH: 'G', FG: 'F', HE: 'E', EG: 'G', FH: 'H' })[h + a]!
    );
    // The setup depends on these Round 1 results; fail loudly if they move.
    expect(r1Winner(letters.E!, letters.G!)).toBe(letters.E);
    expect(r1Winner(letters.F!, letters.H!)).toBe(letters.F);

    const shown = (inGroup: number) => r2Races.find((r) => r.raceId === `r2-II-${inGroup}`)!.raceNum;
    const name = (letter: string) => mixed.teams.find((t) => t.slot === letters[letter])!.name;
    renderRaceList();

    const panel = screen.getByRole('heading', { name: 'Resolve tie: Round 2 Group II' }).parentElement!;
    expect(
      within(panel).getByText(
        `${name('G')} placed above ${name('E')}: won their head-to-head race (Race ${shown(5)})`
      )
    ).toBeTruthy();
    expect(
      within(panel).getByText(
        `${name('H')} placed above ${name('F')}: won their head-to-head race (Race ${shown(6)})`
      )
    ).toBeTruthy();
  });
});
