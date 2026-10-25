import {
  createInitialDisciplineState,
  createInitialDisciplines,
  type EventDisciplines,
} from '../store/initialState';
import type {
  DisciplineKey,
  DisciplineState,
  RaceOutcome,
  Score,
  Team,
} from '../domain/types';
import { MAX_ROUNDS, isLeagueKey, type SeasonRound } from '../seasons/seasons';

export { createInitialDisciplines, type EventDisciplines };

// Terminology: an "event" in code is shown to users as a "round" (one race
// day). Not to be confused with R1/R2, the rounds within a discipline.

// Must match the discipline keys allowed in firestore.rules.
export const DISCIPLINE_KEYS: DisciplineKey[] = ['mixed', 'board', 'ladies'];

/** Largest team count with a cheat sheet; more would crash every viewer. Must match firestore.rules. */
const MAX_TEAMS = 31;

// Must match firestore.rules (data.name.size() <= 100).
export const MAX_EVENT_NAME_LENGTH = 100;

// Must match firestore.rules (data.venue.size() <= 60).
export const MAX_VENUE_LENGTH = 60;

// Must match the textarea maxLength in ExpandableRaceCard.
export const MAX_NOTE_LENGTH = 200;

/** An event as shown in the event list. */
export interface EventSummary {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD, or '' if missing
  /** Null for rounds created before seasons existed. */
  round: SeasonRound | null;
}

/** A fully loaded event, as held by the sync layer. */
export interface EventDetail extends EventSummary {
  disciplines: EventDisciplines;
}

export interface NewEventInput {
  name: string;
  date: string;
  round?: SeasonRound;
}

/**
 * A discipline as stored in Firestore. Scores and tiebreaks are maps so each
 * race result is its own field: concurrent or offline-replayed writes from
 * different devices then merge instead of overwriting each other.
 * teamCount is not stored; it is always derived from teams.
 */
export interface FirestoreDiscipline {
  teams: Team[];
  phase: DisciplineState['phase'];
  scores: Record<string, Score>;
  manualTiebreaks: Record<string, number[]>;
  /** Optional: rounds created before placings existed do not have it. */
  placings: Record<string, number>;
  /** Optional: only written when a race has a note, so event create and reset stay valid under rules without notes. */
  notes?: Record<string, string>;
}

/**
 * One field to write inside disciplines.<key>, relative to that discipline.
 * value undefined means delete the field; an empty path replaces the whole
 * discipline.
 */
export interface DisciplineChange {
  path: string[];
  value: unknown;
}

const PHASE_SET = {
  setup: true,
  'group-stage': true,
  'round-two': true,
  finals: true,
  complete: true,
} satisfies Record<DisciplineState['phase'], true>;

const OUTCOMES = { win: true, loss: true, dsq: true, 'not-run': true } satisfies Record<
  RaceOutcome,
  true
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPhase = (value: unknown): value is DisciplineState['phase'] =>
  typeof value === 'string' && value in PHASE_SET;

const isOutcome = (value: unknown): value is RaceOutcome =>
  typeof value === 'string' && value in OUTCOMES;

const isTeam = (value: unknown): value is Team =>
  isRecord(value) && typeof value.slot === 'number' && typeof value.name === 'string';

const isScore = (value: unknown): value is Score =>
  isRecord(value) &&
  typeof value.raceId === 'string' &&
  typeof value.homeSlot === 'number' &&
  typeof value.awaySlot === 'number' &&
  isOutcome(value.homeOutcome) &&
  isOutcome(value.awayOutcome);

const isSlotList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((n) => typeof n === 'number');

const isPlace = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_TEAMS;

export function toFirestoreDiscipline(state: DisciplineState): FirestoreDiscipline {
  return {
    teams: state.teams,
    phase: state.phase,
    scores: Object.fromEntries(state.scores.map((s) => [s.raceId, s])),
    manualTiebreaks: state.manualTiebreaks,
    placings: state.placings,
    ...(Object.keys(state.notes).length > 0 && { notes: state.notes }),
  };
}

