import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '../auth/authContext';
import { subscribeSeasons } from '../seasons/seasonsRepo';
import { LEAGUES, seasonLabel, type Season } from '../seasons/seasons';
import { PageHeader, PageLayout } from './PageLayout';
import { withErrorCode } from '../lib/firebaseErrors';

export function HomePage() {
  const { user, isApproved, loading, approvalCheckFailed } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [fromCache, setFromCache] = useState(false);
  // Bumped by Retry: Firestore stops a listener after an error.
  const [attempt, setAttempt] = useState(0);

  useEffect(
    () =>
      subscribeSeasons(
        (list, meta) => {
          setSeasons(list);
          setFromCache(meta.fromCache);
          setError(null);
        },
        (err) => {
          console.error('Season list subscription failed', err);
          setError(err);
        }
      ),
    [attempt]
  );

  // The chosen season lives in the URL so Back returns to it.
  const requested = searchParams.get('season');
  const season = seasons?.find((s) => s.id === requested) ?? seasons?.[0] ?? null;

  return (
    <PageLayout>
      <PageHeader title="Kings Races" subtitle="Leagues" />
      <main className="flex-1 px-4 py-4 flex flex-col gap-3">
        {user && !loading && !isApproved && (
          <p className="text-sm text-slate-500">
            {approvalCheckFailed
              ? 'Could not check whether this account can score. Reload the page when you are back online.'
              : `You are signed in as ${user.email}, but this account is not approved to score yet.`}
          </p>
        )}

        {error !== null && (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-red-600">
              {withErrorCode('Could not load seasons. Check your connection.', error)}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="min-h-11 px-3 text-sm font-semibold text-blue-600"
            >
              Retry
            </button>
          </div>
        )}
        {error === null && seasons === null && <p className="text-sm text-slate-500">Loading seasons...</p>}
        {seasons?.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            {fromCache ? 'You are offline. Seasons appear here once you reconnect.' : 'No seasons yet.'}
          </p>
        )}

        {season && seasons && (
          <>
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
              Season
              <select
                value={season.id}
                onChange={(e) => setSearchParams({ season: e.target.value }, { replace: true })}
                className="h-12 text-base font-normal px-4 border border-slate-200 rounded-lg bg-white"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {seasonLabel(s.startYear)}
                  </option>
                ))}
              </select>
            </label>
            <ul className="flex flex-col gap-2">
              {LEAGUES.map((league) => (
                <li key={league.key}>
                  <Link
                    to={`/seasons/${season.id}/${league.key}`}
                    className="flex items-center bg-white border border-slate-200 rounded-lg px-4 min-h-14 text-base font-semibold text-slate-900"
                  >
                    {league.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {isApproved && seasons !== null && (
          <Link
            to="/seasons/new"
            className="flex items-center justify-center min-h-14 rounded-lg border border-blue-600 text-blue-600 font-semibold"
          >
            New season
          </Link>
        )}
        <Link to="/rounds" className="self-center min-h-11 flex items-center text-sm font-semibold text-blue-600">
          All rounds by date
        </Link>
      </main>
    </PageLayout>
  );
}
