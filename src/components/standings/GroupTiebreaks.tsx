import { hasTies } from '../../domain/scoring';
import type { DisciplineKey, TeamStanding } from '../../domain/types';
import type { HeadToHeadDefault } from '../../domain/headToHead';
import {
  buildTiebreakRaces,
  multiTeamTiedSlots,
  sameSlotSet,
  tiebreakRaceOutcome,
  type Meeting,
} from '../../domain/tiebreakRaces';
import { useEventStore } from '../../store/eventStore';
import { useCanEdit } from '../../auth/editAccess';
import { TiebreakResolver } from './TiebreakResolver';
import { TiebreakRacesPanel } from './TiebreakRacesPanel';

export interface TiebreakGroup {
  /** Storage key: group letter for Round 1, r2TiebreakKey(groupNum) for Round 2. */
  key: string;
  label: string;
  /** Standings by points alone, before any manual order. */
  standings: TeamStanding[];
  /** Suggested order for tied teams: head-to-head for two, the seeded rule for three or four. */
  headToHead?: HeadToHeadDefault;
  /** The group's races in race order, for tie-break races between tied teams. */
  meetings?: Meeting[];
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
  const canEdit = useCanEdit();
  const flags = useEventStore((s) => s.disciplines[discipline].tiebreakRaces);
  const scores = useEventStore((s) => s.disciplines[discipline].scores);

  return (
    <>
      {groups
        .filter((group) => hasTies(group.standings))
        .map((group) => {
          // Tie-break races are only offered for levels of three or more teams.
          const tiedSlots = multiTeamTiedSlots(group.standings);
          const races =
            tiedSlots.length > 0
              ? buildTiebreakRaces(group.key, group.meetings ?? [], group.standings)
              : [];
          const stored = flags[group.key];
          const state =
            stored === undefined ? 'off' : sameSlotSet(stored, tiedSlots) ? 'on' : 'stale';
          const outcome =
            state === 'on'
              ? tiebreakRaceOutcome(group.headToHead?.order ?? group.standings, races, scores)
              : null;
          const tiebreakOrder = outcome?.complete ? outcome.order : undefined;
          const panel = races.length > 0 && (state === 'on' || canEdit) && (
            <TiebreakRacesPanel
              discipline={discipline}
              groupKey={group.key}
              label={group.label}
              tiedSlots={tiedSlots}
              races={races}
              state={state}
              outcome={outcome}
              teamNames={teamNames}
              canChange={canChange}
            />
          );
          return (
            <TiebreakResolver
              // Remount when the points, saved order or suggested order
              // change so the resolver never shows a stale draft order.
              key={`${group.key}:${group.standings.map((s) => `${s.slot}=${s.points}`).join(',')}:${
                manualTiebreaks[group.key]?.join(',') ?? ''
              }:${group.headToHead?.order.map((s) => s.slot).join(',') ?? ''}:${
                tiebreakOrder?.map((s) => s.slot).join(',') ?? ''
              }`}
              discipline={discipline}
              groupKey={group.key}
              label={group.label}
              standings={group.standings}
              savedOrder={manualTiebreaks[group.key]}
              teamNames={teamNames}
              canChange={canChange}
              headToHead={group.headToHead}
              tiebreakOrder={tiebreakOrder}
            >
              {panel || undefined}
            </TiebreakResolver>
          );
        })}
    </>
  );
}
