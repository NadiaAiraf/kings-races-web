/**
 * Race order blocks per team count, from the "N Teams" sheets of
 * reference/cheat-sheets-v1.4.xlsx. The Race Order columns (col J for
 * Round 1, col T/U for Round 2) leave a blank row between blocks; each number
 * is the count of races in one block, in running order.
 *
 * Only cells shaped "X V Y" (optionally ending in "*") count as races. Other
 * cells are ignored and do not split blocks: the "races:" footer and its
 * count, the stray count cell under the 11-team Round 1 column, and the
 * 20-team "ANNOUNCE 3 RACES LEFT" note inside the third Round 1 block.
 *
 * Round 1 sizes apply to the cheat sheet roundOneRaces order. Round 2 sizes
 * apply to r2RunningOrder, which copies the sheet's Round 2 Race Order column.
 * Formats without Round 2 have r2 []. The "11 Teams Board" and "11 Teams
 * Ladies" sheets are not used, as the app runs every discipline from the
 * "N Teams" sheet.
 */
export interface RaceOrderBlocks {
  r1: readonly number[];
  r2: readonly number[];
}

export const RACE_ORDER_BLOCKS: Record<number, RaceOrderBlocks> = {
  4: { r1: [2, 2, 2, 2, 2, 2], r2: [] },
  5: { r1: [2, 2, 2, 2, 2], r2: [] },
  6: { r1: [3, 3, 3, 3, 3], r2: [] },
  7: { r1: [3, 3, 3], r2: [3, 3, 3] },
  8: { r1: [4, 4, 4], r2: [4, 4, 4] },
  9: { r1: [3, 3, 3], r2: [3, 3, 3] },
  10: { r1: [4, 4, 4], r2: [4, 4, 4] },
  11: { r1: [5, 5, 5], r2: [5, 5, 5] },
  12: { r1: [4, 4, 4], r2: [6, 6, 6] },
  13: { r1: [5, 5, 5], r2: [5, 5, 5] },
  14: { r1: [6, 6, 6], r2: [6, 6, 6] },
  15: { r1: [7, 7, 7], r2: [7, 7, 7] },
  16: { r1: [8, 8, 8], r2: [8, 8, 8] },
  17: { r1: [6, 6, 6], r2: [6, 6, 6] },
  18: { r1: [6, 6, 6], r2: [6, 6, 6] },
  19: { r1: [7, 7, 7], r2: [7, 7, 7] },
  20: { r1: [8, 8, 8], r2: [8, 8, 8] },
  21: { r1: [7, 7, 7], r2: [9, 9, 9] },
  22: { r1: [8, 8, 8], r2: [10, 10, 10] },
  23: { r1: [8, 8, 8], r2: [11, 11, 11] },
  24: { r1: [8, 8, 8], r2: [12, 12, 12] },
  25: { r1: [9, 9, 9], r2: [2, 12, 12, 12, 2] },
  26: { r1: [10, 10, 10], r2: [13, 13, 13] },
  27: { r1: [11, 11, 11], r2: [13, 13, 13] },
  28: { r1: [12, 12, 12], r2: [14, 14, 14] },
  29: { r1: [13, 13, 13], r2: [14, 14, 14] },
  30: { r1: [14, 14, 14], r2: [14, 14, 14] },
  31: { r1: [15, 15, 15], r2: [15, 15, 15] },
};

export function getRaceOrderBlocks(teamCount: number): RaceOrderBlocks | undefined {
  return RACE_ORDER_BLOCKS[teamCount];
}
