import { useMemo } from 'react';
import { useDisciplineState } from './useDisciplineState';
import { calculateAllGroupStandings } from '../domain/groupCalculations';
import { hasTies } from '../domain/scoring';
import type { DisciplineKey } from '../domain/types';

export function useStandings(discipline: DisciplineKey) {
  const { scores, teamCount, teams, structure } = useDisciplineState(discipline);

  return useMemo(() => {
    if (!structure) return null;

    const standings = calculateAllGroupStandings(scores, structure.groups);
    const tiesByGroup: Record<string, boolean> = {};

    for (const [letter, groupStandings] of Object.entries(standings)) {
      tiesByGroup[letter] = hasTies(groupStandings);
    }

    return { standings, tiesByGroup, groups: structure.groups, teams };
  }, [scores, teamCount, teams, structure]);
}
