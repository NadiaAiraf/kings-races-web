import { createContext, useContext } from 'react';
import type { EventSummary } from './eventDoc';

/** The open event's name and date, for components inside AppShell. */
export const EventInfoContext = createContext<EventSummary | null>(null);

export function useEventInfo(): EventSummary | null {
  return useContext(EventInfoContext);
}
