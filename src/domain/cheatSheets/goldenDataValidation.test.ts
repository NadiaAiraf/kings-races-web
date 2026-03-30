import { describe, it, expect } from 'vitest';
import goldenData from './__fixtures__/goldenData.json';
import { getCheatSheet } from './index';

const data = goldenData as Record<
  string,
  {
    teamCount: number;
    seedMap: number[];
    r1Races: { raceNum: number; homeSlot: number; awaySlot: number }[];
    r2Races: { raceNum: number; homeLetter: string; awayLetter: string }[];
  }
>;

const teamCounts = Array.from({ length: 29 }, (_, i) => i + 4);

describe('VALID-01: seed-to-slot mapping matches xlsx', () => {
  for (const n of teamCounts) {
    it(`${n} teams: seed map matches golden data`, () => {
      const golden = data[String(n)];
      expect(golden).toBeDefined();

      const sheet = getCheatSheet(n);
      const allSlots = sheet.groups.flatMap((g) => g.teamSlots);
      const slotSet = new Set(allSlots);

      // Verify seedMap length equals team count
      expect(golden.seedMap.length).toBe(
        n,
        // Note: custom message via third arg not supported in vitest expect().toBe()
      );

      // Verify every slot in seedMap exists in the group slots
      for (let i = 0; i < golden.seedMap.length; i++) {
        const slot = golden.seedMap[i];
        expect(
          slotSet.has(slot),
          `${n} teams: seed ${i + 1} -> slot ${slot} not found in any group (groups have slots: [${allSlots.join(', ')}])`,
        ).toBe(true);
      }

      // Verify total group slot count matches team count
      expect(
        allSlots.length,
        `${n} teams: expected ${n} total group slots, got ${allSlots.length}`,
      ).toBe(n);
    });
  }
});

describe('VALID-02: R1 race order matches xlsx', () => {
  for (const n of teamCounts) {
    it(`${n} teams: R1 race order matches golden data`, () => {
      const golden = data[String(n)];
      expect(golden).toBeDefined();

      const sheet = getCheatSheet(n);
      const expectedRaces = golden.r1Races;
      const actualRaces = sheet.roundOneRaces;

      // Assert array lengths match
      expect(
        actualRaces.length,
        `${n} teams: expected ${expectedRaces.length} R1 races, got ${actualRaces.length}`,
      ).toBe(expectedRaces.length);

      // Compare each race
      for (let i = 0; i < expectedRaces.length; i++) {
        const expected = expectedRaces[i];
        const actual = actualRaces[i];

        expect(
          actual.homeSlot,
          `${n} teams, R1 race ${i + 1}: expected home=${expected.homeSlot}, got ${actual.homeSlot}`,
        ).toBe(expected.homeSlot);

        expect(
          actual.awaySlot,
          `${n} teams, R1 race ${i + 1}: expected away=${expected.awaySlot}, got ${actual.awaySlot}`,
        ).toBe(expected.awaySlot);
      }
    });
  }
});

describe('VALID-03: R2 race order matches xlsx', () => {
  for (const n of teamCounts) {
    it(`${n} teams: R2 race order matches golden data`, () => {
      const golden = data[String(n)];
      expect(golden).toBeDefined();

      const sheet = getCheatSheet(n);
      const expectedR2 = golden.r2Races;

      // For 4-6 teams, no R2 races expected
      if (expectedR2.length === 0) {
        const hasR2 =
          sheet.roundTwoGroups !== undefined &&
          sheet.roundTwoGroups.length > 0;
        expect(
          hasR2,
          `${n} teams: expected no R2 groups, but roundTwoGroups is defined with ${sheet.roundTwoGroups?.length ?? 0} groups`,
        ).toBe(false);
        return;
      }

      // For 7+ teams: flatten TS R2 races from roundTwoGroups into a single array
      // Groups are ordered by group number (I, II, III, etc.)
      expect(
        sheet.roundTwoGroups,
        `${n} teams: expected roundTwoGroups to be defined for R2 validation`,
      ).toBeDefined();

      const actualR2Flat = (sheet.roundTwoGroups ?? []).flatMap(
        (g) => g.races,
      );

      // Compare flat sequence lengths
      expect(
        actualR2Flat.length,
        `${n} teams: expected ${expectedR2.length} R2 races, got ${actualR2Flat.length}`,
      ).toBe(expectedR2.length);

      // Compare each race by matchup content (homeLetter, awayLetter)
      for (let i = 0; i < expectedR2.length; i++) {
        const expected = expectedR2[i];
        const actual = actualR2Flat[i];

        expect(
          actual.homeLetter,
          `${n} teams, R2 race ${i + 1}: expected ${expected.homeLetter} V ${expected.awayLetter}, got ${actual.homeLetter} V ${actual.awayLetter}`,
        ).toBe(expected.homeLetter);

        expect(
          actual.awayLetter,
          `${n} teams, R2 race ${i + 1}: expected ${expected.homeLetter} V ${expected.awayLetter}, got ${actual.homeLetter} V ${actual.awayLetter}`,
        ).toBe(expected.awayLetter);
      }
    });
  }
});
