import type { Team } from './types';
import { getCheatSheet } from './cheatSheets';

export function assignSlots(names: string[]): Team[] {
  if (names.length >= 4) {
    const structure = getCheatSheet(names.length);
    return names.map((n, i) => ({ slot: structure.seedMap[i], name: n }));
  }
  return names.map((n, i) => ({ slot: i + 1, name: n }));
}
