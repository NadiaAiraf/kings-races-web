import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { FirebaseError } from 'firebase/app';
import { AuthContext } from '../auth/authContext';
import type { AuthStatus } from '../auth/authStatus';
import {
  createInitialDisciplines,
  type DisciplineChange,
  type EventDetail,
  type EventSummary,
  type NewEventInput,
} from '../events/eventDoc';
import type { EventSnapshotMeta } from '../events/eventsRepo';
import { useEventStore } from '../store/eventStore';
import { EventListPage } from './EventListPage';
import { NewEventPage } from './NewEventPage';
import { EventPage } from './EventPage';
import { LoginPage } from './LoginPage';
import { HomePage } from './HomePage';
import { LeaguePage } from './LeaguePage';
import { NewSeasonPage } from './NewSeasonPage';
import type { Season } from '../seasons/seasons';
import { emptyLeagueTeams, type LeagueTeams } from '../seasons/leagueTeams';
import { playedDiscipline } from '../domain/__fixtures__/playedDiscipline';

// Firebase boundary: replace the modules that talk to Firestore and Auth.
const repo = vi.hoisted(() => ({
  onEvents: null as ((events: EventSummary[], meta: EventSnapshotMeta) => void) | null,
  onEventsError: null as ((e: Error) => void) | null,
  eventListSubscriptions: 0,
  eventSubscriptions: 0,
  onEvent: null as ((event: EventDetail | null, meta: EventSnapshotMeta) => void) | null,
  onEventError: null as ((e: Error) => void) | null,
  writes: [] as { id: string; key: string; changes: DisciplineChange[] }[],
  writeError: null as Error | null,
  created: [] as { input: NewEventInput; uid: string }[],
  unsynced: false,
  canStoreOffline: true,
  /** League round listeners by season id (the page also loads last season). */
  onLeagueRounds: {} as Record<string, (events: EventDetail[], meta: EventSnapshotMeta) => void>,
  leagueRoundsQueries: [] as { seasonId: string; league: string }[],
  onSeasons: null as ((seasons: Season[], meta: EventSnapshotMeta) => void) | null,
  onSeasonsError: null as ((e: Error) => void) | null,
  createdSeasons: [] as { startYear: number; uid: string }[],
  onLeagueTeams: null as ((teams: LeagueTeams) => void) | null,
  leagueTeamWrites: [] as { op: 'add' | 'remove'; discipline: string; names: string[] }[],
  existingSeasonIds: ['2026-27'] as string[],
}));

vi.mock('../events/eventsRepo', () => ({
  subscribeEvents: (
    onEvents: (e: EventSummary[], meta: EventSnapshotMeta) => void,
    onError: (e: Error) => void
  ) => {
    repo.onEvents = onEvents;
    repo.onEventsError = onError;
    repo.eventListSubscriptions++;
    return () => {};
  },
  subscribeEvent: (
    _id: string,
    onEvent: (e: EventDetail | null, meta: EventSnapshotMeta) => void,
    onError: (e: Error) => void
  ) => {
    repo.onEvent = onEvent;
    repo.onEventError = onError;
    repo.eventSubscriptions++;
    return () => {};
  },
  writeDisciplineChanges: async (id: string, key: string, changes: DisciplineChange[]) => {
    repo.writes.push({ id, key, changes });
    if (repo.writeError) throw repo.writeError;
  },
  subscribeLeagueRounds: (
    seasonId: string,
    league: string,
    onEvents: (e: EventDetail[], meta: EventSnapshotMeta) => void
  ) => {
    repo.leagueRoundsQueries.push({ seasonId, league });
    repo.onLeagueRounds[seasonId] = onEvents;
    return () => {};
  },
  createEvent: (input: NewEventInput, uid: string) => {
    repo.created.push({ input, uid });
    return { id: 'new-event-id', committed: Promise.resolve() };
  },
  hasUnsyncedWrites: async () => repo.unsynced,
}));

