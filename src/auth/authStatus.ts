export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthStatus {
  loading: boolean;
  user: AuthUser | null;
  isApproved: boolean;
}

export interface AuthDeps {
  onUserChanged: (onUser: (user: AuthUser | null) => void) => () => void;
  /** Watch approvedUsers/{uid}; reports whether the doc exists. */
  watchApproval: (
    uid: string,
    onApproved: (approved: boolean) => void,
    onError: (error: Error) => void
  ) => () => void;
}

export const INITIAL_AUTH_STATUS: AuthStatus = { loading: true, user: null, isApproved: false };

/**
 * Combine sign-in state with the approval allowlist. Fails closed: the user
 * is only approved once their approvedUsers doc is seen to exist, and any
 * error while checking leaves them read-only.
 */
export function watchAuthStatus(deps: AuthDeps, onStatus: (status: AuthStatus) => void) {
  let stopApproval: (() => void) | null = null;

  const stopUser = deps.onUserChanged((user) => {
    stopApproval?.();
    stopApproval = null;

    if (!user) {
      onStatus({ loading: false, user: null, isApproved: false });
      return;
    }

    onStatus({ loading: true, user, isApproved: false });
    stopApproval = deps.watchApproval(
      user.uid,
      (approved) => onStatus({ loading: false, user, isApproved: approved }),
      () => onStatus({ loading: false, user, isApproved: false })
    );
  });

  return () => {
    stopApproval?.();
    stopUser();
  };
}
