// A season runs across one academic year (e.g. 25/26). Each league runs up
// to MAX_ROUNDS rounds per season; a round is one race day ("event" in code).

// Must match the league keys allowed in firestore.rules.
export const LEAGUES = [
  { key: 'southern', name: 'Southern' },
  { key: 'western', name: 'Western' },
  { key: 'northern', name: 'Northern' },
  { key: 'midlands', name: 'Midlands' },
  { key: 'scotland', name: 'Scotland' },
] as const;

export type LeagueKey = (typeof LEAGUES)[number]['key'];

// Must match firestore.rules.
export const MAX_ROUNDS = 4;
export const MIN_SEASON_START_YEAR = 2020;
export const MAX_SEASON_START_YEAR = 2098;

// A new season usually starts in the autumn term.
const SEASON_START_MONTH_INDEX = 8; // September

export interface Season {
  id: string; // e.g. '2025-26'
  startYear: number; // e.g. 2025
}

/** Where a round sits in the season calendar. */
export interface SeasonRound {
  seasonId: string;
  league: LeagueKey;
  roundNumber: number; // 1..MAX_ROUNDS
  venue: string;
}

const LEAGUE_NAMES: Record<string, string> = Object.fromEntries(
  LEAGUES.map((l) => [l.key, l.name])
);

export function isLeagueKey(value: unknown): value is LeagueKey {
  return typeof value === 'string' && value in LEAGUE_NAMES;
}

export function leagueName(key: LeagueKey): string {
  return LEAGUE_NAMES[key];
}

const twoDigits = (n: number) => String(n % 100).padStart(2, '0');

/** Document id for the season starting in startYear: 2025 -> '2025-26'. */
export function seasonIdFor(startYear: number): string {
  return `${startYear}-${twoDigits(startYear + 1)}`;
}

/** Display label for the season starting in startYear: 2025 -> '25/26'. */
export function seasonLabel(startYear: number): string {
  return `${twoDigits(startYear)}/${twoDigits(startYear + 1)}`;
}

/** Start year from a season id, or null if the id is malformed. */
export function seasonStartYear(seasonId: string): number | null {
  const match = /^(\d{4})-\d{2}$/.exec(seasonId);
  if (!match) return null;
  const year = Number(match[1]);
  return seasonIdFor(year) === seasonId ? year : null;
}

/** Label for a season id, falling back to the raw id if it is malformed. */
export function seasonIdLabel(seasonId: string): string {
  const year = seasonStartYear(seasonId);
  return year === null ? seasonId : seasonLabel(year);
}

/** The start year of the season that `date` falls in. */
export function currentSeasonStartYear(date: Date): number {
  return date.getMonth() >= SEASON_START_MONTH_INDEX ? date.getFullYear() : date.getFullYear() - 1;
}

/**
 * The start year to suggest for a new season: the current season if it does
 * not exist yet, otherwise the year after the newest season.
 */
export function suggestedSeasonStartYear(existing: number[], today: Date): number {
  const current = currentSeasonStartYear(today);
  if (!existing.includes(current)) return current;
  return Math.max(...existing) + 1;
}

/** The start year typed for a new season, or an error message. */
export function parseSeasonStartYear(
  input: string,
  existing: number[]
): { year: number } | { error: string } {
  const year = Number(input.trim());
  if (!/^\d{4}$/.test(input.trim())) return { error: 'Enter the year the season starts, e.g. 2026' };
  if (year < MIN_SEASON_START_YEAR || year > MAX_SEASON_START_YEAR) {
    return { error: `Enter a year from ${MIN_SEASON_START_YEAR} to ${MAX_SEASON_START_YEAR}` };
  }
  if (existing.includes(year)) return { error: `Season ${seasonLabel(year)} already exists` };
  return { year };
}

/**
 * Event document id for a season round. Deterministic so Firestore (and
 * firestore.rules) guarantee one round per number per league per season.
 */
export function seasonRoundEventId(round: Omit<SeasonRound, 'venue'>): string {
  return `${round.seasonId}_${round.league}_r${round.roundNumber}`;
}

export function parseSeason(id: string, raw: unknown): Season | null {
  const startYear = seasonStartYear(id);
  if (startYear === null) return null;
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return data.startYear === startYear ? { id, startYear } : null;
}
