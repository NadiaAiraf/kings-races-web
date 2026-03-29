import type {
  Score,
  TeamStanding,
  TournamentStructure,
  RoundTwoGroupDefinition,
  RoundTwoSeeding,
} from './types';

/**
 * Parse an R2 seeding label like "Winner A", "Runner Up B", "Third A", "Loser A",
 * "2nd A", "3rd  A" (double space), "Winner f" (lowercase).
 *
 * Returns { position, groupLetter } where position is 0-indexed
 * (0 = 1st, 1 = 2nd, etc.) and -1 means "last".
 */
function parseSeedingLabel(label: string): { position: number; groupLetter: string } | null {
  // Normalize: trim, collapse multiple spaces to one
  const normalized = label.trim().replace(/\s+/g, ' ');

  // Pattern: "{PositionWord} {GroupLetter}"
  const match = normalized.match(/^(.+)\s+([A-Za-z])$/);
  if (!match) return null;

  const positionWord = match[1].toLowerCase();
  const groupLetter = match[2].toUpperCase();

  let position: number;
  switch (positionWord) {
    case 'winner':
      position = 0;
      break;
    case 'runner up':
    case '2nd':
      position = 1;
      break;
    case 'third':
    case '3rd':
      position = 2;
      break;
    case '4th':
      position = 3;
      break;
    case 'loser':
    case 'last':
      position = -1; // sentinel: means last in group
      break;
    default:
      return null;
  }

  return { position, groupLetter };
}

/**
 * Resolve a single R2 seeding entry to a team slot number.
 *
 * @param entry - The RoundTwoSeeding entry from the cheat sheet
 * @param r1Standings - R1 group standings keyed by group letter (A, B, C, ...)
 * @param manualTiebreaks - Optional manual tiebreak orderings keyed by group letter
 * @returns The resolved team slot number, or null if unresolvable
 */
export function resolveR2TeamSlot(
  entry: RoundTwoSeeding,
  r1Standings: Record<string, TeamStanding[]>,
  manualTiebreaks: Record<string, number[]>
): number | null {
  const parsed = parseSeedingLabel(entry.label);
  if (!parsed) return null;

  const { position, groupLetter } = parsed;
  const standings = r1Standings[groupLetter];
  if (!standings || standings.length === 0) return null;

  // If manual tiebreak exists, reorder standings to match that slot order
  let orderedStandings: TeamStanding[];
  if (manualTiebreaks[groupLetter]) {
    const tiebreakOrder = manualTiebreaks[groupLetter];
    orderedStandings = tiebreakOrder
      .map((slot) => standings.find((s) => s.slot === slot))
      .filter((s): s is TeamStanding => s != null);
  } else {
    orderedStandings = standings;
  }

  // Resolve position
  const index = position === -1 ? orderedStandings.length - 1 : position;
  if (index < 0 || index >= orderedStandings.length) return null;

  return orderedStandings[index].slot;
}

/**
 * Resolve all seeding entries in an R2 group to team slot numbers.
 *
 * @returns Record mapping R2 letter (A, B, C, D...) to slot number (or null)
 */
export function resolveR2GroupTeams(
  r2Group: RoundTwoGroupDefinition,
  r1Standings: Record<string, TeamStanding[]>,
  manualTiebreaks: Record<string, number[]>
): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const entry of r2Group.seedingEntries) {
    result[entry.letter] = resolveR2TeamSlot(entry, r1Standings, manualTiebreaks);
  }
  return result;
}

/**
 * Check if all R1 races have been scored.
 */
export function areAllR1RacesScored(
  scores: Score[],
  structure: TournamentStructure
): boolean {
  const scoredIds = new Set(scores.map((s) => s.raceId));
  return structure.roundOneRaces.every((race) => scoredIds.has(`r1-${race.raceNum}`));
}

/**
 * Check if all R2 races have been scored.
 * Returns true if structure has no roundTwoGroups (R1-only events).
 */
export function areAllR2RacesScored(
  scores: Score[],
  structure: TournamentStructure
): boolean {
  if (!structure.roundTwoGroups || structure.roundTwoGroups.length === 0) {
    return true;
  }
  const scoredIds = new Set(scores.map((s) => s.raceId));
  return structure.roundTwoGroups.every((group) =>
    group.races.every((race) => scoredIds.has(`r2-${group.groupNum}-${race.raceNum}`))
  );
}
