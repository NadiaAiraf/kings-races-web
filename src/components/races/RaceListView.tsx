import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useEventStore } from '../../store/eventStore';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useCurrentRace } from '../../hooks/useCurrentRace';
import { useR2State } from '../../hooks/useR2State';
import { useFinalsState } from '../../hooks/useFinalsState';
import { useStandings } from '../../hooks/useStandings';
import { useRoundFold } from '../../hooks/useRoundFold';
import { useEventInfo } from '../../events/eventInfo';
import { ExpandableRaceCard } from './ExpandableRaceCard';
import { RoundHeader } from './RoundHeader';
import { FinalsBlockedBanner } from '../finals/FinalsBlockedBanner';
import { FinalsReadyBanner } from '../finals/FinalsReadyBanner';
import { GroupTiebreaks, type TiebreakGroup } from '../standings/GroupTiebreaks';
import { r2TiebreakKey } from '../../hooks/groupOrder';
import type { DisciplineKey, Score, RaceOutcome } from '../../domain/types';
import { isResultsOnly, isStoppedEarly } from '../../domain/roundPlacings';

function findNextUnscoredId(
  allRaceIds: string[],
  scoreMap: Map<string, Score>,
  afterId: string,
): string | null {
  const idx = allRaceIds.indexOf(afterId);
  for (let i = idx + 1; i < allRaceIds.length; i++) {
    if (!scoreMap.has(allRaceIds[i])) return allRaceIds[i];
  }
  return null;
}

interface RaceListViewProps {
  discipline: DisciplineKey;
}

