import type { Score, TeamStanding } from './types';

/** Why a two-team tie was ordered the way it was. */
export interface HeadToHeadNote {
  winnerSlot: number;
  loserSlot: number;
  /** Race numbers officials see, for every meeting between the pair that had a winner. */
  raceNums: number[];
  /** The winner's record against the loser across those races. */
  wins: number;
  losses: number;
}

export interface HeadToHeadDefault {
  order: TeamStanding[];
  notes: HeadToHeadNote[];
}

export interface HeadToHeadResult {
  winnerSlot: number;
  loserSlot: number;
  /** Every race between the pair with exactly one winner, in score order. */
  raceIds: string[];
  wins: number;
  losses: number;
}

/**
 * The team that won more of the races between slots a and b. Pairs meet more
 * than once in some formats, so a split counts as no winner. Races without
 * exactly one winner (unscored, not run, both disqualified) are ignored.
 */
export function headToHeadWinner(scores: Score[], a: number, b: number): HeadToHeadResult | null {
  let aWins = 0;
  let bWins = 0;
  const raceIds: string[] = [];
  for (const s of scores) {
    const isPair =
      (s.homeSlot === a && s.awaySlot === b) || (s.homeSlot === b && s.awaySlot === a);
    if (!isPair) continue;
    const homeWon = s.homeOutcome === 'win';
    const awayWon = s.awayOutcome === 'win';
    if (homeWon === awayWon) continue;
    const winner = homeWon ? s.homeSlot : s.awaySlot;
    if (winner === a) aWins++;
    else bWins++;
    raceIds.push(s.raceId);
  }
  if (aWins === bWins) return null;
  return aWins > bWins
    ? { winnerSlot: a, loserSlot: b, raceIds, wins: aWins, losses: bWins }
    : { winnerSlot: b, loserSlot: a, raceIds, wins: bWins, losses: aWins };
}

/** "Race 7", "Races 1 and 7", "Races 1, 5 and 9". */
function raceList(raceNums: number[]): string {
  if (raceNums.length === 1) return `Race ${raceNums[0]}`;
  return `Races ${raceNums.slice(0, -1).join(', ')} and ${raceNums[raceNums.length - 1]}`;
}

/** Why the winner of a head-to-head note was placed first, for display. */
export function headToHeadReason(note: HeadToHeadNote): string {
  const races = raceList(note.raceNums);
  if (note.raceNums.length === 1) return `won their head-to-head race (${races})`;
  if (note.losses === 0) {
    const all = note.wins === 2 ? 'both' : `all ${note.wins}`;
    return `won ${all} head-to-head races (${races})`;
  }
  return `won their head-to-head races ${note.wins}-${note.losses} (${races})`;
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
          raceNums: result.raceIds.map((id) => raceNumOf?.(id) ?? raceNumFromId(id)),
          wins: result.wins,
          losses: result.losses,
        });
      }
    }
    start = end;
  }

  return { order, notes };
}
