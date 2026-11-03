import { useState, useRef, useEffect, useMemo } from 'react';
import { useEventStore } from '../../store/eventStore';
import { RoundHeader } from './RoundHeader';
import { AllRacesDisciplineSection, AllRacesRaceCard, type ScoreResult } from './AllRacesDisciplineSection';
import { hasRoundTwoStarted, roundOneCardSpecs, roundTwoCardSpecs, type CardSpec } from './allRacesCards';
import { RaceOrderPicker } from './RaceOrderPicker';
import { useRaceOrder } from '../../events/raceOrder';
import { useR2State } from '../../hooks/useR2State';
import { useFinalsState } from '../../hooks/useFinalsState';
import { isResultsOnly, isStoppedEarly } from '../../domain/roundPlacings';
import {
  COMBINED_ROUND_LABELS,
  DEFAULT_COMBINED_ORDER,
  DEFAULT_COMBINED_ROUNDS,
  disciplineOrderFor,
  findNextUnscoredRace,
  orderCombinedRaces,
  orderRoundRaces,
  r1RacesByDiscipline,
  raceOrderBlocksFor,
  scoredCombinedKeys,
  type CombinedRound,
  type RaceIdsByDiscipline,
} from '../../domain/combinedRaceOrder';
import type { DisciplineKey } from '../../domain/types';

interface AllRacesListViewProps {
  /** Opens a discipline's own Races tab, e.g. to confirm its finals. */
  onOpenDiscipline?: (discipline: DisciplineKey) => void;
}

/**
 * Every discipline's Round 1, Round 2 and Finals in one list, scored the same
 * way as the Races tab. Finals confirmation and tiebreaks stay on each tab.
 * Round 1 and Round 2 follow the event's race order; Finals always run
 * Board, Ladies, Mixed.
 */
