import type { TeamStanding, Team, Score, RaceMatchup, RaceOutcome } from '../../domain/types';
import { ResultCell } from './ResultCell';
import { TieBadge } from './TieBadge';

interface GroupStandingsTableProps {
  groupLetter: string;
  standings: TeamStanding[];
  teams: Team[];
  scores: Score[];
  groupRaces: RaceMatchup[];
  hasTies: boolean;
}

export function GroupStandingsTable({
  groupLetter,
  standings,
  teams,
  scores,
  groupRaces,
  hasTies,
}: GroupStandingsTableProps) {
  const teamMap = new Map(teams.map((t) => [t.slot, t.name]));

  // Build score lookup: raceId -> Score
  const scoreMap = new Map(scores.map((s) => [s.raceId, s]));

  function getOutcome(race: RaceMatchup, slot: number): RaceOutcome | null {
    const score = scoreMap.get('r1-' + race.raceNum);
    if (!score) return null;
    if (score.homeSlot === slot) return score.homeOutcome;
    if (score.awaySlot === slot) return score.awayOutcome;
    return null;
  }

  function isTiedWithNeighbor(index: number): boolean {
    if (!hasTies) return false;
    const current = standings[index];
    const prev = standings[index - 1];
    const next = standings[index + 1];
    return (
      (prev !== undefined && prev.points === current.points) ||
      (next !== undefined && next.points === current.points)
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        Group {groupLetter}
      </h3>
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-slate-200">
            <th scope="col" className="px-2 py-2 text-left text-sm font-semibold text-slate-500">
              #
            </th>
            <th scope="col" className="px-2 py-2 text-left text-sm font-semibold text-slate-500">
              Team
            </th>
            <th scope="col" className="px-2 py-2 text-center text-sm font-semibold text-slate-500">
              W
            </th>
            <th scope="col" className="px-2 py-2 text-center text-sm font-semibold text-slate-500">
              L
            </th>
            <th scope="col" className="px-2 py-2 text-center text-sm font-semibold text-slate-500">
              DSQ
            </th>
            <th scope="col" className="px-2 py-2 text-center text-sm font-semibold text-slate-500">
              Pts
            </th>
            {groupRaces.map((race) => (
              <th
                key={race.raceNum}
                scope="col"
                className="px-1 py-2 text-center text-xs font-semibold text-slate-400"
              >
                {race.raceNum}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => (
            <tr
              key={standing.slot}
              className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
            >
              <td className="px-2 py-2 text-sm text-slate-500">
                {index + 1}
              </td>
              <td className="px-2 py-2 text-sm text-slate-900 font-medium">
                <span className="flex items-center gap-1.5">
                  {teamMap.get(standing.slot) ?? `Team ${standing.slot}`}
                  {isTiedWithNeighbor(index) && <TieBadge />}
                </span>
              </td>
              <td className="px-2 py-2 text-sm text-slate-700 text-center">
                {standing.wins}
              </td>
              <td className="px-2 py-2 text-sm text-slate-700 text-center">
                {standing.losses}
              </td>
              <td className="px-2 py-2 text-sm text-slate-700 text-center">
                {standing.dsqs}
              </td>
              <td className="px-2 py-2 text-sm text-slate-700 text-center font-semibold">
                {standing.points}
              </td>
              {groupRaces.map((race) => (
                <td key={race.raceNum} className="px-1 py-2">
                  <ResultCell outcome={getOutcome(race, standing.slot)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
