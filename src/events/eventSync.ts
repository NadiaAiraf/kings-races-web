import type { StoreApi } from 'zustand';
import type { DisciplineKey } from '../domain/types';
import type { EventStoreActions, EventStoreState } from '../store/types';
import {
  DISCIPLINE_KEYS,
  diffDiscipline,
  type DisciplineChange,
  type EventDisciplines,
} from './eventDoc';

type EventStore = StoreApi<EventStoreState & EventStoreActions>;

export interface EventSyncDeps {
  /** Subscribe to the event's disciplines as they change remotely. */
  subscribe: (
    onDisciplines: (disciplines: EventDisciplines) => void,
    onError: (error: Error) => void
  ) => () => void;
  /**
   * Must report failure by rejecting, never by throwing synchronously: it is
   * called inside a zustand listener, where a throw stops React updating.
   */
  writeChanges: (key: DisciplineKey, changes: DisciplineChange[]) => Promise<void>;
  /** Checked on every change, so revoking edit rights takes effect at once. */
  canWrite: () => boolean;
  onWriteError: (error: unknown, context: { key: DisciplineKey; paths: string[] }) => void;
  onSubscribeError: (error: Error) => void;
}

/**
 * Bind the working store to one Firestore event.
 *
 * Remote snapshots replace the store's disciplines. Local changes are written
 * back as field-level diffs (one score, the phase, one tiebreak, or teams),
 * only for users who can write, and never for a discipline object that was
 * itself just applied from a snapshot: those are recognised by reference, so
 * remote updates cannot echo back to Firestore.
 *
 * Returns a stop function that unsubscribes and clears the store.
 */
export function startEventSync(store: EventStore, deps: EventSyncDeps): () => void {
  // Start from a blank event so the previous event's data never shows (or
  // gets written) under this one.
  store.getState().resetEvent();

  let remote: EventDisciplines | null = null;

  const unsubscribeStore = store.subscribe((state, prev) => {
    // Nothing is written until the first snapshot has hydrated the store.
    if (!remote || !deps.canWrite()) return;
    for (const key of DISCIPLINE_KEYS) {
      const next = state.disciplines[key];
      if (next === prev.disciplines[key] || next === remote[key]) continue;
      const changes = diffDiscipline(prev.disciplines[key], next);
      if (changes.length > 0) {
        deps.writeChanges(key, changes).catch((error) => {
          // A write rejected by the server is rolled back by Firestore, which
          // sends a snapshot. One that failed before reaching the cache is
          // not, so restore the last snapshot to undo it on screen too.
          if (remote) store.setState({ disciplines: remote });
          deps.onWriteError(error, { key, paths: changes.map((c) => c.path.join('.')) });
        });
      }
    }
  });

  const unsubscribeRemote = deps.subscribe((disciplines) => {
    // remote must be set BEFORE setState: zustand calls the store listener
    // above synchronously, and it uses remote to recognise snapshot objects.
    remote = disciplines;
    store.setState({ disciplines });
  }, deps.onSubscribeError);

  return () => {
    unsubscribeRemote();
    // Unsubscribe the store listener BEFORE resetting, otherwise the reset
    // looks like a local edit and would blank the event in Firestore.
    unsubscribeStore();
    store.getState().resetEvent();
  };
}
