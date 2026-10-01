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

export { createInitialDisciplines, type EventDisciplines };

// Terminology: an "event" in code is shown to users as a "round" (one race
// day). Not to be confused with R1/R2, the rounds within a discipline.

// Must match the discipline keys allowed in firestore.rules.
export const DISCIPLINE_KEYS: DisciplineKey[] = ['mixed', 'board', 'ladies'];

/** Largest team count with a cheat sheet; more would crash every viewer. Must match firestore.rules. */
const MAX_TEAMS = 32;

// Must match firestore.rules (data.name.size() <= 100).
export const MAX_EVENT_NAME_LENGTH = 100;

/** An event as shown in the event list. */
export interface EventSummary {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD, or '' if missing
}

/** A fully loaded event, as held by the sync layer. */
export interface EventDetail extends EventSummary {
  disciplines: EventDisciplines;
}

export interface NewEventInput {
  name: string;
  date: string;
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

export function toFirestoreDiscipline(state: DisciplineState): FirestoreDiscipline {
  return {
    teams: state.teams,
    phase: state.phase,
    scores: Object.fromEntries(state.scores.map((s) => [s.raceId, s])),
    manualTiebreaks: state.manualTiebreaks,
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

  return {
    teams,
    teamCount: teams.length,
    phase: isPhase(raw.phase) ? raw.phase : initial.phase,
    scores,
    manualTiebreaks: manualTiebreaks as Record<string, number[]>,
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

export function parseEventSummary(id: string, raw: unknown): EventSummary {
  const data = isRecord(raw) ? raw : {};
  return {
    id,
    name: typeof data.name === 'string' && data.name ? data.name : 'Untitled round',
    date: typeof data.date === 'string' ? data.date : '',
  };
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
  return {
    name: input.name.trim(),
    date: input.date,
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
  if (!isCalendarDate(input.date)) return 'Choose a date';
  return null;
}
