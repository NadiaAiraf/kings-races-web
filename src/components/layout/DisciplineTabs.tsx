import { clsx } from 'clsx';
import type { DisciplineKey } from '../../domain/types';
import { DISCIPLINE_LABELS } from '../../domain/csvExport';

const DISCIPLINES = ['mixed', 'board', 'ladies'] as const;

/** A single discipline, or 'all' for the combined race list. */
export type DisciplineView = DisciplineKey | 'all';

const VIEW_LABELS: Record<DisciplineView, string> = { ...DISCIPLINE_LABELS, all: 'All races' };

interface DisciplineTabsProps<V extends DisciplineView> {
  active: V;
  onSelect: (view: V) => void;
  /** Tabs to show, in order. Defaults to the three disciplines. */
  views?: readonly V[];
}

export function DisciplineTabs<V extends DisciplineView = DisciplineKey>({
  active,
  onSelect,
  views = DISCIPLINES as readonly DisciplineView[] as readonly V[],
}: DisciplineTabsProps<V>) {
  return (
    <div
      role="tablist"
      aria-label="Discipline"
      className="sticky top-0 z-10 flex h-12 bg-white border-b border-slate-200"
    >
      {views.map((key) => (
        <button
          key={key}
          role="tab"
          aria-selected={active === key}
          onClick={() => onSelect(key)}
          className={clsx(
            'flex-1 text-sm font-semibold transition-colors',
            active === key
              ? 'border-b-[3px] border-brand-600 text-brand-600'
              : 'text-slate-500'
          )}
        >
          {VIEW_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
