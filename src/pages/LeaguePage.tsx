import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/authContext';
import { subscribeLeagueRounds } from '../events/eventsRepo';
import type { EventDetail } from '../events/eventDoc';
import { MAX_ROUNDS, isLeagueKey, leagueName, seasonIdLabel, type LeagueKey } from '../seasons/seasons';
import { PageHeader, PageLayout } from './PageLayout';
import { formatEventDate } from '../lib/dates';
import { withErrorCode } from '../lib/firebaseErrors';

const ROUND_NUMBERS = Array.from({ length: MAX_ROUNDS }, (_, i) => i + 1);

export function LeaguePage() {
  const { seasonId = '', league = '' } = useParams();
  if (!isLeagueKey(league)) {
    return (
      <PageLayout>
        <PageHeader title="League" backTo="/" backLabel="Back to leagues" />
        <p className="flex-1 px-4 py-8 text-center text-sm text-slate-500">This league does not exist.</p>
      </PageLayout>
    );
  }
  return <LeagueView key={`${seasonId}:${league}`} seasonId={seasonId} league={league} />;
}

function LeagueView({ seasonId, league }: { seasonId: string; league: LeagueKey }) {
  const { isApproved } = useAuth();
  const [rounds, setRounds] = useState<EventDetail[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  // Bumped by Retry: Firestore stops a listener after an error.
  const [attempt, setAttempt] = useState(0);

  useEffect(
    () =>
      subscribeLeagueRounds(
        seasonId,
        league,
        (list) => {
          setRounds(list);
          setError(null);
        },
        (err) => {
          console.error('League rounds subscription failed', { seasonId, league }, err);
          setError(err);
        }
      ),
    [seasonId, league, attempt]
  );

  const byNumber = new Map(rounds?.map((r) => [r.round?.roundNumber, r]));
  const basePath = `/seasons/${seasonId}/${league}`;

  return (
    <PageLayout>
      <PageHeader
        title={leagueName(league)}
        subtitle={`Season ${seasonIdLabel(seasonId)}`}
        backTo={`/?season=${seasonId}`}
        backLabel="Back to leagues"
      />
      <main className="flex-1 px-4 py-4 flex flex-col gap-3">
        {error !== null && (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-red-600">
              {withErrorCode('Could not load rounds. Check your connection.', error)}
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
        {error === null && rounds === null && <p className="text-sm text-slate-500">Loading rounds...</p>}

        {rounds && (
          <ul className="flex flex-col gap-2">
            {ROUND_NUMBERS.map((n) => {
              const round = byNumber.get(n);
              if (round) {
                return (
                  <li key={n}>
                    <Link
                      to={`/events/${round.id}`}
                      className="block bg-white border border-slate-200 rounded-lg px-4 py-3 min-h-14"
                    >
                      <span className="block text-base font-semibold text-slate-900">{round.name}</span>
                      <span className="block text-sm text-slate-500">{formatEventDate(round.date)}</span>
                    </Link>
                  </li>
                );
              }
              return (
                <li
                  key={n}
                  className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg px-4 min-h-14"
                >
                  <span className="flex-1 text-base text-slate-400">R{n} not set up</span>
                  {isApproved && (
                    <Link
                      to={`${basePath}/new?round=${n}`}
                      className="min-h-11 flex items-center px-2 text-sm font-semibold text-blue-600"
                    >
                      Set up R{n}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </PageLayout>
  );
}
