import { useMemo } from 'react';
import { useDisciplineState } from './useDisciplineState';
import { useR2State } from './useR2State';
import type { DisciplineKey, RaceMatchup } from '../domain/types';

export function useCurrentRace(discipline: DisciplineKey) {
  const { scores, structure } = useDisciplineState(discipline);
  const r2State = useR2State(discipline);

  return useMemo(() => {
    if (!structure) {
      return {
        currentRace: null,
        currentIndex: -1,
        totalRaces: 0,
        allRaces: [] as RaceMatchup[],
        allR1Scored: false,
        r1Total: 0,
        r2Total: 0,
        scoredR1: 0,
        scoredR2: 0,
      };
    }

    const allRaces = structure.roundOneRaces;
    const scoredIds = new Set(scores.map((s) => s.raceId));

    const r1Total = allRaces.length;
    const scoredR1 = allRaces.filter((race) => scoredIds.has(`r1-${race.raceNum}`)).length;
    const allR1Scored = scoredR1 === r1Total;

    const currentIndex = allRaces.findIndex(
      (race) => !scoredIds.has(`r1-${race.raceNum}`)
    );

    const currentRace = currentIndex >= 0 ? allRaces[currentIndex] : null;

    // Combined R1+R2 totals for progress bar
    const r2Total = r2State ? r2State.totalR2Races : 0;
    const scoredR2 = r2State ? r2State.scoredR2Races : 0;
    const totalRaces = r1Total + r2Total;

    return {
      currentRace,
      currentIndex,
      totalRaces,
      allRaces,
      allR1Scored,
      r1Total,
      r2Total,
      scoredR1,
      scoredR2,
    };
  }, [scores, structure, r2State]);
}