vi.mock('../seasons/seasonsRepo', () => ({
  subscribeSeasons: (
    onSeasons: (s: Season[], meta: EventSnapshotMeta) => void,
    onError: (e: Error) => void
  ) => {
    repo.onSeasons = onSeasons;
    repo.onSeasonsError = onError;
    return () => {};
  },
  createSeason: (startYear: number, uid: string) => {
    repo.createdSeasons.push({ startYear, uid });
    return { id: `${startYear}`, committed: Promise.resolve() };
  },
  subscribeSeasonExists: (seasonId: string, onExists: (exists: boolean) => void) => {
    onExists(repo.existingSeasonIds.includes(seasonId));
    return () => {};
  },
  subscribeLeagueTeams: (_s: string, _l: string, onTeams: (teams: LeagueTeams) => void) => {
    repo.onLeagueTeams = onTeams;
    return () => {};
  },
  addLeagueTeams: async (_s: string, _l: string, discipline: string, names: string[]) => {
    repo.leagueTeamWrites.push({ op: 'add', discipline, names });
  },
  removeLeagueTeam: async (_s: string, _l: string, discipline: string, name: string) => {
    repo.leagueTeamWrites.push({ op: 'remove', discipline, names: [name] });
  },
}));

vi.mock('../lib/offlineStorage', () => ({
  canStoreOffline: async () => repo.canStoreOffline,
}));

const auth = vi.hoisted(() => ({
  signInError: null as Error | null,
  signIns: [] as string[],
  signOuts: 0,
}));

vi.mock('../auth/firebaseAuth', () => ({
  signInWithEmail: async (email: string) => {
    auth.signIns.push(email);
    if (auth.signInError) throw auth.signInError;
  },
  signOutUser: async () => {
    auth.signOuts++;
  },
}));

const SIGNED_OUT: AuthStatus = {
  loading: false,
  user: null,
  isApproved: false,
  approvalCheckFailed: false,
};
const UNAPPROVED: AuthStatus = {
  loading: false,
  user: { uid: 'stranger', email: 'stranger@example.com' },
  isApproved: false,
  approvalCheckFailed: false,
};
const APPROVED: AuthStatus = {
  loading: false,
  user: { uid: 'official', email: 'official@example.com' },
  isApproved: true,
  approvalCheckFailed: false,
};

const ONLINE: EventSnapshotMeta = { fromCache: false };
const OFFLINE: EventSnapshotMeta = { fromCache: true };

