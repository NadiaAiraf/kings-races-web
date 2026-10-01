import { useRef, useCallback } from 'react';
import { useFinalsState } from '../../hooks/useFinalsState';
import { useStandings } from '../../hooks/useStandings';
import { useR2State } from '../../hooks/useR2State';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useEventStore } from '../../store/eventStore';
import { FinalsBlockedBanner } from './FinalsBlockedBanner';
import { FinalsReadyBanner } from './FinalsReadyBanner';
import { FinalsMatchupCard } from './FinalsMatchupCard';
import { GroupTiebreaks } from '../standings/GroupTiebreaks';
import { r2TiebreakKey } from '../../hooks/groupOrder';
import type { DisciplineKey } from '../../domain/types';

interface FinalsViewProps {
  discipline: DisciplineKey;
}

export function FinalsView({ discipline }: FinalsViewProps) {
  const finalsState = useFinalsState(discipline);
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);
  const standingsResult = useStandings(discipline);
  const r2State = useR2State(discipline);
  const { teams, manualTiebreaks } = useDisciplineState(discipline);

  // Create refs for each matchup card for scroll-to-next
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const scrollToNext = useCallback((currentIdx: number) => {
    if (!finalsState) return;
    // Find the next unscored matchup after the one just scored
    const nextUnscored = finalsState.finalsWithNames.findIndex(
      (m, i) => i > currentIdx && !m.score
    );
    if (nextUnscored >= 0) {
      const el = cardRefs.current.get(nextUnscored);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [finalsState]);

  if (!finalsState) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-base text-slate-500">No finals for this event size</p>
        <p className="text-sm text-slate-500 mt-2">
          Events with fewer than 4 teams in a group do not require finals.
        </p>
      </div>
    );
  }

  const { finalsPhase, finalsWithNames, totalFinals, scoredFinals, currentFinalsIndex } = finalsState;

  // No finals defined in structure
  if (totalFinals === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-base text-slate-500">No finals for this event size</p>
        <p className="text-sm text-slate-500 mt-2">
          Events with fewer than 4 teams in a group do not require finals.
        </p>
      </div>
    );
  }

  function handleConfirm() {
    setDisciplinePhase(discipline, 'finals');
  }

  return (
    <div className="flex flex-col gap-4">
      {finalsPhase === 'blocked-incomplete' && (
        <FinalsBlockedBanner reason="incomplete" />
      )}

      {finalsPhase === 'blocked-ties' && <FinalsBlockedBanner reason="ties" />}

      {(finalsPhase === 'blocked-ties' || finalsPhase === 'ready') && (
        <GroupTiebreaks
          discipline={discipline}
          groups={
            finalsState.hasR2
              ? (r2State?.r2Groups ?? []).map((g) => ({
                  key: r2TiebreakKey(g.groupNum),
                  label: `Round 2 Group ${g.groupNum}`,
                  standings: r2State?.r2RawStandings[g.groupNum] ?? [],
                }))
              : Object.entries(standingsResult?.rawStandings ?? {}).map(([letter, standings]) => ({
                  key: letter,
                  label: `Group ${letter}`,
                  standings,
                }))
          }
          manualTiebreaks={manualTiebreaks}
          teamNames={new Map(teams.map((t) => [t.slot, t.name]))}
          canChange
        />
      )}

      {finalsPhase === 'ready' && (
        <FinalsReadyBanner onConfirm={handleConfirm} />
      )}

      {(finalsPhase === 'confirmed' || finalsPhase === 'all-scored') && (
        <div className="flex flex-col gap-4">
          {finalsWithNames.map((matchup, idx) => (
            <FinalsMatchupCard
              key={matchup.raceId}
              ref={(el) => {
                if (el) cardRefs.current.set(idx, el);
              }}
              matchup={matchup}
              discipline={discipline}
              isActive={idx === currentFinalsIndex}
              canScore={finalsPhase === 'confirmed' || finalsPhase === 'all-scored'}
              onScored={() => scrollToNext(idx)}
            />
          ))}
        </div>
      )}

      {finalsPhase === 'all-scored' && (
        <div className="text-center py-4">
          <p className="text-lg font-semibold text-green-800">All finals scored!</p>
        </div>
      )}

      {totalFinals > 0 && (
        <p className="text-sm text-slate-500 text-center">
          Finals: {scoredFinals} of {totalFinals} scored
        </p>
      )}
    </div>
  );
}