export function AllRacesListView({ onOpenDiscipline }: AllRacesListViewProps) {
  const disciplines = useEventStore((s) => s.disciplines);
  const recordResult = useEventStore((s) => s.recordResult);
  const clearResult = useEventStore((s) => s.clearResult);
  const setNote = useEventStore((s) => s.setNote);

  // Explicit calls with literal keys keep the hook order fixed.
  const mixedR2 = useR2State('mixed');
  const ladiesR2 = useR2State('ladies');
  const boardR2 = useR2State('board');
  const mixedFinals = useFinalsState('mixed');
  const ladiesFinals = useFinalsState('ladies');
  const boardFinals = useFinalsState('board');
  const r2 = { mixed: mixedR2, ladies: ladiesR2, board: boardR2 };
  const finals = { mixed: mixedFinals, ladies: ladiesFinals, board: boardFinals };

  const scoredKeys = useMemo(() => scoredCombinedKeys(disciplines), [disciplines]);
  const { order } = useRaceOrder();
  const blocks = useMemo(() => raceOrderBlocksFor(disciplines), [disciplines]);

  /**
   * Races that can be opened, in list order. A discipline's Round 2 counts
   * once its Round 1 is fully scored in `scored`, so scoring the last Round 1
   * race moves straight on before the phase has changed.
   */
  function navigableIds(scored: ReadonlySet<string>): RaceIdsByDiscipline {
    const r1 = r1RacesByDiscipline(disciplines);
    const ids: RaceIdsByDiscipline = {};
    for (const d of DEFAULT_COMBINED_ORDER) {
      const matchups = r1[d];
      // Stopped-early disciplines are read-only, so they are never opened or advanced to.
      if (!matchups || isStoppedEarly(disciplines[d])) continue;
      const r1Ids = matchups.map((m) => `r1-${m.raceNum}`);
      const r1Done = r1Ids.every((id) => scored.has(`${d}:${id}`));
      const finalsPhase = finals[d]?.finalsPhase;
      ids[d] = {
        r1: r1Ids,
        r2: r1Done && r2[d] ? r2[d].r2Races.map((r) => r.raceId) : [],
        finals:
          finalsPhase === 'confirmed' || finalsPhase === 'all-scored'
            ? finals[d]!.finalsWithNames
                .filter((m) => m.homeSlot !== null && m.awaySlot !== null)
                .map((m) => m.raceId)
            : [],
      };
    }
    return ids;
  }

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-expand first unscored card on mount
  useEffect(() => {
    setExpandedKey(
      findNextUnscoredRace(orderCombinedRaces(navigableIds(scoredKeys), order, blocks), scoredKeys, null)?.key ??
        null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScore(discipline: DisciplineKey, key: string, result: ScoreResult) {
    recordResult(discipline, result);
    // Compute next unscored synchronously before React re-renders
    const scored = new Set(scoredKeys).add(key);
    const next = findNextUnscoredRace(orderCombinedRaces(navigableIds(scored), order, blocks), scored, key);
    setExpandedKey(next?.key ?? null);
    // Scroll to next card after DOM updates
    if (next) {
      requestAnimationFrame(() => {
        const el = cardRefs.current.get(next.key);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  const cardHandlers = {
    expandedKey,
    onToggle: (key: string) => setExpandedKey((prev) => (prev === key ? null : key)),
    onScore: handleScore,
    onClear: clearResult,
    onNoteChange: setNote,
    registerCard: (key: string, el: HTMLDivElement) => cardRefs.current.set(key, el),
  };

  function renderSection(round: CombinedRound, d: DisciplineKey) {
    return (
      <AllRacesDisciplineSection
        key={d}
        discipline={d}
        round={round}
        state={disciplines[d]}
        r2State={r2[d]}
        finalsState={finals[d]}
        onOpenDiscipline={onOpenDiscipline}
        {...cardHandlers}
      />
    );
  }

  /**
   * Round 1 or Round 2 under a non-standard order: one card list across
   * disciplines, then the sections of disciplines with nothing to run in
   * this round (no teams, results-only, stopped early, Round 2 not started).
   */
  function renderInterleaved(round: 'r1' | 'r2', shown: readonly DisciplineKey[]) {
    const scheduled = r1RacesByDiscipline(disciplines);
    const ids: RaceIdsByDiscipline = {};
    const specs = new Map<string, CardSpec>();
    for (const d of DEFAULT_COMBINED_ORDER) {
      const state = disciplines[d];
      if (!shown.includes(d) || !scheduled[d] || isStoppedEarly(state)) continue;
      const r2State = r2[d];
      const list =
        round === 'r1'
          ? roundOneCardSpecs(state)
          : hasRoundTwoStarted(state, r2State)
            ? roundTwoCardSpecs(r2State)
            : null;
      if (!list) continue;
      ids[d] = { [round]: list.map((spec) => spec.raceId) };
      for (const spec of list) specs.set(`${d}:${spec.raceId}`, spec);
    }
    return (
      <>
        {orderRoundRaces(round, ids, order, blocks).map((race) => (
          <AllRacesRaceCard
            key={race.key}
            discipline={race.discipline}
            spec={specs.get(race.key)!}
            state={disciplines[race.discipline]}
            {...cardHandlers}
          />
        ))}
        {shown.filter((d) => !ids[d]).map((d) => renderSection(round, d))}
      </>
    );
  }

  let firstRound = true;

  return (
    <div>
      <div className="px-4 pt-3">
        <RaceOrderPicker />
      </div>
      {DEFAULT_COMBINED_ROUNDS.map((round) => {
        // Round 1 explains a discipline without races, so later rounds skip it.
        const shown = disciplineOrderFor(round).filter((d) => {
          const state = disciplines[d];
          return round === 'r1' || (state.teamCount >= 4 && !isResultsOnly(state));
        });
        if (shown.length === 0) return null;
        const isFirst = firstRound;
        firstRound = false;
        return (
          <div key={round}>
            <RoundHeader label={COMBINED_ROUND_LABELS[round]} isActive isFirst={isFirst} />
            {round === 'finals' || order === 'standard'
              ? shown.map((d) => renderSection(round, d))
              : renderInterleaved(round, shown)}
          </div>
        );
      })}
    </div>
  );
}
