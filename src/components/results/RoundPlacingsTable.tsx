import { useMemo } from 'react';
import type { DisciplineKey } from '../../domain/types';
import { computeRoundPlacings, leaguePoints, type PlacingSource } from '../../domain/roundPlacings';
import { useEventStore } from '../../store/eventStore';
import { useCanEdit } from '../../auth/editAccess';

const DISCIPLINE_DISPLAY: Record<DisciplineKey, string> = {
  mixed: 'Mixed',
  board: 'Board',
  ladies: 'Ladies',
};

const SOURCE_LABEL: Record<PlacingSource, string> = {
  final: 'Final',
  group: 'Group',
  official: 'Set by official',
};

interface RoundPlacingsTableProps {
  discipline: DisciplineKey;
}

/**
 * Every team's place and league points once the discipline is complete.
 * Officials can set a place to fill a gap the finals leave, or correct one.
 */
export function RoundPlacingsTable({ discipline }: RoundPlacingsTableProps) {
  const state = useEventStore((s) => s.disciplines[discipline]);
  const setPlacing = useEventStore((s) => s.setPlacing);
  const canEdit = useCanEdit();
  const placings = useMemo(() => computeRoundPlacings(state), [state]);

  if (!placings) return null;
  const missing = placings.filter((p) => p.place === null).length;
  const places = Array.from({ length: state.teamCount }, (_, i) => i + 1);

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
        Final Results: {DISCIPLINE_DISPLAY[discipline]}
      </h2>
      {missing > 0 && (
        <p role="status" className="text-sm text-amber-700 mb-2">
          {missing === 1 ? '1 team needs' : `${missing} teams need`} a place before league points
          are complete.
        </p>
      )}
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-slate-200">
            <th scope="col" className="px-2 py-2 text-left text-sm font-semibold text-slate-500">
              Place
            </th>
            <th scope="col" className="px-2 py-2 text-left text-sm font-semibold text-slate-500">
              Team
            </th>
            <th scope="col" className="px-2 py-2 text-right text-sm font-semibold text-slate-500">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {placings.map((p, index) => (
            <tr key={p.slot} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-2 py-2 w-24">
                {canEdit ? (
                  <select
                    aria-label={`Place for ${p.name}`}
                    value={p.source === 'official' ? String(p.place) : ''}
                    onChange={(e) =>
                      setPlacing(discipline, p.slot, e.target.value ? Number(e.target.value) : null)
                    }
                    className="min-h-11 w-full px-1 border border-slate-200 rounded-lg bg-white text-base"
                  >
                    <option value="">{p.computedPlace ? `${p.computedPlace} (auto)` : '?'}</option>
                    {places.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-mono text-base text-slate-700">{p.place ?? '?'}</span>
                )}
              </td>
              <td className="px-2 py-2">
                <span className="block text-base text-slate-900">{p.name}</span>
                <span className="block text-xs text-slate-500">
                  {p.source ? SOURCE_LABEL[p.source] : 'Needs a place'}
                </span>
              </td>
              <td className="px-2 py-2 text-right font-mono text-base text-slate-700">
                {p.place === null ? '-' : leaguePoints(discipline, p.place)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
