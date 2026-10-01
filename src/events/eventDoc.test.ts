import { describe, it, expect } from 'vitest';
import {
  parseDiscipline,
  parseDisciplines,
  parseEventDetail,
  parseEventSummary,
  validateNewEvent,
} from './eventDoc';

describe('parseDiscipline', () => {
  it('keeps a well-formed discipline unchanged', () => {
    const raw = {
      teams: [{ slot: 1, name: 'Kings' }],
      teamCount: 1,
      phase: 'group-stage',
      scores: [{ raceId: 'r1-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' }],
      manualTiebreaks: { A: [1, 2] },
    };
    expect(parseDiscipline(raw)).toEqual(raw);
  });

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

  it('replaces non-array scores with an empty list', () => {
    expect(parseDiscipline({ scores: 'oops' }).scores).toEqual([]);
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

  it('labels an event with no name', () => {
    expect(parseEventSummary('e1', {}).name).toBe('Untitled event');
  });
});

describe('parseEventDetail', () => {
  it('includes parsed disciplines', () => {
    const detail = parseEventDetail('e1', { name: 'R', date: '2026-01-01' });
    expect(detail.disciplines.mixed.teams).toEqual([]);
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

  it('rejects a missing date', () => {
    expect(validateNewEvent({ name: 'Round 1', date: '' })).toBe('Choose a date');
  });
});
