import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/authContext';
import { createSeason, subscribeSeasons } from '../seasons/seasonsRepo';
import {
  availableSeasonYears,
  currentSeasonStartYear,
  seasonIdFor,
  seasonLabel,
} from '../seasons/seasons';
import { PageHeader, PageLayout } from './PageLayout';
import { withErrorCode } from '../lib/firebaseErrors';

export function NewSeasonPage() {
  const { user, isApproved, loading } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<number[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [chosen, setChosen] = useState<number | null>(null);

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

  const years = existing ? availableSeasonYears(existing, new Date()) : [];
  const current = currentSeasonStartYear(new Date());
  const startYear = chosen ?? (years.includes(current) ? current : years[0]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !isApproved || startYear === undefined) return;
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
          <Link to="/login" className="font-semibold text-blue-600">
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
  } else if (startYear === undefined) {
    body = <p className="text-sm text-slate-500">Every season up to next year already exists.</p>;
  } else {
    body = (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          Season
          <select
            value={startYear}
            onChange={(e) => setChosen(Number(e.target.value))}
            className="h-12 text-base font-normal px-4 border border-slate-200 rounded-lg bg-white"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {seasonLabel(y)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-14 rounded-lg bg-blue-600 text-white font-semibold">
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
