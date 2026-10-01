import {
  FieldPath,
  collection,
  deleteField,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  waitForPendingWrites,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import type { DisciplineKey } from '../domain/types';
import {
  buildNewEventDoc,
  parseEventDetail,
  parseEventSummary,
  type DisciplineChange,
  type EventDetail,
  type EventSummary,
  type NewEventInput,
} from './eventDoc';

// About 4 rounds a year: this covers several seasons while bounding what an
// anonymous viewer of the list downloads and listens to.
const EVENT_LIST_LIMIT = 40;

// Long enough for queued writes to flush on a slow but online connection.
const PENDING_WRITES_TIMEOUT_MS = 3000;

const eventsCollection = () => collection(db, 'events');

/**
 * Create an event and return its id straight away. The id is generated
 * client-side so this works offline: Firestore queues the write and the
 * returned promise settles only once the server accepts or rejects it.
 */
export function createEvent(
  input: NewEventInput,
  uid: string
): { id: string; committed: Promise<void> } {
  const ref = doc(eventsCollection());
  const committed = setDoc(ref, buildNewEventDoc(input, uid, serverTimestamp));
  return { id: ref.id, committed };
}

export interface EventSnapshotMeta {
  /** True when the snapshot came from the local cache, e.g. while offline. */
  fromCache: boolean;
}

export function subscribeEvents(
  onEvents: (events: EventSummary[], meta: EventSnapshotMeta) => void,
  onError: (error: Error) => void
): () => void {
  // Each listener receives whole event documents, so a score update costs one
  // read per open list. Fine at this scale (a few rounds a year, tens of
  // viewers); split out a summaries collection if that ever changes.
  return onSnapshot(
    query(eventsCollection(), orderBy('date', 'desc'), limit(EVENT_LIST_LIMIT)),
    (snap) =>
      onEvents(
        snap.docs.map((d) => parseEventSummary(d.id, d.data())),
        { fromCache: snap.metadata.fromCache }
      ),
    onError
  );
}

export function subscribeEvent(
  id: string,
  onEvent: (event: EventDetail | null, meta: EventSnapshotMeta) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(eventsCollection(), id),
    (snap) =>
      onEvent(snap.exists() ? parseEventDetail(snap.id, snap.data()) : null, {
        fromCache: snap.metadata.fromCache,
      }),
    onError
  );
}

/**
 * Write field-level changes inside one discipline. FieldPath segments are
 * used because race ids and group keys must not be parsed as dotted paths.
 */
export async function writeDisciplineChanges(
  id: string,
  key: DisciplineKey,
  changes: DisciplineChange[]
): Promise<void> {
  // Must stay async: FieldPath and updateDoc validate synchronously, and async
  // turns those throws into rejections. eventSync calls this from inside a
  // zustand listener, where a synchronous throw would stop React updating.
  const fieldsAndValues = changes.flatMap(({ path, value }) => [
    new FieldPath('disciplines', key, ...path),
    value === undefined ? deleteField() : value,
  ]);
  await updateDoc(
    doc(eventsCollection(), id),
    new FieldPath('updatedAt'),
    serverTimestamp(),
    ...fieldsAndValues
  );
}

/**
 * Whether this device holds writes the server has not acknowledged yet.
 * Firestore queues pending writes per user, so signing out hides them until
 * the same user signs back in on this device.
 */
export async function hasUnsyncedWrites(): Promise<boolean> {
  // A rejection (e.g. the user changed while waiting) counts as unsynced, so
  // the caller still asks before signing out.
  const synced = waitForPendingWrites(db).then(
    () => true,
    () => false
  );
  const timedOut = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), PENDING_WRITES_TIMEOUT_MS)
  );
  return !(await Promise.race([synced, timedOut]));
}
