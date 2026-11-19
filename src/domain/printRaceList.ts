// Rows for the printable Round 1 / Round 2 race list officials use to round
// up teams, laid out like the "1st RO" sheets in the cheat sheet workbook.
import type { DisciplineKey } from './types';

export interface PrintRace {
  discipline: DisciplineKey;
  raceNum: number;
  group: string;
  homeTeamName: string;
  awayTeamName: string;
}

export type PrintRow = ({ kind: 'race' } & PrintRace) | { kind: 'gap' };

/** Rows for a printed race list: one per race, with a blank row wherever the discipline changes. */
export function buildPrintRows(races: readonly PrintRace[]): PrintRow[] {
  const rows: PrintRow[] = [];
  races.forEach((race, i) => {
    if (i > 0 && races[i - 1].discipline !== race.discipline) rows.push({ kind: 'gap' });
    rows.push({ kind: 'race', ...race });
  });
  return rows;
}

const GROUP_PREFIX = 'Group ';

/** The group column of a printed race list: "Group A" -> "A", like the cheat sheet. */
export function printGroupLabel(groupLabel: string | undefined): string {
  if (!groupLabel) return '';
  return groupLabel.startsWith(GROUP_PREFIX) ? groupLabel.slice(GROUP_PREFIX.length) : groupLabel;
}
