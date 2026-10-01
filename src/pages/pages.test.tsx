import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { FirebaseError } from 'firebase/app';
import { AuthContext } from '../auth/authContext';
import type { AuthStatus } from '../auth/authStatus';
import {
  createInitialDisciplines,
  type DisciplineChange,
  type EventDetail,
  type EventSummary,
} from '../events/eventDoc';
import type { EventSnapshotMeta } from '../events/eventsRepo';
import { useEventStore } from '../store/eventStore';
import { EventListPage } from './EventListPage';
import { NewEventPage } from './NewEventPage';
import { EventPage } from './EventPage';
import { LoginPage } from './LoginPage';

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
  created: [] as { input: { name: string; date: string }; uid: string }[],
  unsynced: false,
  canStoreOffline: true,
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
  createEvent: (input: { name: string; date: string }, uid: string) => {
    repo.created.push({ input, uid });
    return { id: 'new-event-id', committed: Promise.resolve() };
  },
  hasUnsyncedWrites: async () => repo.unsynced,
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
          <Route path="/" element={<EventListPage />} />
          <Route path="/events/new" element={<NewEventPage />} />
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
  disciplines: createInitialDisciplines(),
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

describe('EventListPage', () => {
  it('lists events from Firestore', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onEvents!([{ id: 'e1', name: 'Round 1 - Hemel', date: '2026-11-14' }], ONLINE));

    expect(screen.getByText('Round 1 - Hemel')).toBeTruthy();
    expect(screen.getByText('Sat 14 Nov 2026')).toBeTruthy();
  });

  it('shows an empty state when there are no events', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onEvents!([], ONLINE));

    expect(screen.getByText('No rounds yet.')).toBeTruthy();
  });

  it('says it is offline rather than "no rounds" when nothing is cached', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onEvents!([], OFFLINE));

    expect(screen.getByText(/You are offline/)).toBeTruthy();
  });

  it('shows an error when the list cannot load', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onEventsError!(new Error('unavailable')));

    expect(screen.getByText('Could not load rounds. Check your connection.')).toBeTruthy();
  });

  it('re-subscribes when Retry is tapped after an error', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onEventsError!(new Error('unavailable')));

    fireEvent.click(screen.getByText('Retry'));

    expect(repo.eventListSubscriptions).toBe(2);
  });

  it('hides "New round" from signed-out visitors', () => {
    renderAt('/', SIGNED_OUT);
    expect(screen.queryByText('New round')).toBeNull();
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('hides "New round" from unapproved users and explains why', () => {
    renderAt('/', UNAPPROVED);
    expect(screen.queryByText('New round')).toBeNull();
    expect(screen.getByText(/not approved to score yet/)).toBeTruthy();
  });

  it('says the approval check failed instead of "not approved"', () => {
    renderAt('/', { ...APPROVED, isApproved: false, approvalCheckFailed: true });
    expect(screen.getByText(/Could not check whether this account can score/)).toBeTruthy();
  });

  it('shows "New round" to approved users', () => {
    renderAt('/', APPROVED);
    expect(screen.getByText('New round')).toBeTruthy();
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
  it('shows a checking state while auth is loading', () => {
    renderAt('/events/new', { ...SIGNED_OUT, loading: true });
    expect(screen.getByText('Checking your account...')).toBeTruthy();
  });

  it('offers sign in to signed-out visitors', () => {
    renderAt('/events/new', SIGNED_OUT);
    expect(screen.queryByText('Create round')).toBeNull();
    expect(screen.getAllByText('Sign in').length).toBeGreaterThan(0);
  });

  it('does not show the form to unapproved users', () => {
    renderAt('/events/new', UNAPPROVED);
    expect(screen.queryByText('Create round')).toBeNull();
    expect(screen.getByText(/Only approved officials can create rounds/)).toBeTruthy();
  });

  it('shows a validation error for a blank name', () => {
    renderAt('/events/new', APPROVED);
    fireEvent.click(screen.getByText('Create round'));

    expect(screen.getByText('Enter a name')).toBeTruthy();
    expect(repo.created).toEqual([]);
  });

  it('creates the event as the signed-in user and opens it', () => {
    renderAt('/events/new', APPROVED);
    fireEvent.change(screen.getByPlaceholderText('e.g. Round 1 - Hemel'), {
      target: { value: 'Round 2' },
    });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-12-05' } });
    fireEvent.click(screen.getByText('Create round'));

    expect(repo.created).toEqual([
      { input: { name: 'Round 2', date: '2026-12-05' }, uid: 'official' },
    ]);
    expect(screen.getByText('Loading round...')).toBeTruthy();
  });
});

describe('EventPage', () => {
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
  it('signs in and returns to the event list', async () => {
    renderAt('/login', SIGNED_OUT);
    await submitLogin(' official@example.com ', 'secret');

    expect(auth.signIns).toEqual(['official@example.com']);
    expect(screen.getByText('Loading rounds...')).toBeTruthy();
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
