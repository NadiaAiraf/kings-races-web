import { describe, it, expect } from 'vitest';
import { assignSlots } from './assignSlots';
import goldenData from './cheatSheets/__fixtures__/goldenData.json';

describe('assignSlots', () => {
  it('assigns 8 teams using serpentine seedMap (not sequential)', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const result = assignSlots(names);
    const expectedSeedMap = goldenData['8'].seedMap; // [1, 11, 14, 4, 2, 12, 13, 3]
    expect(result.map((t) => t.slot)).toEqual(expectedSeedMap);
    // Confirm it's NOT sequential [1, 2, 3, 4, 11, 12, 13, 14]
    expect(result.map((t) => t.slot)).not.toEqual([1, 2, 3, 4, 11, 12, 13, 14]);
  });

  it('assigns 4 teams using seedMap', () => {
    const names = ['W', 'X', 'Y', 'Z'];
    const result = assignSlots(names);
    const expectedSeedMap = goldenData['4'].seedMap; // [1, 4, 3, 2]
    expect(result.map((t) => t.slot)).toEqual(expectedSeedMap);
  });

  it('assigns 16 teams using seedMap', () => {
    const names = Array.from({ length: 16 }, (_, i) => `Team ${i + 1}`);
    const result = assignSlots(names);
    const expectedSeedMap = goldenData['16'].seedMap;
    expect(result.map((t) => t.slot)).toEqual(expectedSeedMap);
  });

  it('falls back to sequential slots for fewer than 4 teams', () => {
    const names = ['Alpha', 'Beta', 'Gamma'];
    const result = assignSlots(names);
    expect(result.map((t) => t.slot)).toEqual([1, 2, 3]);
  });

  it('preserves team names in order — first name gets first seedMap slot', () => {
    const names = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
    const result = assignSlots(names);
    const expectedSeedMap = goldenData['8'].seedMap;
    result.forEach((team, i) => {
      expect(team.name).toBe(names[i]);
      expect(team.slot).toBe(expectedSeedMap[i]);
    });
  });
});
