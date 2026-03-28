import type { DisciplineKey } from './types';
import { DISCIPLINE_TEAM_RANGES } from './types';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateTeamCount(
  discipline: DisciplineKey,
  teamCount: number
): ValidationResult {
  if (!Number.isInteger(teamCount)) {
    return { valid: false, reason: `Team count must be a whole number` };
  }

  const range = DISCIPLINE_TEAM_RANGES[discipline];
  if (teamCount < range.min || teamCount > range.max) {
    const label = discipline.charAt(0).toUpperCase() + discipline.slice(1);
    return {
      valid: false,
      reason: `${label} supports ${range.min}-${range.max} teams`,
    };
  }

  return { valid: true };
}

export function getValidTeamCountRange(
  discipline: DisciplineKey
): { min: number; max: number } {
  return DISCIPLINE_TEAM_RANGES[discipline];
}
