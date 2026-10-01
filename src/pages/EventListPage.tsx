import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/authContext';
import { subscribeEvents } from '../events/eventsRepo';
import type { EventSummary } from '../events/eventDoc';
import { PageHeader, PageLayout } from './PageLayout';
import { formatEventDate } from './formatEventDate';

export function EventListPage() {
  const { user, isApproved } = useAuth();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(
    () =>
      subscribeEvents(
        (list) => {
          setEvents(list);
          setError(false);
        },
        () => setError(true)
      ),
    []
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
        {user && !isApproved && (
          <p className="text-sm text-slate-500">
            You are signed in as {user.email}, but this account is not approved to score yet.
          </p>
        )}

        {error && <p className="text-sm text-red-600">Could not load rounds. Check your connection.</p>}
        {!error && events === null && <p className="text-sm text-slate-500">Loading rounds...</p>}
        {events?.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">No rounds yet.</p>
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