/**
 * Normalise a discipline read from Firestore. Snapshot data is external
 * input (another app version, or a hand edit in the console), so malformed
 * entries are dropped and an impossible team count resets the discipline,
 * rather than crashing the domain functions for every viewer.
 */
export function parseDiscipline(raw: unknown): DisciplineState {
  const initial = createInitialDisciplineState();
  if (!isRecord(raw)) return initial;

  const teams = Array.isArray(raw.teams) ? raw.teams.filter(isTeam) : [];
  if (teams.length > MAX_TEAMS) return initial;

  // An entry is only trusted if its key matches its raceId, so a hand edit
  // cannot create duplicate results for one race.
  const scores = isRecord(raw.scores)
    ? Object.entries(raw.scores)
        .filter(([raceId, s]) => isScore(s) && s.raceId === raceId)
        .map(([, s]) => s as Score)
    : [];
  const manualTiebreaks = isRecord(raw.manualTiebreaks)
    ? Object.fromEntries(
        Object.entries(raw.manualTiebreaks).filter(([, slots]) => isSlotList(slots))
      )
    : {};

  const placings = isRecord(raw.placings)
    ? Object.fromEntries(Object.entries(raw.placings).filter(([, place]) => isPlace(place)))
    : {};

  const notes = isRecord(raw.notes)
    ? Object.fromEntries(
        Object.entries(raw.notes)
          .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
          .map(([raceId, note]) => [raceId, note.trim().slice(0, MAX_NOTE_LENGTH)] as const)
          .filter(([, note]) => note !== '')
      )
    : {};

  return {
    teams,
    teamCount: teams.length,
    phase: isPhase(raw.phase) ? raw.phase : initial.phase,
    scores,
    manualTiebreaks: manualTiebreaks as Record<string, number[]>,
    placings: placings as Record<string, number>,
    notes,
  };
}

export function parseDisciplines(raw: unknown): EventDisciplines {
  const source = isRecord(raw) ? raw : {};
  return {
    mixed: parseDiscipline(source.mixed),
    board: parseDiscipline(source.board),
    ladies: parseDiscipline(source.ladies),
  };
}

function parseSeasonRound(data: Record<string, unknown>): SeasonRound | null {
  const { seasonId, league, roundNumber, venue } = data;
  if (typeof seasonId !== 'string' || !isLeagueKey(league)) return null;
  if (!Number.isInteger(roundNumber) || (roundNumber as number) < 1) return null;
  if ((roundNumber as number) > MAX_ROUNDS) return null;
  return {
    seasonId,
    league,
    roundNumber: roundNumber as number,
    venue: typeof venue === 'string' ? venue : '',
  };
}

export function parseEventSummary(id: string, raw: unknown): EventSummary {
  const data = isRecord(raw) ? raw : {};
  return {
    id,
    name: typeof data.name === 'string' && data.name ? data.name : 'Untitled round',
    date: typeof data.date === 'string' ? data.date : '',
    round: parseSeasonRound(data),
  };
}

/** Event name for a season round, e.g. "R2 - Hemel". */
export function seasonRoundName(roundNumber: number, venue: string): string {
  const trimmed = venue.trim();
  return trimmed ? `R${roundNumber} - ${trimmed}` : `R${roundNumber}`;
}

export function parseEventDetail(id: string, raw: unknown): EventDetail {
  const data = isRecord(raw) ? raw : {};
  return { ...parseEventSummary(id, data), disciplines: parseDisciplines(data.disciplines) };
}

/**
 * The document written when an event is created. serverTimestamp is passed
 * in so the rules tests can build the exact payload the app sends.
 */
export function buildNewEventDoc(input: NewEventInput, uid: string, serverTimestamp: () => unknown) {
  const initial = createInitialDisciplines();
  const round = input.round && {
    seasonId: input.round.seasonId,
    league: input.round.league,
    roundNumber: input.round.roundNumber,
    venue: input.round.venue.trim(),
  };
  return {
    name: input.name.trim(),
    date: input.date,
    ...round,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    disciplines: {
      mixed: toFirestoreDiscipline(initial.mixed),
      board: toFirestoreDiscipline(initial.board),
      ladies: toFirestoreDiscipline(initial.ladies),
    },
  };
}

