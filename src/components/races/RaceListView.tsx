import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useEventStore } from '../../store/eventStore';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useCurrentRace } from '../../hooks/useCurrentRace';
import { useR2State } from '../../hooks/useR2State';
import { useFinalsState } from '../../hooks/useFinalsState';
import { useStandings } from '../../hooks/useStandings';
import { ExpandableRaceCard } from './ExpandableRaceCard';
import { RoundHeader } from './RoundHeader';
import { FinalsBlockedBanner } from '../finals/FinalsBlockedBanner';
import { FinalsReadyBanner } from '../finals/FinalsReadyBanner';
import { TiebreakResolver } from '../standings/TiebreakResolver';
import type { DisciplineKey, Score, RaceOutcome, TeamStanding } from '../../domain/types';

function getTiedClusters(standings: TeamStanding[]): TeamStanding[][] {
  const clusters: TeamStanding[][] = [];
  let i = 0;
  while (i < standings.length) {
    let j = i + 1;
    while (j < standings.length && standings[j].points === standings[i].points) j++;
    if (j - i > 1) clusters.push(standings.slice(i, j));
    i = j;
  }
  return clusters;
}

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
  const { teams, scores, structure, phase } = useDisciplineState(discipline);
  const { allR1Scored } = useCurrentRace(discipline);
  const r2State = useR2State(discipline);
  const finalsState = useFinalsState(discipline);
  const standingsResult = useStandings(discipline);
  const recordResult = useEventStore((s) => s.recordResult);
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);

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
    if (expandedRaceId === null) {
      const firstUnscored = allRaceIds.find((id) => !scoreMap.has(id));
      if (firstUnscored) setExpandedRaceId(firstUnscored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExpand = useCallback((raceId: string) => {
    setExpandedRaceId((prev) => (prev === raceId ? null : raceId));
  }, []);

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

  // Finals gate rendering helpers
  const hasR2 = finalsState?.hasR2 ?? false;
  const tiesByGroup = hasR2
    ? (r2State?.r2TiesByGroup ?? {})
    : (standingsResult?.tiesByGroup ?? {});
  const standingsMap = hasR2
    ? (r2State?.r2Standings ?? {})
    : (standingsResult?.standings ?? {});

  return (
    <div>
      {/* Round 1 */}
      <RoundHeader
        label="Round 1"
        isActive={phase === 'group-stage' || phase === 'setup'}
        isFirst={true}
      />
      {structure.roundOneRaces.map((race) => {
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
              isExpanded={expandedRaceId === raceId}
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

      {/* Round 2 */}
      {structure.roundTwoGroups && (
        <>
          <RoundHeader label="Round 2" isActive={phase === 'round-two'} />
          {(phase === 'round-two' || (r2State && r2State.scoredR2Races > 0)) &&
          r2State ? (
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
                  isExpanded={expandedRaceId === race.raceId}
                  groupLabel={`Group ${race.groupNum}`}
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

          {finalsState ? (
            <>
              {finalsState.finalsPhase === 'blocked-incomplete' && (
                <FinalsBlockedBanner reason="incomplete" />
              )}

              {finalsState.finalsPhase === 'blocked-ties' && (
                <>
                  <FinalsBlockedBanner reason="ties" />
                  {Object.entries(tiesByGroup)
                    .filter(([, hasTie]) => hasTie)
                    .map(([groupKey]) => {
                      const groupStandings = standingsMap[groupKey] ?? [];
                      const clusters = getTiedClusters(groupStandings);
                      return clusters.map((cluster, ci) => (
                        <TiebreakResolver
                          key={`${groupKey}-${ci}`}
                          discipline={discipline}
                          groupKey={groupKey}
                          tiedTeams={cluster.map((s) => ({
                            slot: s.slot,
                            name:
                              teamMap.get(s.slot) ?? `Team ${s.slot}`,
                            points: s.points,
                          }))}
                          onResolved={() => {}}
                        />
                      ));
                    })}
                </>
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
                          seedingContext={`${matchup.homeRef} vs ${matchup.awayRef}`}
                          isFinalMatch={matchup.label.includes('1st')}
                          onExpand={handleExpand}
                          onScore={handleScore}
                        />
                      ) : (
                        <p className="text-sm text-slate-400 py-2">
                          {matchup.label} — Teams not yet resolved
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
