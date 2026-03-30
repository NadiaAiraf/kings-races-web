import { useRef, useCallback, createRef } from 'react';
import { useFinalsState } from '../../hooks/useFinalsState';
import { useStandings } from '../../hooks/useStandings';
import { useR2State } from '../../hooks/useR2State';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useEventStore } from '../../store/eventStore';
import { FinalsBlockedBanner } from './FinalsBlockedBanner';
import { FinalsReadyBanner } from './FinalsReadyBanner';
import { FinalsMatchupCard } from './FinalsMatchupCard';
import { TiebreakResolver } from '../standings/TiebreakResolver';
import type { DisciplineKey, TeamStanding } from '../../domain/types';

function getTiedClusters(standings: TeamStanding[]): TeamStanding[][] {
  const clusters: TeamStanding[][] = [];
  let i = 0;
  while (i < standings.length) {
    let j = i + 1;
    while (j < standings.length && standings[j].points === standings[i].points) j++;
    if (j - i > 1) clusters.push(standings.slice(i, j));
    i = j;
  }
  return clusters;
}

interface FinalsViewProps {
  discipline: DisciplineKey;
}

export function FinalsView({ discipline }: FinalsViewProps) {
  const finalsState = useFinalsState(discipline);
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);
  const standingsResult = useStandings(discipline);
  const r2State = useR2State(discipline);
  const { teams } = useDisciplineState(discipline);

  // Create refs for each matchup card for scroll-to-next
  const cardRefsRef = useRef<Map<number, React.RefObject<HTMLDivElement | null>>>(new Map());

  const getCardRef = useCallback((index: number) => {
    if (!cardRefsRef.current.has(index)) {
      cardRefsRef.current.set(index, createRef<HTMLDivElement>());
    }
    return cardRefsRef.current.get(index)!;
  }, []);

  const scrollToNext = useCallback((currentIdx: number) => {
    if (!finalsState) return;
    // Find the next unscored matchup after the one just scored
    const nextUnscored = finalsState.finalsWithNames.findIndex(
      (m, i) => i > currentIdx && !m.score
    );
    if (nextUnscored >= 0) {
      const ref = cardRefsRef.current.get(nextUnscored);
      ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

      {finalsPhase === 'blocked-ties' && (
        <>
          <FinalsBlockedBanner reason="ties" />
          {(() => {
            const teamMap = new Map(teams.map((t) => [t.slot, t.name]));
            const hasR2 = finalsState?.hasR2 ?? false;
            const tiesByGroup = hasR2
              ? (r2State?.r2TiesByGroup ?? {})
              : (standingsResult?.tiesByGroup ?? {});
            const standingsMap = hasR2
              ? (r2State?.r2Standings ?? {})
              : (standingsResult?.standings ?? {});

            return Object.entries(tiesByGroup)
              .filter(([, hasTie]) => hasTie)
              .map(([groupKey]) => {
                const groupStandings = standingsMap[groupKey] ?? [];
                const clusters = getTiedClusters(groupStandings);
                return clusters.map((cluster, ci) => (
                  <TiebreakResolver
                    key={`${groupKey}-${ci}`}
                    discipline={discipline}
                    groupKey={groupKey}
                    tiedTeams={cluster.map((s) => ({
                      slot: s.slot,
                      name: teamMap.get(s.slot) ?? `Team ${s.slot}`,
                      points: s.points,
                    }))}
                    onResolved={() => {}}
                  />
                ));
              });
          })()}
        </>
      )}

      {finalsPhase === 'ready' && (
        <FinalsReadyBanner onConfirm={handleConfirm} />
      )}

      {(finalsPhase === 'confirmed' || finalsPhase === 'all-scored') && (
        <div className="flex flex-col gap-4">
          {finalsWithNames.map((matchup, idx) => (
            <FinalsMatchupCard
              key={matchup.raceId}
              ref={getCardRef(idx)}
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
