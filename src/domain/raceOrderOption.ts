// The race order options, kept free of other domain imports so the event doc
// parser (also compiled for the Node rules tests) can use them.

/**
 * How Round 1 and Round 2 are run across disciplines:
 * - standard: each discipline straight through, Mixed, Ladies, Board.
 * - ladies-board-blocks: Mixed first, then Ladies and Board alternate block
 *   by block (the cheat sheet's blank-row gaps).
 * - northern: Mixed and Ladies in thirds, Board in sixths, run
 *   M1 B1 L1 B2 M2 B3 L2 B4 M3 B5 L3 B6.
 * Stored on the event doc as raceOrder; must match firestore.rules.
 */
export type RaceOrderOption = 'standard' | 'ladies-board-blocks' | 'northern';

export const RACE_ORDER_OPTIONS: readonly RaceOrderOption[] = ['standard', 'ladies-board-blocks', 'northern'];

export const DEFAULT_RACE_ORDER: RaceOrderOption = 'standard';

export const RACE_ORDER_LABELS: Record<RaceOrderOption, string> = {
  standard: 'Standard',
  'ladies-board-blocks': 'Ladies/Board mixed',
  northern: 'Northern',
};

export function isRaceOrderOption(value: unknown): value is RaceOrderOption {
  return typeof value === 'string' && (RACE_ORDER_OPTIONS as readonly string[]).includes(value);
}
