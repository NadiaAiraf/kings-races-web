import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import type { DisciplineKey } from '../../domain/types';

interface TiedTeam {
  slot: number;
  name: string;
  points: number;
}

interface TiebreakResolverProps {
  discipline: DisciplineKey;
  groupKey: string;
  tiedTeams: TiedTeam[];
  onResolved: () => void;
}

export function TiebreakResolver({
  discipline,
  groupKey,
  tiedTeams,
  onResolved,
}: TiebreakResolverProps) {
  const [orderedTeams, setOrderedTeams] = useState<TiedTeam[]>(tiedTeams);

  function moveUp(index: number) {
    if (index <= 0) return;
    const next = [...orderedTeams];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setOrderedTeams(next);
  }

  function moveDown(index: number) {
    if (index >= orderedTeams.length - 1) return;
    const next = [...orderedTeams];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setOrderedTeams(next);
  }

  function handleConfirm() {
    const orderedSlots = orderedTeams.map((t) => t.slot);
    useEventStore.getState().setManualTiebreak(discipline, groupKey, orderedSlots);
    onResolved();
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h3 className="text-base font-semibold text-amber-900 mb-3">
        Resolve Tie: Group {groupKey}
      </h3>
      <p className="text-sm text-amber-700 mb-3">
        These teams are tied on {orderedTeams[0]?.points ?? 0} pts. Drag to set final order (1st = highest).
      </p>
      <div className="flex flex-col gap-2">
        {orderedTeams.map((team, idx) => (
          <div
            key={team.slot}
            className="flex items-center gap-2 bg-white border border-amber-100 rounded-md px-3 min-h-[56px]"
          >
            <span className="text-sm font-bold text-amber-800 w-6">
              {idx + 1}.
            </span>
            <span className="flex-1 text-sm font-medium text-slate-800 truncate">
              {team.name}
            </span>
            <span className="text-xs text-slate-500 mr-1">
              {team.points} pts
            </span>
            <button
              type="button"
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-lg font-bold ${
                idx === 0
                  ? 'text-slate-300 pointer-events-none opacity-30'
                  : 'text-amber-700 active:bg-amber-100'
              }`}
              aria-label={`Move ${team.name} up`}
            >
              {'\u25B2'}
            </button>
            <button
              type="button"
              onClick={() => moveDown(idx)}
              disabled={idx === orderedTeams.length - 1}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-lg font-bold ${
                idx === orderedTeams.length - 1
                  ? 'text-slate-300 pointer-events-none opacity-30'
                  : 'text-amber-700 active:bg-amber-100'
              }`}
              aria-label={`Move ${team.name} down`}
            >
              {'\u25BC'}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        className="mt-4 w-full min-h-[44px] bg-amber-600 text-white font-semibold rounded-lg active:bg-amber-700"
      >
        Confirm Order
      </button>
    </div>
  );
}
