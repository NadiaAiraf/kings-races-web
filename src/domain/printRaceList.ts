// Rows for the printable Round 1 / Round 2 race list officials use to round
// up teams, laid out like the "1st RO" sheets in the cheat sheet workbook.
import type { DisciplineKey } from './types';

export interface PrintRace {
  discipline: DisciplineKey;
  homeTeamName: string;
  awayTeamName: string;
}

/** A race row carries its running number: 1, 2, 3... across disciplines, skipping blank rows. */
export type PrintRow = ({ kind: 'race'; order: number } & PrintRace) | { kind: 'gap' };

/** Rows for a printed race list: one per race, with a blank row wherever the discipline changes. */
export function buildPrintRows(races: readonly PrintRace[]): PrintRow[] {
  const rows: PrintRow[] = [];
  races.forEach((race, i) => {
    if (i > 0 && races[i - 1].discipline !== race.discipline) rows.push({ kind: 'gap' });
    rows.push({ kind: 'race', order: i + 1, ...race });
  });
  return rows;
}

const DISCIPLINE_LETTERS: Record<DisciplineKey, string> = { mixed: 'M', board: 'B', ladies: 'L' };

/** The discipline column of a printed race list, as the cheat sheet marks it. */
export function printDisciplineLetter(discipline: DisciplineKey): string {
  return DISCIPLINE_LETTERS[discipline];
}
