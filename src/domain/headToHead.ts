import type { Score, TeamStanding } from './types';

/** Why a two-team tie was ordered the way it was. */
export interface HeadToHeadNote {
  winnerSlot: number;
  loserSlot: number;
  /** The race number officials see on the race list. */
  raceNum: number;
}

export interface HeadToHeadDefault {
  order: TeamStanding[];
  notes: HeadToHeadNote[];
}

/**
 * The winner of the race between slots a and b, or null when no race between
 * them has exactly one winner (unscored, not run, both disqualified).
 */
export function headToHeadWinner(
  scores: Score[],
  a: number,
  b: number
): { winnerSlot: number; loserSlot: number; raceId: string } | null {
  for (const s of scores) {
    const isPair =
      (s.homeSlot === a && s.awaySlot === b) || (s.homeSlot === b && s.awaySlot === a);
    if (!isPair) continue;
    const homeWon = s.homeOutcome === 'win';
    const awayWon = s.awayOutcome === 'win';
    if (homeWon === awayWon) continue;
    return homeWon
      ? { winnerSlot: s.homeSlot, loserSlot: s.awaySlot, raceId: s.raceId }
      : { winnerSlot: s.awaySlot, loserSlot: s.homeSlot, raceId: s.raceId };
  }
  return null;
}

/** Fallback race number: the last `-` segment of the race id. */
function raceNumFromId(raceId: string): number {
  return Number(raceId.slice(raceId.lastIndexOf('-') + 1));
}

/**
 * Suggested order for a group sorted by points: every points level shared by
 * exactly two teams puts the head-to-head winner first. Levels of three or
 * more teams, and pairs with no decisive race, keep their order.
 */
export function headToHeadDefault(
  standings: TeamStanding[],
  scores: Score[],
  raceNumOf?: (raceId: string) => number | undefined
): HeadToHeadDefault {
  const order = [...standings];
  const notes: HeadToHeadNote[] = [];

  let start = 0;
  while (start < order.length) {
    let end = start + 1;
    while (end < order.length && order[end].points === order[start].points) end++;

    if (end - start === 2) {
      const result = headToHeadWinner(scores, order[start].slot, order[start + 1].slot);
      if (result) {
        if (order[start].slot !== result.winnerSlot) {
          [order[start], order[start + 1]] = [order[start + 1], order[start]];
        }
        notes.push({
          winnerSlot: result.winnerSlot,
          loserSlot: result.loserSlot,
          raceNum: raceNumOf?.(result.raceId) ?? raceNumFromId(result.raceId),
        });
      }
    }
    start = end;
  }

  return { order, notes };
}
