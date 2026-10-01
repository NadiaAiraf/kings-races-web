import { useEffect, useState, type ReactNode } from 'react';
import { AuthContext } from './authContext';
import { INITIAL_AUTH_STATUS, watchAuthStatus, type AuthDeps } from './authStatus';

interface AuthProviderProps {
  deps: AuthDeps;
  children: ReactNode;
}

export function AuthProvider({ deps, children }: AuthProviderProps) {
  const [status, setStatus] = useState(INITIAL_AUTH_STATUS);

  useEffect(() => watchAuthStatus(deps, setStatus), [deps]);

  // Approved officials rely on offline storage at the slope; ask the browser
  // not to evict it (iOS clears unvisited sites' storage after about 7 days).
  useEffect(() => {
    if (status.isApproved) void navigator.storage?.persist?.();
  }, [status.isApproved]);

  return <AuthContext.Provider value={status}>{children}</AuthContext.Provider>;
}
