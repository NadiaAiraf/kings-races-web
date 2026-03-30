import { clsx } from 'clsx';

export type SubTabKey = 'teams' | 'races' | 'standings';

const SUB_TABS = ['teams', 'races', 'standings'] as const;
const LABELS: Record<SubTabKey, string> = {
  teams: 'Teams',
  races: 'Races',
  standings: 'Stds',
};

interface SubTabsProps {
  active: SubTabKey;
  onSelect: (tab: SubTabKey) => void;
}

export function SubTabs({ active, onSelect }: SubTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Section"
      className="sticky top-12 z-10 flex h-11 bg-white border-b border-slate-200 overflow-x-auto"
    >
      {SUB_TABS.map((key) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          onClick={() => onSelect(key)}
          className={clsx(
            'flex-1 min-w-[64px] whitespace-nowrap text-sm font-semibold transition-colors',
            active === key
              ? 'border-b-[3px] border-blue-600 text-blue-600'
              : 'text-slate-500'
          )}
        >
          {LABELS[key]}
        </button>
      ))}
    </div>
  );
}
