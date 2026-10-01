import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/authContext';
import { EditAccessContext } from '../auth/editAccess';
import { AppShell } from '../components/layout/AppShell';
import { startEventSync } from '../events/eventSync';
import { subscribeEvent, writeDiscipline } from '../events/eventsRepo';
import type { EventSummary } from '../events/eventDoc';
import { useEventStore } from '../store/eventStore';
import { PageHeader, PageLayout } from './PageLayout';
import { formatEventDate } from './formatEventDate';

type Status = 'loading' | 'ready' | 'not-found' | 'error';

export function EventPage() {
  const { id = '' } = useParams();
  // Remount per event so all state starts fresh when the id changes.
  return <EventView key={id} id={id} />;
}

function EventView({ id }: { id: string }) {
  const { isApproved } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [saveError, setSaveError] = useState(false);

  // Read through a ref so approval changes take effect without restarting
  // the Firestore subscription.
  const canWriteRef = useRef(isApproved);
  useEffect(() => {
    canWriteRef.current = isApproved;
  }, [isApproved]);

  useEffect(() => {
    return startEventSync(useEventStore, {
      subscribe: (onDisciplines, onError) =>
        subscribeEvent(
          id,
          (event) => {
            setStatus(event ? 'ready' : 'not-found');
            setSummary(event);
            onDisciplines(event?.disciplines ?? null);
          },
          (err) => {
            setStatus('error');
            onError(err);
          }
        ),
      writeDiscipline: (key, state) => writeDiscipline(id, key, state),
      canWrite: () => canWriteRef.current,
      onError: (err) => {
        console.error('Event sync error', err);
        setSaveError(true);
      },
    });
  }, [id]);

  if (status !== 'ready' || !summary) {
    const message = {
      loading: 'Loading round...',
      'not-found': 'This round does not exist.',
      error: 'Could not load this round. Check your connection.',
      ready: '',
    }[status];
    return (
      <PageLayout>
        <PageHeader title="Round" backTo="/" />
        <main className="flex-1 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">{message}</p>
          {status !== 'loading' && (
            <Link to="/" className="inline-block mt-4 text-sm font-semibold text-blue-600">
              All rounds
            </Link>
          )}
        </main>
      </PageLayout>
    );
  }

  const header = (
    <>
      <PageHeader
        title={summary.name}
        subtitle={`${formatEventDate(summary.date)}${isApproved ? '' : ' · View only'}`}
        backTo="/"
      />
      {saveError && (
        <p role="alert" className="bg-red-50 text-red-700 text-sm px-4 py-2">
          A change could not be saved. Your account may not have permission.
        </p>
      )}
    </>
  );

  return (
    <EditAccessContext.Provider value={isApproved}>
      <AppShell header={header} />
    </EditAccessContext.Provider>
  );
}
