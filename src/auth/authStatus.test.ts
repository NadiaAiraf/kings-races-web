import { describe, it, expect, vi } from 'vitest';
import { watchAuthStatus, type AuthDeps, type AuthStatus, type AuthUser } from './authStatus';

function createFakeAuth() {
  let setUser: (user: AuthUser | null) => void = () => {};
  const approvalWatchers = new Map<
    string,
    { onApproved: (approved: boolean, fromCache: boolean) => void; onError: (e: Error) => void; stopped: boolean }
  >();

  const deps: AuthDeps = {
    onUserChanged: (onUser) => {
      setUser = onUser;
      return () => {};
    },
    watchApproval: (uid, onApproved, onError) => {
      const watcher = { onApproved, onError, stopped: false };
      approvalWatchers.set(uid, watcher);
      return () => {
        watcher.stopped = true;
      };
    },
  };

  return {
    deps,
    signIn: (uid: string) => setUser({ uid, email: `${uid}@example.com` }),
    signOut: () => setUser(null),
    approval: (uid: string) => approvalWatchers.get(uid)!,
  };
}

function track(fake: ReturnType<typeof createFakeAuth>) {
  const statuses: AuthStatus[] = [];
  const stop = watchAuthStatus(fake.deps, (s) => statuses.push(s));
  return { statuses, latest: () => statuses[statuses.length - 1], stop };
}

describe('watchAuthStatus', () => {
  it('reports a signed-out user as not approved', () => {
    const fake = createFakeAuth();
    const { latest } = track(fake);

    fake.signOut();

    expect(latest()).toEqual({
      loading: false,
      user: null,
      isApproved: false,
      approvalCheckFailed: false,
    });
  });

  it('is loading and not approved while the approval check is pending', () => {
    const fake = createFakeAuth();
    const { latest } = track(fake);

    fake.signIn('official');

    expect(latest().loading).toBe(true);
    expect(latest().isApproved).toBe(false);
  });

  it('approves a user whose approvedUsers doc exists', () => {
    const fake = createFakeAuth();
    const { latest } = track(fake);

    fake.signIn('official');
    fake.approval('official').onApproved(true, false);

    expect(latest()).toMatchObject({ loading: false, isApproved: true, user: { uid: 'official' } });
  });

  it('does not approve a signed-in user with no approvedUsers doc', () => {
    const fake = createFakeAuth();
    const { latest } = track(fake);

    fake.signIn('stranger');
    fake.approval('stranger').onApproved(false, false);

    expect(latest()).toMatchObject({ loading: false, isApproved: false });
  });

  it('reports a cache-only "not approved" as a failed check, still read-only', () => {
    const fake = createFakeAuth();
    const { latest } = track(fake);

    fake.signIn('official');
    fake.approval('official').onApproved(false, true);

    expect(latest()).toMatchObject({ isApproved: false, approvalCheckFailed: true });
  });

  it('switches cleanly from one user to another', () => {
    const fake = createFakeAuth();
    const { latest } = track(fake);
    fake.signIn('official');
    fake.approval('official').onApproved(true, false);

    fake.signIn('stranger');

    expect(fake.approval('official').stopped).toBe(true);
    expect(latest()).toMatchObject({ loading: true, isApproved: false, user: { uid: 'stranger' } });
  });

  it('revokes approval when the check errors after approval', () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = createFakeAuth();
    const { latest } = track(fake);
    fake.signIn('official');
    fake.approval('official').onApproved(true, false);

    fake.approval('official').onError(new Error('unavailable'));

    expect(latest()).toMatchObject({ isApproved: false, approvalCheckFailed: true });
    errorLog.mockRestore();
  });

  it('fails closed when the approval check errors', () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = createFakeAuth();
    const { latest } = track(fake);

    fake.signIn('official');
    fake.approval('official').onError(new Error('unavailable'));

    expect(latest()).toMatchObject({ loading: false, isApproved: false, approvalCheckFailed: true });
    errorLog.mockRestore();
  });

  it('revokes approval live when the approvedUsers doc is removed', () => {
    const fake = createFakeAuth();
    const { latest } = track(fake);
    fake.signIn('official');
    fake.approval('official').onApproved(true, false);

    fake.approval('official').onApproved(false, false);

    expect(latest().isApproved).toBe(false);
  });

  it('stops watching the previous user on sign-out', () => {
    const fake = createFakeAuth();
    track(fake);
    fake.signIn('official');

    fake.signOut();

    expect(fake.approval('official').stopped).toBe(true);
  });

  it('stops the approval watch when stopped', () => {
    const fake = createFakeAuth();
    const { stop } = track(fake);
    fake.signIn('official');

    stop();

    expect(fake.approval('official').stopped).toBe(true);
  });
});
