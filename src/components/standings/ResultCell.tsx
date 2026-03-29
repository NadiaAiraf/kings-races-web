import type { RaceOutcome } from '../../domain/types';
import { POINTS } from '../../domain/scoring';

const OUTCOME_STYLES: Record<RaceOutcome, string> = {
  win: 'bg-green-100 text-green-800',
  loss: 'bg-amber-100 text-amber-800',
  dsq: 'bg-red-100 text-red-800',
};

interface ResultCellProps {
  outcome: RaceOutcome | null;
}

export function ResultCell({ outcome }: ResultCellProps) {
  if (!outcome) {
    return (
      <div className="w-6 h-6 rounded-sm bg-slate-50" />
    );
  }

  return (
    <div
      className={`w-6 h-6 rounded-sm text-xs font-mono text-center leading-6 ${OUTCOME_STYLES[outcome]}`}
    >
      {POINTS[outcome]}
    </div>
  );
}