function renderAt(path: string, status: AuthStatus) {
  return render(
    <AuthContext.Provider value={status}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rounds" element={<EventListPage />} />
          <Route path="/seasons/new" element={<NewSeasonPage />} />
          <Route path="/seasons/:seasonId/:league" element={<LeaguePage />} />
          <Route path="/seasons/:seasonId/:league/new" element={<NewEventPage />} />
          <Route path="/events/:id" element={<EventPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

const roundOne: EventDetail = {
  id: 'e1',
  name: 'Round 1 - Hemel',
  date: '2026-11-14',
  round: null,
  disciplines: createInitialDisciplines(),
};

const SEASONS: Season[] = [
  { id: '2026-27', startYear: 2026 },
  { id: '2025-26', startYear: 2025 },
];

const southernR1: EventDetail = {
  ...roundOne,
  id: '2026-27_southern_r1',
  name: 'R1 - Hemel',
  round: { seasonId: '2026-27', league: 'southern', roundNumber: 1, venue: 'Hemel' },
};

const withMixedTeams = (names: string[]): EventDetail => {
  const disciplines = createInitialDisciplines();
  disciplines.mixed = {
    ...disciplines.mixed,
    teams: names.map((name, i) => ({ slot: i + 1, name })),
    teamCount: names.length,
  };
  return { ...roundOne, disciplines };
};

async function submitLogin(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  });
}

async function addTeam(name: string) {
  fireEvent.change(screen.getByPlaceholderText('Team name'), { target: { value: name } });
  await act(async () => {
    fireEvent.click(screen.getByText('Add Team'));
  });
}

beforeEach(() => {
  repo.onEvents = null;
  repo.onEventsError = null;
  repo.eventListSubscriptions = 0;
  repo.eventSubscriptions = 0;
  repo.canStoreOffline = true;
  repo.onEvent = null;
  repo.onEventError = null;
  repo.writes = [];
  repo.writeError = null;
  repo.created = [];
  repo.unsynced = false;
  repo.onLeagueRounds = {};
  repo.leagueRoundsQueries = [];
  repo.onSeasons = null;
  repo.onSeasonsError = null;
  repo.createdSeasons = [];
  repo.onLeagueTeams = null;
  repo.leagueTeamWrites = [];
  repo.existingSeasonIds = ['2026-27'];
  auth.signInError = null;
  auth.signIns = [];
  auth.signOuts = 0;
  useEventStore.getState().resetEvent();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('shows the leagues of the newest season', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onSeasons!(SEASONS, ONLINE));

    const newest = screen.getByRole('button', { name: 'Season 26/27' });
    expect(newest.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Season 25/26' }).getAttribute('aria-expanded')).toBe(
      'false'
    );
    expect(screen.getByText('Scotland').getAttribute('href')).toBe('/seasons/2026-27/scotland');
  });

  it('links the leagues of the season chosen in the URL', () => {
    renderAt('/?season=2025-26', SIGNED_OUT);
    act(() => repo.onSeasons!(SEASONS, ONLINE));

    expect(screen.getByText('Southern').getAttribute('href')).toBe('/seasons/2025-26/southern');
  });

  it('opens a season to show its leagues, closing the other', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onSeasons!(SEASONS, ONLINE));

    fireEvent.click(screen.getByRole('button', { name: 'Season 25/26' }));

    expect(screen.getAllByText('Midlands')).toHaveLength(1);
    expect(screen.getByText('Midlands').getAttribute('href')).toBe('/seasons/2025-26/midlands');
  });

  it('collapses the open season when tapped again', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onSeasons!(SEASONS, ONLINE));

    fireEvent.click(screen.getByRole('button', { name: 'Season 26/27' }));

    expect(screen.queryByText('Southern')).toBeNull();
  });

  it('shows an empty state when there are no seasons', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onSeasons!([], ONLINE));

    expect(screen.getByText('No seasons yet.')).toBeTruthy();
  });

  it('says it is offline rather than "no seasons" when nothing is cached', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onSeasons!([], OFFLINE));

    expect(screen.getByText(/You are offline/)).toBeTruthy();
  });

  it('shows an error when seasons cannot load', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onSeasonsError!(new Error('unavailable')));

    expect(screen.getByText('Could not load seasons. Check your connection.')).toBeTruthy();
  });

  it('hides "New season" from signed-out visitors', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onSeasons!(SEASONS, ONLINE));
    expect(screen.queryByText('New season')).toBeNull();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('hides "New season" from unapproved users and explains why', () => {
    renderAt('/', UNAPPROVED);
    act(() => repo.onSeasons!(SEASONS, ONLINE));
    expect(screen.queryByText('New season')).toBeNull();
    expect(screen.getByText(/not approved to score yet/)).toBeTruthy();
  });

  it('says the approval check failed instead of "not approved"', () => {
    renderAt('/', { ...APPROVED, isApproved: false, approvalCheckFailed: true });
    expect(screen.getByText(/Could not check whether this account can score/)).toBeTruthy();
  });

  it('shows "New season" to approved users', () => {
    renderAt('/', APPROVED);
    act(() => repo.onSeasons!(SEASONS, ONLINE));
    expect(screen.getByText('New season')).toBeTruthy();
  });
});