export function RaceListView({ discipline }: RaceListViewProps) {
  const { teams, scores, structure, phase, manualTiebreaks } = useDisciplineState(discipline);
  const resultsOnly = useEventStore((s) => isResultsOnly(s.disciplines[discipline]));
  // Read-only: another result could make it resolvable and silently swap
  // the officials' places for computed ones.
  const stoppedEarly = useEventStore((s) => isStoppedEarly(s.disciplines[discipline]));
  const { allR1Scored } = useCurrentRace(discipline);
  const r2State = useR2State(discipline);
  const finalsState = useFinalsState(discipline);
  const standingsResult = useStandings(discipline);
  const recordResult = useEventStore((s) => s.recordResult);
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);
  const notes = useEventStore((s) => s.disciplines[discipline].notes);
  const setNote = useEventStore((s) => s.setNote);
  const eventId = useEventInfo()?.id ?? '';
  const r1Fold = useRoundFold(eventId, discipline, 'r1', allR1Scored);
  const r2Complete = r2State?.allR2Scored ?? false;
  const r2Fold = useRoundFold(eventId, discipline, 'r2', r2Complete);

  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.slot, t.name])),
    [teams],
  );

  const scoreMap = useMemo(
    () => new Map<string, Score>(scores.map((s) => [s.raceId, s])),
    [scores],
  );

  // Build ordered list of all race IDs across rounds
  const allRaceIds = useMemo(() => {
    if (!structure) return [];
    const r1Ids = structure.roundOneRaces.map((r) => `r1-${r.raceNum}`);
    const r2Ids = r2State?.r2Races.map((r) => r.raceId) ?? [];
    const finalsIds =
      finalsState?.finalsWithNames
        .filter((m) => m.homeSlot !== null && m.awaySlot !== null)
        .map((m) => m.raceId) ?? [];
    return [...r1Ids, ...r2Ids, ...finalsIds];
  }, [structure, r2State, finalsState]);

  // Auto-expand first unscored card on mount
  useEffect(() => {
    if (expandedRaceId === null && !stoppedEarly) {
      const firstUnscored = allRaceIds.find((id) => !scoreMap.has(id));
      if (firstUnscored) setExpandedRaceId(firstUnscored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExpand = useCallback(
    (raceId: string) => {
      if (stoppedEarly) return;
      setExpandedRaceId((prev) => (prev === raceId ? null : raceId));
    },
    [stoppedEarly],
  );

  const handleScore = useCallback(
    (result: {
      raceId: string;
      homeSlot: number;
      awaySlot: number;
      homeOutcome: RaceOutcome;
      awayOutcome: RaceOutcome;
    }) => {
      recordResult(discipline, result);
      // Compute next unscored synchronously before React re-renders
      const updatedScoreMap = new Map(scoreMap);
      updatedScoreMap.set(result.raceId, result as Score);
      const nextId = findNextUnscoredId(allRaceIds, updatedScoreMap, result.raceId);
      setExpandedRaceId(nextId);
      // Scroll to next card after DOM updates
      if (nextId) {
        requestAnimationFrame(() => {
          const el = cardRefs.current.get(nextId);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    },
    [discipline, recordResult, scoreMap, allRaceIds],
  );

  const handleNoteChange = useCallback(
    (raceId: string, note: string) => setNote(discipline, raceId, note),
    [discipline, setNote],
  );

  if (resultsOnly) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900">No races recorded</h3>
        <p className="text-sm text-slate-500 mt-1">
          This round's results were entered after the event. See Standings for the final places.
        </p>
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h3 className="text-lg font-semibold text-slate-900">Add teams first</h3>
        <p className="text-sm text-slate-500 mt-1">
          Enter at least 4 teams to see the race schedule.
        </p>
      </div>
    );
  }

  // Groups an official may need to complete by hand when teams tie.
  const hasR2 = finalsState?.hasR2 ?? false;
  const r1TiebreakGroups: TiebreakGroup[] = structure.groups.map((g) => ({
    key: g.letter,
    label: `Group ${g.letter}`,
    standings: standingsResult?.rawStandings[g.letter] ?? [],
  }));
  const r2TiebreakGroups: TiebreakGroup[] = (r2State?.r2Groups ?? []).map((g) => ({
    key: r2TiebreakKey(g.groupNum),
    label: `Round 2 Group ${g.groupNum}`,
    standings: r2State?.r2RawStandings[g.groupNum] ?? [],
  }));
  // Groups whose order feeds the finals: Round 2 if the format has it.
  const finalsTiebreakGroups = hasR2 ? r2TiebreakGroups : r1TiebreakGroups;
  const anyR2Scored = scores.some((s) => s.raceId.startsWith('r2-'));
  const finalsStarted = phase === 'finals' || phase === 'complete';

  return (
    <div>
      {stoppedEarly && (
        <p className="text-sm text-slate-500 px-4 py-2">
          Stopped early: places entered by officials. See Stds for the final places.
        </p>
      )}
      {/* Round 1 */}
      <RoundHeader
        label="Round 1"
        isActive={phase === 'group-stage' || phase === 'setup'}
        isFirst={true}
        collapsible={allR1Scored}
        open={r1Fold.open}
        onToggle={r1Fold.toggle}
      />
      {r1Fold.open && structure.roundOneRaces.map((race) => {
        const raceId = `r1-${race.raceNum}`;
        return (
          <div
            key={raceId}
            ref={(el) => {
              if (el) cardRefs.current.set(raceId, el);
            }}
          >
            <ExpandableRaceCard
              raceId={raceId}
              raceNum={race.raceNum}
              homeTeamName={teamMap.get(race.homeSlot) ?? `Team ${race.homeSlot}`}
              awayTeamName={teamMap.get(race.awaySlot) ?? `Team ${race.awaySlot}`}
              homeSlot={race.homeSlot}
              awaySlot={race.awaySlot}
              score={scoreMap.get(raceId)}
              isExpanded={!stoppedEarly && expandedRaceId === raceId}
              note={notes[raceId]}
              onNoteChange={handleNoteChange}
              onExpand={handleExpand}
              onScore={handleScore}
            />
          </div>
        );
      })}
      {allR1Scored && (
        <p className="text-sm text-slate-500 text-center py-2">
          All Round 1 races scored
        </p>
      )}
      {allR1Scored && hasR2 && (
        <GroupTiebreaks
          discipline={discipline}
          groups={r1TiebreakGroups}
          manualTiebreaks={manualTiebreaks}
          teamNames={teamMap}
          canChange={!anyR2Scored && !stoppedEarly}
        />
      )}

      {/* Round 2 */}
      {structure.roundTwoGroups && (
        <>
          <RoundHeader
            label="Round 2"
            isActive={phase === 'round-two'}
            collapsible={r2Complete}
            open={r2Fold.open}
            onToggle={r2Fold.toggle}
          />
          {(phase === 'round-two' || (r2State && r2State.scoredR2Races > 0)) &&
          r2State ? (
            r2Fold.open &&
            r2State.r2Races.map((race) => (
              <div
                key={race.raceId}
                ref={(el) => {
                  if (el) cardRefs.current.set(race.raceId, el);
                }}
              >
                <ExpandableRaceCard
                  raceId={race.raceId}
                  raceNum={race.raceNum}
                  homeTeamName={race.homeTeamName}
                  awayTeamName={race.awayTeamName}
                  homeSlot={race.homeSlot ?? 0}
                  awaySlot={race.awaySlot ?? 0}
                  score={r2State.r2ScoreMap.get(race.raceId)}
                  isExpanded={!stoppedEarly && expandedRaceId === race.raceId}
                  groupLabel={`Group ${race.groupNum}`}
                  allowNotRun
                  note={notes[race.raceId]}
                  onNoteChange={handleNoteChange}
                  onExpand={handleExpand}
                  onScore={handleScore}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 opacity-40 px-4 py-2">
              Round 2 &mdash; {structure.roundTwoRaceCount} races, seeded from Round 1
              results
            </p>
          )}
        </>
      )}

      {/* Finals */}
      {structure.finals.length > 0 && (
        <>
          <RoundHeader label="Finals" isActive={phase === 'finals'} />

          {stoppedEarly ? (
            <p className="text-sm text-slate-500 px-4 py-2">
              Not raced: the round was stopped early.
            </p>
          ) : finalsState ? (
            <>
              {finalsState.finalsPhase === 'blocked-incomplete' && (
                <FinalsBlockedBanner reason="incomplete" />
              )}

              {finalsState.finalsPhase === 'blocked-ties' && (
                <FinalsBlockedBanner reason="ties" />
              )}

              {(finalsState.finalsPhase === 'blocked-ties' ||
                finalsState.finalsPhase === 'ready') && (
                <GroupTiebreaks
                  discipline={discipline}
                  groups={finalsTiebreakGroups}
                  manualTiebreaks={manualTiebreaks}
                  teamNames={teamMap}
                  canChange={!finalsStarted}
                />
              )}

              {finalsState.finalsPhase === 'ready' && (
                <FinalsReadyBanner
                  onConfirm={() => setDisciplinePhase(discipline, 'finals')}
                />
              )}

              {(finalsState.finalsPhase === 'confirmed' ||
                finalsState.finalsPhase === 'all-scored') &&
                finalsState.finalsWithNames.map((matchup) => {
                  const isResolved =
                    matchup.homeSlot !== null && matchup.awaySlot !== null;
                  return (
                    <div
                      key={matchup.raceId}
                      ref={(el) => {
                        if (el) cardRefs.current.set(matchup.raceId, el);
                      }}
                    >
                      {isResolved ? (
                        <ExpandableRaceCard
                          raceId={matchup.raceId}
                          raceNum={matchup.index + 1}
                          homeTeamName={matchup.homeTeamName}
                          awayTeamName={matchup.awayTeamName}
                          homeSlot={matchup.homeSlot ?? 0}
                          awaySlot={matchup.awaySlot ?? 0}
                          score={matchup.score ?? undefined}
                          isExpanded={expandedRaceId === matchup.raceId}
                          matchupLabel={matchup.label}
                          seedingContext={`${matchup.homeRef} vs ${matchup.awayRef}${
                            matchup.optional ? ' · If time allows' : ''
                          }`}
                          isFinalMatch={matchup.label.startsWith('1st/')}
                          allowNotRun
                          note={notes[matchup.raceId]}
                          onNoteChange={handleNoteChange}
                          onExpand={handleExpand}
                          onScore={handleScore}
                        />
                      ) : (
                        <p className="text-sm text-slate-400 py-2">
                          {matchup.label} - Teams not yet resolved
                        </p>
                      )}
                    </div>
                  );
                })}
            </>
          ) : (
            <p className="text-sm text-slate-400 opacity-40 px-4 py-2">
              Finals seeded from group stage results
            </p>
          )}
        </>
      )}
    </div>
  );
}