// Key-order sensitive: a false mismatch only causes a redundant write.
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const isInitialDiscipline = (state: DisciplineState) =>
  state.teams.length === 0 &&
  state.scores.length === 0 &&
  Object.keys(state.manualTiebreaks).length === 0 &&
  Object.keys(state.placings).length === 0 &&
  Object.keys(state.notes).length === 0 &&
  state.phase === 'setup';

/**
 * The minimal set of Firestore fields that turns prev into next. Each score
 * and tiebreak is its own field, so a phase change or one recorded result
 * never rewrites results another device recorded meanwhile.
 *
 * A reset replaces the whole discipline so it also clears results this
 * device has not seen yet. Teams are written as one field; firestore.rules
 * rejects a teams change while the discipline has scores, so a stale offline
 * team edit cannot re-slot teams under another device's results.
 */
export function diffDiscipline(prev: DisciplineState, next: DisciplineState): DisciplineChange[] {
  if (isInitialDiscipline(next) && !isInitialDiscipline(prev)) {
    return [{ path: [], value: toFirestoreDiscipline(next) }];
  }

  const changes: DisciplineChange[] = [];

  if (prev.teams !== next.teams && !sameJson(prev.teams, next.teams)) {
    changes.push({ path: ['teams'], value: next.teams });
  }
  if (prev.phase !== next.phase) {
    changes.push({ path: ['phase'], value: next.phase });
  }

  const prevScores = new Map(prev.scores.map((s) => [s.raceId, s]));
  const nextScores = new Map(next.scores.map((s) => [s.raceId, s]));
  for (const [raceId, score] of nextScores) {
    const before = prevScores.get(raceId);
    if (before !== score && !sameJson(before, score)) {
      changes.push({ path: ['scores', raceId], value: score });
    }
  }
  for (const raceId of prevScores.keys()) {
    if (!nextScores.has(raceId)) changes.push({ path: ['scores', raceId], value: undefined });
  }

  for (const [groupKey, slots] of Object.entries(next.manualTiebreaks)) {
    if (!sameJson(prev.manualTiebreaks[groupKey], slots)) {
      changes.push({ path: ['manualTiebreaks', groupKey], value: slots });
    }
  }
  for (const groupKey of Object.keys(prev.manualTiebreaks)) {
    if (!(groupKey in next.manualTiebreaks)) {
      changes.push({ path: ['manualTiebreaks', groupKey], value: undefined });
    }
  }

  for (const [slot, place] of Object.entries(next.placings)) {
    if (prev.placings[slot] !== place) changes.push({ path: ['placings', slot], value: place });
  }
  for (const slot of Object.keys(prev.placings)) {
    if (!(slot in next.placings)) changes.push({ path: ['placings', slot], value: undefined });
  }

  for (const [raceId, note] of Object.entries(next.notes)) {
    if (prev.notes[raceId] !== note) changes.push({ path: ['notes', raceId], value: note });
  }
  for (const raceId of Object.keys(prev.notes)) {
    if (!(raceId in next.notes)) changes.push({ path: ['notes', raceId], value: undefined });
  }

  return changes;
}

/** A real YYYY-MM-DD calendar date. Stricter than firestore.rules, which only checks the shape. */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d;
}

/** Returns an error message, or null when the input is valid. */
export function validateNewEvent(input: NewEventInput): string | null {
  const name = input.name.trim();
  if (!name) return 'Enter a name';
  if (name.length > MAX_EVENT_NAME_LENGTH) {
    return `Name must be ${MAX_EVENT_NAME_LENGTH} characters or fewer`;
  }
  if (input.round) {
    const venue = input.round.venue.trim();
    if (!venue) return 'Enter a venue';
    if (venue.length > MAX_VENUE_LENGTH) {
      return `Venue must be ${MAX_VENUE_LENGTH} characters or fewer`;
    }
  }
  if (!isCalendarDate(input.date)) return 'Choose a date';
  return null;
}