describe('NewSeasonPage', () => {
  it('does not show the form to unapproved users', () => {
    renderAt('/seasons/new', UNAPPROVED);
    expect(screen.queryByText('Create season')).toBeNull();
    expect(screen.getByText(/Only approved officials can create seasons/)).toBeTruthy();
  });

  it('suggests the next season after the newest one', () => {
    renderAt('/seasons/new', APPROVED);
    act(() => repo.onSeasons!(SEASONS, ONLINE));

    expect((screen.getByLabelText('Year the season starts') as HTMLInputElement).value).toBe('2027');
    expect(screen.getByText('Creates season 27/28')).toBeTruthy();
  });

  it('creates a season for any year typed, however far ahead', () => {
    renderAt('/seasons/new', APPROVED);
    act(() => repo.onSeasons!(SEASONS, ONLINE));

    fireEvent.change(screen.getByLabelText('Year the season starts'), { target: { value: '2031' } });
    fireEvent.click(screen.getByText('Create season'));

    expect(repo.createdSeasons).toEqual([{ startYear: 2031, uid: 'official' }]);
    // Firestore includes the queued write in the next snapshot.
    act(() => repo.onSeasons!([{ id: '2031-32', startYear: 2031 }, ...SEASONS], ONLINE));
    expect(screen.getByText('Southern').getAttribute('href')).toBe('/seasons/2031-32/southern');
  });

  it('refuses a season that already exists', () => {
    renderAt('/seasons/new', APPROVED);
    act(() => repo.onSeasons!(SEASONS, ONLINE));

    fireEvent.change(screen.getByLabelText('Year the season starts'), { target: { value: '2026' } });
    fireEvent.click(screen.getByText('Create season'));

    expect(screen.getByText('Season 26/27 already exists')).toBeTruthy();
    expect(repo.createdSeasons).toEqual([]);
  });
});

