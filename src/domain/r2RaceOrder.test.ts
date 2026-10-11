import { describe, it, expect } from 'vitest';
import { getCheatSheet } from './cheatSheets';
import { R2_RACE_ORDER, r2RunningOrder } from './r2RaceOrder';

const R2_TEAM_COUNTS = Array.from({ length: 29 }, (_, i) => i + 4).filter(
  (n) => (getCheatSheet(n).roundTwoGroups ?? []).length > 0
);

describe('r2RunningOrder', () => {
  it.each(R2_TEAM_COUNTS)('runs every Round 2 race exactly once for %i teams', (count) => {
    const structure = getCheatSheet(count);
    const all = structure.roundTwoGroups!.flatMap((g) => g.races.map((r) => `${g.groupNum}-${r.raceNum}`));
    const ordered = r2RunningOrder(structure).map((r) => `${r.groupNum}-${r.raceNum}`);
    expect([...ordered].sort()).toEqual([...all].sort());
  });

  it.each(R2_TEAM_COUNTS)('follows the spreadsheet race for race for %i teams', (count) => {
    const structure = getCheatSheet(count);
    const letters = r2RunningOrder(structure).map(({ groupNum, raceNum }) => {
      const race = structure.roundTwoGroups!.find((g) => g.groupNum === groupNum)!.races.find(
        (r) => r.raceNum === raceNum
      )!;
      return [race.homeLetter.toUpperCase(), race.awayLetter.toUpperCase()].sort().join('');
    });
    const sheet = R2_RACE_ORDER[count].map(([h, a]) => [h, a].sort().join(''));
    expect(letters).toEqual(sheet);
  });

  it('interleaves the groups: 25 teams opens with group VI', () => {
    expect(r2RunningOrder(getCheatSheet(25)).slice(0, 3)).toEqual([
      { groupNum: 'VI', raceNum: 1 },
      { groupNum: 'VI', raceNum: 2 },
      { groupNum: 'I', raceNum: 1 },
    ]);
  });

  it('runs a repeated pairing in its group order (17 teams, a two-team group)', () => {
    const structure = getCheatSheet(17);
    const twoTeamGroup = structure.roundTwoGroups!.find((g) =>
      g.races.every((r) => r.homeLetter.toUpperCase() === 'P' || r.awayLetter.toUpperCase() === 'P')
    )!;
    const runs = r2RunningOrder(structure).filter((r) => r.groupNum === twoTeamGroup.groupNum);
    expect(runs.map((r) => r.raceNum)).toEqual(twoTeamGroup.races.map((r) => r.raceNum));
  });
});
