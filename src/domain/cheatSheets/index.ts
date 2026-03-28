import type { TournamentStructure } from '../types';
import { TEAMS_4 } from './teams4';
import { TEAMS_5 } from './teams5';
import { TEAMS_6 } from './teams6';
import { TEAMS_7 } from './teams7';
import { TEAMS_8 } from './teams8';
import { TEAMS_9 } from './teams9';
import { TEAMS_10 } from './teams10';
import { TEAMS_11 } from './teams11';
import { TEAMS_12 } from './teams12';
import { TEAMS_13 } from './teams13';
import { TEAMS_14 } from './teams14';
import { TEAMS_15 } from './teams15';
import { TEAMS_16 } from './teams16';
import { TEAMS_17 } from './teams17';
import { TEAMS_18 } from './teams18';
import { TEAMS_19 } from './teams19';
import { TEAMS_20 } from './teams20';
import { TEAMS_21 } from './teams21';
import { TEAMS_22 } from './teams22';
import { TEAMS_23 } from './teams23';
import { TEAMS_24 } from './teams24';
import { TEAMS_25 } from './teams25';
import { TEAMS_26 } from './teams26';
import { TEAMS_27 } from './teams27';
import { TEAMS_28 } from './teams28';
import { TEAMS_29 } from './teams29';
import { TEAMS_30 } from './teams30';
import { TEAMS_31 } from './teams31';
import { TEAMS_32 } from './teams32';

const CHEAT_SHEETS: Record<number, TournamentStructure> = {
  4: TEAMS_4,
  5: TEAMS_5,
  6: TEAMS_6,
  7: TEAMS_7,
  8: TEAMS_8,
  9: TEAMS_9,
  10: TEAMS_10,
  11: TEAMS_11,
  12: TEAMS_12,
  13: TEAMS_13,
  14: TEAMS_14,
  15: TEAMS_15,
  16: TEAMS_16,
  17: TEAMS_17,
  18: TEAMS_18,
  19: TEAMS_19,
  20: TEAMS_20,
  21: TEAMS_21,
  22: TEAMS_22,
  23: TEAMS_23,
  24: TEAMS_24,
  25: TEAMS_25,
  26: TEAMS_26,
  27: TEAMS_27,
  28: TEAMS_28,
  29: TEAMS_29,
  30: TEAMS_30,
  31: TEAMS_31,
  32: TEAMS_32,
};

export function getCheatSheet(teamCount: number): TournamentStructure {
  const sheet = CHEAT_SHEETS[teamCount];
  if (!sheet) {
    throw new Error(
      `No cheat sheet for ${teamCount} teams. Valid range: 4-32.`
    );
  }
  return sheet;
}

export function isValidTeamCount(teamCount: number): boolean {
  return teamCount >= 4 && teamCount <= 32 && Number.isInteger(teamCount);
}