describe('LeaguePage', () => {
  it('queries the rounds of the league in this season and last season', () => {
    renderAt('/seasons/2026-27/southern', SIGNED_OUT);
    expect(repo.leagueRoundsQueries).toEqual(
      expect.arrayContaining([
        { seasonId: '2026-27', league: 'southern' },
        { seasonId: '2025-26', league: 'southern' },
      ])
    );
  });

  it('shows the league and season in the header', () => {
    renderAt('/seasons/2026-27/southern', SIGNED_OUT);
    expect(screen.getByText('Southern')).toBeTruthy();
    expect(screen.getByText('Season 26/27')).toBeTruthy();
  });

  it('links each set-up round and marks the rest as not set up', () => {
    renderAt('/seasons/2026-27/southern', SIGNED_OUT);
    act(() => repo.onLeagueRounds['2026-27']([southernR1], ONLINE));

    expect(screen.getByText('R1 - Hemel').closest('a')!.getAttribute('href')).toBe(
      '/events/2026-27_southern_r1'
    );
    expect(screen.getByText('R4 not set up')).toBeTruthy();
  });

  it('hides "Set up" from viewers', () => {
    renderAt('/seasons/2026-27/southern', SIGNED_OUT);
    act(() => repo.onLeagueRounds['2026-27']([], ONLINE));

    expect(screen.queryByText('Set up R1')).toBeNull();
  });

  it('offers approved users to set up each missing round', () => {
    renderAt('/seasons/2026-27/southern', APPROVED);
    act(() => repo.onLeagueRounds['2026-27']([southernR1], ONLINE));

    expect(screen.queryByText('Set up R1')).toBeNull();
    expect(screen.getByText('Set up R2').getAttribute('href')).toBe(
      '/seasons/2026-27/southern/new?round=2'
    );
  });

  it('shows season standings from finished rounds', () => {
    const mixed = playedDiscipline(4);
    mixed.teams = mixed.teams.map((t, i) => ({ ...t, name: ['Kings', 'UCL', 'LSE', 'Bath'][i] }));
    const finished = { ...southernR1, disciplines: { ...createInitialDisciplines(), mixed } };
    renderAt('/seasons/2026-27/southern', SIGNED_OUT);
    act(() => repo.onLeagueRounds['2026-27']([finished], ONLINE));

    const table = within(screen.getByRole('region', { name: 'Season standings' }));
    expect(table.getAllByRole('row')[1].textContent).toMatch(/30$/);
  });

  it('switches the standings discipline', () => {
    renderAt('/seasons/2026-27/southern', SIGNED_OUT);
    act(() => repo.onLeagueRounds['2026-27']([southernR1], ONLINE));

    fireEvent.click(screen.getByRole('tab', { name: 'Board' }));

    expect(screen.getByRole('tab', { name: 'Board' }).getAttribute('aria-selected')).toBe('true');
  });

  it("lists the league's teams for the chosen discipline", () => {
    renderAt('/seasons/2026-27/southern', SIGNED_OUT);
    act(() => repo.onLeagueRounds['2026-27']([], ONLINE));
    act(() => repo.onLeagueTeams!({ ...emptyLeagueTeams(), mixed: ['Kings 1', 'UCL 1'] }));

    expect(screen.getByText('League teams (2)')).toBeTruthy();
    expect(screen.queryByLabelText('Add teams, one per line')).toBeNull();
  });

  it('adds pasted teams to the league list, one per line', () => {
    renderAt('/seasons/2026-27/southern', APPROVED);
    act(() => repo.onLeagueRounds['2026-27']([], ONLINE));
    act(() => repo.onLeagueTeams!({ ...emptyLeagueTeams(), mixed: ['Kings 1'] }));

    fireEvent.change(screen.getByLabelText('Add teams, one per line'), {
      target: { value: 'kings 1\nUCL 1\nLSE 1' },
    });
    fireEvent.click(screen.getByText('Add teams'));

    expect(repo.leagueTeamWrites).toEqual([
      { op: 'add', discipline: 'mixed', names: ['UCL 1', 'LSE 1'] },
    ]);
  });

  it('removes a team from the list of the chosen discipline', () => {
    renderAt('/seasons/2026-27/southern', APPROVED);
    act(() => repo.onLeagueRounds['2026-27']([], ONLINE));
    act(() => repo.onLeagueTeams!({ ...emptyLeagueTeams(), board: ['Kings 1'] }));

    fireEvent.click(screen.getByRole('tab', { name: 'Board' }));
    fireEvent.click(screen.getByLabelText('Remove Kings 1'));

    expect(repo.leagueTeamWrites).toEqual([{ op: 'remove', discipline: 'board', names: ['Kings 1'] }]);
  });

  it('does not offer to set up rounds in a season that does not exist', () => {
    renderAt('/seasons/2019-20/southern', APPROVED);
    act(() => repo.onLeagueRounds['2019-20']([], ONLINE));

    expect(screen.getByText('This season does not exist.')).toBeTruthy();
    expect(screen.queryByText('Set up R1')).toBeNull();
  });

  it('rejects an unknown league', () => {
    renderAt('/seasons/2026-27/eastern', SIGNED_OUT);
    expect(screen.getByText('This league does not exist.')).toBeTruthy();
  });
});

describe('EventListPage', () => {
  it('lists events from Firestore', () => {
    renderAt('/rounds', SIGNED_OUT);
    act(() =>
      repo.onEvents!([{ id: 'e1', name: 'Round 1 - Hemel', date: '2026-11-14', round: null }], ONLINE)
    );

    expect(screen.getByText('Round 1 - Hemel')).toBeTruthy();
    expect(screen.getByText('Sat 14 Nov 2026')).toBeTruthy();
  });

  it('shows the league and season of a season round', () => {
    renderAt('/rounds', SIGNED_OUT);
    act(() => repo.onEvents!([southernR1], ONLINE));

    expect(screen.getByText('Southern 26/27 · Sat 14 Nov 2026')).toBeTruthy();
  });

  it('shows an empty state when there are no events', () => {
    renderAt('/rounds', SIGNED_OUT);
    act(() => repo.onEvents!([], ONLINE));

    expect(screen.getByText('No rounds yet.')).toBeTruthy();
  });

  it('says it is offline rather than "no rounds" when nothing is cached', () => {
    renderAt('/rounds', SIGNED_OUT);
    act(() => repo.onEvents!([], OFFLINE));

    expect(screen.getByText(/You are offline/)).toBeTruthy();
  });

  it('shows an error when the list cannot load', () => {
    renderAt('/rounds', SIGNED_OUT);
    act(() => repo.onEventsError!(new Error('unavailable')));

    expect(screen.getByText('Could not load rounds. Check your connection.')).toBeTruthy();
  });

  it('re-subscribes when Retry is tapped after an error', () => {
    renderAt('/rounds', SIGNED_OUT);
    act(() => repo.onEventsError!(new Error('unavailable')));

    fireEvent.click(screen.getByText('Retry'));

    expect(repo.eventListSubscriptions).toBe(2);
  });
});

