import { describe, it, expect } from 'vitest';
import { buildPrintRows, printGroupLabel, type PrintRace } from './printRaceList';
import type { DisciplineKey } from './types';

function race(discipline: DisciplineKey, raceNum: number): PrintRace {
  return { discipline, raceNum, group: 'A', homeTeamName: `Home ${raceNum}`, awayTeamName: `Away ${raceNum}` };
}

const kinds = (races: PrintRace[]) => buildPrintRows(races).map((row) => row.kind);

describe('buildPrintRows', () => {
  it('returns no rows for no races', () => {
    expect(buildPrintRows([])).toEqual([]);
  });

  it('gives one race row per race and no gaps when every race is one discipline', () => {
    const races = [race('mixed', 1), race('mixed', 2), race('mixed', 3)];

    expect(kinds(races)).toEqual(['race', 'race', 'race']);
  });

  it('adds a blank row where the discipline changes', () => {
    const races = [race('mixed', 1), race('mixed', 2), race('ladies', 1)];

    expect(kinds(races)).toEqual(['race', 'race', 'gap', 'race']);
  });

  it('adds a blank row between every pair of differing disciplines', () => {
    const races = [race('mixed', 1), race('board', 1), race('ladies', 1), race('board', 2)];

    expect(kinds(races)).toEqual(['race', 'gap', 'race', 'gap', 'race', 'gap', 'race']);
  });

  it('adds no blank row between consecutive blocks of the same discipline', () => {
    const races = [race('ladies', 1), race('ladies', 2), race('ladies', 3), race('ladies', 4)];

    expect(kinds(races)).toEqual(['race', 'race', 'race', 'race']);
  });

  it('never starts or ends with a blank row', () => {
    const rows = buildPrintRows([race('board', 1), race('mixed', 1)]);

    expect(rows[0].kind).toBe('race');
    expect(rows[rows.length - 1].kind).toBe('race');
  });

  it('carries each race through unchanged', () => {
    const input: PrintRace = {
      discipline: 'ladies',
      raceNum: 7,
      group: '2',
      homeTeamName: 'Kings 1',
      awayTeamName: 'Imperial 2',
    };

    expect(buildPrintRows([input])).toEqual([{ kind: 'race', ...input }]);
  });
});

describe('printGroupLabel', () => {
  it('drops the Group prefix from a letter group', () => {
    expect(printGroupLabel('Group A')).toBe('A');
  });

  it('drops the Group prefix from a numbered group', () => {
    expect(printGroupLabel('Group 1')).toBe('1');
  });

  it('is blank when there is no group', () => {
    expect(printGroupLabel(undefined)).toBe('');
  });

  it('returns a label without the Group prefix unchanged', () => {
    expect(printGroupLabel('Seeded')).toBe('Seeded');
  });
});
