import { clsx } from 'clsx';
import type { RaceOutcome, Score } from '../../domain/types';
import { OutcomeButton } from '../scoring/OutcomeButton';

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

interface ExpandableRaceCardProps {
  raceId: string;
  raceNum: number;
  homeTeamName: string;
  awayTeamName: string;
  homeSlot: number;
  awaySlot: number;
  score: Score | undefined;
  isExpanded: boolean;
  disabled?: boolean;
  groupLabel?: string;
  matchupLabel?: string;
  seedingContext?: string;
  isFinalMatch?: boolean;
  onExpand: (raceId: string) => void;
  onScore: (result: {
    raceId: string;
    homeSlot: number;
    awaySlot: number;
    homeOutcome: RaceOutcome;
    awayOutcome: RaceOutcome;
  }) => void;
}

export function ExpandableRaceCard({
  raceId,
  raceNum,
  homeTeamName,
  awayTeamName,
  homeSlot,
  awaySlot,
  score,
  isExpanded,
  disabled,
  groupLabel,
  matchupLabel,
  seedingContext,
  isFinalMatch,
  onExpand,
  onScore,
}: ExpandableRaceCardProps) {
  function handleScore(team: 'home' | 'away', outcome: 'win' | 'dsq') {
    let homeOutcome: RaceOutcome;
    let awayOutcome: RaceOutcome;

    if (team === 'home' && outcome === 'win') {
      homeOutcome = 'win';
      awayOutcome = 'loss';
    } else if (team === 'home' && outcome === 'dsq') {
      homeOutcome = 'dsq';
      awayOutcome = 'win';
    } else if (team === 'away' && outcome === 'win') {
      awayOutcome = 'win';
      homeOutcome = 'loss';
    } else {
      // team === 'away' && outcome === 'dsq'
      awayOutcome = 'dsq';
      homeOutcome = 'win';
    }

    onScore({ raceId, homeSlot, awaySlot, homeOutcome, awayOutcome });
  }

  return (
    <div
      className={clsx(
        'bg-white border border-slate-200 rounded-lg p-4 mb-2',
        'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        disabled && 'opacity-40 pointer-events-none',
      )}
      style={{ scrollMarginTop: '92px' }}
      aria-expanded={isExpanded}
      aria-label={`Race ${raceNum}: ${homeTeamName} versus ${awayTeamName}`}
      onClick={() => !disabled && onExpand(raceId)}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {/* Header row */}
      <div className="text-sm text-slate-500 mb-1 flex items-center gap-2">
        <span>Race {raceNum}</span>
        {groupLabel && (
          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
            {groupLabel}
          </span>
        )}
        {matchupLabel && (
          <span className="text-xs text-slate-600 font-medium">{matchupLabel}</span>
        )}
        {isFinalMatch && (
          <span className="text-xs font-semibold text-blue-600">FINAL</span>
        )}
      </div>

      {/* Seeding context for finals */}
      {seedingContext && (
        <div className="text-sm text-slate-500 mt-1">{seedingContext}</div>
      )}

      {/* Team row - collapsed state */}
      {!isExpanded && (
        <div className="flex items-center gap-2">
          <div className="flex-1 text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>{homeTeamName}</span>
            {score && <OutcomeBadge outcome={score.homeOutcome} />}
          </div>
          <span className="text-slate-500">vs</span>
          <div className="flex-1 text-base font-semibold text-slate-900 text-right flex items-center justify-end gap-2">
            {score && <OutcomeBadge outcome={score.awayOutcome} />}
            <span>{awayTeamName}</span>
          </div>
        </div>
      )}

      {/* Expanded state with scoring buttons */}
      {isExpanded && (
        <div
          className="flex gap-4 mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Home team column */}
          <div className="flex-1">
            <div className="text-base font-semibold text-slate-900 mb-2">
              {homeTeamName}
            </div>
            <div className="flex gap-2">
              <OutcomeButton
                outcome="win"
                selected={score?.homeOutcome === 'win'}
                onSelect={() => handleScore('home', 'win')}
              />
              <OutcomeButton
                outcome="dsq"
                selected={score?.homeOutcome === 'dsq'}
                onSelect={() => handleScore('home', 'dsq')}
              />
            </div>
          </div>

          {/* Away team column */}
          <div className="flex-1">
            <div className="text-base font-semibold text-slate-900 mb-2">
              {awayTeamName}
            </div>
            <div className="flex gap-2">
              <OutcomeButton
                outcome="win"
                selected={score?.awayOutcome === 'win'}
                onSelect={() => handleScore('away', 'win')}
              />
              <OutcomeButton
                outcome="dsq"
                selected={score?.awayOutcome === 'dsq'}
                onSelect={() => handleScore('away', 'dsq')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
