import type { RaceOutcome } from './types';

/**
 * Returns the auto-complement outcome for the opposing team.
 * Win -> Loss, Loss -> Win. DSQ has no auto-complement.
 */
export function getComplement(outcome: RaceOutcome): RaceOutcome | null {
  if (outcome === 'win') return 'loss';
  if (outcome === 'loss') return 'win';
  return null; // DSQ has no auto-complement
}

/**
 * Returns which outcomes should be disabled for a team based on the other team's selection.
 * Valid pairs: Win/Loss, Loss/Win, Win/DSQ, DSQ/Win.
 * Both teams cannot DSQ (D-01).
 */
export function getDisabledOutcomes(otherOutcome: RaceOutcome | null): Set<RaceOutcome> {
  if (otherOutcome === null) return new Set();
  if (otherOutcome === 'dsq') return new Set(['loss', 'dsq']); // Only Win allowed
  if (otherOutcome === 'win') return new Set(['win']); // Only Loss or DSQ allowed
  if (otherOutcome === 'loss') return new Set(['loss', 'dsq']); // Only Win allowed
  return new Set();
}
