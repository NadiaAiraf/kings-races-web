import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/authContext';
import { EditAccessContext } from '../auth/editAccess';
import { AppShell } from '../components/layout/AppShell';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { startEventSync } from '../events/eventSync';
import { subscribeEvent, writeDisciplineChanges } from '../events/eventsRepo';
import { EventInfoContext } from '../events/eventInfo';
import type { EventSummary } from '../events/eventDoc';
import { useEventStore } from '../store/eventStore';
import { PageHeader, PageLayout } from './PageLayout';
import { formatEventDate } from '../lib/dates';
import { canStoreOffline } from '../lib/offlineStorage';
import { isPermissionDenied, withErrorCode } from '../lib/firebaseErrors';

type View =
  | { status: 'loading' }
  | { status: 'ready'; event: EventSummary }
  | { status: 'not-found' }
  | { status: 'offline-missing' }
  | { status: 'lost' }
  | { status: 'error' };

const MESSAGES: Record<Exclude<View['status'], 'ready'>, string> = {
  loading: 'Loading round...',
  'not-found': 'This round does not exist.',
  'offline-missing': 'You are offline and this round has not been opened on this device yet.',
  lost: 'This round could not be saved or was removed. Changes made on this device were not kept.',
  error: 'Could not load this round. Check your connection.',
};

function saveErrorMessage(err: unknown): string {
  if (isPermissionDenied(err)) {
    return 'A change was rejected: this account is not allowed to score. It has been undone.';
  }
  return withErrorCode('A change could not be saved. It has been undone.', err);
}

export function EventPage() {
  const { id = '' } = useParams();
  const { user, loading } = useAuth();
  const [attempt, setAttempt] = useState(0);

  // Wait for the stored sign-in to resolve so a signed-in user does not mount
  // (and subscribe) twice on load.
  if (loading) {
    return (
      <PageLayout>
        <PageHeader title="Round" backTo="/" />
        <p className="flex-1 px-4 py-8 text-center text-sm text-slate-500">Loading round...</p>
      </PageLayout>
    );
  }

  // Remount per event, per retry and per signed-in user so state and
  // listeners start fresh. Pending writes are per user: after a user change an
  // offline-created round can briefly read as missing, and without the remount
  // it would be shown as "lost".
  return (
    <EventView
      key={`${id}:${attempt}:${user?.uid ?? ''}`}
      id={id}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

function EventView({ id, onRetry }: { id: string; onRetry: () => void }) {
  const { isApproved } = useAuth();
  const [view, setView] = useState<View>({ status: 'loading' });
  const [liveUpdatesStopped, setLiveUpdatesStopped] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canSaveOffline, setCanSaveOffline] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    let active = true;
    canStoreOffline().then((ok) => {
      if (active) setCanSaveOffline(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  // Read through a ref so approval changes take effect without restarting
  // the Firestore subscription. A layout effect updates it before AppShell's
  // passive effects (phase transitions) run in the same commit.
  const canWriteRef = useRef(isApproved);
  useLayoutEffect(() => {
    canWriteRef.current = isApproved;
  }, [isApproved]);

  useEffect(() => {
    return startEventSync(useEventStore, {
      subscribe: (onDisciplines, onError) =>
        subscribeEvent(
          id,
          (event, { fromCache }) => {
            if (event) {
              hasLoaded.current = true;
              setView({ status: 'ready', event });
              onDisciplines(event.disciplines);
            } else if (hasLoaded.current) {
              // e.g. an offline-created round the server later rejected
              setView({ status: 'lost' });
            } else {
              setView({ status: fromCache ? 'offline-missing' : 'not-found' });
            }
          },
          onError
        ),
      writeChanges: (key, changes) => writeDisciplineChanges(id, key, changes),
      canWrite: () => canWriteRef.current,
      onWriteError: (err, context) => {
        console.error('Failed to save change', { eventId: id, ...context }, err);
        setSaveError(saveErrorMessage(err));
      },
      onSubscribeError: (err) => {
        console.error('Event subscription failed', { eventId: id }, err);
        // Firestore stops a listener after an error. Keep showing the last
        // data if there is any, and offer a retry that re-subscribes.
        if (hasLoaded.current) {
          setLiveUpdatesStopped(withErrorCode('Live updates stopped.', err));
        } else {
          setLoadError(err);
          setView({ status: 'error' });
        }
      },
    });
  }, [id]);

  if (view.status !== 'ready') {
    return (
      <PageLayout>
        <PageHeader title="Round" backTo="/" />
        <main className="flex-1 px-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            {view.status === 'error' ? withErrorCode(MESSAGES.error, loadError) : MESSAGES[view.status]}
          </p>
          {view.status === 'error' && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-11 px-4 text-sm font-semibold text-blue-600"
            >
              Retry
            </button>
          )}
          {view.status !== 'loading' && (
            <Link to="/" className="block mt-4 text-sm font-semibold text-blue-600">
              All rounds
            </Link>
          )}
        </main>
      </PageLayout>
    );
  }

  const { event } = view;
  const header = (
    <>
      <PageHeader
        title={event.name}
        subtitle={`${formatEventDate(event.date)}${isApproved ? '' : ' · View only'}`}
        backTo="/"
      />
      {isApproved && !canSaveOffline && (
        <p role="alert" className="bg-amber-50 text-amber-800 text-sm px-4 py-2">
          This browser cannot save results offline. Stay connected while scoring.
        </p>
      )}
      {liveUpdatesStopped && (
        <div role="alert" className="flex items-center gap-2 bg-amber-50 text-amber-800 text-sm px-4 py-2">
          <span className="flex-1">{liveUpdatesStopped}</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-2 font-semibold">
            Retry
          </button>
        </div>
      )}
      {saveError && (
        <div role="alert" className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-2">
          <span className="flex-1">{saveError}</span>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            className="min-h-11 px-2 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );

  return (
    <EventInfoContext.Provider value={event}>
      <EditAccessContext.Provider value={isApproved}>
        <ErrorBoundary
          fallback={
            <PageLayout>
              {header}
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">Something went wrong showing this round.</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 min-h-11 px-4 text-sm font-semibold text-blue-600"
                >
                  Retry
                </button>
              </div>
            </PageLayout>
          }
        >
          <AppShell header={header} />
        </ErrorBoundary>
      </EditAccessContext.Provider>
    </EventInfoContext.Provider>
  );
}
