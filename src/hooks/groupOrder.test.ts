import { describe, it, expect } from 'vitest';
import type { TeamStanding } from '../domain/types';
import {
  hasResolvedTie,
  hasUnresolvedTie,
  isValidManualOrder,
  orderStandings,
} from './groupOrder';

const standing = (slot: number, points: number): TeamStanding => ({
  slot,
  points,
  wins: 0,
  losses: 0,
  dsqs: 0,
  played: 0,
});

// Slot 1 clear first, 2 and 3 level, 4 last.
const tied = [standing(1, 18), standing(2, 12), standing(3, 12), standing(4, 6)];
const clear = [standing(1, 18), standing(2, 12), standing(3, 9), standing(4, 6)];

describe('isValidManualOrder', () => {
  it('accepts a full order that swaps only the tied teams', () => {
    expect(isValidManualOrder(tied, [1, 3, 2, 4])).toBe(true);
  });

  it('rejects an order that puts a lower-points team above a higher one', () => {
    expect(isValidManualOrder(tied, [3, 1, 2, 4])).toBe(false);
  });

  it('rejects an order that lists only the tied teams', () => {
    expect(isValidManualOrder(tied, [3, 2])).toBe(false);
  });

  it('rejects an order with a slot from another group', () => {
    expect(isValidManualOrder(tied, [1, 3, 2, 99])).toBe(false);
  });

  it('rejects an order that repeats a slot', () => {
    expect(isValidManualOrder(tied, [1, 3, 3, 4])).toBe(false);
  });

  it('rejects a missing order', () => {
    expect(isValidManualOrder(tied, undefined)).toBe(false);
  });
});

describe('orderStandings', () => {
  it('applies a valid manual order', () => {
    expect(orderStandings(tied, [1, 3, 2, 4]).map((s) => s.slot)).toEqual([1, 3, 2, 4]);
  });

  it('ignores an order the points no longer support', () => {
    expect(orderStandings(clear, [1, 3, 2, 4]).map((s) => s.slot)).toEqual([1, 2, 3, 4]);
  });
});

describe('hasUnresolvedTie / hasResolvedTie', () => {
  it('reports an unresolved tie with no saved order', () => {
    expect(hasUnresolvedTie(tied, undefined)).toBe(true);
  });

  it('reports the tie as resolved once a valid order is saved', () => {
    expect(hasUnresolvedTie(tied, [1, 3, 2, 4])).toBe(false);
    expect(hasResolvedTie(tied, [1, 3, 2, 4])).toBe(true);
  });

  it('reports no tie for a group with distinct points', () => {
    expect(hasUnresolvedTie(clear, undefined)).toBe(false);
    expect(hasResolvedTie(clear, undefined)).toBe(false);
  });
});
