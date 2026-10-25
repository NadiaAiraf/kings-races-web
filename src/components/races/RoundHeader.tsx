import { clsx } from 'clsx';

interface RoundHeaderProps {
  label: string;
  isActive: boolean;
  isFirst?: boolean;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}

export function RoundHeader({
  label,
  isActive,
  isFirst = false,
  collapsible = false,
  open = true,
  onToggle,
}: RoundHeaderProps) {
  if (collapsible) {
    return (
      <h2 className={clsx('mb-3', !isFirst && 'mt-6')}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between bg-slate-700 border border-slate-700 rounded-sm px-4 min-h-14 text-base font-semibold text-white"
        >
          {label}
          <span aria-hidden="true" className="text-slate-300">
            {open ? '▾' : '▸'}
          </span>
        </button>
      </h2>
    );
  }

  return (
    <h2
      className={clsx(
        'text-xl font-semibold leading-tight mb-3',
        !isFirst && 'mt-6',
        isActive ? 'text-slate-900' : 'text-slate-400 opacity-40'
      )}
    >
      {label}
    </h2>
  );
}
