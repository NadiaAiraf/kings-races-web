import Papa from 'papaparse';
import type { DisciplineKey } from './types';

export interface FinalResult {
  position: number;
  teamName: string;
  placementLabel: string;
}

const DISCIPLINE_ORDER: DisciplineKey[] = ['mixed', 'board', 'ladies'];

const DISCIPLINE_LABELS: Record<DisciplineKey, string> = {
  mixed: 'Mixed',
  board: 'Board',
  ladies: 'Ladies',
};

/**
 * Generate a combined CSV string for all three disciplines.
 *
 * Format:
 * ```
 * --- Mixed ---
 * #,Team,Placement
 * 1,Team Alpha,1st
 * 2,Team Beta,2nd
 *
 * --- Board ---
 * #,Team,Placement
 * ...
 * ```
 */
export function generateEventCSV(
  disciplines: Record<DisciplineKey, FinalResult[]>
): string {
  const rows: string[][] = [];

  for (let i = 0; i < DISCIPLINE_ORDER.length; i++) {
    const key = DISCIPLINE_ORDER[i];
    const results = disciplines[key];

    // Discipline header
    rows.push([`--- ${DISCIPLINE_LABELS[key]} ---`]);
    // Column headers
    rows.push(['#', 'Team', 'Placement']);
    // Data rows
    for (const r of results) {
      rows.push([String(r.position), r.teamName, r.placementLabel]);
    }
    // Blank row separator (except after last discipline)
    if (i < DISCIPLINE_ORDER.length - 1) {
      rows.push([]);
    }
  }

  return Papa.unparse(rows);
}

/**
 * Trigger a CSV file download in the browser.
 *
 * Creates a Blob, generates an object URL, and clicks a hidden anchor element.
 * Falls back to window.open for mobile Safari compatibility.
 */
export function triggerCSVDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
