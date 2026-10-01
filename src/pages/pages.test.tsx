import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthContext } from '../auth/authContext';
import type { AuthStatus } from '../auth/authStatus';
import { createInitialDisciplines, type EventDetail, type EventSummary } from '../events/eventDoc';
import { useEventStore } from '../store/eventStore';
import { EventListPage } from './EventListPage';
import { NewEventPage } from './NewEventPage';
import { EventPage } from './EventPage';
import { LoginPage } from './LoginPage';

// Firebase boundary: replace the modules that talk to Firestore and Auth.
const repo = vi.hoisted(() => ({
  onEvents: null as ((events: EventSummary[]) => void) | null,
  onEvent: null as ((event: EventDetail | null) => void) | null,
  writes: [] as { id: string; key: string; teams: unknown[] }[],
  created: [] as { input: { name: string; date: string }; uid: string }[],
}));

vi.mock('../events/eventsRepo', () => ({
  subscribeEvents: (onEvents: (e: EventSummary[]) => void) => {
    repo.onEvents = onEvents;
    return () => {};
  },
  subscribeEvent: (_id: string, onEvent: (e: EventDetail | null) => void) => {
    repo.onEvent = onEvent;
    return () => {};
  },
  writeDiscipline: async (id: string, key: string, state: { teams: unknown[] }) => {
    repo.writes.push({ id, key, teams: state.teams });
  },
  createEvent: (input: { name: string; date: string }, uid: string) => {
    repo.created.push({ input, uid });
    return { id: 'new-event-id', committed: Promise.resolve() };
  },
}));

const auth = vi.hoisted(() => ({ signInError: null as Error | null, signIns: [] as string[] }));

vi.mock('../auth/firebaseAuth', () => ({
  signInWithEmail: async (email: string) => {
    auth.signIns.push(email);
    if (auth.signInError) throw auth.signInError;
  },
  signOutUser: async () => {},
}));

const SIGNED_OUT: AuthStatus = { loading: false, user: null, isApproved: false };
const UNAPPROVED: AuthStatus = {
  loading: false,
  user: { uid: 'stranger', email: 'stranger@example.com' },
  isApproved: false,
};
const APPROVED: AuthStatus = {
  loading: false,
  user: { uid: 'official', email: 'official@example.com' },
  isApproved: true,
};

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

beforeEach(() => {
  repo.onEvents = null;
  repo.onEvent = null;
  repo.writes = [];
  repo.created = [];
  auth.signInError = null;
  auth.signIns = [];
  useEventStore.getState().resetEvent();
});

afterEach(() => {
  cleanup();
});

describe('EventListPage', () => {
  it('lists events from Firestore', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onEvents!([{ id: 'e1', name: 'Round 1 - Hemel', date: '2026-11-14' }]));

    expect(screen.getByText('Round 1 - Hemel')).toBeTruthy();
    expect(screen.getByText('Sat 14 Nov 2026')).toBeTruthy();
  });

  it('shows an empty state when there are no events', () => {
    renderAt('/', SIGNED_OUT);
    act(() => repo.onEvents!([]));

    expect(screen.getByText('No rounds yet.')).toBeTruthy();
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

  it('shows "New round" to approved users', () => {
    renderAt('/', APPROVED);
    expect(screen.getByText('New round')).toBeTruthy();
  });
});

describe('NewEventPage', () => {
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
    act(() => repo.onEvent!(null));
    expect(screen.getByText('This round does not exist.')).toBeTruthy();
  });

  it('shows the event read-only to anonymous viewers', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEvent!(withMixedTeams(['Kings', 'Imperial'])));

    expect(screen.getByText('Round 1 - Hemel')).toBeTruthy();
    expect(screen.getByText(/View only/)).toBeTruthy();
    expect(screen.getByText('1. Kings')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Team name')).toBeNull();
  });

  it('shows live updates to viewers', () => {
    renderAt('/events/e1', SIGNED_OUT);
    act(() => repo.onEvent!(withMixedTeams(['Kings'])));
    act(() => repo.onEvent!(withMixedTeams(['Kings', 'Imperial'])));

    expect(screen.getByText('2. Imperial')).toBeTruthy();
  });

  it('keeps unapproved signed-in users read-only', () => {
    renderAt('/events/e1', UNAPPROVED);
    act(() => repo.onEvent!(roundOne));

    expect(screen.queryByPlaceholderText('Team name')).toBeNull();
  });

  it('writes an approved user\'s change to that discipline only', () => {
    renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne));

    fireEvent.change(screen.getByPlaceholderText('Team name'), { target: { value: 'Kings' } });
    fireEvent.click(screen.getByText('Add Team'));

    expect(repo.writes).toEqual([{ id: 'e1', key: 'mixed', teams: [{ slot: 1, name: 'Kings' }] }]);
  });

  it('does not write snapshots back for approved users', () => {
    renderAt('/events/e1', APPROVED);
    act(() => repo.onEvent!(roundOne));
    act(() => repo.onEvent!(withMixedTeams(['Kings', 'Imperial'])));

    expect(repo.writes).toEqual([]);
  });
});

describe('LoginPage', () => {
  it('signs in and returns to the event list', async () => {
    renderAt('/login', SIGNED_OUT);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' official@example.com ' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });

    expect(auth.signIns).toEqual(['official@example.com']);
    expect(screen.getByText('Loading rounds...')).toBeTruthy();
  });

  it('shows an error when sign-in fails', async () => {
    auth.signInError = new Error('boom');
    renderAt('/login', SIGNED_OUT);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'x' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });

    expect(screen.getByText('Sign in failed. Try again.')).toBeTruthy();
  });
});
