import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import type { DisciplineKey, TeamStanding } from '../../domain/types';
import { useCanEdit } from '../../auth/editAccess';
import { isValidManualOrder, orderStandings } from '../../hooks/groupOrder';

interface TiebreakResolverProps {
  discipline: DisciplineKey;
  /** Storage key: group letter for Round 1, r2TiebreakKey(groupNum) for Round 2. */
  groupKey: string;
  label: string;
  /** The group's standings by points alone. */
  standings: TeamStanding[];
  savedOrder: number[] | undefined;
  teamNames: Map<number, string>;
  /** False once the next stage has started, so seeding can no longer move. */
  canChange: boolean;
}

/**
 * Lets an official complete a group whose teams are level on points by
 * setting the finishing order. Only teams tied on points can swap places;
 * the whole group's order is saved so seeding lookups read it directly.
 */
export function TiebreakResolver({
  discipline,
  groupKey,
  label,
  standings,
  savedOrder,
  teamNames,
  canChange,
}: TiebreakResolverProps) {
  const canEdit = useCanEdit();
  const isResolved = isValidManualOrder(standings, savedOrder);
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<TeamStanding[]>(() => orderStandings(standings, savedOrder));

  const name = (slot: number) => teamNames.get(slot) ?? `Team ${slot}`;

  if (!canEdit) {
    if (isResolved) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
        <h3 className="text-base font-semibold text-amber-900 mb-1">Tie: {label}</h3>
        <p className="text-sm text-amber-700">Waiting for an official to set the finishing order.</p>
      </div>
    );
  }

  if (isResolved && !editing) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{label}: order set manually</h3>
          {canChange && (
            <button
              type="button"
              onClick={() => {
                setOrder(orderStandings(standings, savedOrder));
                setEditing(true);
              }}
              className="min-h-11 px-2 text-sm font-semibold text-blue-600"
            >
              Change
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {savedOrder.map((slot, i) => `${i + 1}. ${name(slot)}`).join('  ')}
        </p>
      </div>
    );
  }

  const tiedWithNext = (i: number) =>
    i < order.length - 1 && order[i].points === order[i + 1].points;

  function swap(i: number) {
    const next = [...order];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setOrder(next);
  }

  function handleConfirm() {
    useEventStore.getState().setManualTiebreak(
      discipline,
      groupKey,
      order.map((t) => t.slot)
    );
    setEditing(false);
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
      <h3 className="text-base font-semibold text-amber-900 mb-1">Resolve tie: {label}</h3>
      <p className="text-sm text-amber-700 mb-3">
        Teams level on points can be moved. Set the finishing order, then confirm to complete the
        group.
      </p>
      <div className="flex flex-col gap-2">
        {order.map((team, idx) => (
          <div
            key={team.slot}
            className="flex items-center gap-2 bg-white border border-amber-100 rounded-md px-3 min-h-[56px]"
          >
            <span className="text-sm font-bold text-amber-800 w-6">{idx + 1}.</span>
            <span className="flex-1 text-sm font-medium text-slate-800 truncate">
              {name(team.slot)}
            </span>
            <span className="text-xs text-slate-500 mr-1">{team.points} pts</span>
            {idx > 0 && tiedWithNext(idx - 1) ? (
              <button
                type="button"
                onClick={() => swap(idx - 1)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-lg font-bold text-amber-700 active:bg-amber-100"
                aria-label={`Move ${name(team.slot)} up`}
              >
                {'▲'}
              </button>
            ) : (
              <span className="min-w-[44px]" aria-hidden="true" />
            )}
            {tiedWithNext(idx) ? (
              <button
                type="button"
                onClick={() => swap(idx)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-lg font-bold text-amber-700 active:bg-amber-100"
                aria-label={`Move ${name(team.slot)} down`}
              >
                {'▼'}
              </button>
            ) : (
              <span className="min-w-[44px]" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleConfirm}
        className="mt-4 w-full min-h-[44px] bg-amber-600 text-white font-semibold rounded-lg active:bg-amber-700"
      >
        Confirm order
      </button>
    </div>
  );
}
