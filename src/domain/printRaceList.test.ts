import { describe, it, expect } from 'vitest';
import { buildPrintRows, printDisciplineLetter, type PrintRace } from './printRaceList';
import type { DisciplineKey } from './types';

function race(discipline: DisciplineKey, n: number): PrintRace {
  return { discipline, homeTeamName: `Home ${n}`, awayTeamName: `Away ${n}` };
}

const kinds = (races: PrintRace[]) => buildPrintRows(races).map((row) => row.kind);

const orders = (races: PrintRace[]) =>
  buildPrintRows(races).map((row) => (row.kind === 'race' ? row.order : null));

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

  it('numbers races in running order across disciplines, skipping blank rows, like the cheat sheet', () => {
    const races = [race('mixed', 1), race('mixed', 2), race('ladies', 1), race('board', 1)];

    expect(orders(races)).toEqual([1, 2, null, 3, null, 4]);
  });

  it('carries each race through with its running number', () => {
    const input: PrintRace = { discipline: 'ladies', homeTeamName: 'Kings 1', awayTeamName: 'Imperial 2' };

    expect(buildPrintRows([input])).toEqual([{ kind: 'race', order: 1, ...input }]);
  });
});

describe('printDisciplineLetter', () => {
  it('marks mixed races M', () => {
    expect(printDisciplineLetter('mixed')).toBe('M');
  });

  it('marks board races B', () => {
    expect(printDisciplineLetter('board')).toBe('B');
  });

  it('marks ladies races L', () => {
    expect(printDisciplineLetter('ladies')).toBe('L');
  });
});
