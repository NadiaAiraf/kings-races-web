import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { EventInfoContext } from '../../events/eventInfo';
import type { EventSummary } from '../../events/eventDoc';
import { LeagueRoundsContext, type LeagueRounds } from '../../seasons/leagueRounds';
import type { StandingsRound } from '../../seasons/seasonStandings';
import { emptyLeagueTeams } from '../../seasons/leagueTeams';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines } from '../../store/initialState';
import { playedDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { TeamEntryView } from './TeamEntryView';

const store = () => useEventStore.getState();

const r2: EventSummary = {
  id: '2026-27_southern_r2',
  name: 'R2 - Hemel',
  date: '2026-12-05',
  round: { seasonId: '2026-27', league: 'southern', roundNumber: 2, venue: 'Hemel' },
};

/** R1 finished with Kings 1st, UCL 2nd, LSE 3rd, Bath 4th (set as placings). */
function finishedR1(): StandingsRound {
  const order = ['Kings', 'UCL', 'LSE', 'Bath'];
  const mixed = playedDiscipline(4);
  mixed.teams = mixed.teams.map((t, i) => ({ ...t, name: order[i] }));
  mixed.placings = Object.fromEntries(mixed.teams.map((t, i) => [t.slot, i + 1]));
  return {
    round: { ...r2.round!, roundNumber: 1 },
    disciplines: { ...createInitialDisciplines(), mixed },
  };
}

function renderEntry(canEdit: boolean, rounds: LeagueRounds | null, event: EventSummary = r2) {
  return render(
    <EventInfoContext.Provider value={event}>
      <LeagueRoundsContext.Provider value={rounds}>
        <EditAccessContext.Provider value={canEdit}>
          <TeamEntryView discipline="mixed" />
        </EditAccessContext.Provider>
      </LeagueRoundsContext.Provider>
    </EventInfoContext.Provider>
  );
}

/** Tick these teams as having turned up. */
function tick(...names: string[]) {
  for (const name of names) fireEvent.click(screen.getByLabelText(name));
}

/** Type a team that is not on the list into the checklist's own box and add it. */
function addNew(name: string) {
  const list = screen.getByRole('region', { name: 'League teams' });
  fireEvent.change(within(list).getByPlaceholderText('Team name'), { target: { value: name } });
  fireEvent.click(within(list).getByRole('button', { name: 'Add' }));
}

const SEASON: LeagueRounds = { season: [finishedR1()], lastSeason: [], teams: emptyLeagueTeams() };

describe('carrying teams over from the league standings', () => {
  beforeEach(() => store().resetEvent());
  afterEach(() => cleanup());

  it('lists the league teams alphabetically', () => {
    renderEntry(true, SEASON);
    const labels = screen.getAllByRole('checkbox').map((c) => c.closest('label')!.textContent);
    expect(labels).toEqual(['Bath', 'Kings', 'LSE', 'UCL']);
  });

  it('sorts numbered teams naturally', () => {
    const teams = { ...emptyLeagueTeams(), mixed: ['UCL 10', 'UCL 2', 'UCL 1'] };
    renderEntry(true, { season: [], lastSeason: [], teams });
    const labels = screen.getAllByRole('checkbox').map((c) => c.closest('label')!.textContent);
    expect(labels).toEqual(['UCL 1', 'UCL 2', 'UCL 10']);
  });

  it('starts with no team ticked', () => {
    renderEntry(true, SEASON);
    expect(screen.getAllByRole('checkbox').some((c) => (c as HTMLInputElement).checked)).toBe(false);
    expect((screen.getByText('Enter 0 teams') as HTMLButtonElement).disabled).toBe(true);
  });

  it('enters all teams in standings order, not list order', () => {
    renderEntry(true, SEASON);
    tick('UCL', 'Bath', 'Kings', 'LSE');
    fireEvent.click(screen.getByText('Enter 4 teams'));
    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual(['Kings', 'UCL', 'LSE', 'Bath']);
  });

  it('enters the teams that turned up in seeding order', () => {
    renderEntry(true, SEASON);
    tick('Bath', 'LSE', 'Kings');
    fireEvent.click(screen.getByText('Enter 3 teams'));

    // Fewer than 4 teams are slotted in entry order.
    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual(['Kings', 'LSE', 'Bath']);
  });

  it('keeps new teams added afterwards at the bottom of the seeding', () => {
    renderEntry(true, SEASON);
    tick('Kings', 'UCL', 'LSE', 'Bath');
    fireEvent.click(screen.getByText('Enter 4 teams'));
    fireEvent.change(screen.getByPlaceholderText('Team name'), { target: { value: 'Exeter' } });
    fireEvent.click(screen.getByText('Add Team'));

    const teams = store().disciplines.mixed.teams;
    expect(teams.at(-1)!.name).toBe('Exeter');
  });

  it('hides the league teams once teams are entered', () => {
    renderEntry(true, SEASON);
    tick('Kings', 'UCL', 'LSE', 'Bath');
    fireEvent.click(screen.getByText('Enter 4 teams'));
    expect(screen.queryByRole('region', { name: 'League teams' })).toBeNull();
  });

  it("seeds teams from the league's team list after the teams with standings", () => {
    const teams = { ...emptyLeagueTeams(), mixed: ['Exeter', 'UCL'] };
    renderEntry(true, { ...SEASON, teams });
    tick('Exeter', 'Kings', 'UCL', 'LSE', 'Bath');
    fireEvent.click(screen.getByText('Enter 5 teams'));
    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual([
      'Kings',
      'UCL',
      'LSE',
      'Bath',
      'Exeter',
    ]);
  });

  it('allows a list longer than 31 and applies the limit to who is ticked', () => {
    const names = Array.from({ length: 34 }, (_, i) => `Team ${i + 1}`);
    const r1: EventSummary = { ...r2, round: { ...r2.round!, roundNumber: 1 } };
    renderEntry(true, { season: [], lastSeason: [], teams: { ...emptyLeagueTeams(), mixed: names } }, r1);
    tick(...names);
    expect(screen.getByText('Maximum 31 teams. Untick some teams.')).toBeTruthy();

    tick('Team 32', 'Team 33', 'Team 34');
    fireEvent.click(screen.getByText('Enter 31 teams'));

    expect(store().disciplines.mixed.teams).toHaveLength(31);
  });

  it('keeps ticks when the list updates while ticking', () => {
    const view = renderEntry(true, SEASON);
    tick('Kings', 'UCL');

    // Another official adds a team to the league list.
    const teams = { ...emptyLeagueTeams(), mixed: ['Exeter'] };
    view.rerender(
      <EventInfoContext.Provider value={r2}>
        <LeagueRoundsContext.Provider value={{ ...SEASON, teams }}>
          <EditAccessContext.Provider value={true}>
            <TeamEntryView discipline="mixed" />
          </EditAccessContext.Provider>
        </LeagueRoundsContext.Provider>
      </EventInfoContext.Provider>
    );

    expect(screen.getByText('Enter 2 teams')).toBeTruthy();
  });

  it('does not offer league teams to viewers', () => {
    renderEntry(false, SEASON);
    expect(screen.queryByRole('region', { name: 'League teams' })).toBeNull();
  });

  it('does not offer league teams outside a season', () => {
    renderEntry(true, null, { ...r2, round: null });
    expect(screen.queryByRole('region', { name: 'League teams' })).toBeNull();
  });

  it('blocks entering more teams than the discipline allows', () => {
    const many = Array.from({ length: 18 }, (_, i) => `Team ${i + 1}`);
    const board = playedDiscipline(18);
    board.teams = board.teams.map((t, i) => ({ ...t, name: many[i] }));
    board.placings = Object.fromEntries(board.teams.map((t, i) => [t.slot, i + 1]));
    const rounds: LeagueRounds = {
      season: [{ round: SEASON.season[0].round, disciplines: { ...createInitialDisciplines(), board } }],
      lastSeason: [],
      teams: emptyLeagueTeams(),
    };
    render(
      <EventInfoContext.Provider value={r2}>
        <LeagueRoundsContext.Provider value={rounds}>
          <EditAccessContext.Provider value={true}>
            <TeamEntryView discipline="board" />
          </EditAccessContext.Provider>
        </LeagueRoundsContext.Provider>
      </EventInfoContext.Provider>
    );

    tick(...many);
    expect(screen.getByText('Maximum 17 teams. Untick some teams.')).toBeTruthy();
    expect((screen.getByText('Enter 18 teams') as HTMLButtonElement).disabled).toBe(true);
  });

  it('hides the standalone team box while the league teams show', () => {
    renderEntry(true, SEASON);
    const list = screen.getByRole('region', { name: 'League teams' });
    const inputs = screen.getAllByPlaceholderText('Team name');
    expect(inputs).toHaveLength(1);
    expect(list.contains(inputs[0])).toBe(true);
    expect(screen.queryByText('Add Team')).toBeNull();
  });

  it('adds a typed team to the list ticked and marked new', () => {
    renderEntry(true, SEASON);
    addNew('Exeter');
    const list = screen.getByRole('region', { name: 'League teams' });
    expect((screen.getByLabelText('Exeter') as HTMLInputElement).checked).toBe(true);
    expect(within(list).getByText('New')).toBeTruthy();
    expect(screen.getByText('Enter 1 team')).toBeTruthy();
  });

  it('enters new teams after the league teams in seeding order', () => {
    renderEntry(true, SEASON);
    tick('Bath', 'Kings');
    addNew('Exeter');
    addNew('Durham');
    tick('UCL');
    fireEvent.click(screen.getByText('Enter 5 teams'));
    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual([
      'Kings',
      'UCL',
      'Bath',
      'Exeter',
      'Durham',
    ]);
  });

  it('ticks a league team instead of adding a duplicate', () => {
    renderEntry(true, SEASON);
    addNew('  kings ');
    const list = screen.getByRole('region', { name: 'League teams' });
    expect((screen.getByLabelText('Kings') as HTMLInputElement).checked).toBe(true);
    expect(within(list).queryByText('New')).toBeNull();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    expect(screen.getByText('Enter 1 team')).toBeTruthy();
  });

  it('rejects a team already added as new', () => {
    renderEntry(true, SEASON);
    addNew('Exeter');
    const list = screen.getByRole('region', { name: 'League teams' });
    fireEvent.change(within(list).getByPlaceholderText('Team name'), { target: { value: 'exeter' } });
    expect(screen.getByText('Team already added')).toBeTruthy();
    expect((within(list).getByRole('button', { name: 'Add' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps an unticked new team in the list and leaves it out', () => {
    renderEntry(true, SEASON);
    addNew('Exeter');
    tick('Kings');
    fireEvent.click(screen.getByLabelText('Exeter'));
    expect((screen.getByLabelText('Exeter') as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByText('Enter 1 team'));
    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual(['Kings']);
  });

  it('enters a ticked new team as the league team it now matches, in its seeding position', () => {
    const view = renderEntry(true, SEASON);
    tick('Kings');
    addNew('Durham');
    addNew('exeter');

    // Another official adds Exeter to the league list while teams are being ticked.
    const teams = { ...emptyLeagueTeams(), mixed: ['Exeter'] };
    view.rerender(
      <EventInfoContext.Provider value={r2}>
        <LeagueRoundsContext.Provider value={{ ...SEASON, teams }}>
          <EditAccessContext.Provider value={true}>
            <TeamEntryView discipline="mixed" />
          </EditAccessContext.Provider>
        </LeagueRoundsContext.Provider>
      </EventInfoContext.Provider>
    );

    fireEvent.click(screen.getByText('Enter 3 teams'));
    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual(['Kings', 'Exeter', 'Durham']);
  });

  it('does not enter an unticked new team that now matches a league team', () => {
    const view = renderEntry(true, SEASON);
    tick('Kings');
    addNew('Exeter');
    fireEvent.click(screen.getByLabelText('Exeter'));

    const teams = { ...emptyLeagueTeams(), mixed: ['Exeter'] };
    view.rerender(
      <EventInfoContext.Provider value={r2}>
        <LeagueRoundsContext.Provider value={{ ...SEASON, teams }}>
          <EditAccessContext.Provider value={true}>
            <TeamEntryView discipline="mixed" />
          </EditAccessContext.Provider>
        </LeagueRoundsContext.Provider>
      </EventInfoContext.Provider>
    );

    fireEvent.click(screen.getByText('Enter 1 team'));
    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual(['Kings']);
  });

  it('counts new teams towards the limit', () => {
    const many = Array.from({ length: 17 }, (_, i) => `Team ${i + 1}`);
    const board = playedDiscipline(17);
    board.teams = board.teams.map((t, i) => ({ ...t, name: many[i] }));
    board.placings = Object.fromEntries(board.teams.map((t, i) => [t.slot, i + 1]));
    const rounds: LeagueRounds = {
      season: [{ round: SEASON.season[0].round, disciplines: { ...createInitialDisciplines(), board } }],
      lastSeason: [],
      teams: emptyLeagueTeams(),
    };
    render(
      <EventInfoContext.Provider value={r2}>
        <LeagueRoundsContext.Provider value={rounds}>
          <EditAccessContext.Provider value={true}>
            <TeamEntryView discipline="board" />
          </EditAccessContext.Provider>
        </LeagueRoundsContext.Provider>
      </EventInfoContext.Provider>
    );

    tick(...many);
    addNew('Extra');
    expect(screen.getByText('Maximum 17 teams. Untick some teams.')).toBeTruthy();
    expect((screen.getByText('Enter 18 teams') as HTMLButtonElement).disabled).toBe(true);
  });
});
