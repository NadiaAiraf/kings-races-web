import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';
import { signOutUser } from '../auth/firebaseAuth';
import { hasUnsyncedWrites } from '../events/eventsRepo';

const UNSYNCED_SIGN_OUT_WARNING =
  'Some results on this phone have not synced yet. If you sign out, they stay queued here and are only sent when you sign back in on this phone. Sign out anyway?';

async function signOutSafely() {
  if ((await hasUnsyncedWrites()) && !window.confirm(UNSYNCED_SIGN_OUT_WARNING)) return;
  try {
    await signOutUser();
  } catch (err) {
    console.error('Sign out failed', err);
  }
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
}

export function PageHeader({ title, subtitle, backTo }: PageHeaderProps) {
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutSafely();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="flex items-center gap-2 bg-white border-b border-slate-200 px-4 min-h-14">
      {backTo && (
        <Link
          to={backTo}
          aria-label="Back to rounds"
          className="min-h-11 min-w-11 -ml-3 flex items-center justify-center text-xl text-blue-600"
        >
          {'‹'}
        </Link>
      )}
      <div className="flex-1 min-w-0 py-2">
        <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {user ? (
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="min-h-11 px-2 text-sm text-slate-500"
        >
          Sign out
        </button>
      ) : (
        <Link to="/login" className="min-h-11 px-2 flex items-center text-sm font-semibold text-blue-600">
          Sign in
        </Link>
      )}
    </header>
  );
}

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen min-h-dvh max-w-[430px] mx-auto bg-slate-50">
      {children}
    </div>
  );
}
