import type { Score, TeamStanding } from './types';

/**
 * Tie-break races are optional extra races between teams level on points in
 * a group of three or more. Their results live in `scores` under `tb-` ids and
 * only feed the group's tiebreak box: they never change points or progress.
 */
export const TIEBREAK_RACE_PREFIX = 'tb-';

/** A race from the original group order between two teams. */
export interface Meeting {
  raceId: string;
  homeSlot: number;
  awaySlot: number;
}

/** A tie-break rerun of an original meeting, with home and away swapped. */
export interface TiebreakRace {
  raceId: string;
  originalRaceId: string;
  homeSlot: number;
  awaySlot: number;
}

export interface TiebreakRaceOutcome {
  /** False until every tie-break race has a matching result. */
  complete: boolean;
  /** Tie-break race wins by slot (only teams in tied levels). */
  wins: Record<number, number>;
  /** baseOrder with each 3+ level re-sorted by tie-break wins (stable); baseOrder until complete. */
  order: TeamStanding[];
  /** Runs of 2+ teams still level on tie-break wins, in order; empty until complete. */
  stillLevel: number[][];
}

/** Score id of the tie-break rerun of `originalRaceId` in a group. */
export function tiebreakRaceId(groupKey: string, originalRaceId: string): string {
  return `${tiebreakRacePrefix(groupKey)}${originalRaceId}`;
}

/** Every tie-break race id of a group starts with this. */
export function tiebreakRacePrefix(groupKey: string): string {
  return `${TIEBREAK_RACE_PREFIX}${groupKey}-`;
}

export function isTiebreakRaceId(raceId: string): boolean {
  return raceId.startsWith(TIEBREAK_RACE_PREFIX);
}

/** [start, end) index ranges of points levels shared by three or more teams. */
function multiTeamLevels(standings: TeamStanding[]): Array<[number, number]> {
  const levels: Array<[number, number]> = [];
  let start = 0;
  while (start < standings.length) {
    let end = start + 1;
    while (end < standings.length && standings[end].points === standings[start].points) end++;
    if (end - start >= 3) levels.push([start, end]);
    start = end;
  }
  return levels;
}

/**
 * Slots in every points level shared by three or more teams, in standings
 * order. Two-team levels are left to head-to-head.
 */
export function multiTeamTiedSlots(standings: TeamStanding[]): number[] {
  return multiTeamLevels(standings).flatMap(([start, end]) =>
    standings.slice(start, end).map((s) => s.slot)
  );
}

/** Whether two slot lists hold the same slots, in any order. */
export function sameSlotSet(a: number[] | undefined, b: number[]): boolean {
  if (!a || a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((slot) => set.has(slot));
}

/**
 * One tie-break race per original meeting between two teams in the same
 * three-plus points level, in the original race order, home and away swapped.
 */
export function buildTiebreakRaces(
  groupKey: string,
  meetings: Meeting[],
  standings: TeamStanding[]
): TiebreakRace[] {
  const levelOf = new Map<number, number>();
  multiTeamLevels(standings).forEach(([start, end], level) => {
    for (let i = start; i < end; i++) levelOf.set(standings[i].slot, level);
  });

  return meetings
    .filter((m) => {
      const home = levelOf.get(m.homeSlot);
      return home !== undefined && home === levelOf.get(m.awaySlot);
    })
    .map((m) => ({
      raceId: tiebreakRaceId(groupKey, m.raceId),
      originalRaceId: m.raceId,
      homeSlot: m.awaySlot,
      awaySlot: m.homeSlot,
    }));
}

/**
 * The order tie-break races suggest. Once every race has a result for the
 * expected teams, each three-plus points level is re-sorted by tie-break wins
 * (stable), and runs still level on wins are reported for officials to settle.
 */
export function tiebreakRaceOutcome(
  baseOrder: TeamStanding[],
  races: TiebreakRace[],
  scores: Score[]
): TiebreakRaceOutcome {
  const levels = multiTeamLevels(baseOrder);
  const wins: Record<number, number> = {};
  for (const [start, end] of levels) {
    for (let i = start; i < end; i++) wins[baseOrder[i].slot] = 0;
  }

  const byId = new Map(scores.map((s) => [s.raceId, s]));
  const matched = races.map((race) => {
    const s = byId.get(race.raceId);
    return s && s.homeSlot === race.homeSlot && s.awaySlot === race.awaySlot ? s : null;
  });
  if (matched.some((s) => s === null)) {
    return { complete: false, wins, order: [...baseOrder], stillLevel: [] };
  }

  for (const s of matched as Score[]) {
    if (s.homeOutcome === 'win' && s.homeSlot in wins) wins[s.homeSlot]++;
    if (s.awayOutcome === 'win' && s.awaySlot in wins) wins[s.awaySlot]++;
  }

  const order = [...baseOrder];
  const stillLevel: number[][] = [];
  for (const [start, end] of levels) {
    const level = order.slice(start, end).sort((a, b) => wins[b.slot] - wins[a.slot]);
    order.splice(start, end - start, ...level);

    let runStart = 0;
    while (runStart < level.length) {
      let runEnd = runStart + 1;
      while (runEnd < level.length && wins[level[runEnd].slot] === wins[level[runStart].slot]) {
        runEnd++;
      }
      if (runEnd - runStart >= 2) {
        stillLevel.push(level.slice(runStart, runEnd).map((s) => s.slot));
      }
      runStart = runEnd;
    }
  }

  return { complete: true, wins, order, stillLevel };
}