describe('Sign out', () => {
  it('signs out straight away when everything has synced', async () => {
    renderAt('/', APPROVED);
    await act(async () => {
      fireEvent.click(screen.getByText('Sign out'));
    });

    expect(auth.signOuts).toBe(1);
  });

  it('asks for confirmation when results have not synced', async () => {
    repo.unsynced = true;
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderAt('/', APPROVED);
    await act(async () => {
      fireEvent.click(screen.getByText('Sign out'));
    });

    expect(confirm).toHaveBeenCalledOnce();
    expect(auth.signOuts).toBe(0);
  });

  it('signs out with unsynced results once confirmed', async () => {
    repo.unsynced = true;
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderAt('/', APPROVED);
    await act(async () => {
      fireEvent.click(screen.getByText('Sign out'));
    });

    expect(auth.signOuts).toBe(1);
  });
});

describe('NewEventPage', () => {
  const NEW_R2 = '/seasons/2026-27/southern/new?round=2';

  it('shows a checking state while auth is loading', () => {
    renderAt(NEW_R2, { ...SIGNED_OUT, loading: true });
    expect(screen.getByText('Checking your account...')).toBeTruthy();
  });

  it('offers sign in to signed-out visitors', () => {
    renderAt(NEW_R2, SIGNED_OUT);
    expect(screen.queryByText('Create R2')).toBeNull();
    expect(screen.getAllByText('Sign in').length).toBeGreaterThan(0);
  });

  it('does not show the form to unapproved users', () => {
    renderAt(NEW_R2, UNAPPROVED);
    expect(screen.queryByText('Create R2')).toBeNull();
    expect(screen.getByText(/Only approved officials can create rounds/)).toBeTruthy();
  });

  it('refuses a round number outside R1-R4', () => {
    renderAt('/seasons/2026-27/southern/new?round=5', APPROVED);
    expect(screen.getByText('This round cannot be set up.')).toBeTruthy();
  });

  it('shows a validation error for a blank venue', () => {
    renderAt(NEW_R2, APPROVED);
    fireEvent.click(screen.getByText('Create R2'));

    expect(screen.getByText('Enter a venue')).toBeTruthy();
    expect(repo.created).toEqual([]);
  });

  it('creates the round in its league and season and opens it', () => {
    renderAt(NEW_R2, APPROVED);
    fireEvent.change(screen.getByLabelText('Venue'), { target: { value: 'Hemel' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-12-05' } });
    fireEvent.click(screen.getByText('Create R2'));

    expect(repo.created).toEqual([
      {
        input: {
          name: 'R2 - Hemel',
          date: '2026-12-05',
          round: { seasonId: '2026-27', league: 'southern', roundNumber: 2, venue: 'Hemel' },
        },
        uid: 'official',
      },
    ]);
    expect(screen.getByText('Loading round...')).toBeTruthy();
  });
});

describe('EventPage', () => {
  it("loads the league's rounds for a season round, for seeding", () => {
    renderAt('/events/2026-27_southern_r1', SIGNED_OUT);
    act(() => repo.onEvent!(southernR1, ONLINE));

    expect(repo.leagueRoundsQueries).toEqual([
      { seasonId: '2026-27', league: 'southern' },
      { seasonId: '2025-26', league: 'southern' },
    ]);
  });

  it('links back to the league from a season round', () => {
    renderAt('/events/2026-27_southern_r1', SIGNED_OUT);
    act(() => repo.onEvent!(southernR1, ONLINE));

    expect(screen.getByLabelText('Back to league').getAttribute('href')).toBe(
      '/seasons/2026-27/southern'
    );
    expect(screen.getByText('Southern 26/27 · Sat 14 Nov 2026 · View only')).toBeTruthy();
  });

  it('shows a loading state until the first snapshot', () => {
    renderAt('/events/e1', SIGNED_OUT);
    expect(screen.getByText('Loading round...')).toBeTruthy();
  });

  it('shows a not-found state for a missing event', () => {
    renderAt('/events/missing', SIGNED_OUT);
    act(() => repo.onEvent!(null, ONLINE));
    expect(screen.getByText('This round does not exist.')).toBeTruthy();
  });

  it('explains when an uncached round is opened offline', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEvent!(null, OFFLINE));
    expect(screen.getByText(/You are offline and this round has not been opened/)).toBeTruthy();
  });

  it('explains when a loaded round disappears, e.g. a rejected offline create', () => {
    renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne, OFFLINE));
    act(() => repo.onEvent!(null, ONLINE));
    expect(screen.getByText(/could not be saved or was removed/)).toBeTruthy();
  });

  it('shows a load error when the first load fails', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEventError!(new Error('unavailable')));
    expect(screen.getByText('Could not load this round. Check your connection.')).toBeTruthy();
  });

  it('re-subscribes when Retry is tapped after a load error', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEventError!(new Error('unavailable')));

    fireEvent.click(screen.getByText('Retry'));

    expect(repo.eventSubscriptions).toBe(2);
    expect(screen.getByText('Loading round...')).toBeTruthy();
  });

  it('re-subscribes from the "Live updates stopped" banner', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEvent!(roundOne, ONLINE));
    act(() => repo.onEventError!(new Error('unavailable')));

    fireEvent.click(screen.getByText('Retry'));

    expect(repo.eventSubscriptions).toBe(2);
  });

  it('keeps showing the round with a banner when live updates stop', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEvent!(withMixedTeams(['Kings']), ONLINE));
    act(() => repo.onEventError!(new Error('unavailable')));

    expect(screen.getByText('Live updates stopped.')).toBeTruthy();
    expect(screen.getByText('1. Kings')).toBeTruthy();
  });

  it('shows the event read-only to anonymous viewers', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEvent!(withMixedTeams(['Kings', 'Imperial']), ONLINE));

    expect(screen.getByText('Round 1 - Hemel')).toBeTruthy();
    expect(screen.getByText(/View only/)).toBeTruthy();
    expect(screen.getByText('1. Kings')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Team name')).toBeNull();
  });

  it('shows live updates to viewers', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEvent!(withMixedTeams(['Kings']), ONLINE));
    act(() => repo.onEvent!(withMixedTeams(['Kings', 'Imperial']), ONLINE));

    expect(screen.getByText('2. Imperial')).toBeTruthy();
  });

  it('keeps unapproved signed-in users read-only', () => {
    renderAt('/events/e1', UNAPPROVED);
    act(() => repo.onEvent!(roundOne, ONLINE));

    expect(screen.queryByPlaceholderText('Team name')).toBeNull();
  });

  it("writes an approved user's change as a field-level update", async () => {
    renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne, ONLINE));

    await addTeam('Kings');

    expect(repo.writes).toEqual([
      {
        id: 'e1',
        key: 'mixed',
        changes: [{ path: ['teams'], value: [{ slot: 1, name: 'Kings' }] }],
      },
    ]);
  });

  it('does not write snapshots back for approved users', () => {
    renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne, ONLINE));
    act(() => repo.onEvent!(withMixedTeams(['Kings', 'Imperial']), ONLINE));

    expect(repo.writes).toEqual([]);
  });

  it('shows a dismissable banner when a change is rejected', async () => {
    repo.writeError = new FirebaseError('permission-denied', 'Missing or insufficient permissions.');
    renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne, ONLINE));

    await addTeam('Kings');
    expect(screen.getByText(/this account is not allowed to score/)).toBeTruthy();

    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByText(/this account is not allowed to score/)).toBeNull();
  });
});

