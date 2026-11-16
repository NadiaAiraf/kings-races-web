// End-to-end checks of optional tie-break races through the race list
// officials use, with the real store, cheat sheets and hooks.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { createInitialDisciplines } from '../store/initialState';
import { assignSlots } from '../domain/assignSlots';
import { getCheatSheet } from '../domain/cheatSheets';
import { useStandings } from '../hooks/useStandings';
import { useCurrentRace } from '../hooks/useCurrentRace';
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
const slotOf = new Map(assignSlots(TEAMS).map((t) => [t.name, t.slot]));
const nameOf = new Map(assignSlots(TEAMS).map((t) => [t.slot, t.name]));

/**
 * A 4-team round (every pair meets twice) scored by naming each race's
 * winner. Unlisted races are left unscored.
 */
function fourTeamRound(winners: Record<number, string>): DisciplineState {
  const teams = assignSlots(TEAMS);
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
    tiebreakRaces: {},
  };
}

/** Race number -> winner for a 4-team round, using the real race order. */
function winnersFor(beats: Array<[string, string, number]>): Record<number, string> {
  // beats: [winner, loser, which meeting (1st or 2nd)]
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

// Kings wins all 6. Imperial, Bristol and Bath each win 2 (each beats each
// of the other two once), so all three are level.
const THREE_WAY = winnersFor([
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
]);

// Imperial and Kings both win 4; Bath and Bristol both win 2.
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

const TIED = ['Imperial', 'Bristol', 'Bath'];

/** The original meetings among the tied three, in race order. */
function tiedMeetings() {
  const tied = new Set(TIED.map((n) => slotOf.get(n)!));
  return getCheatSheet(4).roundOneRaces.filter(
    (r) => tied.has(r.homeSlot) && tied.has(r.awaySlot)
  );
}

/** Record every tie-break race, the winner picked from (home, away, meeting). */
function scoreTiebreaks(pick: (home: string, away: string, meeting: number) => string) {
  const seen = new Map<string, number>();
  act(() => {
    for (const r of tiedMeetings()) {
      // Tie-break races swap the sides of the original meeting.
      const home = nameOf.get(r.awaySlot)!;
      const away = nameOf.get(r.homeSlot)!;
      const pair = [home, away].sort().join('-');
      const meeting = (seen.get(pair) ?? 0) + 1;
      seen.set(pair, meeting);
      const homeWon = pick(home, away, meeting) === home;
      store().recordResult('mixed', {
        raceId: `tb-A-r1-${r.raceNum}`,
        homeSlot: r.awaySlot,
        awaySlot: r.homeSlot,
        homeOutcome: homeWon ? 'win' : 'loss',
        awayOutcome: homeWon ? 'loss' : 'win',
      });
    }
  });
}

/** Imperial wins both against each rival, Bristol both against Bath. */
const decided = (home: string, away: string) =>
  TIED.indexOf(home) < TIED.indexOf(away) ? home : away;

/** Each team wins one of its two races against each rival. */
const eachWinsOnce = (home: string, away: string, meeting: number) => {
  const [first, second] = [home, away].sort();
  return meeting === 1 ? first : second;
};

function resolverBox() {
  return screen.getByRole('heading', { name: /Resolve tie: Group A/ }).parentElement!;
}

/** Team names in the resolver rows, top to bottom (not the race cards). */
function resolverOrder(): string[] {
  return within(resolverBox())
    .getAllByText(/^\d+\.$/)
    .map((el) => el.nextElementSibling!.textContent!);
}

describe('optional tie-break races in the race list', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    store().resetEvent();
  });

  afterEach(() => cleanup());

  it('offers officials tie-break races for a three-way tie', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();

    expect(within(resolverBox()).getByRole('button', { name: 'Run tie-break races' })).toBeTruthy();
  });

  it('offers no tie-break races for two-team ties', () => {
    load(fourTeamRound(TWO_PAIRS));
    renderRaceList();

    expect(screen.queryByRole('button', { name: 'Run tie-break races' })).toBeNull();
  });

  it('shows the six meetings of the tied teams in race order with sides swapped', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();

    fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));

    const labels = screen.getAllByLabelText(/^Tie-break \d:/).map((el) => el.getAttribute('aria-label'));
    expect(labels).toEqual(
      tiedMeetings().map(
        (r, i) => `Tie-break ${i + 1}: ${nameOf.get(r.awaySlot)} versus ${nameOf.get(r.homeSlot)}`
      )
    );
  });

  it('opens the resolver in tie-break order once the races decide it', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();
    fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));

    scoreTiebreaks(decided);

    expect(resolverOrder()).toEqual(['Kings', 'Imperial', 'Bristol', 'Bath']);
  });

  it('explains the decided order', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();
    fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));

    scoreTiebreaks(decided);

    expect(
      screen.getByText(
        'Tie-break races decide the order: Imperial 4 wins, Bristol 2, Bath 0. Check the order below and press Confirm order.'
      )
    ).toBeTruthy();
  });

  it('leaves the group unresolved until an official confirms the order', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();
    fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));

    scoreTiebreaks(decided);

    expect(store().disciplines.mixed.manualTiebreaks).toEqual({});
  });

  it('saves the tie-break order when the official confirms it', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();
    fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));
    scoreTiebreaks(decided);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm order' }));

    expect(store().disciplines.mixed.manualTiebreaks.A).toEqual(
      ['Kings', 'Imperial', 'Bristol', 'Bath'].map((n) => slotOf.get(n))
    );
  });

  it('tells officials to settle it their own way when the teams are still level', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();
    fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));
    const pointsOrder = resolverOrder();

    scoreTiebreaks(eachWinsOnce);

    expect(screen.getByText(/are still level after the tie-break races\. Settle it your own way, e\.g\. rock, paper, scissors or a beer drinking contest/)).toBeTruthy();
    expect(resolverOrder()).toEqual(pointsOrder);
  });

  it('leaves group standings and race progress unchanged by tie-break results', () => {
    load(fourTeamRound(THREE_WAY));
    act(() => store().setTiebreakRaces('mixed', 'A', TIED.map((n) => slotOf.get(n)!)));
    const { result } = renderHook(() => ({
      standings: useStandings('mixed')?.rawStandings,
      progress: useCurrentRace('mixed'),
    }));
    const before = JSON.stringify(result.current);

    scoreTiebreaks(decided);

    expect(JSON.stringify(result.current)).toBe(before);
  });

  it('drops the old tie-break races when a changed result changes the tie', () => {
    load(fourTeamRound(THREE_WAY));
    renderRaceList();
    fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));

    // Kings loses its first meeting with each rival: all four level on 3.
    const flips = winnersFor([
      ['Imperial', 'Kings', 1],
      ['Bristol', 'Kings', 1],
      ['Bath', 'Kings', 1],
    ]);
    act(() => {
      for (const race of getCheatSheet(4).roundOneRaces) {
        const winner = flips[race.raceNum];
        if (!winner) continue;
        const homeWon = slotOf.get(winner) === race.homeSlot;
        store().recordResult('mixed', {
          raceId: `r1-${race.raceNum}`,
          homeSlot: race.homeSlot,
          awaySlot: race.awaySlot,
          homeOutcome: homeWon ? 'win' : 'loss',
          awayOutcome: homeWon ? 'loss' : 'win',
        });
      }
    });

    expect({
      cards: screen.queryAllByLabelText(/^Tie-break \d:/).length,
      stale: !!screen.queryByText('The tie has changed since tie-break races were started.'),
    }).toEqual({ cards: 0, stale: true });
  });
});
