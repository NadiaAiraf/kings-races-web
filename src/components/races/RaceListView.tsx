import { useMemo } from 'react';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { RaceCard } from './RaceCard';
import { RoundHeader } from './RoundHeader';
import type { DisciplineKey, Score } from '../../domain/types';

interface RaceListViewProps {
  discipline: DisciplineKey;
}

export function RaceListView({ discipline }: RaceListViewProps) {
  const { teams, scores, structure } = useDisciplineState(discipline);

  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.slot, t.name])),
    [teams]
  );

  const scoreMap = useMemo(
    () => new Map<string, Score>(scores.map((s) => [s.raceId, s])),
    [scores]
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

  return (
    <div>
      <RoundHeader label="Round 1" isActive={true} isFirst={true} />
      {structure.roundOneRaces.map((race) => (
        <RaceCard
          key={`r1-${race.raceNum}`}
          raceNum={race.raceNum}
          homeTeamName={teamMap.get(race.homeSlot) ?? `Team ${race.homeSlot}`}
          awayTeamName={teamMap.get(race.awaySlot) ?? `Team ${race.awaySlot}`}
          score={scoreMap.get(`r1-${race.raceNum}`)}
        />
      ))}

      {structure.roundTwoGroups && (
        <>
          <RoundHeader label="Round 2" isActive={false} />
          <p className="text-sm text-slate-400 opacity-40 px-4 py-2">
            Round 2 &mdash; {structure.roundTwoRaceCount} races, seeded from Round 1 results
          </p>
        </>
      )}

      {structure.finals.length > 0 && (
        <>
          <RoundHeader label="Finals" isActive={false} />
          <p className="text-sm text-slate-400 opacity-40 px-4 py-2">
            Finals seeded from group stage results
          </p>
        </>
      )}
    </div>
  );
}
