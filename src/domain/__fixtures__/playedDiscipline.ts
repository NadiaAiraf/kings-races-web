// Test fixture: a whole discipline played out with the real cheat sheets.
import type { DisciplineState, Score, TeamStanding } from '../types';
import { assignSlots } from '../assignSlots';
import { getCheatSheet } from '../cheatSheets';
import { calculateAllGroupStandings } from '../groupCalculations';
import { calculateGroupStandings } from '../scoring';
import { resolveR2GroupTeams } from '../r2Seeding';
import { resolveAllFinalsMatchups } from '../finalsSeeding';
import { NO_TIEBREAKS } from '../../hooks/groupOrder';

const homeWins = (raceId: string, homeSlot: number, awaySlot: number): Score => ({
  raceId,
  homeSlot,
  awaySlot,
  homeOutcome: 'win',
  awayOutcome: 'loss',
});

/** A complete discipline of `count` teams where the home team wins every race. */
export function playedDiscipline(count: number, overrides: Partial<DisciplineState> = {}): DisciplineState {
  const teams = assignSlots(Array.from({ length: count }, (_, i) => `Team ${i + 1}`));
  const structure = getCheatSheet(count);
  const scores: Score[] = structure.roundOneRaces.map((r) =>
    homeWins(`r1-${r.raceNum}`, r.homeSlot, r.awaySlot)
  );

  const r1Standings = calculateAllGroupStandings(scores, structure.groups);
  let r2Standings: Record<string, TeamStanding[]> | null = null;
  if (structure.roundTwoGroups?.length) {
    r2Standings = {};
    for (const group of structure.roundTwoGroups) {
      const slots = resolveR2GroupTeams(group, r1Standings, NO_TIEBREAKS);
      const groupScores = group.races.map((race) =>
        homeWins(
          `r2-${group.groupNum}-${race.raceNum}`,
          slots[race.homeLetter]!,
          slots[race.awayLetter]!
        )
      );
      scores.push(...groupScores);
      const groupSlots = Object.values(slots).filter((s): s is number => s !== null);
      r2Standings[group.groupNum] = calculateGroupStandings(groupScores, groupSlots);
    }
  }

  resolveAllFinalsMatchups(structure, r2Standings, r1Standings, NO_TIEBREAKS).forEach((m, i) =>
    scores.push(homeWins(`fin-${i}`, m.homeSlot!, m.awaySlot!))
  );

  return {
    teams,
    teamCount: count,
    phase: 'complete',
    scores,
    manualTiebreaks: {},
    placings: {},
    ...overrides,
  };
}
