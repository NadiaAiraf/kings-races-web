import { describe, it, expect } from 'vitest';
import { formatEventDate } from './formatEventDate';

describe('formatEventDate', () => {
  it('formats an ISO date in UK style', () => {
    expect(formatEventDate('2026-11-14')).toBe('Sat 14 Nov 2026');
  });

  it('returns an empty string for a missing date', () => {
    expect(formatEventDate('')).toBe('');
  });
});
