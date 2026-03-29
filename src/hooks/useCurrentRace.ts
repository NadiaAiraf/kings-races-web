import { useMemo } from 'react';
import { useDisciplineState } from './useDisciplineState';
import type { DisciplineKey, RaceMatchup } from '../domain/types';

export function useCurrentRace(discipline: DisciplineKey) {
  const { scores, structure } = useDisciplineState(discipline);

  return useMemo(() => {
    if (!structure) {
      return { currentRace: null, currentIndex: -1, totalRaces: 0, allRaces: [] as RaceMatchup[] };
    }

    const allRaces = structure.roundOneRaces;
    const scoredIds = new Set(scores.map((s) => s.raceId));

    const currentIndex = allRaces.findIndex(
      (race) => !scoredIds.has(`r1-${race.raceNum}`)
    );

    const currentRace = currentIndex >= 0 ? allRaces[currentIndex] : null;

    return {
      currentRace,
      currentIndex,
      totalRaces: allRaces.length,
      allRaces,
    };
  }, [scores, structure]);
}
