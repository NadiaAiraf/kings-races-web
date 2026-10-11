import { useState } from 'react';
import { clsx } from 'clsx';

interface CarryOverTeamsProps {
  /** League teams in seeding order. */
  names: string[];
  max: number;
  onConfirm: (names: string[]) => void;
}

/**
 * The league's teams in seeding order, for an official to tick off who has
 * turned up. Entered in this order, so the standings decide the seeding.
 */
export function CarryOverTeams({ names, max, onConfirm }: CarryOverTeamsProps) {
  const [absent, setAbsent] = useState<ReadonlySet<string>>(new Set());
  const present = names.filter((n) => !absent.has(n));
  const overLimit = present.length > max;

  function toggle(name: string) {
    setAbsent((prev) => {
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
        In seeding order from the league standings. Untick any team that has not turned up, then
        add new teams below.
      </p>
      <ul>
        {names.map((name, i) => (
          <li key={name}>
            <label className="flex items-center gap-3 min-h-12 border-b border-slate-100">
              <input
                type="checkbox"
                checked={!absent.has(name)}
                onChange={() => toggle(name)}
                className="h-5 w-5"
              />
              <span
                className={clsx(
                  'flex-1 text-base',
                  absent.has(name) ? 'text-slate-400 line-through' : 'text-slate-900'
                )}
              >
                {i + 1}. {name}
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
