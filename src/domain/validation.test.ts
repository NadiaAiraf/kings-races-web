import { describe, it, expect } from 'vitest';
import { validateTeamCount, getValidTeamCountRange } from './validation';

describe('validateTeamCount', () => {
  it('accepts valid mixed range (4-32)', () => {
    expect(validateTeamCount('mixed', 4).valid).toBe(true);
    expect(validateTeamCount('mixed', 32).valid).toBe(true);
    expect(validateTeamCount('mixed', 16).valid).toBe(true);
  });

  it('rejects out-of-range mixed', () => {
    const result = validateTeamCount('mixed', 33);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('4-32');
  });

  it('rejects below minimum', () => {
    const result = validateTeamCount('mixed', 3);
    expect(result.valid).toBe(false);
  });

  it('accepts valid board range (4-17)', () => {
    expect(validateTeamCount('board', 4).valid).toBe(true);
    expect(validateTeamCount('board', 17).valid).toBe(true);
  });

  it('rejects out-of-range board', () => {
    const result = validateTeamCount('board', 18);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('4-17');
  });

  it('accepts valid ladies range (4-17)', () => {
    expect(validateTeamCount('ladies', 4).valid).toBe(true);
    expect(validateTeamCount('ladies', 17).valid).toBe(true);
  });

  it('rejects out-of-range ladies', () => {
    const result = validateTeamCount('ladies', 18);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('4-17');
  });

  it('rejects non-integer team counts', () => {
    const result = validateTeamCount('mixed', 4.5);
    expect(result.valid).toBe(false);
  });
});

describe('getValidTeamCountRange', () => {
  it('returns correct range for mixed', () => {
    expect(getValidTeamCountRange('mixed')).toEqual({ min: 4, max: 32 });
  });
  it('returns correct range for board', () => {
    expect(getValidTeamCountRange('board')).toEqual({ min: 4, max: 17 });
  });
  it('returns correct range for ladies', () => {
    expect(getValidTeamCountRange('ladies')).toEqual({ min: 4, max: 17 });
  });
});
