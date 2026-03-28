import { describe, it, expect } from 'vitest';
import { getCheatSheet, isValidTeamCount } from './index';

describe('cheat sheet lookup', () => {
  it('throws for team count below 4', () => {
    expect(() => getCheatSheet(3)).toThrow();
  });
  it('throws for team count above 32', () => {
    expect(() => getCheatSheet(33)).toThrow();
  });
  it('isValidTeamCount returns true for 4-32', () => {
    expect(isValidTeamCount(4)).toBe(true);
    expect(isValidTeamCount(32)).toBe(true);
    expect(isValidTeamCount(16)).toBe(true);
  });
  it('isValidTeamCount returns false outside range', () => {
    expect(isValidTeamCount(3)).toBe(false);
    expect(isValidTeamCount(33)).toBe(false);
    expect(isValidTeamCount(4.5)).toBe(false);
  });
});

describe('cheat sheet structural integrity', () => {
  for (let n = 4; n <= 32; n++) {
    describe(`${n} teams`, () => {
      const sheet = getCheatSheet(n);

      it('has correct teamCount', () => {
        expect(sheet.teamCount).toBe(n);
      });

      it('has non-empty groups', () => {
        expect(sheet.groups.length).toBeGreaterThan(0);
      });

      it('has non-empty Round 1 races', () => {
        expect(sheet.roundOneRaces.length).toBeGreaterThan(0);
      });

      it('Round 1 race count matches expected', () => {
        expect(sheet.roundOneRaces.length).toBe(sheet.roundOneRaceCount);
      });

      it('all R1 race slots are valid group member slots', () => {
        const allSlots = new Set(sheet.groups.flatMap(g => g.teamSlots));
        for (const race of sheet.roundOneRaces) {
          expect(allSlots.has(race.homeSlot)).toBe(true);
          expect(allSlots.has(race.awaySlot)).toBe(true);
        }
      });

      it('no duplicate R1 race numbers', () => {
        const nums = sheet.roundOneRaces.map(r => r.raceNum);
        expect(new Set(nums).size).toBe(nums.length);
      });

      it('every team slot appears in at least one R1 race', () => {
        const racingSlots = new Set<number>();
        for (const race of sheet.roundOneRaces) {
          racingSlots.add(race.homeSlot);
          racingSlots.add(race.awaySlot);
        }
        const allSlots = sheet.groups.flatMap(g => g.teamSlots);
        for (const slot of allSlots) {
          expect(racingSlots.has(slot)).toBe(true);
        }
      });

      if (n >= 7) {
        it('has Round 2 groups for 7+ teams', () => {
          expect(sheet.roundTwoGroups).toBeDefined();
          expect(sheet.roundTwoGroups!.length).toBeGreaterThan(0);
        });

        it('has Round 2 race count for 7+ teams', () => {
          expect(sheet.roundTwoRaceCount).toBeDefined();
          expect(sheet.roundTwoRaceCount).toBeGreaterThan(0);
        });
      }

      it('has finals array', () => {
        expect(sheet.finals).toBeDefined();
      });
    });
  }
});
