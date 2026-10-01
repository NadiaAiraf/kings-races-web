import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useEventStore } from '../store/eventStore';
import type { DisciplineKey, Score } from '../domain/types';
import { createInitialDisciplines, type DisciplineChange, type EventDisciplines } from './eventDoc';
import { startEventSync } from './eventSync';

const store = () => useEventStore.getState();

const stops: (() => void)[] = [];

/** In-memory stand-in for the Firestore event document. */
function startWithFakeRemote({ canWrite = true, failWrites = false } = {}) {
  let push: ((d: EventDisciplines) => void) | null = null;
  let pushError: ((e: Error) => void) | null = null;
  const writes: { key: DisciplineKey; changes: DisciplineChange[] }[] = [];
  const writeErrors: unknown[] = [];
  const subscribeErrors: Error[] = [];
  let unsubscribed = false;
  let allowWrites = canWrite;

  const stop = startEventSync(useEventStore, {
    subscribe: (onDisciplines, onError) => {
      push = onDisciplines;
      pushError = onError;
      return () => {
        unsubscribed = true;
      };
    },
    writeChanges: async (key, changes) => {
      writes.push({ key, changes });
      if (failWrites) throw new Error('permission-denied');
    },
    canWrite: () => allowWrites,
    onWriteError: (e) => writeErrors.push(e),
    onSubscribeError: (e) => subscribeErrors.push(e),
  });
  stops.push(stop);

  return {
    stop,
    writes,
    writeErrors,
    subscribeErrors,
    snapshot: (d: EventDisciplines) => push!(d),
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

const kingsBeatImperial: Score = {
  raceId: 'r1-1',
  homeSlot: 1,
  awaySlot: 2,
  homeOutcome: 'win',
  awayOutcome: 'loss',
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('startEventSync', () => {
  beforeEach(() => {
    store().resetEvent();
  });

  afterEach(() => {
    while (stops.length) stops.pop()!();
  });

  it('clears data left over from a previously open event', () => {
    store().setTeams('mixed', [{ slot: 1, name: 'Old Event Team' }]);

    startWithFakeRemote();

    expect(store().disciplines.mixed.teams).toEqual([]);
  });

  it('hydrates the store from a snapshot', () => {
    const remote = startWithFakeRemote();

    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    expect(store().disciplines.mixed.teams.map((t) => t.name)).toEqual(['Kings', 'Imperial']);
  });

  it('never writes a snapshot back to Firestore', () => {
    const remote = startWithFakeRemote();

    remote.snapshot(remoteWithTeams(['Kings']));
    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    expect(remote.writes).toEqual([]);
  });

  it('writes only the recorded score, not the whole discipline', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    store().recordResult('mixed', kingsBeatImperial);

    expect(remote.writes).toEqual([
      { key: 'mixed', changes: [{ path: ['scores', 'r1-1'], value: kingsBeatImperial }] },
    ]);
  });

  it('writes only the phase for a phase transition', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    store().setDisciplinePhase('mixed', 'round-two');

    expect(remote.writes).toEqual([
      { key: 'mixed', changes: [{ path: ['phase'], value: 'round-two' }] },
    ]);
  });

  it('deletes the score field when a result is cleared', () => {
    const remote = startWithFakeRemote();
    const withScore = remoteWithTeams(['Kings', 'Imperial']);
    withScore.mixed = { ...withScore.mixed, scores: [kingsBeatImperial] };
    remote.snapshot(withScore);

    store().clearResult('mixed', 'r1-1');

    expect(remote.writes).toEqual([
      { key: 'mixed', changes: [{ path: ['scores', 'r1-1'], value: undefined }] },
    ]);
  });

  it('writes teams for a team change in another discipline', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(createInitialDisciplines());

    store().setTeams('board', [{ slot: 1, name: 'UCL' }]);

    expect(remote.writes).toEqual([
      { key: 'board', changes: [{ path: ['teams'], value: [{ slot: 1, name: 'UCL' }] }] },
    ]);
  });

  it("after another device's score arrives, a local score writes only itself", () => {
    const remote = startWithFakeRemote();
    remote.snapshot(remoteWithTeams(['Kings', 'Imperial', 'UCL', 'LSE']));
    const otherDevice = remoteWithTeams(['Kings', 'Imperial', 'UCL', 'LSE']);
    otherDevice.mixed = { ...otherDevice.mixed, scores: [kingsBeatImperial] };
    remote.snapshot(otherDevice);
    const local: Score = { raceId: 'r1-2', homeSlot: 3, awaySlot: 4, homeOutcome: 'win', awayOutcome: 'loss' };

    store().recordResult('mixed', local);

    expect(remote.writes).toEqual([
      { key: 'mixed', changes: [{ path: ['scores', 'r1-2'], value: local }] },
    ]);
  });

  it('writes nothing for a change that leaves the disciplines alone', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(remoteWithTeams(['Kings']));

    store().setActiveDiscipline('board');

    expect(remote.writes).toEqual([]);
  });

  it("replaces the whole discipline on reset, clearing results this device hasn't seen", () => {
    const remote = startWithFakeRemote();
    const scored = remoteWithTeams(['Kings', 'Imperial']);
    scored.mixed = { ...scored.mixed, scores: [kingsBeatImperial] };
    remote.snapshot(scored);

    store().resetDiscipline('mixed');

    expect(remote.writes).toEqual([
      {
        key: 'mixed',
        changes: [{ path: [], value: { teams: [], phase: 'setup', scores: {}, manualTiebreaks: {} } }],
      },
    ]);
  });

  it('keeps untouched disciplines identical to the snapshot objects', () => {
    const remote = startWithFakeRemote();
    const snapshot = remoteWithTeams(['Kings', 'Imperial']);
    remote.snapshot(snapshot);

    store().recordResult('mixed', kingsBeatImperial);

    expect(store().disciplines.board).toBe(snapshot.board);
    expect(store().disciplines.ladies).toBe(snapshot.ladies);
  });

  it('does not write local changes for a read-only viewer', () => {
    const remote = startWithFakeRemote({ canWrite: false });
    remote.snapshot(createInitialDisciplines());

    // e.g. AppShell's phase auto-transition running locally for a viewer
    store().setDisciplinePhase('mixed', 'round-two');

    expect(store().disciplines.mixed.phase).toBe('round-two');
    expect(remote.writes).toEqual([]);
  });

  it('stops writing as soon as edit rights are revoked', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(createInitialDisciplines());

    remote.revokeWrite();
    store().setTeams('mixed', [{ slot: 1, name: 'Kings' }]);

    expect(remote.writes).toEqual([]);
  });

  it('does not write before the first snapshot arrives', () => {
    const remote = startWithFakeRemote();

    store().setTeams('mixed', [{ slot: 1, name: 'Too early' }]);

    expect(remote.writes).toEqual([]);
  });

  it('lets a snapshot replace local state after a local write', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(createInitialDisciplines());
    store().setTeams('mixed', [{ slot: 1, name: 'Kings' }]);

    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    expect(store().disciplines.mixed.teamCount).toBe(2);
    expect(remote.writes).toHaveLength(1);
  });

  it('reports failed writes', async () => {
    const remote = startWithFakeRemote({ failWrites: true });
    remote.snapshot(createInitialDisciplines());

    store().setTeams('mixed', [{ slot: 1, name: 'Kings' }]);
    await flush();

    expect(remote.writeErrors).toHaveLength(1);
  });

  it('restores the last snapshot on screen when a write fails', async () => {
    const remote = startWithFakeRemote({ failWrites: true });
    remote.snapshot(remoteWithTeams(['Kings', 'Imperial']));

    store().recordResult('mixed', kingsBeatImperial);
    await flush();

    expect(store().disciplines.mixed.scores).toEqual([]);
  });

  it('reports subscription errors separately from write errors', () => {
    const remote = startWithFakeRemote();

    remote.fail(new Error('unavailable'));

    expect(remote.subscribeErrors).toHaveLength(1);
    expect(remote.writeErrors).toEqual([]);
  });

  it('unsubscribes and stops writing when stopped', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(remoteWithTeams(['Kings']));

    remote.stop();
    store().setTeams('mixed', [{ slot: 1, name: 'After stop' }]);

    expect(remote.isUnsubscribed()).toBe(true);
    expect(remote.writes).toEqual([]);
  });

  it('does not write the reset to Firestore when stopped', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(remoteWithTeams(['Kings']));

    remote.stop();

    expect(remote.writes).toEqual([]);
  });

  it('resets the store contents when stopped', () => {
    const remote = startWithFakeRemote();
    remote.snapshot(remoteWithTeams(['Kings']));

    remote.stop();

    expect(store().disciplines.mixed.teams).toEqual([]);
  });
});
