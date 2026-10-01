import { hasTies } from '../domain/scoring';
import type { TeamStanding } from '../domain/types';

/**
 * Manual tiebreaks are stored as the FULL finishing order of a group (every
 * slot, best first), keyed by group letter for Round 1 and `r2-<groupNum>`
 * for Round 2. The seeding lookups in src/domain read them that way.
 */
export const r2TiebreakKey = (groupNum: string) => `r2-${groupNum}`;

/**
 * A saved order still applies only if it covers exactly this group's teams
 * and agrees with the points. If a result is changed afterwards so the
 * points no longer fit, the order is ignored and the tie must be resolved
 * again.
 */
export function isValidManualOrder(
  standings: TeamStanding[],
  order: number[] | undefined
): order is number[] {
  if (!order || order.length !== standings.length) return false;
  const bySlot = new Map(standings.map((s) => [s.slot, s]));
  if (new Set(order).size !== order.length || !order.every((slot) => bySlot.has(slot))) {
    return false;
  }
  return order.every(
    (slot, i) => i === 0 || bySlot.get(order[i - 1])!.points >= bySlot.get(slot)!.points
  );
}

/** Standings in final order: the saved manual order when it is valid. */
export function orderStandings(
  standings: TeamStanding[],
  order: number[] | undefined
): TeamStanding[] {
  if (!isValidManualOrder(standings, order)) return standings;
  const bySlot = new Map(standings.map((s) => [s.slot, s]));
  return order.map((slot) => bySlot.get(slot)!);
}

/**
 * Pass this as the tiebreak map to the seeding functions in src/domain,
 * together with standings already put through orderStandings. They apply a
 * stored order without checking it, so validity is decided here instead.
 */
export const NO_TIEBREAKS: Record<string, number[]> = {};

/** True when teams are level on points and no valid manual order exists. */
export function hasUnresolvedTie(standings: TeamStanding[], order: number[] | undefined): boolean {
  return hasTies(standings) && !isValidManualOrder(standings, order);
}

/** True when the group had a tie that an official has settled. */
export function hasResolvedTie(standings: TeamStanding[], order: number[] | undefined): boolean {
  return hasTies(standings) && isValidManualOrder(standings, order);
}
