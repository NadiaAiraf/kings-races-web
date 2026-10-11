import { useEffect, useMemo, useState } from 'react';
import type { EventDetail } from '../events/eventDoc';
import { subscribeLeagueRounds } from '../events/eventsRepo';
import { seasonIdFor, seasonStartYear, type SeasonRound } from './seasons';
import type { LeagueRounds } from './leagueRounds';

/**
 * Live rounds of a season round's league, this season and last. Null
 * outside a season or until this season's rounds have loaded. Last season
 * only feeds tiebreaks and R1 seeding, so its errors are only logged.
 */
export function useLeagueRounds(round: SeasonRound | null): LeagueRounds | null {
  const seasonId = round?.seasonId ?? null;
  const league = round?.league ?? null;
  const startYear = seasonId === null ? null : seasonStartYear(seasonId);
  const lastSeasonId = startYear === null ? null : seasonIdFor(startYear - 1);

  const [season, setSeason] = useState<EventDetail[] | null>(null);
  const [lastSeason, setLastSeason] = useState<EventDetail[]>([]);

  useEffect(() => {
    if (!seasonId || !league) return;
    return subscribeLeagueRounds(seasonId, league, setSeason, (err) =>
      console.error('Season rounds subscription failed', { seasonId, league }, err)
    );
  }, [seasonId, league]);

  useEffect(() => {
    if (!lastSeasonId || !league) return;
    return subscribeLeagueRounds(lastSeasonId, league, setLastSeason, (err) =>
      console.error('Last season rounds subscription failed', { lastSeasonId, league }, err)
    );
  }, [lastSeasonId, league]);

  return useMemo(() => (season ? { season, lastSeason } : null), [season, lastSeason]);
}
