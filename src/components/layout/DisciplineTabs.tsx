import { clsx } from 'clsx';
import type { DisciplineKey } from '../../domain/types';

const DISCIPLINES = ['mixed', 'board', 'ladies'] as const;
const LABELS: Record<DisciplineKey, string> = {
  mixed: 'Mixed',
  board: 'Board',
  ladies: 'Ladies',
};

interface DisciplineTabsProps {
  active: DisciplineKey;
  onSelect: (discipline: DisciplineKey) => void;
}

export function DisciplineTabs({ active, onSelect }: DisciplineTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Discipline"
      className="sticky top-0 z-10 flex h-12 bg-white border-b border-slate-200"
    >
      {DISCIPLINES.map((key) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          onClick={() => onSelect(key)}
          className={clsx(
            'flex-1 text-sm font-semibold transition-colors',
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
