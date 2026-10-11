import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '../auth/authContext';
import { subscribeSeasons } from '../seasons/seasonsRepo';
import { LEAGUES, seasonLabel, type Season } from '../seasons/seasons';
import { PageHeader, PageLayout } from './PageLayout';
import logoUrl from '../assets/kings-ski-club-logo.png';
import { withErrorCode } from '../lib/firebaseErrors';

const CLOSED = 'none';

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
        },
      ),
    [attempt],
  );

  // The chosen season lives in the URL so Back returns to it.
  // The open season lives in the URL so Back returns to it. The newest is
  // open by default; CLOSED means the official collapsed it.
  const requested = searchParams.get('season');
  const openId =
    requested === CLOSED
      ? null
      : ((seasons?.find((s) => s.id === requested) ?? seasons?.[0])?.id ?? null);

  function toggle(seasonId: string) {
    setSearchParams({ season: seasonId === openId ? CLOSED : seasonId }, { replace: true });
  }

  return (
    <PageLayout>
      <PageHeader title="Kings Races" subtitle="Leagues" />
      <main className="flex-1 px-4 py-4 flex flex-col gap-3">
        <img
          src={logoUrl}
          alt="Kings Ski Club, est. 1978"
          className="self-center w-56 max-w-full h-auto my-2"
        />
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
              className="min-h-11 px-3 text-sm font-semibold text-brand-600"
            >
              Retry
            </button>
          </div>
        )}
        {error === null && seasons === null && (
          <p className="text-sm text-slate-500">Loading seasons...</p>
        )}
        {seasons?.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            {fromCache
              ? 'You are offline. Seasons appear here once you reconnect.'
              : 'No seasons yet.'}
          </p>
        )}

        {seasons && seasons.length > 0 && (
          <ul className="flex flex-col gap-2">
            {seasons.map((s) => {
              const open = s.id === openId;
              return (
                <li key={s.id} className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-expanded={open}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-sm px-4 min-h-14 text-base font-semibold text-slate-900"
                  >
                    Season {seasonLabel(s.startYear)}
                    <span aria-hidden="true" className="text-slate-400">
                      {open ? '▾' : '▸'}
                    </span>
                  </button>
                  {open && (
                    <ul
                      className="flex flex-col gap-2 pl-4"
                      aria-label={`Leagues in ${seasonLabel(s.startYear)}`}
                    >
                      {LEAGUES.map((league) => (
                        <li key={league.key}>
                          <Link
                            to={`/seasons/${s.id}/${league.key}`}
                            className="flex items-center bg-white border border-slate-200 rounded-sm px-4 min-h-12 text-base text-slate-900"
                          >
                            {league.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {isApproved && seasons !== null && (
          <Link
            to="/seasons/new"
            className="flex items-center justify-center min-h-14 rounded-sm border border-brand-600 text-brand-600 font-semibold"
          >
            New season
          </Link>
        )}
        <Link
          to="/rounds"
          className="self-center min-h-11 flex items-center text-sm font-semibold text-brand-600"
        >
          All rounds by date
        </Link>
      </main>
    </PageLayout>
  );
}
