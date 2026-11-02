import { useEffect } from 'react';
import { useEventStore } from '../store/eventStore';
import type { DisciplineKey } from '../domain/types';
import { useDisciplineState } from './useDisciplineState';
import { useStandings } from './useStandings';
import { useFinalsState } from './useFinalsState';
import { areAllR1RacesScored } from '../domain/r2Seeding';

/** Moves one discipline's phase on when its scores say it has finished a stage. */
export function usePhaseTransitions(discipline: DisciplineKey): void {
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);
  const { scores, structure, phase } = useDisciplineState(discipline);
  const standingsResult = useStandings(discipline);
  const finalsState = useFinalsState(discipline);

  // These transitions run on every client, viewers included, because the
  // phase is derived from scores. Only approved clients persist them (via
  // startEventSync), and only the phase field is written, so several
  // approved devices making the same transition cannot overwrite scores.

  // Phase auto-transition: group-stage -> round-two
  useEffect(() => {
    if (
      (phase === 'group-stage' || phase === 'setup') &&
      structure &&
      structure.roundTwoGroups &&
      structure.roundTwoGroups.length > 0 &&
      areAllR1RacesScored(scores, structure) &&
      standingsResult
    ) {
      // Check no ties in any R1 group
      const anyTies = Object.values(standingsResult.tiesByGroup).some((t) => t);
      if (!anyTies) {
        setDisciplinePhase(discipline, 'round-two');
      }
    }
  }, [phase, structure, scores, standingsResult, discipline, setDisciplinePhase]);

  // Phase auto-transition: finals -> complete (when all finals scored)
  useEffect(() => {
    if (phase === 'finals' && finalsState && finalsState.finalsPhase === 'all-scored') {
      setDisciplinePhase(discipline, 'complete');
    }
  }, [phase, finalsState, discipline, setDisciplinePhase]);
}
