import { describe, it, expect } from 'vitest';
import { getCheatSheet } from './index';
import goldenGroupOrder from './__fixtures__/goldenGroupOrder.json';

/**
 * Group letters in the order each "N Teams" sheet lists them, from
 * reference/cheat-sheets-v1.4.xlsx. From 17 teams the sheet interleaves
 * them (e.g. A, E, B, F, C, G, D, H), following the seeding slots.
 */
const golden = goldenGroupOrder as Record<string, string[]>;

describe('group order matches the spreadsheet', () => {
  it.each(Array.from({ length: 29 }, (_, i) => i + 4))(
    'lists the groups for %i teams in sheet order',
    (count) => {
      expect(getCheatSheet(count).groups.map((g) => g.letter)).toEqual(golden[count]);
    },
  );
});
