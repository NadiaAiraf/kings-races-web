import { clsx } from 'clsx';

interface RoundHeaderProps {
  label: string;
  isActive: boolean;
  isFirst?: boolean;
}

export function RoundHeader({ label, isActive, isFirst = false }: RoundHeaderProps) {
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
