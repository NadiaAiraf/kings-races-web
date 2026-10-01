import { useMemo } from 'react';
import { useDisciplineState } from './useDisciplineState';
import { calculateAllGroupStandings } from '../domain/groupCalculations';
import { hasUnresolvedTie, orderStandings } from './groupOrder';
import type { DisciplineKey, TeamStanding } from '../domain/types';

export function useStandings(discipline: DisciplineKey) {
  const { scores, teams, structure, manualTiebreaks } = useDisciplineState(discipline);

  return useMemo(() => {
    if (!structure) return null;

    const r1Scores = scores.filter((s) => s.raceId.startsWith('r1-'));
    const rawStandings = calculateAllGroupStandings(r1Scores, structure.groups);
    const standings: Record<string, TeamStanding[]> = {};
    // A group only counts as tied until an official saves a valid order.
    const tiesByGroup: Record<string, boolean> = {};

    for (const [letter, groupStandings] of Object.entries(rawStandings)) {
      standings[letter] = orderStandings(groupStandings, manualTiebreaks[letter]);
      tiesByGroup[letter] = hasUnresolvedTie(groupStandings, manualTiebreaks[letter]);
    }

    return { standings, rawStandings, tiesByGroup, groups: structure.groups, teams };
  }, [scores, teams, structure, manualTiebreaks]);
}
