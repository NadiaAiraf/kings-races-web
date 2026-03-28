import type { RaceMatchup, Score, GroupDefinition, TeamStanding } from './types';
import { calculateGroupStandings } from './scoring';

export function getGroupRaces(
  allRaces: RaceMatchup[],
  groupTeamSlots: number[]
): RaceMatchup[] {
  const slotSet = new Set(groupTeamSlots);
  return allRaces.filter(
    (race) => slotSet.has(race.homeSlot) && slotSet.has(race.awaySlot)
  );
}

export function calculateAllGroupStandings(
  scores: Score[],
  groups: GroupDefinition[]
): Record<string, TeamStanding[]> {
  const result: Record<string, TeamStanding[]> = {};
  for (const group of groups) {
    result[group.letter] = calculateGroupStandings(scores, group.teamSlots);
  }
  return result;
}
