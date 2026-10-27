import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/authContext';
import { deleteEvent, subscribeLeagueRounds } from '../events/eventsRepo';
import type { EventDetail } from '../events/eventDoc';
import {
  MAX_ROUNDS,
  isLeagueKey,
  leagueName,
  seasonIdFor,
  seasonIdLabel,
  seasonStartYear,
  type LeagueKey,
} from '../seasons/seasons';
import { computeSeasonStandings, standingsPositions } from '../seasons/seasonStandings';
import type { DisciplineKey } from '../domain/types';
import { DisciplineTabs } from '../components/layout/DisciplineTabs';
import { SeasonStandingsTable } from '../components/season/SeasonStandingsTable';
import { LeagueTeamsEditor } from '../components/season/LeagueTeamsEditor';
import { ConfirmButton } from '../components/shared/ConfirmButton';
import {
  addLeagueTeams,
  removeLeagueTeam,
  subscribeLeagueTeams,
  subscribeSeasonExists,
} from '../seasons/seasonsRepo';
import { emptyLeagueTeams, type LeagueTeams } from '../seasons/leagueTeams';
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
  const { user, isApproved } = useAuth();
  const [rounds, setRounds] = useState<EventDetail[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [lastSeasonRounds, setLastSeasonRounds] = useState<EventDetail[]>([]);
  const [discipline, setDiscipline] = useState<DisciplineKey>('mixed');
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeams>(emptyLeagueTeams);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Bumped by Retry: Firestore stops a listener after an error.
  const [attempt, setAttempt] = useState(0);

  // Last season's final table breaks ties on equal points, as in the sheet.
  const startYear = seasonStartYear(seasonId);
  const lastSeasonId = startYear === null ? null : seasonIdFor(startYear - 1);
  useEffect(() => {
    if (!lastSeasonId) return;
    return subscribeLeagueRounds(
      lastSeasonId,
      league,
      (list) => setLastSeasonRounds(list),
      // Standings still work without it, just without that tiebreak.
      (err) => console.error('Last season rounds subscription failed', { lastSeasonId, league }, err)
    );
  }, [lastSeasonId, league, attempt]);

  // Rounds can only be created in a season that exists (firestore.rules).
  const [seasonExists, setSeasonExists] = useState<boolean | null>(null);
  useEffect(
    () =>
      subscribeSeasonExists(seasonId, setSeasonExists, (err) =>
        console.error('Season lookup failed', { seasonId }, err)
      ),
    [seasonId, attempt]
  );

  useEffect(
    () =>
      subscribeLeagueTeams(seasonId, league, setLeagueTeams, (err) => {
        console.error('League teams subscription failed', { seasonId, league }, err);
        setTeamsError(withErrorCode('Could not load the league teams.', err));
      }),
    [seasonId, league, attempt]
  );

  // Writes are queued offline and the list updates at once from the local
  // cache, so they are not awaited; a rejection is rolled back and shown.
  function reportTeamsWriteError(err: unknown) {
    console.error('League teams change failed', { seasonId, league }, err);
    setTeamsError(withErrorCode('A change to the league teams could not be saved.', err));
  }

  // Not awaited, like the team list writes: the round is archived and drops
  // out of the list from the local cache, and comes back with an error if the
  // server refuses.
  function removeRound(round: EventDetail) {
    if (!user) return;
    setDeleteError(null);
    deleteEvent(round.id, user.uid).catch((err) => {
      console.error('Round delete failed', { id: round.id }, err);
      setDeleteError(withErrorCode(`${round.name} could not be deleted.`, err));
    });
  }

  const standings = useMemo(() => {
    if (!rounds) return null;
    const lastSeason = standingsPositions(computeSeasonStandings(lastSeasonRounds, discipline));
    return computeSeasonStandings(rounds, discipline, lastSeason);
  }, [rounds, lastSeasonRounds, discipline]);

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
              className="min-h-11 px-3 text-sm font-semibold text-brand-600"
            >
              Retry
            </button>
          </div>
        )}
        {error === null && rounds === null && <p className="text-sm text-slate-500">Loading rounds...</p>}
        {seasonExists === false && (
          <p className="text-sm text-slate-500">This season does not exist.</p>
        )}

        {deleteError && (
          <p role="alert" className="text-sm text-red-600">
            {deleteError}
          </p>
        )}
        {rounds && (
          <ul className="flex flex-col gap-2">
            {ROUND_NUMBERS.map((n) => {
              const round = byNumber.get(n);
              if (round) {
                return (
                  <li key={n} className="flex items-stretch gap-2">
                    <Link
                      to={`/events/${round.id}`}
                      className="flex-1 min-w-0 block bg-white border border-slate-200 rounded-sm px-4 py-3 min-h-14"
                    >
                      <span className="block text-base font-semibold text-slate-900">{round.name}</span>
                      <span className="block text-sm text-slate-500">{formatEventDate(round.date)}</span>
                    </Link>
                    {isApproved && (
                      <ConfirmButton
                        label={`Delete R${n}`}
                        confirmLabel={`Confirm delete R${n}`}
                        onConfirm={() => removeRound(round)}
                        className="w-24 shrink-0"
                      />
                    )}
                  </li>
                );
              }
              return (
                <li
                  key={n}
                  className="flex items-center gap-2 border border-dashed border-slate-300 rounded-sm px-4 min-h-14"
                >
                  <span className="flex-1 text-base text-slate-400">R{n} not set up</span>
                  {isApproved && seasonExists && (
                    <Link
                      to={`${basePath}/new?round=${n}`}
                      className="min-h-11 flex items-center px-2 text-sm font-semibold text-brand-600"
                    >
                      Set up R{n}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {standings && (
          <section className="flex flex-col gap-2 mt-4" aria-label="Season standings">
            <h2 className="text-lg font-semibold text-slate-900">Season standings</h2>
            <DisciplineTabs active={discipline} onSelect={setDiscipline} />
            <SeasonStandingsTable rows={standings} />
            {teamsError && (
              <p role="alert" className="text-sm text-red-600">
                {teamsError}
              </p>
            )}
            <LeagueTeamsEditor
              names={leagueTeams[discipline]}
              canEdit={isApproved}
              onAdd={(names) =>
                addLeagueTeams(seasonId, league, discipline, names).catch(reportTeamsWriteError)
              }
              onRemove={(name) =>
                removeLeagueTeam(seasonId, league, discipline, name).catch(reportTeamsWriteError)
              }
            />
          </section>
        )}
      </main>
    </PageLayout>
  );
}
