import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../auth/authContext';
import { signInWithEmail } from '../auth/firebaseAuth';
import { PageHeader, PageLayout } from './PageLayout';

function signInErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
      return 'Email or password is incorrect.';
    }
    if (err.code === 'auth/too-many-requests') {
      return 'Too many attempts. Try again in a few minutes.';
    }
    if (err.code === 'auth/network-request-failed') {
      return 'No connection. Sign in needs to be online.';
    }
  }
  return 'Sign in failed. Try again.';
}

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Sign in failed', err instanceof FirebaseError ? err.code : err);
      setError(signInErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <PageHeader title="Official sign in" backTo="/" />
      <main className="flex-1 px-4 py-4">
        {user ? (
          <p className="text-sm text-slate-600">Signed in as {user.email}.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-base font-normal px-4 border border-slate-200 rounded-lg"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base font-normal px-4 border border-slate-200 rounded-lg"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="min-h-14 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </main>
    </PageLayout>
  );
}
