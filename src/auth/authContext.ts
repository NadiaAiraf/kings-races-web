import { createContext, useContext } from 'react';
import { INITIAL_AUTH_STATUS, type AuthStatus } from './authStatus';

export const AuthContext = createContext<AuthStatus>(INITIAL_AUTH_STATUS);

export function useAuth(): AuthStatus {
  return useContext(AuthContext);
}
