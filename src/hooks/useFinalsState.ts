import { useMemo } from 'react';
import { useDisciplineState } from './useDisciplineState';
import { useStandings } from './useStandings';
import { useR2State } from './useR2State';
import { areAllR1RacesScored } from '../domain/r2Seeding';
import { resolveAllFinalsMatchups, areAllFinalsScored } from '../domain/finalsSeeding';
import type { DisciplineKey, Score } from '../domain/types';
import type { ResolvedFinalsMatchup } from '../domain/finalsSeeding';

export type FinalsPhase = 'blocked-incomplete' | 'blocked-ties' | 'ready' | 'confirmed' | 'all-scored';

export interface ResolvedFinalsMatchupWithNames extends ResolvedFinalsMatchup {
  index: number;
  raceId: string;
  homeTeamName: string;
  awayTeamName: string;
  score: Score | null;
}

export function useFinalsState(discipline: DisciplineKey) {
  const { scores, teams, structure, phase, manualTiebreaks } = useDisciplineState(discipline);
  const r1StandingsResult = useStandings(discipline);
  const r2State = useR2State(discipline);

  return useMemo(() => {
    if (!structure) return null;

    const hasR2 = !!structure.roundTwoGroups && structure.roundTwoGroups.length > 0;
    const allR1Scored = areAllR1RacesScored(scores, structure);
    const allR2Scored = hasR2 ? (r2State?.allR2Scored ?? false) : true;
    const allGroupStageScored = allR1Scored && allR2Scored;

    // Check for ties in relevant standings
    const r1Standings = r1StandingsResult?.standings ?? {};
    const r1Ties = r1StandingsResult?.tiesByGroup ?? {};
    const r2Standings = r2State?.r2Standings ?? null;
    const r2Ties = r2State?.r2TiesByGroup ?? {};

    // Per D-02: if any ties exist in the relevant round, block finals
    const hasAnyR1Ties = Object.values(r1Ties).some((t) => t);
    const hasAnyR2Ties = Object.values(r2Ties).some((t) => t);
    const hasTiesBlocking = hasR2 ? hasAnyR2Ties : hasAnyR1Ties;

    // Determine finals phase state
    let finalsPhase: FinalsPhase;
    if (phase === 'finals' || phase === 'complete') {
      // Already confirmed
      const allFinalsScored = areAllFinalsScored(structure.finals, scores);
      finalsPhase = allFinalsScored ? 'all-scored' : 'confirmed';
    } else if (!allGroupStageScored) {
      finalsPhase = 'blocked-incomplete';
    } else if (hasTiesBlocking) {
      finalsPhase = 'blocked-ties';
    } else {
      finalsPhase = 'ready';
    }

    // Resolve matchups (only meaningful when ready or confirmed)
    const standingsForResolution = hasR2 ? r2Standings : null;
    const resolvedMatchups = resolveAllFinalsMatchups(
      structure,
      standingsForResolution,
      r1Standings,
      manualTiebreaks
    );

    // Team name lookup
    const teamMap = new Map(teams.map((t) => [t.slot, t.name]));

    const finalsWithNames: ResolvedFinalsMatchupWithNames[] = resolvedMatchups.map((m, index) => ({
      ...m,
      index,
      raceId: `fin-${index}`,
      homeTeamName: m.homeSlot ? (teamMap.get(m.homeSlot) ?? `Team ${m.homeSlot}`) : 'TBD',
      awayTeamName: m.awaySlot ? (teamMap.get(m.awaySlot) ?? `Team ${m.awaySlot}`) : 'TBD',
      score: scores.find((s) => s.raceId === `fin-${index}`) ?? null,
    }));

    // Current unscored finals match
    const currentFinalsIndex = finalsWithNames.findIndex((m) => !m.score);
    const totalFinals = finalsWithNames.length;
    const scoredFinals = finalsWithNames.filter((m) => m.score).length;

    return {
      finalsPhase,
      finalsWithNames,
      currentFinalsIndex,
      totalFinals,
      scoredFinals,
      hasR2,
    };
  }, [scores, teams, structure, phase, manualTiebreaks, r1StandingsResult, r2State]);
}
