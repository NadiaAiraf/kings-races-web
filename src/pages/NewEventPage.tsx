import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/authContext';
import { createEvent } from '../events/eventsRepo';
import { MAX_EVENT_NAME_LENGTH, validateNewEvent } from '../events/eventDoc';
import { toLocalIsoDate } from '../lib/dates';
import { PageHeader, PageLayout } from './PageLayout';

export function NewEventPage() {
  const { user, isApproved, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => toLocalIsoDate(new Date()));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !isApproved) return;
    const input = { name, date };
    const validationError = validateNewEvent(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    // Navigate straight away: the write is queued locally and syncs when
    // online. If the server rejects it, the event page shows it as lost.
    const { id, committed } = createEvent(input, user.uid);
    committed.catch((err) => console.error('Failed to create event', { eventId: id }, err));
    navigate(`/events/${id}`, { replace: true });
  }

  let body;
  if (loading) {
    body = <p className="text-sm text-slate-500">Checking your account...</p>;
  } else if (!isApproved) {
    body = (
      <p className="text-sm text-slate-600">
        Only approved officials can create rounds.{' '}
        {!user && (
          <Link to="/login" className="font-semibold text-blue-600">
            Sign in
          </Link>
        )}
      </p>
    );
  } else {
    body = (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Round 1 - Hemel"
            maxLength={MAX_EVENT_NAME_LENGTH}
            className="h-12 text-base font-normal px-4 border border-slate-200 rounded-lg"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 text-base font-normal px-4 border border-slate-200 rounded-lg"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="min-h-14 rounded-lg bg-blue-600 text-white font-semibold">
          Create round
        </button>
      </form>
    );
  }

  return (
    <PageLayout>
      <PageHeader title="New round" backTo="/" />
      <main className="flex-1 px-4 py-4">{body}</main>
    </PageLayout>
  );
}
