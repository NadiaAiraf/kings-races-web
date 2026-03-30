import { useMemo } from 'react';
import { useDisciplineState } from './useDisciplineState';
import { useFinalsState } from './useFinalsState';
import type { DisciplineKey, Team, Score } from '../domain/types';
import type { FinalResult } from '../domain/csvExport';

/**
 * Parse a placement label like "1st/2nd" into [1, 2].
 * Handles ordinals from 1st through 32nd.
 */
function parsePlacementLabel(label: string): [number, number] {
  const parts = label.match(/(\d+)\w+\s*\/\s*(\d+)\w+/);
  if (!parts) return [0, 0];
  return [parseInt(parts[1], 10), parseInt(parts[2], 10)];
}

/**
 * Format a number as an ordinal string: 1 -> "1st", 2 -> "2nd", etc.
 */
function formatOrdinal(n: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const mod10 = n % 10;
  const mod100 = n % 100;
  // 11th, 12th, 13th are exceptions
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${suffixes[mod10] ?? 'th'}`;
}

/**
 * Pure function: derive final placement results from scored finals matchups.
 *
 * No hooks, no store access -- pure data in, data out.
 * Used by both `useFinalResults` hook and the export handler.
 */
export function computeFinalResults(
  finalsWithNames: ReadonlyArray<{
    label: string;
    homeSlot: number | null;
    awaySlot: number | null;
    score: Score | null;
  }>,
  teams: ReadonlyArray<Team>,
  finalsPhase: string
): FinalResult[] | null {
  if (finalsPhase !== 'all-scored') return null;

  const teamMap = new Map(teams.map((t) => [t.slot, t.name]));
  const results: FinalResult[] = [];

  for (const matchup of finalsWithNames) {
    if (!matchup.score || matchup.homeSlot === null || matchup.awaySlot === null) continue;

    const [winnerPos, loserPos] = parsePlacementLabel(matchup.label);

    const winnerSlot =
      matchup.score.homeOutcome === 'win' ? matchup.homeSlot : matchup.awaySlot;
    const loserSlot =
      matchup.score.homeOutcome === 'win' ? matchup.awaySlot : matchup.homeSlot;

    results.push({
      position: winnerPos,
      teamName: teamMap.get(winnerSlot) ?? `Team ${winnerSlot}`,
      placementLabel: formatOrdinal(winnerPos),
    });
    results.push({
      position: loserPos,
      teamName: teamMap.get(loserSlot) ?? `Team ${loserSlot}`,
      placementLabel: formatOrdinal(loserPos),
    });
  }

  return results.sort((a, b) => a.position - b.position);
}

/**
 * Hook that derives final placement results from scored finals matchups.
 * Returns null if finals are not yet all scored.
 */
export function useFinalResults(discipline: DisciplineKey): FinalResult[] | null {
  const finalsState = useFinalsState(discipline);
  const { teams } = useDisciplineState(discipline);

  return useMemo(() => {
    if (!finalsState) return null;
    return computeFinalResults(finalsState.finalsWithNames, teams, finalsState.finalsPhase);
  }, [finalsState, teams]);
}
