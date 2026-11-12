import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../auth/authContext';
import { signOutUser } from '../auth/firebaseAuth';
import { hasUnsyncedWrites } from '../events/eventsRepo';
import crownUrl from '../assets/kings-ski-club-crown.png';

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
  backLabel?: string;
}

export function PageHeader({ title, subtitle, backTo, backLabel = 'Back to rounds' }: PageHeaderProps) {
  const { user } = useAuth();
  const location = useLocation();
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
    <header className="flex items-center gap-2 bg-surface border-b border-slate-200 px-4 min-h-14">
      {backTo && (
        <Link
          to={backTo}
          aria-label={backLabel}
          className="min-h-11 min-w-11 -ml-3 flex items-center justify-center text-xl text-brand-600 dark:text-brand-400"
        >
          {'‹'}
        </Link>
      )}
      {!backTo && <img src={crownUrl} alt="" className="h-8 w-8 shrink-0" />}
      <div className="flex-1 min-w-0 py-2">
        <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {location.pathname !== '/options' && (
        <Link
          to="/options"
          state={{ from: location.pathname + location.search }}
          aria-label="Options"
          className="min-h-11 min-w-11 flex items-center justify-center text-slate-500"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      )}
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
        <Link to="/login" className="min-h-11 px-2 flex items-center text-sm font-semibold text-brand-600 dark:text-brand-400">
          Sign in
        </Link>
      )}
    </header>
  );
}

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen min-h-dvh max-w-[430px] md:max-w-3xl mx-auto bg-slate-50">
      {children}
    </div>
  );
}