describe('EventPage save and storage warnings', () => {
  it('shows a generic message for a non-permission save failure', async () => {
    repo.writeError = new Error('unavailable');
    renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne, ONLINE));

    await addTeam('Kings');

    expect(screen.getByText('A change could not be saved. It has been undone.')).toBeTruthy();
  });

  it('warns approved users when the browser cannot store results offline', async () => {
    repo.canStoreOffline = false;
    renderAt('/events/e1', APPROVED);
    await act(async () => repo.onEvent!(roundOne, ONLINE));

    expect(screen.getByText(/cannot save results offline/)).toBeTruthy();
  });

  it('does not show the storage warning to viewers', async () => {
    repo.canStoreOffline = false;
    renderAt('/events/e1', SIGNED_OUT);
    await act(async () => repo.onEvent!(roundOne, ONLINE));

    expect(screen.queryByText(/cannot save results offline/)).toBeNull();
  });

  it('stops writing as soon as approval is revoked on an open round', () => {
    const { rerender } = renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne, ONLINE));

    rerender(
      <AuthContext.Provider value={{ ...APPROVED, isApproved: false }}>
        <MemoryRouter initialEntries={['/events/e1']}>
          <Routes>
            <Route path="/events/:id" element={<EventPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    act(() => useEventStore.getState().setTeams('mixed', [{ slot: 1, name: 'X' }]));

    expect(screen.queryByPlaceholderText('Team name')).toBeNull();
    expect(repo.writes).toEqual([]);
  });

  it('re-subscribes when the signed-in user changes', () => {
    const { rerender } = renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne, ONLINE));

    rerender(
      <AuthContext.Provider value={SIGNED_OUT}>
        <MemoryRouter initialEntries={['/events/e1']}>
          <Routes>
            <Route path="/events/:id" element={<EventPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(repo.eventSubscriptions).toBe(2);
  });
});

