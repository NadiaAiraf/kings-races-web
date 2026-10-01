import { createContext, useContext } from 'react';

/**
 * Whether the current user may change the open event. Defaults to false so
 * anything rendered outside an approved scope is read-only. This only hides
 * controls; Firestore security rules are the real access control.
 */
export const EditAccessContext = createContext(false);

export function useCanEdit(): boolean {
  return useContext(EditAccessContext);
}
