import { describe, it, expect } from 'vitest';
import { getCheatSheet } from './index';
import goldenFinals from './__fixtures__/goldenFinals.json';
import { parsePlacementLabel } from '../../hooks/useFinalResults';

/**
 * Finals per team count, from the FINAL ROUND block of each "N Teams" sheet
 * in reference/cheat-sheets-v1.4.xlsx (BYE rows dropped). label is null
 * where the sheet gives no places; optional marks the sheet's "*" finals,
 * run "only if time allows".
 */
const golden = goldenFinals as Record<
  string,
  { homeRef: string; awayRef: string; label: string | null; optional: boolean }[]
>;

const norm = (ref: string) => ref.toLowerCase().replace(/\s+/g, ' ').trim();
const TEAM_COUNTS = Array.from({ length: 28 }, (_, i) => i + 4);

describe('finals match the spreadsheet', () => {
  it.each(TEAM_COUNTS)('races the same finals in the same order for %i teams', (count) => {
    const app = getCheatSheet(count).finals.map((f) => [norm(f.homeRef), norm(f.awayRef)]);
    const sheet = golden[count].map((f) => [norm(f.homeRef), norm(f.awayRef)]);
    expect(app).toEqual(sheet);
  });

  it.each(TEAM_COUNTS)('uses the sheet labels where it gives them for %i teams', (count) => {
    const app = getCheatSheet(count).finals;
    golden[count].forEach((f, i) => {
      if (f.label) expect(app[i].label).toBe(f.label);
    });
  });

  it.each(TEAM_COUNTS)('marks the "only if time allows" finals for %i teams', (count) => {
    const app = getCheatSheet(count).finals.map((f) => Boolean(f.optional));
    expect(app).toEqual(golden[count].map((f) => f.optional));
  });

  it.each(TEAM_COUNTS)('never decides the same place twice for %i teams', (count) => {
    const places = getCheatSheet(count).finals.flatMap((f) => parsePlacementLabel(f.label));
    expect(places.every((p) => p >= 1 && p <= count)).toBe(true);
    expect(new Set(places).size).toBe(places.length);
  });
});
