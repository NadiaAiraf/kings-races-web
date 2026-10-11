import { useState } from 'react';
import { clsx } from 'clsx';

interface CarryOverTeamsProps {
  /** League teams in seeding order (see seedingOrder). */
  names: string[];
  max: number;
  onConfirm: (names: string[]) => void;
}

// Natural order, so "UCL 2" comes before "UCL 10".
const alphabetical = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/**
 * The league's teams A-Z, for an official to tick who has turned up.
 * The ticked teams are entered in seeding order, so the league standings
 * decide the seeding however the list is shown.
 */
export function CarryOverTeams({ names, max, onConfirm }: CarryOverTeamsProps) {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const present = names.filter((n) => ticked.has(n));
  const listed = [...names].sort(alphabetical);
  const overLimit = present.length > max;

  function toggle(name: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <section
      aria-label="League teams"
      className="flex flex-col gap-2 bg-white border border-slate-200 rounded-lg p-3"
    >
      <h3 className="text-base font-semibold text-slate-900">League teams</h3>
      <p className="text-sm text-slate-500">
        Tick each team that has turned up. Teams are seeded from the league standings when
        entered. Add new teams below afterwards.
      </p>
      <ul>
        {listed.map((name) => (
          <li key={name}>
            <label className="flex items-center gap-3 min-h-12 border-b border-slate-100">
              <input
                type="checkbox"
                checked={ticked.has(name)}
                onChange={() => toggle(name)}
                className="h-5 w-5"
              />
              <span
                className={clsx(
                  'flex-1 text-base',
                  ticked.has(name) ? 'text-slate-900' : 'text-slate-500'
                )}
              >
                {name}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {overLimit && <p className="text-sm text-red-600">Maximum {max} teams. Untick some teams.</p>}
      <button
        type="button"
        onClick={() => onConfirm(present)}
        disabled={present.length === 0 || overLimit}
        className="min-h-12 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-40"
      >
        Enter {present.length} {present.length === 1 ? 'team' : 'teams'}
      </button>
    </section>
  );
}
