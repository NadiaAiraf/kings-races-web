import { useState, useRef, useEffect, useMemo } from 'react';
import { useEventStore } from '../../store/eventStore';
import { ExpandableRaceCard } from './ExpandableRaceCard';
import { RoundHeader } from './RoundHeader';
import { DISCIPLINE_LABELS } from '../../domain/csvExport';
import { isResultsOnly, isStoppedEarly } from '../../domain/roundPlacings';
import {
  DEFAULT_COMBINED_ORDERING,
  combinedRaceKey,
  findNextUnscoredRace,
  orderCombinedRaces,
  r1RacesByDiscipline,
  type CombinedRace,
} from '../../domain/combinedRaceOrder';
import type { DisciplineKey, RaceOutcome, Score } from '../../domain/types';

/** Every discipline's Round 1 races in one list, scored the same way as the Races tab. */
export function AllRacesListView() {
  const disciplines = useEventStore((s) => s.disciplines);
  const recordResult = useEventStore((s) => s.recordResult);
  const clearResult = useEventStore((s) => s.clearResult);
  const setNote = useEventStore((s) => s.setNote);

  const races = useMemo(
    () => orderCombinedRaces(r1RacesByDiscipline(disciplines), DEFAULT_COMBINED_ORDERING),
    [disciplines],
  );

  const scoredKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const [discipline, state] of Object.entries(disciplines)) {
      for (const score of state.scores) {
        keys.add(combinedRaceKey(discipline as DisciplineKey, score.raceId));
      }
    }
    return keys;
  }, [disciplines]);

  const scoreMaps = useMemo(() => {
    const maps = new Map<DisciplineKey, Map<string, Score>>();
    for (const [discipline, state] of Object.entries(disciplines)) {
      maps.set(discipline as DisciplineKey, new Map(state.scores.map((s) => [s.raceId, s])));
    }
    return maps;
  }, [disciplines]);

  const teamNames = useMemo(() => {
    const maps = new Map<DisciplineKey, Map<number, string>>();
    for (const [discipline, state] of Object.entries(disciplines)) {
      maps.set(discipline as DisciplineKey, new Map(state.teams.map((t) => [t.slot, t.name])));
    }
    return maps;
  }, [disciplines]);

  // Read-only, as in the Races tab, so they are never opened or advanced to.
  const stoppedEarly = useMemo(
    () =>
      new Set(
        (Object.entries(disciplines) as [DisciplineKey, (typeof disciplines)[DisciplineKey]][])
          .filter(([, state]) => isStoppedEarly(state))
          .map(([discipline]) => discipline),
      ),
    [disciplines],
  );

  const navigable = useMemo(
    () => races.filter((r) => !stoppedEarly.has(r.discipline)),
    [races, stoppedEarly],
  );

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-expand first unscored card on mount
  useEffect(() => {
    setExpandedKey(findNextUnscoredRace(navigable, scoredKeys, null)?.key ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScore(
    discipline: DisciplineKey,
    key: string,
    result: {
      raceId: string;
      homeSlot: number;
      awaySlot: number;
      homeOutcome: RaceOutcome;
      awayOutcome: RaceOutcome;
    },
  ) {
    recordResult(discipline, result);
    // Compute next unscored synchronously before React re-renders
    const next = findNextUnscoredRace(navigable, new Set(scoredKeys).add(key), key);
    setExpandedKey(next?.key ?? null);
    // Scroll to next card after DOM updates
    if (next) {
      requestAnimationFrame(() => {
        const el = cardRefs.current.get(next.key);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function renderCard(r: CombinedRace) {
    const { discipline, raceId, race } = r;
    const names = teamNames.get(discipline);
    const isStopped = stoppedEarly.has(discipline);
    return (
      <div
        key={r.key}
        ref={(el) => {
          if (el) cardRefs.current.set(r.key, el);
        }}
      >
        <ExpandableRaceCard
          raceId={raceId}
          raceNum={race.raceNum}
          homeTeamName={names?.get(race.homeSlot) ?? `Team ${race.homeSlot}`}
          awayTeamName={names?.get(race.awaySlot) ?? `Team ${race.awaySlot}`}
          homeSlot={race.homeSlot}
          awaySlot={race.awaySlot}
          score={scoreMaps.get(discipline)?.get(raceId)}
          isExpanded={!isStopped && expandedKey === r.key}
          note={disciplines[discipline].notes[raceId]}
          onNoteChange={(id, note) => setNote(discipline, id, note)}
          // The cleared card is already the expanded one, so it stays open for re-scoring.
          onClear={(id) => clearResult(discipline, id)}
          onExpand={() => {
            if (isStopped) return;
            setExpandedKey((prev) => (prev === r.key ? null : r.key));
          }}
          onScore={(result) => handleScore(discipline, r.key, result)}
        />
      </div>
    );
  }

  return (
    <div>
      {DEFAULT_COMBINED_ORDERING.disciplines.map((discipline, index) => {
        const state = disciplines[discipline];
        const sectionRaces = races.filter((r) => r.discipline === discipline);
        return (
          <section key={discipline} aria-label={DISCIPLINE_LABELS[discipline]}>
            <RoundHeader label={DISCIPLINE_LABELS[discipline]} isActive isFirst={index === 0} />
            {state.teamCount < 4 ? (
              <p className="text-sm text-slate-500 px-4 py-2">No teams entered yet.</p>
            ) : isResultsOnly(state) ? (
              <p className="text-sm text-slate-500 px-4 py-2">
                Results entered after the event. No races recorded.
              </p>
            ) : (
              <>
                {stoppedEarly.has(discipline) && (
                  <p className="text-sm text-slate-500 px-4 py-2">
                    Stopped early: places entered by officials.
                  </p>
                )}
                {sectionRaces.map(renderCard)}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
