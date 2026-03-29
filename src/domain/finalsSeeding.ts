import type {
  FinalsMatchup,
  Score,
  TeamStanding,
  TournamentStructure,
} from './types';

/**
 * Position mapping for finals refs.
 * Returns 0-indexed position or -1 for "last".
 */
function parsePositionWord(word: string): number | null {
  switch (word) {
    case 'winner':
      return 0;
    case '2nd':
    case 'second':
    case 'runner up':
      return 1;
    case '3rd':
    case 'third':
      return 2;
    case '4th':
      return 3;
    case '5th':
      return 4;
    case 'loser':
    case 'last':
      return -1;
    default:
      return null;
  }
}

/**
 * Resolve a finals ref string like "Winner Group I", "2nd Group A", "Runner up I"
 * to a team slot number.
 *
 * Three patterns are supported:
 * 1. R1-only: "{Position} Group {Letter}" e.g., "Winner Group A", "2nd Group A"
 * 2. R2: "{Position} Group {RomanNumeral}" e.g., "Winner Group I", "Second Group II"
 * 3. Anomalous (teams7): "{Position} {RomanNumeral}" e.g., "Winner I", "Runner up I"
 *
 * @param ref - The homeRef or awayRef string from a FinalsMatchup
 * @param r2Standings - R2 group standings keyed by group num (I, II, III, ...) or null for R1-only events
 * @param r1Standings - R1 group standings keyed by group letter (A, B, C, ...)
 * @param manualTiebreaks - Optional tiebreak orderings
 * @returns The resolved team slot number, or null if unresolvable
 */
export function resolveFinalsRef(
  ref: string,
  r2Standings: Record<string, TeamStanding[]> | null,
  r1Standings: Record<string, TeamStanding[]>,
  manualTiebreaks: Record<string, number[]>
): number | null {
  const normalized = ref.trim();

  // Try "Group" patterns first. Roman numerals (I, V, X) overlap with single letters,
  // so we match the group identifier and check if it's a known R2 group key or R1 group letter.
  const groupMatch = normalized.match(/^(.+)\s+Group\s+([A-Z][IVX]*)$/);
  if (groupMatch) {
    const posWord = groupMatch[1].toLowerCase();
    const groupId = groupMatch[2];
    const position = parsePositionWord(posWord);
    if (position === null) return null;

    // If groupId is a roman numeral pattern and R2 standings exist, treat as R2 ref
    const isRomanNumeral = /^[IVX]+$/.test(groupId);
    if (isRomanNumeral && r2Standings && r2Standings[groupId]) {
      return lookupStanding(r2Standings[groupId], position, manualTiebreaks[`r2-${groupId}`]);
    }

    // Otherwise treat as R1 ref (single group letter like A, B, C, D)
    if (r1Standings[groupId]) {
      return lookupStanding(r1Standings[groupId], position, manualTiebreaks[groupId]);
    }

    return null;
  }

  // Pattern 3: Anomalous refs (teams7 only) -- "{Position} {RomanNumeral}" (no "Group" word)
  // e.g., "Winner I", "Runner up I"
  const anomalyMatch = normalized.match(/^(.+)\s+([IVX]+)$/);
  if (anomalyMatch && r2Standings) {
    const posWord = anomalyMatch[1].toLowerCase();
    const groupNum = anomalyMatch[2];
    const position = parsePositionWord(posWord);
    if (position === null) return null;
    return lookupStanding(r2Standings[groupNum], position, manualTiebreaks[`r2-${groupNum}`]);
  }

  return null;
}

/**
 * Look up a team slot from sorted standings at the given position.
 */
function lookupStanding(
  standings: TeamStanding[] | undefined,
  position: number,
  tiebreakOrder?: number[]
): number | null {
  if (!standings || standings.length === 0) return null;

  let ordered = standings;
  if (tiebreakOrder) {
    ordered = tiebreakOrder
      .map((slot) => standings.find((s) => s.slot === slot))
      .filter((s): s is TeamStanding => s != null);
  }

  const index = position === -1 ? ordered.length - 1 : position;
  if (index < 0 || index >= ordered.length) return null;
  return ordered[index].slot;
}

/**
 * Resolved finals matchup with actual team slot numbers.
 */
export interface ResolvedFinalsMatchup {
  label: string;
  homeRef: string;
  awayRef: string;
  homeSlot: number | null;
  awaySlot: number | null;
}

/**
 * Resolve all finals matchups in a tournament structure to actual team slots.
 */
export function resolveAllFinalsMatchups(
  structure: TournamentStructure,
  r2Standings: Record<string, TeamStanding[]> | null,
  r1Standings: Record<string, TeamStanding[]>,
  manualTiebreaks: Record<string, number[]>
): ResolvedFinalsMatchup[] {
  return structure.finals.map((matchup) => ({
    label: matchup.label,
    homeRef: matchup.homeRef,
    awayRef: matchup.awayRef,
    homeSlot: resolveFinalsRef(matchup.homeRef, r2Standings, r1Standings, manualTiebreaks),
    awaySlot: resolveFinalsRef(matchup.awayRef, r2Standings, r1Standings, manualTiebreaks),
  }));
}

/**
 * Check if all finals matchups have been scored.
 * Finals use raceId pattern "fin-{index}" where index is the position in the finals array.
 */
export function areAllFinalsScored(
  finalsMatchups: FinalsMatchup[],
  scores: Score[]
): boolean {
  const scoredIds = new Set(scores.map((s) => s.raceId));
  return finalsMatchups.every((_, i) => scoredIds.has(`fin-${i}`));
}
