import { createContext, useContext } from 'react';
import { DEFAULT_RACE_ORDER, type RaceOrderOption } from '../domain/combinedRaceOrder';

export interface RaceOrderControl {
  /** The open event's race order for Round 1 and Round 2. */
  order: RaceOrderOption;
  /** null when this user cannot change it */
  setOrder: ((order: RaceOrderOption) => void) | null;
}

/** Defaults to Standard and read-only outside an event. */
export const RaceOrderContext = createContext<RaceOrderControl>({ order: DEFAULT_RACE_ORDER, setOrder: null });

export function useRaceOrder(): RaceOrderControl {
  return useContext(RaceOrderContext);
}
