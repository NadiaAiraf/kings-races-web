import { useFinalsState } from '../../hooks/useFinalsState';
import { useEventStore } from '../../store/eventStore';
import { FinalsBlockedBanner } from './FinalsBlockedBanner';
import { FinalsReadyBanner } from './FinalsReadyBanner';
import type { DisciplineKey } from '../../domain/types';

interface FinalsViewProps {
  discipline: DisciplineKey;
}

export function FinalsView({ discipline }: FinalsViewProps) {
  const finalsState = useFinalsState(discipline);
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);

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

  const { finalsPhase, finalsWithNames, totalFinals, scoredFinals } = finalsState;

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
        <FinalsBlockedBanner reason="ties" />
      )}

      {finalsPhase === 'ready' && (
        <FinalsReadyBanner onConfirm={handleConfirm} />
      )}

      {(finalsPhase === 'confirmed' || finalsPhase === 'all-scored') && (
        <div className="flex flex-col gap-4">
          {finalsWithNames.map((matchup) => (
            <div
              key={matchup.raceId}
              className="border border-slate-200 rounded-lg p-4 bg-white"
            >
              <p className="text-sm font-semibold text-slate-900">{matchup.label}</p>
              <p className="text-sm text-slate-500 mt-1">
                {matchup.homeRef} vs {matchup.awayRef}
              </p>
              <p className="text-xl font-semibold text-slate-900 mt-2">
                {matchup.homeTeamName} vs {matchup.awayTeamName}
              </p>
            </div>
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
