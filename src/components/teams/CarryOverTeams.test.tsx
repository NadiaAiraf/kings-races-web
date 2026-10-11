import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
});
