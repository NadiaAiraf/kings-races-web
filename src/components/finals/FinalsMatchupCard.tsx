import { useState, forwardRef } from 'react';
import { clsx } from 'clsx';
import { useEventStore } from '../../store/eventStore';
import { OutcomeButton } from '../scoring/OutcomeButton';
import { getComplement, getDisabledOutcomes } from '../../domain/scoringHelpers';
import type { DisciplineKey, RaceOutcome } from '../../domain/types';
import type { ResolvedFinalsMatchupWithNames } from '../../hooks/useFinalsState';

interface FinalsMatchupCardProps {
  matchup: ResolvedFinalsMatchupWithNames;
  discipline: DisciplineKey;
  isActive: boolean;
  canScore: boolean;
  onScored?: () => void;
}

export const FinalsMatchupCard = forwardRef<HTMLDivElement, FinalsMatchupCardProps>(
  function FinalsMatchupCard({ matchup, discipline, isActive, canScore, onScored }, ref) {
    const recordResult = useEventStore((s) => s.recordResult);
    const clearResult = useEventStore((s) => s.clearResult);

    const [homeOutcome, setHomeOutcome] = useState<RaceOutcome | null>(null);
    const [awayOutcome, setAwayOutcome] = useState<RaceOutcome | null>(null);

    const isScored = !!matchup.score;
    const isResolved = matchup.homeSlot !== null && matchup.awaySlot !== null;
    const isFinalMatch = matchup.label.includes('1st');

    // Determine winner side for border color
    const winnerSide = matchup.score
      ? matchup.score.homeOutcome === 'win'
        ? 'home'
        : matchup.score.awayOutcome === 'win'
          ? 'away'
          : null
      : null;

    const homeDisabled = getDisabledOutcomes(awayOutcome);
    const awayDisabled = getDisabledOutcomes(homeOutcome);

    function commitScore(home: RaceOutcome, away: RaceOutcome) {
      if (matchup.homeSlot === null || matchup.awaySlot === null) return;
      recordResult(discipline, {
        raceId: matchup.raceId,
        homeSlot: matchup.homeSlot,
        awaySlot: matchup.awaySlot,
        homeOutcome: home,
        awayOutcome: away,
      });
      setHomeOutcome(null);
      setAwayOutcome(null);
      onScored?.();
    }

    function handleHomeSelect(outcome: RaceOutcome) {
      setHomeOutcome(outcome);
      const complement = getComplement(outcome);

      if (awayOutcome !== null) {
        commitScore(outcome, awayOutcome);
      } else if (complement !== null) {
        setAwayOutcome(complement);
        commitScore(outcome, complement);
      }
    }

    function handleAwaySelect(outcome: RaceOutcome) {
      setAwayOutcome(outcome);
      const complement = getComplement(outcome);

      if (homeOutcome !== null) {
        commitScore(homeOutcome, outcome);
      } else if (complement !== null) {
        setHomeOutcome(complement);
        commitScore(complement, outcome);
      }
    }

    function handleEdit() {
      clearResult(discipline, matchup.raceId);
      setHomeOutcome(null);
      setAwayOutcome(null);
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'border border-slate-200 rounded-lg p-4 bg-white',
          isScored && winnerSide === 'home' && 'border-l-4 border-l-green-600',
          isScored && winnerSide === 'away' && 'border-l-4 border-l-green-600'
        )}
        aria-label={`Finals match: ${matchup.label} - ${matchup.homeTeamName} versus ${matchup.awayTeamName}`}
      >
        {/* Header: placement label and FINAL badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">{matchup.label}</span>
          {isFinalMatch && (
            <span className="text-xs font-semibold text-blue-600">FINAL</span>
          )}
        </div>

        {/* Seeding context */}
        <p className="text-sm text-slate-500 mt-1">
          {matchup.homeRef} vs {matchup.awayRef}
        </p>

        {/* Team names */}
        <p className="text-xl font-semibold text-slate-900 mt-2">
          {matchup.homeTeamName} vs {matchup.awayTeamName}
        </p>

        {/* Scoring UI */}
        {!isResolved && (
          <p className="text-sm text-slate-400 mt-3">
            Teams not yet resolved
          </p>
        )}

        {isResolved && canScore && !isScored && (
          <div className="mt-3 flex flex-col gap-3">
            {/* Home team scoring */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">{matchup.homeTeamName}</p>
              <div className="flex gap-2">
                <OutcomeButton
                  outcome="win"
                  selected={homeOutcome === 'win'}
                  disabled={homeDisabled.has('win')}
                  onSelect={handleHomeSelect}
                />
                <OutcomeButton
                  outcome="loss"
                  selected={homeOutcome === 'loss'}
                  disabled={homeDisabled.has('loss')}
                  onSelect={handleHomeSelect}
                />
                <OutcomeButton
                  outcome="dsq"
                  selected={homeOutcome === 'dsq'}
                  disabled={homeDisabled.has('dsq')}
                  onSelect={handleHomeSelect}
                />
              </div>
            </div>

            {/* Away team scoring */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">{matchup.awayTeamName}</p>
              <div className="flex gap-2">
                <OutcomeButton
                  outcome="win"
                  selected={awayOutcome === 'win'}
                  disabled={awayDisabled.has('win')}
                  onSelect={handleAwaySelect}
                />
                <OutcomeButton
                  outcome="loss"
                  selected={awayOutcome === 'loss'}
                  disabled={awayDisabled.has('loss')}
                  onSelect={handleAwaySelect}
                />
                <OutcomeButton
                  outcome="dsq"
                  selected={awayOutcome === 'dsq'}
                  disabled={awayDisabled.has('dsq')}
                  onSelect={handleAwaySelect}
                />
              </div>
            </div>
          </div>
        )}

        {isScored && matchup.score && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              <span className={clsx(
                'font-semibold',
                matchup.score.homeOutcome === 'win' && 'text-green-700',
                matchup.score.homeOutcome === 'dsq' && 'text-red-600'
              )}>
                {matchup.score.homeOutcome.toUpperCase()}
              </span>
              {' / '}
              <span className={clsx(
                'font-semibold',
                matchup.score.awayOutcome === 'win' && 'text-green-700',
                matchup.score.awayOutcome === 'dsq' && 'text-red-600'
              )}>
                {matchup.score.awayOutcome.toUpperCase()}
              </span>
            </div>
            {canScore && (
              <button
                type="button"
                onClick={handleEdit}
                className="text-sm text-slate-500 min-h-14 px-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);
