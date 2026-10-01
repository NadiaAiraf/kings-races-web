export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthStatus {
  loading: boolean;
  user: AuthUser | null;
  isApproved: boolean;
  /** The approval check failed or could not reach the server. */
  approvalCheckFailed: boolean;
}

export interface AuthDeps {
  onUserChanged: (onUser: (user: AuthUser | null) => void) => () => void;
  /**
   * Watch approvedUsers/{uid}; reports whether the doc exists and whether
   * that answer came only from the local cache.
   */
  watchApproval: (
    uid: string,
    onApproved: (approved: boolean, fromCache: boolean) => void,
    onError: (error: Error) => void
  ) => () => void;
}

export const INITIAL_AUTH_STATUS: AuthStatus = {
  loading: true,
  user: null,
  isApproved: false,
  approvalCheckFailed: false,
};

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
      onStatus({ loading: false, user: null, isApproved: false, approvalCheckFailed: false });
      return;
    }

    onStatus({ loading: true, user, isApproved: false, approvalCheckFailed: false });
    stopApproval = deps.watchApproval(
      user.uid,
      (approved, fromCache) =>
        onStatus({
          loading: false,
          user,
          isApproved: approved,
          // Offline with nothing cached reads as "no doc": say the check
          // could not be made rather than "not approved". Still read-only.
          approvalCheckFailed: !approved && fromCache,
        }),
      (error) => {
        console.error('Approval check failed', { uid: user.uid }, error);
        onStatus({ loading: false, user, isApproved: false, approvalCheckFailed: true });
      }
    );
  });

  return () => {
    stopApproval?.();
    stopUser();
  };
}
