import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../auth/authContext';
import { createEvent } from '../events/eventsRepo';
import { MAX_VENUE_LENGTH, seasonRoundName, validateNewEvent } from '../events/eventDoc';
import { MAX_ROUNDS, isLeagueKey, leagueName, seasonIdLabel } from '../seasons/seasons';
import { toLocalIsoDate } from '../lib/dates';
import { PageHeader, PageLayout } from './PageLayout';

export function NewEventPage() {
  const { user, isApproved, loading } = useAuth();
  const navigate = useNavigate();
  const { seasonId = '', league = '' } = useParams();
  const [searchParams] = useSearchParams();
  const roundNumber = Number(searchParams.get('round'));
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(() => toLocalIsoDate(new Date()));
  const [error, setError] = useState<string | null>(null);

  const leaguePath = `/seasons/${seasonId}/${league}`;
  const validRound =
    isLeagueKey(league) && Number.isInteger(roundNumber) && roundNumber >= 1 && roundNumber <= MAX_ROUNDS;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !isApproved || !validRound) return;
    const input = {
      name: seasonRoundName(roundNumber, venue),
      date,
      round: { seasonId, league, roundNumber, venue },
    };
    const validationError = validateNewEvent(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    // Navigate straight away: the write is queued locally and syncs when
    // online. If the server rejects it (e.g. another official set up this
    // round first), the event page shows it as lost.
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
  } else if (!validRound) {
    body = <p className="text-sm text-slate-500">This round cannot be set up.</p>;
  } else {
    body = (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          Venue
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Hemel"
            maxLength={MAX_VENUE_LENGTH}
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
          Create R{roundNumber}
        </button>
      </form>
    );
  }

  const title = validRound ? `New R${roundNumber}` : 'New round';
  const subtitle = isLeagueKey(league)
    ? `${leagueName(league)} · Season ${seasonIdLabel(seasonId)}`
    : undefined;

  return (
    <PageLayout>
      <PageHeader title={title} subtitle={subtitle} backTo={leaguePath} backLabel="Back to league" />
      <main className="flex-1 px-4 py-4">{body}</main>
    </PageLayout>
  );
}