describe('LoginPage', () => {
  it('signs in and returns to the leagues', async () => {
    renderAt('/login', SIGNED_OUT);
    await submitLogin(' official@example.com ', 'secret');

    expect(auth.signIns).toEqual(['official@example.com']);
    expect(screen.getByText('Loading seasons...')).toBeTruthy();
  });

  it('shows a generic error for an unknown failure', async () => {
    auth.signInError = new Error('boom');
    renderAt('/login', SIGNED_OUT);
    await submitLogin('a@b.com', 'x');

    expect(screen.getByText('Sign in failed. Try again.')).toBeTruthy();
  });

  it('explains wrong credentials', async () => {
    auth.signInError = new FirebaseError('auth/invalid-credential', 'bad');
    renderAt('/login', SIGNED_OUT);
    await submitLogin('a@b.com', 'x');

    expect(screen.getByText('Email or password is incorrect.')).toBeTruthy();
  });

  it('explains rate limiting', async () => {
    auth.signInError = new FirebaseError('auth/too-many-requests', 'slow down');
    renderAt('/login', SIGNED_OUT);
    await submitLogin('a@b.com', 'x');

    expect(screen.getByText('Too many attempts. Try again in a few minutes.')).toBeTruthy();
  });

  it('explains that sign-in needs a connection', async () => {
    auth.signInError = new FirebaseError('auth/network-request-failed', 'offline');
    renderAt('/login', SIGNED_OUT);
    await submitLogin('a@b.com', 'x');

    expect(screen.getByText('No connection. Sign in needs to be online.')).toBeTruthy();
  });
});
