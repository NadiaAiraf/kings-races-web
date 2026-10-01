import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import type { DisciplineKey, DisciplineState } from '../domain/types';
import {
  createInitialDisciplines,
  parseEventDetail,
  parseEventSummary,
  type EventDetail,
  type EventSummary,
  type NewEventInput,
} from './eventDoc';

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
  const committed = setDoc(ref, {
    name: input.name.trim(),
    date: input.date,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    disciplines: createInitialDisciplines(),
  });
  return { id: ref.id, committed };
}

export function subscribeEvents(
  onEvents: (events: EventSummary[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(eventsCollection(), orderBy('date', 'desc')),
    (snap) => onEvents(snap.docs.map((d) => parseEventSummary(d.id, d.data()))),
    onError
  );
}

export function subscribeEvent(
  id: string,
  onEvent: (event: EventDetail | null) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(eventsCollection(), id),
    (snap) => onEvent(snap.exists() ? parseEventDetail(snap.id, snap.data()) : null),
    onError
  );
}

/** Write one discipline so scorers on different disciplines never clash. */
export function writeDiscipline(
  id: string,
  key: DisciplineKey,
  state: DisciplineState
): Promise<void> {
  return updateDoc(doc(eventsCollection(), id), {
    [`disciplines.${key}`]: state,
    updatedAt: serverTimestamp(),
  });
}
