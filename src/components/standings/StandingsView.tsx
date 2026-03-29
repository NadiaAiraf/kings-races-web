import type { DisciplineKey } from '../../domain/types';
import { useStandings } from '../../hooks/useStandings';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { getGroupRaces } from '../../domain/groupCalculations';
import { GroupStandingsTable } from './GroupStandingsTable';

interface StandingsViewProps {
  discipline: DisciplineKey;
  onClose: () => void;
}

export function StandingsView({ discipline, onClose }: StandingsViewProps) {
  const result = useStandings(discipline);
  const { scores, structure } = useDisciplineState(discipline);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-2 border-b border-slate-200 bg-white sticky top-0 z-10">
        <button
          onClick={onClose}
          className="min-h-14 flex items-center gap-1 text-sm font-semibold text-blue-600"
        >
          <span>&larr;</span> Back to Scoring
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold text-slate-900">
          Standings
        </h1>
        <div className="w-14" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!result ? (
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-lg font-semibold text-slate-900">
              No results recorded
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Record race results to see live standings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {result.groups.map((group) => (
              <div key={group.letter} className="overflow-x-auto">
                <GroupStandingsTable
                  groupLetter={group.letter}
                  standings={result.standings[group.letter]}
                  teams={result.teams}
                  scores={scores}
                  groupRaces={getGroupRaces(
                    structure!.roundOneRaces,
                    group.teamSlots
                  )}
                  hasTies={result.tiesByGroup[group.letter]}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
