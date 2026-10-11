import type { DisciplineState, Score, TeamStanding, TournamentStructure } from './types';
import type { ResolvedFinalsMatchup } from './finalsSeeding';
import { calculateAllGroupStandings } from './groupCalculations';
import { calculateGroupStandings } from './scoring';
import { getCheatSheet } from './cheatSheets';
import { resolveAllFinalsMatchups, areAllFinalsScored } from './finalsSeeding';
import { resolveR2GroupTeams } from './r2Seeding';
import { NO_TIEBREAKS, orderStandings, r2TiebreakKey } from '../hooks/groupOrder';

export interface CompletedDiscipline {
  structure: TournamentStructure;
  /** R1 standings with any valid manual order applied. */
  r1Standings: Record<string, TeamStanding[]>;
  /** R2 standings with any valid manual order applied, or null without R2. */
  r2Standings: Record<string, TeamStanding[]> | null;
  finals: Array<ResolvedFinalsMatchup & { score: Score | null }>;
}

/**
 * Standings and finals of a finished discipline from raw state (no hooks).
 * Replicates the logic of useStandings + useR2State + useFinalsState.
 * Null until the discipline is complete with every final scored.
 */
export function resolveCompletedDiscipline(
  disciplineState: DisciplineState
): CompletedDiscipline | null {
  if (disciplineState.phase !== 'complete') return null;
  if (disciplineState.teamCount < 4) return null;

  const structure = getCheatSheet(disciplineState.teamCount);
  if (!structure) return null;

  // Build R1 standings (filter to r1-* scores only)
  const r1Scores = disciplineState.scores.filter((s) => s.raceId.startsWith('r1-'));
  // Apply any valid manual order so resolved ties feed R2 and finals.
  const tiebreaks = disciplineState.manualTiebreaks;
  const r1Standings = Object.fromEntries(
    Object.entries(calculateAllGroupStandings(r1Scores, structure.groups)).map(
      ([letter, standings]) => [letter, orderStandings(standings, tiebreaks[letter])]
    )
  );

  // Build R2 standings if applicable
  let r2Standings: Record<string, TeamStanding[]> | null = null;
  if (structure.roundTwoGroups && structure.roundTwoGroups.length > 0) {
    r2Standings = {};
    for (const r2Group of structure.roundTwoGroups) {
      // Resolve R2 group teams from R1 standings
      const r2Scores = disciplineState.scores.filter((s) =>
        s.raceId.startsWith(`r2-${r2Group.groupNum}-`)
      );
      // Seed from the labels, as useR2State does: some sheets (24 and 25
      // teams) have no positionCode.
      const teamSlots = Object.values(
        resolveR2GroupTeams(r2Group, r1Standings, NO_TIEBREAKS)
      ).filter((slot): slot is number => slot !== null);
      r2Standings[r2Group.groupNum] = orderStandings(
        calculateGroupStandings(r2Scores, teamSlots),
        tiebreaks[r2TiebreakKey(r2Group.groupNum)]
      );
    }
  }

  // Check if all finals are scored
  if (!areAllFinalsScored(structure.finals, disciplineState.scores)) return null;

  // Resolve finals matchups
  const resolvedMatchups = resolveAllFinalsMatchups(
    structure,
    r2Standings,
    r1Standings,
    NO_TIEBREAKS
  );
  const finals = resolvedMatchups.map((m, index) => ({
    ...m,
    score: disciplineState.scores.find((s) => s.raceId === `fin-${index}`) ?? null,
  }));

  return { structure, r1Standings, r2Standings, finals };
}
