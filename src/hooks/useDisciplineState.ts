import { useMemo } from 'react';
import { useEventStore } from '../store/eventStore';
import { getCheatSheet } from '../domain/cheatSheets';
import type { DisciplineKey, TournamentStructure } from '../domain/types';

export function useDisciplineState(discipline: DisciplineKey) {
  const { teams, teamCount, scores, phase, manualTiebreaks } = useEventStore(
    (s) => s.disciplines[discipline]
  );

  const structure: TournamentStructure | null = useMemo(() => {
    if (teamCount >= 4) {
      return getCheatSheet(teamCount);
    }
    return null;
  }, [teamCount]);

  return { teams, teamCount, scores, phase, structure, manualTiebreaks };
}
