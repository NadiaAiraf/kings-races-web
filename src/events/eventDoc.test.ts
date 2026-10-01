import { describe, it, expect } from 'vitest';
import type { DisciplineState, Score } from '../domain/types';
import {
  buildNewEventDoc,
  createInitialDisciplines,
  diffDiscipline,
  parseDiscipline,
  parseDisciplines,
  parseEventDetail,
  parseEventSummary,
  toFirestoreDiscipline,
  validateNewEvent,
} from './eventDoc';

const score = (raceId: string, homeOutcome: Score['homeOutcome'] = 'win'): Score => ({
  raceId,
  homeSlot: 1,
  awaySlot: 2,
  homeOutcome,
  awayOutcome: homeOutcome === 'win' ? 'loss' : 'win',
});

const discipline = (overrides: Partial<DisciplineState> = {}): DisciplineState => ({
  teams: [
    { slot: 1, name: 'Kings' },
    { slot: 2, name: 'Imperial' },
  ],
  teamCount: 2,
  phase: 'group-stage',
  scores: [],
  manualTiebreaks: {},
  ...overrides,
});

describe('toFirestoreDiscipline / parseDiscipline', () => {
  it('round-trips a discipline through the Firestore shape', () => {
    const state = discipline({ scores: [score('r1-1')], manualTiebreaks: { A: [1, 2] } });
    expect(parseDiscipline(toFirestoreDiscipline(state))).toEqual(state);
  });

  it('stores scores as a map keyed by race id', () => {
    const stored = toFirestoreDiscipline(discipline({ scores: [score('r1-1')] }));
    expect(stored.scores).toEqual({ 'r1-1': score('r1-1') });
  });

  it('does not store teamCount', () => {
    expect(toFirestoreDiscipline(discipline())).not.toHaveProperty('teamCount');
  });
});

describe('parseDiscipline', () => {
  it('returns the initial state for a missing discipline', () => {
    expect(parseDiscipline(undefined)).toEqual({
      teams: [],
      teamCount: 0,
      phase: 'setup',
      scores: [],
      manualTiebreaks: {},
    });
  });

  it('derives teamCount from the teams array', () => {
    expect(parseDiscipline({ teams: [{ slot: 1, name: 'A' }], teamCount: 9 }).teamCount).toBe(1);
  });

  it('falls back to setup for an unknown phase', () => {
    expect(parseDiscipline({ phase: 'semi-finals' }).phase).toBe('setup');
  });

  it('drops malformed teams', () => {
    const parsed = parseDiscipline({ teams: [{ slot: 1, name: 'Kings' }, null, { slot: 'x' }] });
    expect(parsed.teams).toEqual([{ slot: 1, name: 'Kings' }]);
  });

  it('keeps a final recorded as not run', () => {
    const notRun = { ...score('fin-0'), homeOutcome: 'not-run', awayOutcome: 'not-run' };
    expect(parseDiscipline({ scores: { 'fin-0': notRun } }).scores).toEqual([notRun]);
  });

  it('drops malformed scores', () => {
    const parsed = parseDiscipline({
      scores: { 'r1-1': score('r1-1'), 'r1-2': { raceId: 'r1-2', homeOutcome: 'maybe' } },
    });
    expect(parsed.scores).toEqual([score('r1-1')]);
  });

  it('drops tiebreaks that are not lists of slots', () => {
    const parsed = parseDiscipline({ manualTiebreaks: { A: [1, 2], B: 'oops' } });
    expect(parsed.manualTiebreaks).toEqual({ A: [1, 2] });
  });

  it('resets a discipline with more teams than any cheat sheet supports', () => {
    const teams = Array.from({ length: 33 }, (_, i) => ({ slot: i + 1, name: `T${i}` }));
    expect(parseDiscipline({ teams, phase: 'group-stage', scores: { 'r1-1': score('r1-1') } })).toEqual(
      createInitialDisciplines().mixed
    );
  });

  it('keeps exactly 32 teams', () => {
    const teams = Array.from({ length: 32 }, (_, i) => ({ slot: i + 1, name: `T${i}` }));
    expect(parseDiscipline({ teams }).teamCount).toBe(32);
  });

  it('ignores a score whose key does not match its race id', () => {
    const parsed = parseDiscipline({ scores: { 'r1-9': score('r1-1') } });
    expect(parsed.scores).toEqual([]);
  });

  it('ignores scores stored as a list (not the Firestore shape)', () => {
    expect(parseDiscipline({ scores: [score('r1-1')] }).scores).toEqual([]);
  });

  it('returns the initial state for a non-object discipline', () => {
    expect(parseDiscipline('oops')).toEqual(createInitialDisciplines().mixed);
  });

  it('drops tiebreak lists that contain non-numbers', () => {
    expect(parseDiscipline({ manualTiebreaks: { A: [1, 'x'] } }).manualTiebreaks).toEqual({});
  });
});

describe('parseDisciplines', () => {
  it('fills in all three disciplines', () => {
    const result = parseDisciplines({ mixed: { phase: 'finals' } });
    expect(result.mixed.phase).toBe('finals');
    expect(result.board.phase).toBe('setup');
    expect(result.ladies.phase).toBe('setup');
  });
});

describe('parseEventSummary', () => {
  it('reads name and date', () => {
    expect(parseEventSummary('e1', { name: 'Round 2', date: '2026-11-14' })).toEqual({
      id: 'e1',
      name: 'Round 2',
      date: '2026-11-14',
    });
  });

  it('labels a round with no name', () => {
    expect(parseEventSummary('e1', {}).name).toBe('Untitled round');
  });
});

