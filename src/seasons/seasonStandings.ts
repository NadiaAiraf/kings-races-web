import type { DisciplineKey } from '../domain/types';
import type { EventDisciplines } from '../store/initialState';
import { computeRoundPlacings, leaguePoints } from '../domain/roundPlacings';
import type { SeasonRound } from './seasons';

/** The parts of a round the standings need (an EventDetail fits). */
export interface StandingsRound {
  round: SeasonRound | null;
  disciplines: EventDisciplines;
}

export interface RoundResult {
  /** Null when the team raced but no place has been set yet. */
  place: number | null;
  points: number;
}

export interface SeasonStandingRow {
  /** Identifies a team across rounds: its name, ignoring case and spacing. */
  key: string;
  /** As entered in the team's most recent round. */
  name: string;
  /** Keyed by round number; missing when the team did not race that round. */
  results: Partial<Record<number, RoundResult>>;
  total: number;
  lastSeasonPosition: number | null;
}

export function teamKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * League standings for one discipline across a season's rounds, ranked as
 * the spreadsheet's Team Standings sheet does: total points, then the best,
 * 2nd, 3rd and 4th best round, then the most recent round's points, then
 * last season's position. Only rounds where the discipline is complete count.
 */
export function computeSeasonStandings(
  rounds: StandingsRound[],
  discipline: DisciplineKey,
  lastSeasonPositions: ReadonlyMap<string, number> = new Map()
): SeasonStandingRow[] {
  const rows = new Map<string, SeasonStandingRow>();
  const ordered = rounds
    .filter((r): r is StandingsRound & { round: SeasonRound } => r.round !== null)
    .sort((a, b) => a.round.roundNumber - b.round.roundNumber);

  for (const { round, disciplines } of ordered) {
    const placings = computeRoundPlacings(disciplines[discipline]);
    if (!placings) continue;
    for (const { name, place } of placings) {
      const key = teamKey(name);
      const row = rows.get(key) ?? {
        key,
        name,
        results: {},
        total: 0,
        lastSeasonPosition: lastSeasonPositions.get(key) ?? null,
      };
      const points = place === null ? 0 : leaguePoints(discipline, place);
      row.name = name.trim();
      row.results[round.roundNumber] = { place, points };
      row.total += points;
      rows.set(key, row);
    }
  }

  return [...rows.values()].sort(compareRows);
}

function bestFirst(row: SeasonStandingRow): number[] {
  return Object.values(row.results)
    .map((r) => r!.points)
    .sort((a, b) => b - a);
}

function mostRecentPoints(row: SeasonStandingRow): number {
  const rounds = Object.keys(row.results).map(Number).sort((a, b) => b - a);
  for (const n of rounds) {
    if (row.results[n]!.points > 0) return row.results[n]!.points;
  }
  return 0;
}

function compareRows(a: SeasonStandingRow, b: SeasonStandingRow): number {
  if (a.total !== b.total) return b.total - a.total;
  const bestA = bestFirst(a);
  const bestB = bestFirst(b);
  for (let i = 0; i < Math.max(bestA.length, bestB.length); i++) {
    const diff = (bestB[i] ?? 0) - (bestA[i] ?? 0);
    if (diff !== 0) return diff;
  }
  const recent = mostRecentPoints(b) - mostRecentPoints(a);
  if (recent !== 0) return recent;
  const lastA = a.lastSeasonPosition ?? Infinity;
  const lastB = b.lastSeasonPosition ?? Infinity;
  if (lastA !== lastB) return lastA - lastB;
  return a.name.localeCompare(b.name);
}

/** Final positions by team key, for next season's tiebreak and seeding. */
export function standingsPositions(rows: SeasonStandingRow[]): Map<string, number> {
  return new Map(rows.map((row, i) => [row.key, i + 1]));
}

/**
 * Team names in seeding order for a new round: this season's standings from
 * the earlier rounds, with last season's teams that have not raced yet
 * ranked in by the same rules (0 points, then last season's position). For
 * R1 that is simply last season's final table.
 */
export function seedingOrder(
  roundNumber: number,
  seasonRounds: StandingsRound[],
  lastSeasonRounds: StandingsRound[],
  discipline: DisciplineKey
): string[] {
  const lastSeason = computeSeasonStandings(lastSeasonRounds, discipline);
  const lastPositions = standingsPositions(lastSeason);
  const earlier = seasonRounds.filter((r) => r.round && r.round.roundNumber < roundNumber);
  const rows = computeSeasonStandings(earlier, discipline, lastPositions);

  const seen = new Set(rows.map((r) => r.key));
  for (const row of lastSeason) {
    if (seen.has(row.key)) continue;
    rows.push({
      key: row.key,
      name: row.name,
      results: {},
      total: 0,
      lastSeasonPosition: lastPositions.get(row.key)!,
    });
  }
  return rows.sort(compareRows).map((r) => r.name);
}
