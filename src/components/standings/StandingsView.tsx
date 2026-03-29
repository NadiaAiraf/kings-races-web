import { useCallback } from 'react';
import type { DisciplineKey, RaceMatchup } from '../../domain/types';
import { useStandings } from '../../hooks/useStandings';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useR2State } from '../../hooks/useR2State';
import { useFinalResults, computeFinalResults } from '../../hooks/useFinalResults';
import { getGroupRaces } from '../../domain/groupCalculations';
import { calculateAllGroupStandings } from '../../domain/groupCalculations';
import { calculateGroupStandings, hasTies } from '../../domain/scoring';
import { getCheatSheet } from '../../domain/cheatSheets';
import { resolveAllFinalsMatchups, areAllFinalsScored } from '../../domain/finalsSeeding';
import { generateEventCSV, triggerCSVDownload } from '../../domain/csvExport';
import type { FinalResult } from '../../domain/csvExport';
import { useEventStore } from '../../store/eventStore';
import { GroupStandingsTable } from './GroupStandingsTable';
import { FinalResultsTable } from '../results/FinalResultsTable';
import { ExportButton } from '../results/ExportButton';

interface StandingsViewProps {
  discipline: DisciplineKey;
  onClose?: () => void;
  asTab?: boolean;
}

const ALL_DISCIPLINES: DisciplineKey[] = ['mixed', 'board', 'ladies'];

/**
 * Build final results for a single discipline from raw store data (no hooks).
 * Replicates the logic from useFinalsState + computeFinalResults.
 */
function buildResultsForDiscipline(
  disciplineState: { teams: { slot: number; name: string }[]; teamCount: number; scores: { raceId: string; homeSlot: number; awaySlot: number; homeOutcome: string; awayOutcome: string }[]; phase: string; manualTiebreaks: Record<string, number[]> }
): FinalResult[] | null {
  if (disciplineState.phase !== 'complete') return null;
  if (disciplineState.teamCount < 4) return null;

  const structure = getCheatSheet(disciplineState.teamCount);
  if (!structure) return null;

  // Build R1 standings
  const r1Standings = calculateAllGroupStandings(
    disciplineState.scores as any,
    structure.groups
  );

  // Build R2 standings if applicable
  let r2Standings: Record<string, any[]> | null = null;
  if (structure.roundTwoGroups && structure.roundTwoGroups.length > 0) {
    r2Standings = {};
    for (const r2Group of structure.roundTwoGroups) {
      // Resolve R2 group teams from R1 standings
      const r2Scores = disciplineState.scores.filter((s) =>
        s.raceId.startsWith(`r2-${r2Group.groupNum}-`)
      );
      // Get team slots for this R2 group from seeding entries
      const teamSlots: number[] = [];
      for (const entry of r2Group.seedingEntries) {
        // Each seeding entry resolves to a team slot from R1 standings
        const groupLetter = entry.positionCode.slice(1); // e.g., "A" from "A1"
        const posIndex = parseInt(entry.positionCode.slice(0, 1), 10) - 1;
        // Actually positionCode is like "A1" meaning group A, position 1
        // But we need to parse it properly
        const letterMatch = entry.positionCode.match(/^([A-Z])(\d+)$/);
        if (letterMatch) {
          const groupKey = letterMatch[1];
          const pos = parseInt(letterMatch[2], 10) - 1;
          const groupStandings = r1Standings[groupKey];
          if (groupStandings && groupStandings[pos]) {
            teamSlots.push(groupStandings[pos].slot);
          }
        }
      }
      r2Standings[r2Group.groupNum] = calculateGroupStandings(
        r2Scores as any,
        teamSlots
      );
    }
  }

  // Resolve finals matchups
  const resolvedMatchups = resolveAllFinalsMatchups(
    structure,
    r2Standings,
    r1Standings,
    disciplineState.manualTiebreaks
  );

  // Build finalsWithNames equivalent
  const teamMap = new Map(disciplineState.teams.map((t) => [t.slot, t.name]));
  const finalsWithNames = resolvedMatchups.map((m, index) => ({
    ...m,
    score: disciplineState.scores.find((s) => s.raceId === `fin-${index}`) ?? null,
  }));

  // Check if all finals are scored
  const allScored = areAllFinalsScored(structure.finals, disciplineState.scores as any);
  if (!allScored) return null;

  return computeFinalResults(
    finalsWithNames as any,
    disciplineState.teams,
    'all-scored'
  );
}

export function StandingsView({ discipline, onClose, asTab = false }: StandingsViewProps) {
  const result = useStandings(discipline);
  const { scores, structure, phase } = useDisciplineState(discipline);
  const r2State = useR2State(discipline);
  const finalResults = useFinalResults(discipline);

  const showR2 =
    r2State !== null &&
    (phase === 'round-two' || phase === 'finals' || phase === 'complete');

  const handleExport = useCallback(() => {
    const state = useEventStore.getState();
    const disciplines: Record<DisciplineKey, FinalResult[]> = {
      mixed: [],
      board: [],
      ladies: [],
    };

    for (const key of ALL_DISCIPLINES) {
      const discState = state.disciplines[key];
      const results = buildResultsForDiscipline(discState);
      if (results) {
        disciplines[key] = results;
      }
    }

    const csv = generateEventCSV(disciplines);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const filename = `kings-races-${yyyy}-${mm}-${dd}.csv`;
    triggerCSVDownload(csv, filename);
  }, []);

  // Determine if export should be enabled (any discipline complete)
  const allDisciplineStates = useEventStore((s) => s.disciplines);
  const anyComplete = ALL_DISCIPLINES.some(
    (key) => allDisciplineStates[key].phase === 'complete'
  );

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
        {phase === 'complete' && finalResults && (
          <div className="mb-6">
            <FinalResultsTable discipline={discipline} results={finalResults} />
            <div className="mt-4">
              <ExportButton
                disabled={!anyComplete}
                onExport={handleExport}
              />
            </div>
          </div>
        )}

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
