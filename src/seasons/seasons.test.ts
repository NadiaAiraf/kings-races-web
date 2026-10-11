import { describe, it, expect } from 'vitest';
import {
  availableSeasonYears,
  currentSeasonStartYear,
  isLeagueKey,
  leagueName,
  parseSeason,
  seasonIdFor,
  seasonIdLabel,
  seasonLabel,
  seasonRoundEventId,
  seasonStartYear,
} from './seasons';

describe('season ids and labels', () => {
  it('builds the id from the start year', () => {
    expect(seasonIdFor(2025)).toBe('2025-26');
  });

  it('pads the end year across a century boundary', () => {
    expect(seasonIdFor(2099)).toBe('2099-00');
  });

  it('labels a season the way the spreadsheet does', () => {
    expect(seasonLabel(2025)).toBe('25/26');
  });

  it('reads the start year back from an id', () => {
    expect(seasonStartYear('2026-27')).toBe(2026);
  });

  it('rejects an id whose years are not consecutive', () => {
    expect(seasonStartYear('2026-29')).toBeNull();
  });

  it('labels a malformed id with the raw id', () => {
    expect(seasonIdLabel('mystery')).toBe('mystery');
  });
});

describe('currentSeasonStartYear', () => {
  it('treats September onwards as the new season', () => {
    expect(currentSeasonStartYear(new Date(2026, 8, 1))).toBe(2026);
  });

  it('treats spring as the second half of the previous season', () => {
    expect(currentSeasonStartYear(new Date(2027, 2, 14))).toBe(2026);
  });
});

describe('leagues', () => {
  it('recognises a known league key', () => {
    expect(isLeagueKey('scotland')).toBe(true);
  });

  it('rejects an unknown league key', () => {
    expect(isLeagueKey('eastern')).toBe(false);
  });

  it('names a league', () => {
    expect(leagueName('midlands')).toBe('Midlands');
  });
});

describe('seasonRoundEventId', () => {
  it('is unique per season, league and round number', () => {
    expect(seasonRoundEventId({ seasonId: '2025-26', league: 'southern', roundNumber: 2 })).toBe(
      '2025-26_southern_r2'
    );
  });
});

describe('parseSeason', () => {
  it('parses a valid season document', () => {
    expect(parseSeason('2025-26', { startYear: 2025 })).toEqual({ id: '2025-26', startYear: 2025 });
  });

  it('rejects a document whose start year does not match its id', () => {
    expect(parseSeason('2025-26', { startYear: 2024 })).toBeNull();
  });
});

describe('availableSeasonYears', () => {
  it('offers up to next season, newest first, skipping existing seasons', () => {
    const years = availableSeasonYears([2026, 2024], new Date(2026, 9, 11));
    expect(years.slice(0, 3)).toEqual([2027, 2025, 2023]);
  });

  it('stops at the earliest season the rules allow', () => {
    const years = availableSeasonYears([], new Date(2026, 9, 11));
    expect(years.at(-1)).toBe(2020);
  });
});
