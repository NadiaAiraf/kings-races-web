import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/authContext';
import { createSeason, subscribeSeasons } from '../seasons/seasonsRepo';
import {
  parseSeasonStartYear,
  seasonIdFor,
  seasonLabel,
  suggestedSeasonStartYear,
} from '../seasons/seasons';
import { PageHeader, PageLayout } from './PageLayout';
import { withErrorCode } from '../lib/firebaseErrors';

export function NewSeasonPage() {
  const { user, isApproved, loading } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<number[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  // What the official typed; null shows the suggested year until they type.
  const [typed, setTyped] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeSeasons(
        (list) => setExisting(list.map((s) => s.startYear)),
        (err) => {
          console.error('Season list subscription failed', err);
          setLoadError(err);
        }
      ),
    []
  );

  const input = typed ?? (existing ? String(suggestedSeasonStartYear(existing, new Date())) : '');
  const parsed = existing ? parseSeasonStartYear(input, existing) : null;
  const preview = parsed && 'year' in parsed ? seasonLabel(parsed.year) : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !isApproved || !parsed) return;
    if ('error' in parsed) {
      setError(parsed.error);
      return;
    }
    const startYear = parsed.year;
    // Like rounds, the write is queued locally and syncs when online.
    const { id, committed } = createSeason(startYear, user.uid);
    committed.catch((err) => console.error('Failed to create season', { seasonId: id }, err));
    navigate(`/?season=${seasonIdFor(startYear)}`, { replace: true });
  }

  let body;
  if (loading) {
    body = <p className="text-sm text-slate-500">Checking your account...</p>;
  } else if (!isApproved) {
    body = (
      <p className="text-sm text-slate-600">
        Only approved officials can create seasons.{' '}
        {!user && (
          <Link to="/login" className="font-semibold text-brand-600">
            Sign in
          </Link>
        )}
      </p>
    );
  } else if (loadError !== null) {
    body = (
      <p className="text-sm text-red-600">
        {withErrorCode('Could not load seasons. Check your connection.', loadError)}
      </p>
    );
  } else if (existing === null) {
    body = <p className="text-sm text-slate-500">Loading seasons...</p>;
  } else {
    body = (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          Year the season starts
          <input
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => {
              setTyped(e.target.value);
              setError(null);
            }}
            placeholder="e.g. 2026"
            maxLength={4}
            className="h-12 text-base font-normal px-4 border border-slate-200 rounded-sm"
          />
        </label>
        {preview && <p className="text-sm text-slate-600">Creates season {preview}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="min-h-14 rounded-sm bg-brand-600 text-white font-semibold">
          Create season
        </button>
      </form>
    );
  }

  return (
    <PageLayout>
      <PageHeader title="New season" backTo="/" backLabel="Back to leagues" />
      <main className="flex-1 px-4 py-4">{body}</main>
    </PageLayout>
  );
}