describe('parseEventDetail', () => {
  it('includes parsed disciplines', () => {
    const detail = parseEventDetail('e1', { name: 'R', date: '2026-01-01' });
    expect(detail.disciplines.mixed.teams).toEqual([]);
  });
});

describe('buildNewEventDoc', () => {
  it('trims the name and attributes the event to the creator', () => {
    const doc = buildNewEventDoc({ name: '  Round 1  ', date: '2026-11-14' }, 'uid-1', () => 'TS');
    expect(doc).toMatchObject({
      name: 'Round 1',
      date: '2026-11-14',
      createdBy: 'uid-1',
      createdAt: 'TS',
      updatedAt: 'TS',
    });
  });

  it('includes all three disciplines in Firestore shape', () => {
    const doc = buildNewEventDoc({ name: 'R', date: '2026-11-14' }, 'uid-1', () => 'TS');
    const initial = toFirestoreDiscipline(createInitialDisciplines().mixed);
    expect(doc.disciplines).toEqual({ mixed: initial, board: initial, ladies: initial });
  });
});

describe('diffDiscipline', () => {
  it('returns no changes for identical state', () => {
    const state = discipline({ scores: [score('r1-1')] });
    expect(diffDiscipline(state, { ...state })).toEqual([]);
  });

  it('writes a new score as its own field', () => {
    const prev = discipline();
    const next = discipline({ scores: [score('r1-1')] });
    expect(diffDiscipline(prev, next)).toEqual([{ path: ['scores', 'r1-1'], value: score('r1-1') }]);
  });

  it('writes a changed score', () => {
    const prev = discipline({ scores: [score('r1-1', 'win')] });
    const next = discipline({ scores: [score('r1-1', 'dsq')] });
    expect(diffDiscipline(prev, next)).toEqual([
      { path: ['scores', 'r1-1'], value: score('r1-1', 'dsq') },
    ]);
  });

  it('deletes a removed score', () => {
    const prev = discipline({ scores: [score('r1-1')] });
    const next = discipline({ scores: [] });
    expect(diffDiscipline(prev, next)).toEqual([{ path: ['scores', 'r1-1'], value: undefined }]);
  });

  it('writes the phase alone', () => {
    expect(diffDiscipline(discipline(), discipline({ phase: 'round-two' }))).toEqual([
      { path: ['phase'], value: 'round-two' },
    ]);
  });

  it('writes a tiebreak as its own field', () => {
    expect(diffDiscipline(discipline(), discipline({ manualTiebreaks: { A: [2, 1] } }))).toEqual([
      { path: ['manualTiebreaks', 'A'], value: [2, 1] },
    ]);
  });

  it('writes teams whole when they change', () => {
    const teams = [{ slot: 1, name: 'Kings' }];
    expect(diffDiscipline(discipline(), discipline({ teams, teamCount: 1 }))).toEqual([
      { path: ['teams'], value: teams },
    ]);
  });

  it('replaces the whole discipline when it is reset', () => {
    const prev = discipline({ scores: [score('r1-1')], manualTiebreaks: { A: [1, 2] } });
    const reset = createInitialDisciplines().mixed;
    expect(diffDiscipline(prev, reset)).toEqual([
      { path: [], value: toFirestoreDiscipline(reset) },
    ]);
  });

  it('writes nothing when an already-empty discipline is reset', () => {
    const empty = createInitialDisciplines().mixed;
    expect(diffDiscipline(empty, createInitialDisciplines().mixed)).toEqual([]);
  });

  it('writes nothing for teams that are equal but a new array', () => {
    const prev = discipline();
    expect(diffDiscipline(prev, { ...prev, teams: prev.teams.map((t) => ({ ...t })) })).toEqual([]);
  });

  it('writes nothing for a re-recorded score with the same outcome', () => {
    const prev = discipline({ scores: [score('r1-1')] });
    expect(diffDiscipline(prev, discipline({ scores: [score('r1-1')] }))).toEqual([]);
  });

  it('writes a tiebreak whose order changed', () => {
    const prev = discipline({ manualTiebreaks: { A: [1, 2] } });
    expect(diffDiscipline(prev, discipline({ manualTiebreaks: { A: [2, 1] } }))).toEqual([
      { path: ['manualTiebreaks', 'A'], value: [2, 1] },
    ]);
  });

  it('deletes only the tiebreak that was removed', () => {
    const prev = discipline({ manualTiebreaks: { A: [1, 2], B: [3, 4] } });
    expect(diffDiscipline(prev, discipline({ manualTiebreaks: { B: [3, 4] } }))).toEqual([
      { path: ['manualTiebreaks', 'A'], value: undefined },
    ]);
  });
});

describe('validateNewEvent', () => {
  it('accepts a name and ISO date', () => {
    expect(validateNewEvent({ name: 'Round 1', date: '2026-11-14' })).toBeNull();
  });

  it('rejects a blank name', () => {
    expect(validateNewEvent({ name: '   ', date: '2026-11-14' })).toBe('Enter a name');
  });

  it('rejects a name over 100 characters', () => {
    expect(validateNewEvent({ name: 'x'.repeat(101), date: '2026-11-14' })).toMatch(/100/);
  });

  it('rejects an impossible calendar date', () => {
    expect(validateNewEvent({ name: 'Round 1', date: '2026-02-30' })).toBe('Choose a date');
  });

  it('rejects a missing date', () => {
    expect(validateNewEvent({ name: 'Round 1', date: '' })).toBe('Choose a date');
  });
});
