import type { DisciplineKey } from '../domain/types';
import { teamKey } from './seasonStandings';

/**
 * Every team registered in a league for a season, per discipline. Unlike a
 * round (at most 31 teams), the list can hold the whole league; officials
 * pick who races when they enter a round's teams.
 */
export type LeagueTeams = Record<DisciplineKey, string[]>;

// Must match firestore.rules.
export const MAX_LEAGUE_TEAMS = 100;
export const MAX_TEAM_NAME_LENGTH = 60;

export const emptyLeagueTeams = (): LeagueTeams => ({ mixed: [], board: [], ladies: [] });

const isNameList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((n) => typeof n === 'string');

export function parseLeagueTeams(raw: unknown): LeagueTeams {
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = (value: unknown) => (isNameList(value) ? value : []);
  return { mixed: list(data.mixed), board: list(data.board), ladies: list(data.ladies) };
}

/**
 * Names from pasted text (one per line) that are not on the list yet, in
 * order, trimmed and without duplicates (ignoring case and spacing).
 */
export function newTeamNames(text: string, existing: string[]): string[] {
  const seen = new Set(existing.map(teamKey));
  const names: string[] = [];
  for (const line of text.split('\n')) {
    const name = line.trim().replace(/\s+/g, ' ');
    if (!name || seen.has(teamKey(name))) continue;
    seen.add(teamKey(name));
    names.push(name);
  }
  return names;
}

/** Returns an error message, or null when the names can be added. */
export function validateNewTeamNames(names: string[], existing: string[]): string | null {
  if (names.length === 0) return 'Enter at least one new team';
  const tooLong = names.find((n) => n.length > MAX_TEAM_NAME_LENGTH);
  if (tooLong) return `"${tooLong}" is longer than ${MAX_TEAM_NAME_LENGTH} characters`;
  if (existing.length + names.length > MAX_LEAGUE_TEAMS) {
    return `A league can list at most ${MAX_LEAGUE_TEAMS} teams per discipline`;
  }
  return null;
}
