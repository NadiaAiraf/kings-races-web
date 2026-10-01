import { describe, it, expect } from 'vitest';
import { exportFilename, formatEventDate, toLocalIsoDate } from './dates';

describe('formatEventDate', () => {
  it('formats an ISO date in UK style', () => {
    expect(formatEventDate('2026-11-14')).toBe('Sat 14 Nov 2026');
  });

  it('returns an empty string for a missing date', () => {
    expect(formatEventDate('')).toBe('');
  });

  it('returns an empty string for an impossible month', () => {
    expect(formatEventDate('2026-13-01')).toBe('');
  });

  it('returns an empty string for a day that rolls into the next month', () => {
    expect(formatEventDate('2026-02-30')).toBe('');
  });
});

describe('toLocalIsoDate', () => {
  it('zero-pads single-digit months and days', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('exportFilename', () => {
  const now = new Date(2026, 10, 20);

  it('uses the round name and date', () => {
    expect(exportFilename({ name: 'Round 1 - Hemel', date: '2026-11-14' }, now)).toBe(
      'kings-races-round-1-hemel-2026-11-14.csv'
    );
  });

  it("falls back to today's date with no open round", () => {
    expect(exportFilename(null, now)).toBe('kings-races-2026-11-20.csv');
  });

  it('drops the slug when the name has no letters or digits', () => {
    expect(exportFilename({ name: '!!!', date: '2026-11-14' }, now)).toBe('kings-races-2026-11-14.csv');
  });
});
