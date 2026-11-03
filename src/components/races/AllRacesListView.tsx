import { useState, useRef, useEffect, useMemo } from 'react';
import { useEventStore } from '../../store/eventStore';
import { RoundHeader } from './RoundHeader';
import { AllRacesDisciplineSection, type ScoreResult } from './AllRacesDisciplineSection';
import { useR2State } from '../../hooks/useR2State';
import { useFinalsState } from '../../hooks/useFinalsState';
import { isResultsOnly, isStoppedEarly } from '../../domain/roundPlacings';
import {
  COMBINED_ROUND_LABELS,
  DEFAULT_COMBINED_ORDER,
  DEFAULT_COMBINED_ORDERING,
  findNextUnscoredRace,
  orderCombinedRaces,
  r1RacesByDiscipline,
  scoredCombinedKeys,
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
      findNextUnscoredRace(orderCombinedRaces(navigableIds(scoredKeys)), scoredKeys, null)?.key ?? null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScore(discipline: DisciplineKey, key: string, result: ScoreResult) {
    recordResult(discipline, result);
    // Compute next unscored synchronously before React re-renders
    const scored = new Set(scoredKeys).add(key);
    const next = findNextUnscoredRace(orderCombinedRaces(navigableIds(scored)), scored, key);
    setExpandedKey(next?.key ?? null);
    // Scroll to next card after DOM updates
    if (next) {
      requestAnimationFrame(() => {
        const el = cardRefs.current.get(next.key);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  let firstRound = true;

  return (
    <div>
      {DEFAULT_COMBINED_ORDERING.rounds.map((round) => {
        // Round 1 explains a discipline without races, so later rounds skip it.
        const shown = DEFAULT_COMBINED_ORDERING.disciplines.filter((d) => {
          const state = disciplines[d];
          return round === 'r1' || (state.teamCount >= 4 && !isResultsOnly(state));
        });
        if (shown.length === 0) return null;
        const isFirst = firstRound;
        firstRound = false;
        return (
          <div key={round}>
            <RoundHeader label={COMBINED_ROUND_LABELS[round]} isActive isFirst={isFirst} />
            {shown.map((d) => (
              <AllRacesDisciplineSection
                key={d}
                discipline={d}
                round={round}
                state={disciplines[d]}
                r2State={r2[d]}
                finalsState={finals[d]}
                expandedKey={expandedKey}
                onToggle={(key) => setExpandedKey((prev) => (prev === key ? null : key))}
                onScore={handleScore}
                onClear={clearResult}
                onNoteChange={setNote}
                registerCard={(key, el) => cardRefs.current.set(key, el)}
                onOpenDiscipline={onOpenDiscipline}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
