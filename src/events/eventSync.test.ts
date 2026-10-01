import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from '../store/eventStore';
import type { DisciplineKey, DisciplineState } from '../domain/types';
import { createInitialDisciplines, type EventDisciplines } from './eventDoc';
import { startEventSync, type EventSyncDeps } from './eventSync';

const store = () => useEventStore.getState();

/** In-memory stand-in for the Firestore event document. */
function createFakeRemote({ canWrite = true, failWrites = false } = {}) {
  let push: ((d: EventDisciplines | null) => void) | null = null;
  let pushError: ((e: Error) => void) | null = null;
  const writes: { key: DisciplineKey; state: DisciplineState }[] = [];
  const errors: unknown[] = [];
  let unsubscribed = false;
  let allowWrites = canWrite;

  const deps: EventSyncDeps = {
    subscribe: (onDisciplines, onError) => {
      push = onDisciplines;
      pushError = onError;
      return () => {
        unsubscribed = true;
      };
    },
    writeDiscipline: async (key, state) => {
      writes.push({ key, state });
      if (failWrites) throw new Error('offline and out of quota');
    },
    canWrite: () => allowWrites,
    onError: (e) => errors.push(e),
  };

  return {
    deps,
    writes,
    errors,
    snapshot: (d: EventDisciplines | null) => push!(d),
    fail: (e: Error) => pushError!(e),
    revokeWrite: () => {
      allowWrites = false;
    },
    isUnsubscribed: () => unsubscribed,
  };
}

const remoteWithTeams = (names: string[]): EventDisciplines => {
  const d = createInitialDisciplines();
  d.mixed = {
    ...d.mixed,
    teams: names.map((name, i) => ({ slot: i + 1, name })),
    teamCount: names.length,
  };
  return d;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('startEventSync', () => {
  beforeEach(() => {
    store().resetEvent();
  });

  it('clears data left over from a previously open event', () => {
    store().setTeams('mixed', [{ slot: 1, name: 'Old Event Team' }]);
    const remote = createFakeRemote();

    startEventSync(useEventStore, remote.deps);

    expect(store().disciplines.mixed.teams).toEqual([]);
  });

  it('hydrates the store from a snapshot', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);

    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual(['Kings', 'Imperial']);
  });

  it('never writes a snapshot back to Firestore', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);

    remote.snapshot(remoteWithTeams(['Kings']));
    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    expect(remote.writes).toEqual([]);
  });

  it('writes a local change for a user who can write', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);
    remote.snapshot(createInitialDisciplines());

    store().setTeams('board', [{ slot: 1, name: 'UCL' }]);

    expect(remote.writes).toHaveLength(1);
    expect(remote.writes[0].key).toBe('board');
    expect(remote.writes[0].state.teams).toEqual([{ slot: 1, name: 'UCL' }]);
  });

  it('writes only the discipline that changed', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);
    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    store().recordResult('mixed', {
      raceId: 'r1-1',
      homeSlot: 1,
      awaySlot: 2,
      homeOutcome: 'win',
      awayOutcome: 'loss',
    });

    expect(remote.writes.map((w) => w.key)).toEqual(['mixed']);
  });

  it('does not write local changes for a read-only viewer', () => {
    const remote = createFakeRemote({ canWrite: false });
    startEventSync(useEventStore, remote.deps);
    remote.snapshot(createInitialDisciplines());

    // e.g. AppShell's phase auto-transition running locally for a viewer
    store().setDisciplinePhase('mixed', 'round-two');

    expect(store().disciplines.mixed.phase).toBe('round-two');
    expect(remote.writes).toEqual([]);
  });

  it('stops writing as soon as edit rights are revoked', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);
    remote.snapshot(createInitialDisciplines());

    remote.revokeWrite();
    store().setTeams('mixed', [{ slot: 1, name: 'Kings' }]);

    expect(remote.writes).toEqual([]);
  });

  it('does not write before the first snapshot arrives', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);

    store().setTeams('mixed', [{ slot: 1, name: 'Too early' }]);

    expect(remote.writes).toEqual([]);
  });

  it('lets a snapshot replace local state after a local write', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);
    remote.snapshot(createInitialDisciplines());
    store().setTeams('mixed', [{ slot: 1, name: 'Kings' }]);

    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    expect(store().disciplines.mixed.teamCount).toBe(2);
    expect(remote.writes).toHaveLength(1);
  });

  it('ignores a not-found snapshot', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);

    remote.snapshot(null);
    store().setTeams('mixed', [{ slot: 1, name: 'Kings' }]);

    expect(remote.writes).toEqual([]);
  });

  it('reports failed writes', async () => {
    const remote = createFakeRemote({ failWrites: true });
    startEventSync(useEventStore, remote.deps);
    remote.snapshot(createInitialDisciplines());

    store().setTeams('mixed', [{ slot: 1, name: 'Kings' }]);
    await flush();

    expect(remote.errors).toHaveLength(1);
  });

  it('reports subscription errors', () => {
    const remote = createFakeRemote();
    startEventSync(useEventStore, remote.deps);

    remote.fail(new Error('permission-denied'));

    expect(remote.errors).toHaveLength(1);
  });

  it('stops syncing and clears the store when stopped', () => {
    const remote = createFakeRemote();
    const stop = startEventSync(useEventStore, remote.deps);
    remote.snapshot(remoteWithTeams(['Kings']));

    stop();
    store().setTeams('mixed', [{ slot: 1, name: 'After stop' }]);

    expect(remote.isUnsubscribed()).toBe(true);
    expect(remote.writes).toEqual([]);
  });

  it('resets the store contents when stopped', () => {
    const remote = createFakeRemote();
    const stop = startEventSync(useEventStore, remote.deps);
    remote.snapshot(remoteWithTeams(['Kings']));

    stop();

    expect(store().disciplines.mixed.teams).toEqual([]);
  });
});
