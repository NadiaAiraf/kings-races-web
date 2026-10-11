import {
  arrayRemove,
  arrayUnion,
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
import { parseSeason, seasonIdFor, type LeagueKey, type Season } from './seasons';
import type { DisciplineKey } from '../domain/types';
import { emptyLeagueTeams, parseLeagueTeams, type LeagueTeams } from './leagueTeams';

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

const leagueTeamsDoc = (seasonId: string, league: LeagueKey) =>
  doc(seasonsCollection(), seasonId, 'leagues', league);

/** The league's team list for a season; empty lists until one is saved. */
export function subscribeLeagueTeams(
  seasonId: string,
  league: LeagueKey,
  onTeams: (teams: LeagueTeams) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    leagueTeamsDoc(seasonId, league),
    (snap) => onTeams(snap.exists() ? parseLeagueTeams(snap.data()) : emptyLeagueTeams()),
    onError
  );
}

/**
 * Add teams to one discipline's list. arrayUnion/arrayRemove merge with
 * other officials' edits instead of overwriting the list. Works offline.
 */
export function addLeagueTeams(
  seasonId: string,
  league: LeagueKey,
  discipline: DisciplineKey,
  names: string[]
): Promise<void> {
  return setDoc(
    leagueTeamsDoc(seasonId, league),
    { [discipline]: arrayUnion(...names), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export function removeLeagueTeam(
  seasonId: string,
  league: LeagueKey,
  discipline: DisciplineKey,
  name: string
): Promise<void> {
  return setDoc(
    leagueTeamsDoc(seasonId, league),
    { [discipline]: arrayRemove(name), updatedAt: serverTimestamp() },
    { merge: true }
  );
}
