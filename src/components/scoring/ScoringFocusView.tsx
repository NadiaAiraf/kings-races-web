import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useCurrentRace } from '../../hooks/useCurrentRace';
import { useR2State } from '../../hooks/useR2State';
import { OutcomeButton } from './OutcomeButton';
import { getComplement, getDisabledOutcomes } from '../../domain/scoringHelpers';
import type { DisciplineKey, RaceOutcome } from '../../domain/types';

interface ScoringFocusViewProps {
  discipline: DisciplineKey;
}

export function ScoringFocusView({ discipline }: ScoringFocusViewProps) {
  const { teams, scores, structure, phase } = useDisciplineState(discipline);
  const { currentRace, currentIndex, totalRaces, allRaces, allR1Scored, scoredR1, scoredR2, r1Total } =
    useCurrentRace(discipline);
  const r2State = useR2State(discipline);
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

  // Determine if we're scoring R2
  const isR2Phase = phase === 'round-two';
  const hasR2 = r2State !== null;

  // Active race resolution depends on phase
  let activeRaceId: string | null = null;
  let activeHomeSlot: number | null = null;
  let activeAwaySlot: number | null = null;
  let activeRaceNum: number | null = null;
  let activeDisplayIndex: number = -1;
  let activeDisplayTotal: number = totalRaces;
  let activeGroupLabel: string | null = null;

  if (editingRaceId) {
    // Editing an existing race
    if (editingRaceId.startsWith('r2-')) {
      // R2 race
      const r2Race = r2State?.r2Races.find((r) => r.raceId === editingRaceId);
      if (r2Race) {
        activeRaceId = r2Race.raceId;
        activeHomeSlot = r2Race.homeSlot;
        activeAwaySlot = r2Race.awaySlot;
        activeRaceNum = r2Race.raceNum;
        activeDisplayIndex = r2State!.r2Races.indexOf(r2Race) + r1Total;
        activeGroupLabel = `Group ${r2Race.groupNum}`;
      }
    } else {
      // R1 race
      const r1Race = allRaces.find((r) => `r1-${r.raceNum}` === editingRaceId);
      if (r1Race) {
        activeRaceId = `r1-${r1Race.raceNum}`;
        activeHomeSlot = r1Race.homeSlot;
        activeAwaySlot = r1Race.awaySlot;
        activeRaceNum = r1Race.raceNum;
        activeDisplayIndex = allRaces.indexOf(r1Race);
      }
    }
  } else if (isR2Phase && hasR2 && r2State.currentR2Race) {
    // Auto-advance in R2
    const r2Race = r2State.currentR2Race;
    activeRaceId = r2Race.raceId;
    activeHomeSlot = r2Race.homeSlot;
    activeAwaySlot = r2Race.awaySlot;
    activeRaceNum = r2Race.raceNum;
    activeDisplayIndex = r2State.currentR2Index + r1Total;
    activeGroupLabel = `Group ${r2Race.groupNum}`;
  } else if (!isR2Phase && currentRace) {
    // Auto-advance in R1
    activeRaceId = `r1-${currentRace.raceNum}`;
    activeHomeSlot = currentRace.homeSlot;
    activeAwaySlot = currentRace.awaySlot;
    activeRaceNum = currentRace.raceNum;
    activeDisplayIndex = currentIndex;
  }

  // All scored state
  if (!activeRaceId || activeHomeSlot === null || activeAwaySlot === null) {
    // Check what phase we're in for the right message
    if (isR2Phase && hasR2 && r2State.allR2Scored) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-xl font-semibold text-slate-900">All Round 2 races scored!</p>
          <p className="text-sm text-slate-500 mt-2">
            All {r2State.totalR2Races} Round 2 races have been recorded.
          </p>
          {renderRecentResults(true)}
        </div>
      );
    }
    if (allR1Scored && hasR2 && !isR2Phase) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-xl font-semibold text-slate-900">All Round 1 races scored</p>
          <p className="text-sm text-slate-500 mt-2">
            Round 2 will begin when phase transitions.
          </p>
          {renderRecentResults(false)}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl font-semibold text-slate-900">All races scored!</p>
        <p className="text-sm text-slate-500 mt-2">
          All {totalRaces} races have been recorded.
        </p>
        {renderRecentResults(false)}
      </div>
    );
  }

  const homeTeamName =
    activeHomeSlot !== null
      ? (teamMap.get(activeHomeSlot) ?? `Team ${activeHomeSlot}`)
      : 'TBD';
  const awayTeamName =
    activeAwaySlot !== null
      ? (teamMap.get(activeAwaySlot) ?? `Team ${activeAwaySlot}`)
      : 'TBD';

  // Disabled outcomes based on D-01 constraints
  const homeDisabled = getDisabledOutcomes(awayOutcome);
  const awayDisabled = getDisabledOutcomes(homeOutcome);

  function commitScore(home: RaceOutcome, away: RaceOutcome) {
    if (!activeRaceId || activeHomeSlot === null || activeAwaySlot === null) return;
    recordResult(discipline, {
      raceId: activeRaceId,
      homeSlot: activeHomeSlot,
      awaySlot: activeAwaySlot,
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

  function renderRecentResults(showR2: boolean) {
    // Show scored races in reverse order (most recent first)
    const recentEntries: Array<{
      raceId: string;
      raceNum: number;
      homeName: string;
      awayName: string;
    }> = [];

    if (showR2 && r2State) {
      for (const race of [...r2State.r2Races].reverse()) {
        if (r2State.r2ScoreMap.has(race.raceId)) {
          recentEntries.push({
            raceId: race.raceId,
            raceNum: race.raceNum,
            homeName: race.homeTeamName,
            awayName: race.awayTeamName,
          });
        }
      }
    } else {
      const scoredRaces = allRaces
        .filter((race) => scoreMap.has(`r1-${race.raceNum}`))
        .reverse();
      for (const race of scoredRaces) {
        recentEntries.push({
          raceId: `r1-${race.raceNum}`,
          raceNum: race.raceNum,
          homeName: teamMap.get(race.homeSlot) ?? `Team ${race.homeSlot}`,
          awayName: teamMap.get(race.awaySlot) ?? `Team ${race.awaySlot}`,
        });
      }
    }

    if (recentEntries.length === 0) return null;

    return (
      <div className="border-t border-slate-200 pt-4 mt-2 w-full">
        <p className="text-sm font-semibold text-slate-500 mb-2">Recent results</p>
        {recentEntries.map((entry) => (
          <div
            key={entry.raceId}
            className="flex items-center justify-between py-2 border-b border-slate-100"
          >
            <span className="text-sm text-slate-700">
              Race {entry.raceNum}: {entry.homeName} vs {entry.awayName}
            </span>
            <button
              type="button"
              onClick={() => startEdit(entry.raceId)}
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
        <p className="text-[28px] font-semibold leading-[1.15]">
          Race {activeRaceNum}
          {activeGroupLabel && (
            <span className="text-base font-medium text-slate-500 ml-2">{activeGroupLabel}</span>
          )}
        </p>
        <p className="text-sm text-slate-500">
          Race {(activeDisplayIndex >= 0 ? activeDisplayIndex : totalRaces - 1) + 1} of{' '}
          {activeDisplayTotal}
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
      {renderRecentResults(isR2Phase)}
    </div>
  );
}
