import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/app';
import type { EventSnapshotMeta } from '../events/eventsRepo';
import { parseSeason, seasonIdFor, type Season } from './seasons';

// One season a year; must match the list limit in firestore.rules.
const SEASON_LIST_LIMIT = 20;

const seasonsCollection = () => collection(db, 'seasons');

/** Newest season first. */
export function subscribeSeasons(
  onSeasons: (seasons: Season[], meta: EventSnapshotMeta) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(seasonsCollection(), orderBy('startYear', 'desc'), limit(SEASON_LIST_LIMIT)),
    (snap) =>
      onSeasons(
        snap.docs.flatMap((d) => parseSeason(d.id, d.data()) ?? []),
        { fromCache: snap.metadata.fromCache }
      ),
    onError
  );
}

/**
 * Create a season. The id comes from the start year, so firestore.rules
 * rejects a duplicate. Like createEvent, this works offline.
 */
export function createSeason(
  startYear: number,
  uid: string
): { id: string; committed: Promise<void> } {
  const id = seasonIdFor(startYear);
  const committed = setDoc(doc(seasonsCollection(), id), {
    startYear,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return { id, committed };
}
