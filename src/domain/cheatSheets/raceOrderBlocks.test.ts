import { describe, it, expect } from 'vitest';
import { getCheatSheet } from './index';
import { getRaceOrderBlocks } from './raceOrderBlocks';
import { r2RunningOrder } from '../r2RaceOrder';

const sum = (sizes: readonly number[]) => sizes.reduce((n, s) => n + s, 0);
const TEAM_COUNTS = Array.from({ length: 28 }, (_, i) => i + 4);

describe('race order blocks', () => {
  it.each(TEAM_COUNTS)('Round 1 blocks for %i teams add up to the Round 1 races', (n) => {
    expect(sum(getRaceOrderBlocks(n)!.r1)).toBe(getCheatSheet(n).roundOneRaces.length);
  });

  it.each(TEAM_COUNTS)('Round 2 blocks for %i teams add up to the Round 2 running order', (n) => {
    expect(sum(getRaceOrderBlocks(n)!.r2)).toBe(r2RunningOrder(getCheatSheet(n)).length);
  });

  it.each(TEAM_COUNTS)('every block size for %i teams is a positive integer', (n) => {
    const { r1, r2 } = getRaceOrderBlocks(n)!;
    expect([...r1, ...r2].every((s) => Number.isInteger(s) && s > 0)).toBe(true);
  });

  it('has no Round 2 blocks for 4, 5 and 6 teams', () => {
    expect([4, 5, 6].map((n) => getRaceOrderBlocks(n)!.r2)).toEqual([[], [], []]);
  });

  it('splits 4 teams into six blocks of two', () => {
    expect(getRaceOrderBlocks(4)!.r1).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('ignores the stray count cell under the 11-team Round 1', () => {
    expect(getRaceOrderBlocks(11)!.r1).toEqual([5, 5, 5]);
  });

  it('ignores the announce note inside the 20-team Round 1', () => {
    expect(getRaceOrderBlocks(20)!.r1).toEqual([8, 8, 8]);
  });

  it('keeps the short end blocks of the 25-team Round 2', () => {
    expect(getRaceOrderBlocks(25)!.r2).toEqual([2, 12, 12, 12, 2]);
  });

  it('splits 31 teams into three blocks of 15', () => {
    expect(getRaceOrderBlocks(31)!.r1).toEqual([15, 15, 15]);
  });

  it('has nothing for unsupported team counts', () => {
    expect(getRaceOrderBlocks(3)).toBeUndefined();
    expect(getRaceOrderBlocks(32)).toBeUndefined();
  });
});
