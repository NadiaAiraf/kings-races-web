import type { DisciplineKey, RaceMatchup } from '../../domain/types';
import { useStandings } from '../../hooks/useStandings';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useR2State } from '../../hooks/useR2State';
import { getGroupRaces } from '../../domain/groupCalculations';
import { GroupStandingsTable } from './GroupStandingsTable';

interface StandingsViewProps {
  discipline: DisciplineKey;
  onClose?: () => void;
  asTab?: boolean;
}

export function StandingsView({ discipline, onClose, asTab = false }: StandingsViewProps) {
  const result = useStandings(discipline);
  const { scores, structure, phase } = useDisciplineState(discipline);
  const r2State = useR2State(discipline);

  const showR2 =
    r2State !== null &&
    (phase === 'round-two' || phase === 'finals' || phase === 'complete');

  return (
    <div className="flex flex-col h-full">
      {!asTab && onClose && (
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
      )}

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
            <h2 className="text-lg font-semibold text-slate-900">Round 1 Standings</h2>
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

            {showR2 && r2State && (
              <>
                <h2 className="text-lg font-semibold text-slate-900 mt-6 mb-2">
                  Round 2 Standings
                </h2>
                {r2State.r2Groups.map((group) => {
                  // Convert R2 races to RaceMatchup format for GroupStandingsTable
                  const r2GroupRaces: RaceMatchup[] = group.races.map((race) => ({
                    raceNum: race.raceNum,
                    homeSlot: group.resolvedTeams[race.homeLetter] ?? 0,
                    awaySlot: group.resolvedTeams[race.awayLetter] ?? 0,
                  }));

                  return (
                    <div key={group.groupNum} className="overflow-x-auto">
                      <GroupStandingsTable
                        groupLetter={`R2-${group.groupNum}`}
                        standings={r2State.r2Standings[group.groupNum]}
                        teams={result.teams}
                        scores={scores.filter((s) =>
                          s.raceId.startsWith(`r2-${group.groupNum}-`)
                        )}
                        groupRaces={r2GroupRaces}
                        hasTies={r2State.r2TiesByGroup[group.groupNum]}
                        raceIdPrefix={`r2-${group.groupNum}-`}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
