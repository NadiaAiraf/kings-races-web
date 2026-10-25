import { useState } from 'react';
import { clsx } from 'clsx';
import { TeamInput } from './TeamInput';

interface CarryOverTeamsProps {
  /** League teams in seeding order (see seedingOrder). */
  names: string[];
  max: number;
  onConfirm: (names: string[]) => void;
}

// Natural order, so "UCL 2" comes before "UCL 10".
const alphabetical = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const key = (name: string) => name.trim().toLowerCase();

/**
 * The league's teams A-Z, for an official to tick who has turned up, plus
 * any new teams typed in that are not on the list. Ticked league teams are
 * entered in seeding order, so the league standings decide the seeding
 * however the list is shown; ticked new teams follow in the order added.
 * New teams are kept only here, never written to the league's team list.
 */
export function CarryOverTeams({ names, max, onConfirm }: CarryOverTeamsProps) {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  // New teams in the order they were added.
  const [added, setAdded] = useState<string[]>([]);

  // Ticks are kept by name, so they survive the list updating (e.g. another
  // official adding a league team) while teams are being ticked. A new team
  // that has since been added to the league stands in for that league team,
  // so a ticked one is entered once, in the league team's seeding position.
  const leagueKeys = new Set(names.map(key));
  const newTeams = added.filter((n) => !leagueKeys.has(key(n)));
  const isTicked = (league: string) =>
    ticked.has(league) || added.some((n) => ticked.has(n) && key(n) === key(league));

  const present = [...names.filter(isTicked), ...newTeams.filter((n) => ticked.has(n))];
  const listed = [...names].sort(alphabetical);
  const overLimit = present.length > max;

  function toggleLeague(name: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      const on = prev.has(name) || added.some((n) => prev.has(n) && key(n) === key(name));
      if (on) {
        next.delete(name);
        for (const n of added) if (key(n) === key(name)) next.delete(n);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function toggleNew(name: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleAdd(name: string) {
    const match = names.find((n) => key(n) === key(name));
    if (!match) setAdded((prev) => [...prev, name]);
    setTicked((prev) => new Set(prev).add(match ?? name));
  }

  function row(name: string, checked: boolean, onToggle: () => void, isNew: boolean) {
    return (
      <li key={name} className="flex items-center gap-2 border-b border-slate-100">
        <label className="flex flex-1 items-center gap-3 min-h-12">
          <input type="checkbox" checked={checked} onChange={onToggle} className="h-5 w-5" />
          <span className={clsx('flex-1 text-base', checked ? 'text-slate-900' : 'text-slate-500')}>
            {name}
          </span>
        </label>
        {isNew && (
          <span className="text-xs font-semibold uppercase rounded-sm bg-brand-50 text-brand-700 px-1.5 py-0.5">
            New
          </span>
        )}
      </li>
    );
  }

  return (
    <section
      aria-label="League teams"
      className="flex flex-col gap-2 bg-white border border-slate-200 rounded-sm p-3"
    >
      <h3 className="text-base font-semibold text-slate-900">League teams</h3>
      <p className="text-sm text-slate-500">
        Tick each team that has turned up, and add any team not on the list. Teams are seeded
        from the league standings when entered, with new teams after them.
      </p>
      <ul>
        {listed.map((name) => row(name, isTicked(name), () => toggleLeague(name), false))}
        {newTeams.map((name) => row(name, ticked.has(name), () => toggleNew(name), true))}
      </ul>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">Add a team not on the list</p>
        <TeamInput onAdd={handleAdd} existingNames={newTeams} buttonLabel="Add" />
      </div>
      {overLimit && <p className="text-sm text-red-600">Maximum {max} teams. Untick some teams.</p>}
      <button
        type="button"
        onClick={() => onConfirm(present)}
        disabled={present.length === 0 || overLimit}
        className="min-h-12 rounded-sm bg-brand-600 text-white font-semibold disabled:opacity-40"
      >
        Enter {present.length} {present.length === 1 ? 'team' : 'teams'}
      </button>
    </section>
  );
}
