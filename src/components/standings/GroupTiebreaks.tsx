import { hasTies } from '../../domain/scoring';
import type { DisciplineKey, TeamStanding } from '../../domain/types';
import { TiebreakResolver } from './TiebreakResolver';

export interface TiebreakGroup {
  /** Storage key: group letter for Round 1, r2TiebreakKey(groupNum) for Round 2. */
  key: string;
  label: string;
  /** Standings by points alone, before any manual order. */
  standings: TeamStanding[];
}

interface GroupTiebreaksProps {
  discipline: DisciplineKey;
  groups: TiebreakGroup[];
  manualTiebreaks: Record<string, number[]>;
  teamNames: Map<number, string>;
  canChange: boolean;
}

/** One resolver per group whose teams are level on points. */
export function GroupTiebreaks({
  discipline,
  groups,
  manualTiebreaks,
  teamNames,
  canChange,
}: GroupTiebreaksProps) {
  return (
    <>
      {groups
        .filter((group) => hasTies(group.standings))
        .map((group) => (
          <TiebreakResolver
            // Remount when the points or saved order change so the
            // resolver never shows a stale draft order.
            key={`${group.key}:${group.standings.map((s) => `${s.slot}=${s.points}`).join(',')}:${
              manualTiebreaks[group.key]?.join(',') ?? ''
            }`}
            discipline={discipline}
            groupKey={group.key}
            label={group.label}
            standings={group.standings}
            savedOrder={manualTiebreaks[group.key]}
            teamNames={teamNames}
            canChange={canChange}
          />
        ))}
    </>
  );
}
