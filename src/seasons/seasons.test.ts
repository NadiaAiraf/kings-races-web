import { describe, it, expect } from 'vitest';
import {
  currentSeasonStartYear,
  isLeagueKey,
  parseSeasonStartYear,
  leagueName,
  parseSeason,
  seasonIdFor,
  seasonIdLabel,
  seasonLabel,
  seasonRoundEventId,
  seasonStartYear,
  suggestedSeasonStartYear,
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

describe('suggestedSeasonStartYear', () => {
  it('suggests the current season when it does not exist yet', () => {
    expect(suggestedSeasonStartYear([2025], new Date(2026, 9, 11))).toBe(2026);
  });

  it('suggests the year after the newest season otherwise', () => {
    expect(suggestedSeasonStartYear([2026, 2027], new Date(2026, 9, 11))).toBe(2028);
  });
});

describe('parseSeasonStartYear', () => {
  it('accepts any year in range, however far ahead', () => {
    expect(parseSeasonStartYear(' 2031 ', [])).toEqual({ year: 2031 });
  });

  it('rejects a season that already exists', () => {
    expect(parseSeasonStartYear('2026', [2026])).toEqual({ error: 'Season 26/27 already exists' });
  });

  it('rejects something that is not a year', () => {
    expect(parseSeasonStartYear('26/27', [])).toHaveProperty('error');
  });

  it('rejects a year outside 2020-2098', () => {
    expect(parseSeasonStartYear('2019', [])).toHaveProperty('error');
  });
});
