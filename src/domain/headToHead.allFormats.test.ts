// Checks the head-to-head default against every real cheat sheet, with many
// seeded random result sets, so formats where pairs meet more than once and
// groups of every size are all covered.
import { describe, it, expect } from 'vitest';
import { getCheatSheet } from './cheatSheets';
import { calculateGroupStandings } from './scoring';
import { headToHeadDefault } from './headToHead';
import { isValidManualOrder } from '../hooks/groupOrder';
import type { RaceOutcome, Score, TeamStanding, TournamentStructure } from './types';

/** Small deterministic PRNG (mulberry32) so failures reproduce. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random but legal Round 1 result for every race, sometimes left unscored. */
function randomScores(structure: TournamentStructure, next: () => number): Score[] {
  const scores: Score[] = [];
  for (const race of structure.roundOneRaces) {
    const r = next();
    let outcomes: [RaceOutcome, RaceOutcome];
    if (r < 0.42) outcomes = ['win', 'loss'];
    else if (r < 0.84) outcomes = ['loss', 'win'];
    else if (r < 0.88) outcomes = ['win', 'dsq'];
    else if (r < 0.92) outcomes = ['dsq', 'win'];
    else if (r < 0.95) outcomes = ['dsq', 'dsq'];
    else continue; // unscored
    scores.push({
      raceId: `r1-${race.raceNum}`,
      homeSlot: race.homeSlot,
      awaySlot: race.awaySlot,
      homeOutcome: outcomes[0],
      awayOutcome: outcomes[1],
    });
  }
  return scores;
}

/** Independent tally: how many races between a and b each team won outright. */
function tally(scores: Score[], a: number, b: number) {
  let aWins = 0;
  let bWins = 0;
  const raceNums: number[] = [];
  for (const s of scores) {
    const pair = new Set([s.homeSlot, s.awaySlot]);
    if (!pair.has(a) || !pair.has(b) || a === b) continue;
    const winners = [
      s.homeOutcome === 'win' ? s.homeSlot : null,
      s.awayOutcome === 'win' ? s.awaySlot : null,
    ].filter((x) => x !== null);
    if (winners.length !== 1) continue;
    if (winners[0] === a) aWins++;
    else bWins++;
    raceNums.push(Number(s.raceId.slice(3)));
  }
  return { aWins, bWins, raceNums };
}

/** Teams grouped by points level, in standings order. */
function levels(standings: TeamStanding[]): TeamStanding[][] {
  const out: TeamStanding[][] = [];
  for (const s of standings) {
    const last = out[out.length - 1];
    if (last && last[0].points === s.points) last.push(s);
    else out.push([s]);
  }
  return out;
}

const RUNS_PER_FORMAT = 60;

describe('headToHeadDefault across every format', () => {
  for (let teamCount = 4; teamCount <= 31; teamCount++) {
    it(`holds its rules for ${teamCount} teams over ${RUNS_PER_FORMAT} random result sets`, () => {
      const structure = getCheatSheet(teamCount);
      const next = rng(teamCount * 7919);
      let twoTeamLevels = 0;

      for (let run = 0; run < RUNS_PER_FORMAT; run++) {
        const scores = randomScores(structure, next);
        for (const group of structure.groups) {
          const standings = calculateGroupStandings(scores, group.teamSlots);
          const { order, notes } = headToHeadDefault(standings, scores);
          const ctx = `teams=${teamCount} run=${run} group=${group.letter}`;

          // Same teams, still in points order, so it is a legal saved order.
          expect([...order].map((s) => s.slot).sort(), ctx).toEqual(
            standings.map((s) => s.slot).sort()
          );
          expect(isValidManualOrder(standings, order.map((s) => s.slot)), ctx).toBe(true);

          let pos = 0;
          const expectedNotes = [];
          for (const level of levels(standings)) {
            const placed = order.slice(pos, pos + level.length).map((s) => s.slot);
            const original = level.map((s) => s.slot);

            if (level.length !== 2) {
              // Singles and ties of three or more keep the points-only order.
              expect(placed, ctx).toEqual(original);
            } else {
              twoTeamLevels++;
              const [a, b] = original;
              const { aWins, bWins, raceNums } = tally(scores, a, b);
              if (aWins === bWins) {
                expect(placed, ctx).toEqual(original);
              } else {
                const winner = aWins > bWins ? a : b;
                const loser = winner === a ? b : a;
                expect(placed, ctx).toEqual([winner, loser]);
                expectedNotes.push({
                  winnerSlot: winner,
                  loserSlot: loser,
                  raceNums,
                  wins: Math.max(aWins, bWins),
                  losses: Math.min(aWins, bWins),
                });
              }
            }
            pos += level.length;
          }
          expect(notes, ctx).toEqual(expectedNotes);
        }
      }

      // Guard against a vacuous pass: the random results must produce pairs.
      expect(twoTeamLevels).toBeGreaterThan(0);
    });
  }
});
