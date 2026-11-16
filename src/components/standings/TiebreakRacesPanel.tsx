import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import { useCanEdit } from '../../auth/editAccess';
import type { DisciplineKey } from '../../domain/types';
import {
  tiebreakRacePrefix,
  type TiebreakRace,
  type TiebreakRaceOutcome,
} from '../../domain/tiebreakRaces';
import { ExpandableRaceCard } from '../races/ExpandableRaceCard';
import { ConfirmDialog } from '../shared/ConfirmDialog';

export type TiebreakRacesState = 'off' | 'on' | 'stale';

interface TiebreakRacesPanelProps {
  discipline: DisciplineKey;
  /** Storage key: group letter for Round 1, r2TiebreakKey(groupNum) for Round 2. */
  groupKey: string;
  label: string;
  /** Slots currently level in a points level of three or more teams. */
  tiedSlots: number[];
  races: TiebreakRace[];
  /** off: not started; on: started for this tie; stale: started for a different tie. */
  state: TiebreakRacesState;
  /** Only given when state is 'on'. */
  outcome: TiebreakRaceOutcome | null;
  teamNames: Map<number, string>;
  /** False once the next stage has started, so seeding can no longer move. */
  canChange: boolean;
}

/** "A", "A and B", "A, B and C". */
function nameList(names: string[]): string {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Optional extra races between teams level on points in a group of three or
 * more, with sides swapped. Their results only suggest an order inside the
 * tiebreak box; they never change points.
 */
export function TiebreakRacesPanel({
  discipline,
  groupKey,
  label,
  tiedSlots,
  races,
  state,
  outcome,
  teamNames,
  canChange,
}: TiebreakRacesPanelProps) {
  const canEdit = useCanEdit();
  const scores = useEventStore((s) => s.disciplines[discipline].scores);
  const setTiebreakRaces = useEventStore((s) => s.setTiebreakRaces);
  const recordResult = useEventStore((s) => s.recordResult);
  const clearResult = useEventStore((s) => s.clearResult);
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);

  if (!canEdit && state !== 'on') return null;

  const name = (slot: number) => teamNames.get(slot) ?? `Team ${slot}`;
  const canToggle = canEdit && canChange;
  const prefix = tiebreakRacePrefix(groupKey);
  const resultCount = scores.filter((s) => s.raceId.startsWith(prefix)).length;
  const scoreMap = new Map(scores.map((s) => [s.raceId, s]));

  const runButton = canToggle && (
    <button
      type="button"
      aria-pressed="false"
      onClick={() => setTiebreakRaces(discipline, groupKey, tiedSlots)}
      className="min-h-11 px-3 rounded-sm text-sm font-semibold bg-amber-100 text-amber-900 active:bg-amber-200"
    >
      Run tie-break races
    </button>
  );

  if (state !== 'on') {
    return (
      <div className="mb-3 flex flex-col gap-2 items-start">
        {state === 'stale' && (
          <p className="text-sm text-amber-800 dark:text-amber-300">
            The tie has changed since tie-break races were started.
          </p>
        )}
        {runButton}
      </div>
    );
  }

  const cancelControl =
    canToggle &&
    (resultCount === 0 ? (
      <button
        type="button"
        aria-pressed="true"
        onClick={() => setTiebreakRaces(discipline, groupKey, null)}
        className="min-h-11 px-3 rounded-sm text-sm font-semibold bg-slate-100 text-slate-700"
      >
        Cancel tie-break races
      </button>
    ) : (
      <ConfirmDialog
        triggerLabel="Cancel tie-break races"
        title="Remove tie-break results?"
        description={`This removes ${resultCount} tie-break result${resultCount === 1 ? '' : 's'} for ${label} for everyone.`}
        confirmLabel="Remove"
        onConfirm={() => setTiebreakRaces(discipline, groupKey, null)}
        className="min-h-11"
      />
    ));

  const messages: string[] = [];
  if (outcome?.complete) {
    const tied = outcome.order.filter((s) => s.slot in outcome.wins);
    const summary = tied
      .map((s, i) => {
        const w = outcome.wins[s.slot];
        return i === 0 ? `${name(s.slot)} ${w} win${w === 1 ? '' : 's'}` : `${name(s.slot)} ${w}`;
      })
      .join(', ');
    if (outcome.stillLevel.length === 0) {
      messages.push(
        `Tie-break races decide the order: ${summary}. Check the order below and press Confirm order.`
      );
    } else {
      const levelSlots = new Set(outcome.stillLevel.flat());
      if (tied.some((s) => !levelSlots.has(s.slot))) messages.push(`Tie-break wins: ${summary}.`);
      for (const run of outcome.stillLevel) {
        messages.push(
          `${nameList(run.map(name))} are still level after the tie-break races. Settle it your own way, e.g. rock, paper, scissors or a beer drinking contest, then set the order below.`
        );
      }
    }
  }

  return (
    <div className="mb-3 flex flex-col gap-2">
      <p className="text-sm text-amber-700 dark:text-amber-400">
        Extra races between the tied teams with sides swapped. They do not change points.
      </p>
      <div>
        {races.map((race, i) => (
          <ExpandableRaceCard
            key={race.raceId}
            raceId={race.raceId}
            raceNum={i + 1}
            raceLabel={`Tie-break ${i + 1}`}
            homeTeamName={name(race.homeSlot)}
            awayTeamName={name(race.awaySlot)}
            homeSlot={race.homeSlot}
            awaySlot={race.awaySlot}
            score={scoreMap.get(race.raceId)}
            isExpanded={expandedRaceId === race.raceId}
            disabled={!canChange}
            onExpand={(id) => setExpandedRaceId((current) => (current === id ? null : id))}
            onScore={(score) => {
              recordResult(discipline, score);
              setExpandedRaceId(null);
            }}
            onClear={(id) => clearResult(discipline, id)}
          />
        ))}
      </div>
      {messages.map((message) => (
        <p key={message} className="text-sm font-medium text-amber-900">
          {message}
        </p>
      ))}
      {cancelControl && <div>{cancelControl}</div>}
    </div>
  );
}
