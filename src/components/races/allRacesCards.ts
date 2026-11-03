// Card data for the All races view, shared by the per-discipline sections and
// the interleaved list of a non-standard race order.
import { getCheatSheet } from '../../domain/cheatSheets';
import type { R2State } from '../../hooks/useR2State';
import type { DisciplineState, Score } from '../../domain/types';

export interface CardSpec {
  raceId: string;
  raceNum: number;
  homeTeamName: string;
  awayTeamName: string;
  homeSlot: number;
  awaySlot: number;
  score: Score | undefined;
  groupLabel?: string;
  matchupLabel?: string;
  seedingContext?: string;
  isFinalMatch?: boolean;
  allowNotRun?: boolean;
}

/** Round 1 cards of a discipline with a race schedule, in cheat sheet order. */
export function roundOneCardSpecs(state: DisciplineState): CardSpec[] {
  const names = new Map(state.teams.map((t) => [t.slot, t.name]));
  const scores = new Map(state.scores.map((s) => [s.raceId, s]));
  return getCheatSheet(state.teamCount).roundOneRaces.map((race) => {
    const raceId = `r1-${race.raceNum}`;
    return {
      raceId,
      raceNum: race.raceNum,
      homeTeamName: names.get(race.homeSlot) ?? `Team ${race.homeSlot}`,
      awayTeamName: names.get(race.awaySlot) ?? `Team ${race.awaySlot}`,
      homeSlot: race.homeSlot,
      awaySlot: race.awaySlot,
      score: scores.get(raceId),
    };
  });
}

/** Round 2 cards in running order. */
export function roundTwoCardSpecs(r2State: R2State): CardSpec[] {
  return r2State.r2Races.map((race) => ({
    raceId: race.raceId,
    raceNum: race.raceNum,
    homeTeamName: race.homeTeamName,
    awayTeamName: race.awayTeamName,
    homeSlot: race.homeSlot ?? 0,
    awaySlot: race.awaySlot ?? 0,
    score: r2State.r2ScoreMap.get(race.raceId),
    groupLabel: `Group ${race.groupNum}`,
    allowNotRun: true,
  }));
}

/** Whether a discipline's Round 2 cards are shown: its format has Round 2 and it has started. */
export function hasRoundTwoStarted(state: DisciplineState, r2State: R2State | null): r2State is R2State {
  if (state.teamCount < 4 || !getCheatSheet(state.teamCount).roundTwoGroups?.length) return false;
  const started = state.phase === 'round-two' || (r2State?.scoredR2Races ?? 0) > 0;
  return started && r2State !== null;
}
