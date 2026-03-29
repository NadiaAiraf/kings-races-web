import { clsx } from 'clsx';
import type { Score } from '../../domain/types';

interface RaceCardProps {
  raceNum: number;
  homeTeamName: string;
  awayTeamName: string;
  score: Score | undefined;
  disabled?: boolean;
}

const OUTCOME_BADGE: Record<string, { className: string; label: string }> = {
  win: { className: 'bg-green-100 text-green-800', label: 'W' },
  loss: { className: 'bg-amber-100 text-amber-800', label: 'L' },
  dsq: { className: 'bg-red-100 text-red-800', label: 'DSQ' },
};

function OutcomeBadge({ outcome }: { outcome: string }) {
  const badge = OUTCOME_BADGE[outcome];
  if (!badge) return null;
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded font-medium', badge.className)}>
      {badge.label}
    </span>
  );
}

export function RaceCard({ raceNum, homeTeamName, awayTeamName, score, disabled }: RaceCardProps) {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200 rounded-lg p-4 mb-2',
        disabled && 'opacity-40 pointer-events-none'
      )}
    >
      <div className="text-sm text-slate-500 mb-1">Race {raceNum}</div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-base text-slate-900">
            <span>{homeTeamName}</span>
            {score && <OutcomeBadge outcome={score.homeOutcome} />}
          </div>
          <div className="flex items-center gap-2 text-base text-slate-900 mt-1">
            <span className="text-slate-500">vs</span>
            <span>{awayTeamName}</span>
            {score && <OutcomeBadge outcome={score.awayOutcome} />}
          </div>
        </div>
        {score && (
          <span className="text-sm text-slate-500 min-h-14 min-w-14 flex items-center justify-center cursor-pointer">
            Edit
          </span>
        )}
      </div>
    </div>
  );
}
