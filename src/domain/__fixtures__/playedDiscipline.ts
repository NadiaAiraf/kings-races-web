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
    notes: {},
    ...overrides,
  };
}

/**
 * Give `count` teams slots the cheat sheet does not know, so nothing can
 * place them: stands in for a gap an official has to fill by hand.
 */
export function withUnplaceableTeams(state: DisciplineState, count: number): DisciplineState {
  const teams = state.teams.map((t, i) => (i < count ? { ...t, slot: 900 + i } : t));
  return { ...state, teams };
}

/**
 * A discipline of `count` teams ended after its first `racesRun` races (e.g.
 * abandoned for weather mid round two): phase 'complete', no finals raced,
 * places as the officials entered them.
 */
export function stoppedEarlyDiscipline(
  count: number,
  racesRun: number,
  placings: Record<number, number> = {}
): DisciplineState {
  const played = playedDiscipline(count);
  return { ...played, scores: played.scores.slice(0, racesRun), placings };
}

/**
 * Joint places as hand-decided for a 19-team round stopped mid round two:
 * six teams on 1st, six on 7th, seven on 13th, in slot order.
 */
export function jointPlacings19(state: DisciplineState): Record<number, number> {
  return Object.fromEntries(
    state.teams.map((t, i) => [t.slot, i < 6 ? 1 : i < 12 ? 7 : 13])
  );
}
