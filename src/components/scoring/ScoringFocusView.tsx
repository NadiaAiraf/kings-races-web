import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useCurrentRace } from '../../hooks/useCurrentRace';
import { OutcomeButton } from './OutcomeButton';
import type { DisciplineKey, RaceOutcome, RaceMatchup } from '../../domain/types';

function getComplement(outcome: RaceOutcome): RaceOutcome | null {
  if (outcome === 'win') return 'loss';
  if (outcome === 'loss') return 'win';
  return null; // DSQ has no auto-complement
}

/**
 * Returns which outcomes should be disabled for a team based on the other team's selection.
 * Valid pairs: Win/Loss, Loss/Win, Win/DSQ, DSQ/Win.
 * Both teams cannot DSQ (D-01).
 */
function getDisabledOutcomes(otherOutcome: RaceOutcome | null): Set<RaceOutcome> {
  if (otherOutcome === null) return new Set();
  if (otherOutcome === 'dsq') return new Set(['loss', 'dsq']); // Only Win allowed
  if (otherOutcome === 'win') return new Set(['win']); // Only Loss or DSQ allowed
  if (otherOutcome === 'loss') return new Set(['loss', 'dsq']); // Only Win allowed
  return new Set();
}

interface ScoringFocusViewProps {
  discipline: DisciplineKey;
}

export function ScoringFocusView({ discipline }: ScoringFocusViewProps) {
  const { teams, scores, structure } = useDisciplineState(discipline);
  const { currentRace, currentIndex, totalRaces, allRaces } = useCurrentRace(discipline);
  const recordResult = useEventStore((s) => s.recordResult);
  const clearResult = useEventStore((s) => s.clearResult);

  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [homeOutcome, setHomeOutcome] = useState<RaceOutcome | null>(null);
  const [awayOutcome, setAwayOutcome] = useState<RaceOutcome | null>(null);

  // Lookups
  const teamMap = new Map(teams.map((t) => [t.slot, t.name]));
  const scoreMap = new Map(scores.map((s) => [s.raceId, s]));

  // Empty state: no teams or structure
  if (!structure || teams.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl font-semibold text-slate-900">Add teams first</p>
        <p className="text-sm text-slate-500 mt-2">Enter at least 4 teams to start scoring.</p>
      </div>
    );
  }

  // Determine active race
  let activeRace: RaceMatchup | null = null;
  let activeIndex = currentIndex;

  if (editingRaceId) {
    activeRace = allRaces.find((r) => `r1-${r.raceNum}` === editingRaceId) ?? null;
    if (activeRace) {
      activeIndex = allRaces.indexOf(activeRace);
    }
  } else {
    activeRace = currentRace;
  }

  // All scored, not editing
  if (!activeRace) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl font-semibold text-slate-900">All races scored!</p>
        <p className="text-sm text-slate-500 mt-2">
          All {totalRaces} races have been recorded.
        </p>
        {/* Recent results for re-scoring */}
        {renderRecentResults()}
      </div>
    );
  }

  const homeTeamName = teamMap.get(activeRace.homeSlot) ?? `Team ${activeRace.homeSlot}`;
  const awayTeamName = teamMap.get(activeRace.awaySlot) ?? `Team ${activeRace.awaySlot}`;

  // Disabled outcomes based on D-01 constraints
  const homeDisabled = getDisabledOutcomes(awayOutcome);
  const awayDisabled = getDisabledOutcomes(homeOutcome);

  function commitScore(home: RaceOutcome, away: RaceOutcome) {
    if (!activeRace) return;
    const raceId = `r1-${activeRace.raceNum}`;
    recordResult(discipline, {
      raceId,
      homeSlot: activeRace.homeSlot,
      awaySlot: activeRace.awaySlot,
      homeOutcome: home,
      awayOutcome: away,
    });
    // Reset local state immediately -- no delay (D-02)
    setHomeOutcome(null);
    setAwayOutcome(null);
    setEditingRaceId(null);
  }

  function handleHomeSelect(outcome: RaceOutcome) {
    setHomeOutcome(outcome);
    const complement = getComplement(outcome);

    if (awayOutcome !== null) {
      // Both outcomes now set -- commit
      commitScore(outcome, awayOutcome);
    } else if (complement !== null) {
      // Auto-complement: set away and commit immediately
      setAwayOutcome(complement);
      commitScore(outcome, complement);
    }
    // else: DSQ tapped, wait for away tap
  }

  function handleAwaySelect(outcome: RaceOutcome) {
    setAwayOutcome(outcome);
    const complement = getComplement(outcome);

    if (homeOutcome !== null) {
      // Both outcomes now set -- commit
      commitScore(homeOutcome, outcome);
    } else if (complement !== null) {
      // Auto-complement: set home and commit immediately
      setHomeOutcome(complement);
      commitScore(complement, outcome);
    }
    // else: DSQ tapped, wait for home tap
  }

  function startEdit(raceId: string) {
    clearResult(discipline, raceId);
    setHomeOutcome(null);
    setAwayOutcome(null);
    setEditingRaceId(raceId);
  }

  function cancelEdit() {
    setHomeOutcome(null);
    setAwayOutcome(null);
    setEditingRaceId(null);
  }

  function renderRecentResults() {
    // Show scored races in reverse order (most recent first)
    const scoredRaces = allRaces
      .filter((race) => scoreMap.has(`r1-${race.raceNum}`))
      .map((race) => ({
        race,
        score: scoreMap.get(`r1-${race.raceNum}`)!,
      }))
      .reverse();

    if (scoredRaces.length === 0) return null;

    return (
      <div className="border-t border-slate-200 pt-4 mt-2 w-full">
        <p className="text-sm font-semibold text-slate-500 mb-2">Recent results</p>
        {scoredRaces.map(({ race, score }) => (
          <div
            key={score.raceId}
            className="flex items-center justify-between py-2 border-b border-slate-100"
          >
            <span className="text-sm text-slate-700">
              Race {race.raceNum}: {teamMap.get(race.homeSlot) ?? `Team ${race.homeSlot}`} vs{' '}
              {teamMap.get(race.awaySlot) ?? `Team ${race.awaySlot}`}
            </span>
            <button
              type="button"
              onClick={() => startEdit(score.raceId)}
              className="text-sm text-slate-500 min-h-14 px-2"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Current race card */}
      <div className="text-center">
        <p className="text-[28px] font-semibold leading-[1.15]">Race {activeRace.raceNum}</p>
        <p className="text-sm text-slate-500">
          Race {(activeIndex >= 0 ? activeIndex : totalRaces - 1) + 1} of {totalRaces}
        </p>
      </div>

      {/* Team A (Home) section */}
      <div>
        <p className="text-xl font-semibold text-slate-900 mb-2">{homeTeamName}</p>
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

      {/* Team B (Away) section */}
      <div>
        <p className="text-xl font-semibold text-slate-900 mb-2">{awayTeamName}</p>
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

      {/* Cancel edit button */}
      {editingRaceId && (
        <button
          type="button"
          onClick={cancelEdit}
          className="text-sm text-slate-500 min-h-14"
        >
          Cancel edit
        </button>
      )}

      {/* Recent scored races for re-scoring */}
      {renderRecentResults()}
    </div>
  );
}
