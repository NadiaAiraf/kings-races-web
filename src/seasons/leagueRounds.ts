import { createContext, useContext, useMemo } from 'react';
import type { DisciplineKey } from '../domain/types';
import { useEventInfo } from '../events/eventInfo';
import { seedingOrder, type StandingsRound } from './seasonStandings';
import type { LeagueTeams } from './leagueTeams';

/** The open round's league rounds, this season and last, and its team list. */
export interface LeagueRounds {
  season: StandingsRound[];
  lastSeason: StandingsRound[];
  teams: LeagueTeams;
}

/**
 * Provided by EventPage for a season round once this season's rounds have
 * loaded; null otherwise. Keeps Firestore out of the components.
 */
export const LeagueRoundsContext = createContext<LeagueRounds | null>(null);

/**
 * Seeding order for the open round's teams in one discipline (see
 * seedingOrder). Null outside a season round or until its rounds load.
 */
export function useSeedingOrder(discipline: DisciplineKey): string[] | null {
  const roundNumber = useEventInfo()?.round?.roundNumber ?? null;
  const rounds = useContext(LeagueRoundsContext);
  return useMemo(() => {
    if (roundNumber === null || !rounds) return null;
    return seedingOrder(
      roundNumber,
      rounds.season,
      rounds.lastSeason,
      discipline,
      rounds.teams[discipline]
    );
  }, [roundNumber, rounds, discipline]);
}
