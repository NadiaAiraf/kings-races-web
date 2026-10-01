import { createInitialDisciplineState } from '../store/eventStore';
import type { DisciplineKey, DisciplineState } from '../domain/types';

export const DISCIPLINE_KEYS: DisciplineKey[] = ['mixed', 'board', 'ladies'];

export type EventDisciplines = Record<DisciplineKey, DisciplineState>;

/** An event as shown in the event list. */
export interface EventSummary {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

/** A fully loaded event, as held by the sync layer. */
export interface EventDetail extends EventSummary {
  disciplines: EventDisciplines;
}

export interface NewEventInput {
  name: string;
  date: string;
}

const PHASES: DisciplineState['phase'][] = [
  'setup',
  'group-stage',
  'round-two',
  'finals',
  'complete',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const createInitialDisciplines = (): EventDisciplines => ({
  mixed: createInitialDisciplineState(),
  board: createInitialDisciplineState(),
  ladies: createInitialDisciplineState(),
});

/**
 * Normalise a discipline read from Firestore. Snapshot data is external
 * input, so missing or malformed fields fall back to the initial state
 * rather than crashing the domain functions that consume DisciplineState.
 */
export function parseDiscipline(raw: unknown): DisciplineState {
  const initial = createInitialDisciplineState();
  if (!isRecord(raw)) return initial;

  const teams = Array.isArray(raw.teams) ? (raw.teams as DisciplineState['teams']) : [];
  return {
    teams,
    teamCount: teams.length,
    phase: PHASES.includes(raw.phase as DisciplineState['phase'])
      ? (raw.phase as DisciplineState['phase'])
      : initial.phase,
    scores: Array.isArray(raw.scores) ? (raw.scores as DisciplineState['scores']) : [],
    manualTiebreaks: isRecord(raw.manualTiebreaks)
      ? (raw.manualTiebreaks as DisciplineState['manualTiebreaks'])
      : {},
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
    name: typeof data.name === 'string' && data.name ? data.name : 'Untitled event',
    date: typeof data.date === 'string' ? data.date : '',
  };
}

export function parseEventDetail(id: string, raw: unknown): EventDetail {
  const data = isRecord(raw) ? raw : {};
  return { ...parseEventSummary(id, data), disciplines: parseDisciplines(data.disciplines) };
}

/** Returns an error message, or null when the input is valid. */
export function validateNewEvent(input: NewEventInput): string | null {
  const name = input.name.trim();
  if (!name) return 'Enter a name';
  if (name.length > 100) return 'Name must be 100 characters or fewer';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return 'Choose a date';
  return null;
}
