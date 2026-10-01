import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';
import { subscribeEvents } from '../events/eventsRepo';
import type { EventSummary } from '../events/eventDoc';
import { PageHeader, PageLayout } from './PageLayout';
import { formatEventDate } from '../lib/dates';
import { withErrorCode } from '../lib/firebaseErrors';

export function EventListPage() {
  const { user, isApproved, loading, approvalCheckFailed } = useAuth();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [fromCache, setFromCache] = useState(false);
  // Bumped by Retry: Firestore stops a listener after an error.
  const [attempt, setAttempt] = useState(0);

  useEffect(
    () =>
      subscribeEvents(
        (list, meta) => {
          setEvents(list);
          setFromCache(meta.fromCache);
          setError(null);
        },
        (err) => {
          console.error('Event list subscription failed', err);
          setError(err);
        }
      ),
    [attempt]
  );

  return (
    <PageLayout>
      <PageHeader title="Kings Races" subtitle="Rounds" />
      <main className="flex-1 px-4 py-4 flex flex-col gap-3">
        {isApproved && (
          <Link
            to="/events/new"
            className="flex items-center justify-center min-h-14 rounded-lg bg-blue-600 text-white font-semibold"
          >
            New round
          </Link>
        )}
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
        {error === null && events === null && <p className="text-sm text-slate-500">Loading rounds...</p>}
        {events?.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">
            {fromCache ? 'You are offline. Rounds appear here once you reconnect.' : 'No rounds yet.'}
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {events?.map((event) => (
            <li key={event.id}>
              <Link
                to={`/events/${event.id}`}
                className="block bg-white border border-slate-200 rounded-lg px-4 py-3 min-h-14"
              >
                <span className="block text-base font-semibold text-slate-900">{event.name}</span>
                <span className="block text-sm text-slate-500">{formatEventDate(event.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </PageLayout>
  );
}
