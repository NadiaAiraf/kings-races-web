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

/**
 * Why a three- or four-team tie was ordered the way it was. The seeded rule:
 * the two highest seeds' race decides the top two places of the tie; in a
 * four-way tie the two lowest seeds' race decides the bottom two, and in a
 * three-way tie the lowest seed takes the bottom place outright.
 */
export interface SeededTieNote {
  /** The tied slots in suggested order. */
  slots: number[];
  /** The group place the first of them takes (1 = top of the group). */
  firstPlace: number;
  /** The race between the two highest seeds. */
  top: HeadToHeadNote;
  /** Four-way ties: the race between the two lowest seeds. */
  bottom?: HeadToHeadNote;
  /** Three-way ties: the lowest seed, placed last without a race. */
  lowestSeedSlot?: number;
}

export interface HeadToHeadDefault {
  order: TeamStanding[];
  notes: HeadToHeadNote[];
  /** Present when the caller passed seeds. */
  seeded?: SeededTieNote[];
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

/** A team's entry seed (1 = top seed) from the cheat sheet's seed map. */
export function seedOfSlot(seedMap: number[]): (slot: number) => number | undefined {
  return (slot) => {
    const i = seedMap.indexOf(slot);
    return i < 0 ? undefined : i + 1;
  };
}

/**
 * Suggested order for a group sorted by points: every points level shared by
 * exactly two teams puts the head-to-head winner first. When seeds are given,
 * levels of three or four teams follow the seeded rule (see SeededTieNote).
 * Larger levels, and levels whose deciding races have no winner, keep their
 * order.
 */
export function headToHeadDefault(
  standings: TeamStanding[],
  scores: Score[],
  raceNumOf?: (raceId: string) => number | undefined,
  seedOf?: (slot: number) => number | undefined
): HeadToHeadDefault {
  const order = [...standings];
  const notes: HeadToHeadNote[] = [];
  const seeded: SeededTieNote[] = [];
  const toNote = (result: HeadToHeadResult): HeadToHeadNote => ({
    winnerSlot: result.winnerSlot,
    loserSlot: result.loserSlot,
    raceNums: result.raceIds.map((id) => raceNumOf?.(id) ?? raceNumFromId(id)),
    wins: result.wins,
    losses: result.losses,
  });

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
        notes.push(toNote(result));
      }
    } else if (seedOf && (end - start === 3 || end - start === 4)) {
      const note = seededTie(order.slice(start, end), scores, seedOf, toNote);
      if (note) {
        const bySlot = new Map(order.map((t) => [t.slot, t]));
        note.slots.forEach((slot, i) => (order[start + i] = bySlot.get(slot)!));
        seeded.push({ ...note, firstPlace: start + 1 });
      }
    }
    start = end;
  }

  return seedOf ? { order, notes, seeded } : { order, notes };
}

/** The seeded rule for one level of three or four teams, or null if a deciding race has no winner. */
function seededTie(
  level: TeamStanding[],
  scores: Score[],
  seedOf: (slot: number) => number | undefined,
  toNote: (result: HeadToHeadResult) => HeadToHeadNote
): Omit<SeededTieNote, 'firstPlace'> | null {
  const seeds = level.map((t) => seedOf(t.slot));
  if (seeds.some((s) => s === undefined)) return null;
  const bySeed = level
    .map((t, i) => ({ slot: t.slot, seed: seeds[i]! }))
    .sort((a, b) => a.seed - b.seed)
    .map((t) => t.slot);

  const top = headToHeadWinner(scores, bySeed[0], bySeed[1]);
  if (!top) return null;
  if (bySeed.length === 3) {
    return {
      slots: [top.winnerSlot, top.loserSlot, bySeed[2]],
      top: toNote(top),
      lowestSeedSlot: bySeed[2],
    };
  }
  const bottom = headToHeadWinner(scores, bySeed[2], bySeed[3]);
  if (!bottom) return null;
  return {
    slots: [top.winnerSlot, top.loserSlot, bottom.winnerSlot, bottom.loserSlot],
    top: toNote(top),
    bottom: toNote(bottom),
  };
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

/** The lines explaining a seeded suggestion, for display. */
export function seededTieLines(note: SeededTieNote, name: (slot: number) => string): string[] {
  const race = (pair: HeadToHeadNote, place: number) =>
    `${name(pair.winnerSlot)} v ${name(pair.loserSlot)} decides ${ordinal(place)} and ${ordinal(place + 1)}: ` +
    `${name(pair.winnerSlot)} ${headToHeadReason(pair)}.`;
  const lines = [
    `Suggested by seeding for this ${note.slots.length}-way tie:`,
    race(note.top, note.firstPlace),
  ];
  if (note.bottom) lines.push(race(note.bottom, note.firstPlace + 2));
  if (note.lowestSeedSlot !== undefined) {
    lines.push(`${name(note.lowestSeedSlot)} is the lowest seed, so ${ordinal(note.firstPlace + 2)}.`);
  }
  lines.push('This is only a suggestion. You can run tie-break races instead, or move teams yourself.');
  return lines;
}
