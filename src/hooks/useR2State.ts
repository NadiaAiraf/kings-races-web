import { useMemo } from 'react';
import { useDisciplineState } from './useDisciplineState';
import { useStandings } from './useStandings';
import { resolveR2GroupTeams } from '../domain/r2Seeding';
import { calculateGroupStandings, hasTies } from '../domain/scoring';
import type { DisciplineKey, TeamStanding, RoundTwoGroupDefinition } from '../domain/types';

export interface R2ResolvedGroup extends RoundTwoGroupDefinition {
  resolvedTeams: Record<string, number | null>;
}

export interface R2Race {
  groupNum: string;
  raceNum: number;
  raceId: string;
  homeSlot: number | null;
  awaySlot: number | null;
  homeTeamName: string;
  awayTeamName: string;
  homeLetter: string;
  awayLetter: string;
}

export interface R2State {
  r2Groups: R2ResolvedGroup[];
  r2Races: R2Race[];
  r2ScoreMap: Map<string, import('../domain/types').Score>;
  r2Standings: Record<string, TeamStanding[]>;
  r2TiesByGroup: Record<string, boolean>;
  totalR2Races: number;
  scoredR2Races: number;
  allR2Scored: boolean;
  currentR2Race: R2Race | null;
  currentR2Index: number;
}

export function useR2State(discipline: DisciplineKey): R2State | null {
  const { scores, teams, structure, manualTiebreaks } = useDisciplineState(discipline);
  const r1StandingsResult = useStandings(discipline);

  return useMemo(() => {
    if (!structure || !structure.roundTwoGroups || !r1StandingsResult) {
      return null;
    }

    const r1Standings = r1StandingsResult.standings;

    // Resolve R2 teams from R1 standings
    const r2Groups: R2ResolvedGroup[] = structure.roundTwoGroups.map((group) => {
      const letterToSlot = resolveR2GroupTeams(group, r1Standings, manualTiebreaks);
      return { ...group, resolvedTeams: letterToSlot };
    });

    // Build team name lookup
    const teamMap = new Map(teams.map((t) => [t.slot, t.name]));

    // Build R2 races with resolved slot numbers
    const r2Races: R2Race[] = [];

    for (const group of r2Groups) {
      for (const race of group.races) {
        const homeSlot = group.resolvedTeams[race.homeLetter] ?? null;
        const awaySlot = group.resolvedTeams[race.awayLetter] ?? null;
        r2Races.push({
          groupNum: group.groupNum,
          raceNum: race.raceNum,
          raceId: `r2-${group.groupNum}-${race.raceNum}`,
          homeSlot,
          awaySlot,
          homeTeamName: homeSlot ? (teamMap.get(homeSlot) ?? `Team ${homeSlot}`) : 'TBD',
          awayTeamName: awaySlot ? (teamMap.get(awaySlot) ?? `Team ${awaySlot}`) : 'TBD',
          homeLetter: race.homeLetter,
          awayLetter: race.awayLetter,
        });
      }
    }

    // R2 score lookup
    const r2ScoreMap = new Map(
      scores.filter((s) => s.raceId.startsWith('r2-')).map((s) => [s.raceId, s])
    );

    // R2 standings per group
    const r2Standings: Record<string, TeamStanding[]> = {};
    for (const group of r2Groups) {
      const resolvedSlots = Object.values(group.resolvedTeams).filter(
        (s): s is number => s !== null
      );
      const r2Scores = scores.filter((s) =>
        s.raceId.startsWith(`r2-${group.groupNum}-`)
      );
      r2Standings[group.groupNum] = calculateGroupStandings(r2Scores, resolvedSlots);
    }

    // R2 completion
    const totalR2Races = r2Races.length;
    const scoredR2Races = r2Races.filter((r) => r2ScoreMap.has(r.raceId)).length;
    const allR2Scored = totalR2Races > 0 && scoredR2Races === totalR2Races;

    // Current unscored R2 race
    const currentR2Index = r2Races.findIndex((r) => !r2ScoreMap.has(r.raceId));
    const currentR2Race = currentR2Index >= 0 ? r2Races[currentR2Index] : null;

    // R2 ties
    const r2TiesByGroup: Record<string, boolean> = {};
    for (const [groupNum, standings] of Object.entries(r2Standings)) {
      r2TiesByGroup[groupNum] = hasTies(standings);
    }

    return {
      r2Groups,
      r2Races,
      r2ScoreMap,
      r2Standings,
      r2TiesByGroup,
      totalR2Races,
      scoredR2Races,
      allR2Scored,
      currentR2Race,
      currentR2Index,
    };
  }, [scores, teams, structure, manualTiebreaks, r1StandingsResult]);
}
