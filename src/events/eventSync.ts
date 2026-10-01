import type { StoreApi } from 'zustand';
import type { DisciplineKey, DisciplineState } from '../domain/types';
import type { EventStoreActions, EventStoreState } from '../store/types';
import { DISCIPLINE_KEYS, createInitialDisciplines, type EventDisciplines } from './eventDoc';

type EventStore = StoreApi<EventStoreState & EventStoreActions>;

export interface EventSyncDeps {
  /** Subscribe to remote disciplines; null means the event does not exist. */
  subscribe: (
    onDisciplines: (disciplines: EventDisciplines | null) => void,
    onError: (error: Error) => void
  ) => () => void;
  writeDiscipline: (key: DisciplineKey, state: DisciplineState) => Promise<void>;
  /** Checked on every change, so revoking edit rights takes effect at once. */
  canWrite: () => boolean;
  /** Called for failed writes and failed subscriptions. */
  onError: (error: unknown) => void;
}

/**
 * Bind the working store to one Firestore event.
 *
 * Remote snapshots replace the store's disciplines. Local changes are written
 * back per discipline, only for users who can write, and never for a
 * discipline object that was itself just applied from a snapshot: those are
 * recognised by reference, so remote updates cannot echo back to Firestore.
 *
 * Returns a stop function that unsubscribes and clears the store.
 */
export function startEventSync(store: EventStore, deps: EventSyncDeps): () => void {
  // Start from a blank event so the previous event's data never shows (or
  // gets written) under this one.
  store.setState({ disciplines: createInitialDisciplines(), activeDiscipline: 'mixed' });

  let remote: EventDisciplines | null = null;

  const unsubscribeStore = store.subscribe((state, prev) => {
    // Nothing is written until the first snapshot has hydrated the store.
    if (!remote || !deps.canWrite()) return;
    for (const key of DISCIPLINE_KEYS) {
      const next = state.disciplines[key];
      if (next !== prev.disciplines[key] && next !== remote[key]) {
        deps.writeDiscipline(key, next).catch(deps.onError);
      }
    }
  });

  const unsubscribeRemote = deps.subscribe(
    (disciplines) => {
      if (!disciplines) return;
      remote = disciplines;
      store.setState({ disciplines });
    },
    deps.onError
  );

  return () => {
    unsubscribeRemote();
    unsubscribeStore();
    store.setState({ disciplines: createInitialDisciplines(), activeDiscipline: 'mixed' });
  };
}
