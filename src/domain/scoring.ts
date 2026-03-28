import type { RaceOutcome, Score, TeamStanding } from './types';

export const POINTS: Record<RaceOutcome, number> = {
  win: 3,
  loss: 1,
  dsq: 0,
};

export function calculateGroupStandings(
  scores: Score[],
  groupTeamSlots: number[]
): TeamStanding[] {
  const standings: TeamStanding[] = groupTeamSlots.map((slot) => {
    let points = 0, wins = 0, losses = 0, dsqs = 0;

    for (const score of scores) {
      let outcome: RaceOutcome | null = null;
      if (score.homeSlot === slot) outcome = score.homeOutcome;
      else if (score.awaySlot === slot) outcome = score.awayOutcome;
      else continue;

      points += POINTS[outcome];
      if (outcome === 'win') wins++;
      else if (outcome === 'loss') losses++;
      else if (outcome === 'dsq') dsqs++;
    }

    return { slot, points, wins, losses, dsqs, played: wins + losses + dsqs };
  });

  return standings.sort((a, b) => b.points - a.points);
}

export function hasTies(standings: TeamStanding[]): boolean {
  for (let i = 0; i < standings.length - 1; i++) {
    if (standings[i].points === standings[i + 1].points) return true;
  }
  return false;
}
