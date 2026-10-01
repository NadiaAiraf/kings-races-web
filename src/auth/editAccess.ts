import { createContext, useContext } from 'react';

/**
 * Whether the current user may change the open event. Defaults to false so
 * anything rendered outside an approved scope is read-only.
 *
 * Convention: the component that renders a mutating control reads this
 * itself and hides the control (callers never need to remember to gate).
 * Behind that, startEventSync drops writes for users who cannot write, and
 * Firestore security rules are the real access control.
 */
export const EditAccessContext = createContext(false);

export function useCanEdit(): boolean {
  return useContext(EditAccessContext);
}
