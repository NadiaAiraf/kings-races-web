import { useEffect, useMemo, useState } from 'react';
import type { EventDetail } from '../events/eventDoc';
import { subscribeLeagueRounds } from '../events/eventsRepo';
import { seasonIdFor, seasonStartYear, type SeasonRound } from './seasons';
import type { LeagueRounds } from './leagueRounds';
import { subscribeLeagueTeams } from './seasonsRepo';
import { emptyLeagueTeams, type LeagueTeams } from './leagueTeams';

/**
 * Live rounds of a season round's league, this season and last, and the
 * league's team list. Null outside a season (pass null to stop listening) or
 * until all three have loaded, so seeding never runs on partial data. If
 * last season or the team list fails to load it counts as empty, so team
 * entry still works.
 */
export function useLeagueRounds(round: SeasonRound | null): LeagueRounds | null {
  const seasonId = round?.seasonId ?? null;
  const league = round?.league ?? null;
  const startYear = seasonId === null ? null : seasonStartYear(seasonId);
  const lastSeasonId = startYear === null ? null : seasonIdFor(startYear - 1);

  const [season, setSeason] = useState<EventDetail[] | null>(null);
  const [lastSeason, setLastSeason] = useState<EventDetail[] | null>(null);
  const [teams, setTeams] = useState<LeagueTeams | null>(null);

  useEffect(() => {
    if (!seasonId || !league) return;
    return subscribeLeagueTeams(seasonId, league, setTeams, (err) => {
      console.error('League teams subscription failed', { seasonId, league }, err);
      setTeams(emptyLeagueTeams());
    });
  }, [seasonId, league]);

  useEffect(() => {
    if (!seasonId || !league) return;
    return subscribeLeagueRounds(seasonId, league, setSeason, (err) =>
      console.error('Season rounds subscription failed', { seasonId, league }, err)
    );
  }, [seasonId, league]);

  useEffect(() => {
    if (!lastSeasonId || !league) return;
    return subscribeLeagueRounds(lastSeasonId, league, setLastSeason, (err) => {
      console.error('Last season rounds subscription failed', { lastSeasonId, league }, err);
      setLastSeason([]);
    });
  }, [lastSeasonId, league]);

  return useMemo(
    () => (season && lastSeason && teams ? { season, lastSeason, teams } : null),
    [season, lastSeason, teams]
  );
}
