import type { DisciplineKey, DisciplineState } from './types';
import { resolveCompletedDiscipline } from './disciplineResults';
import { resolveFinalsRef } from './finalsSeeding';
import { PLACING_REFS } from './placingRefs';
import { formatOrdinal, parsePlacementLabel } from '../hooks/useFinalResults';
import type { FinalResult } from './csvExport';
import { NO_TIEBREAKS } from '../hooks/groupOrder';

export type PlacingSource = 'final' | 'group' | 'official' | 'entered';

export interface TeamPlacing {
  slot: number;
  name: string;
  /** The place that counts: the official's if set, else the computed one. */
  place: number | null;
  source: PlacingSource | null;
  /** The place from finals or group position, ignoring any official's place. */
  computedPlace: number | null;
}

/**
 * A discipline run outside the app: finished, with teams and their final
 * places but no race results.
 */
export function isResultsOnly(state: DisciplineState): boolean {
  return state.phase === 'complete' && state.scores.length === 0 && state.teams.length > 0;
}

/**
 * A discipline finished before all its races were run (e.g. weather): some
 * results, no finals outcome, so officials enter the places.
 */
export function isStoppedEarly(state: DisciplineState): boolean {
  return (
    state.phase === 'complete' &&
    state.scores.length > 0 &&
    resolveCompletedDiscipline(state) === null
  );
}

/** Whether a discipline's places are the officials' entered places. */
export function usesEnteredPlacings(state: DisciplineState): boolean {
  return isResultsOnly(state) || isStoppedEarly(state);
}

/**
 * Every team's final place in a finished discipline, best first, with
 * unplaced teams last. Finals decide most places; the rest come from the
 * spreadsheet's group-position refs (PLACING_REFS). An official's place
 * overrides both and fills any gap. A results-only or stopped-early
 * discipline uses the entered places. Null until the discipline is complete.
 */
export function computeRoundPlacings(state: DisciplineState): TeamPlacing[] | null {
  if (isResultsOnly(state)) return enteredPlacings(state);
  const completed = resolveCompletedDiscipline(state);
  if (!completed) {
    // Stopped early: same test as isStoppedEarly, without resolving twice.
    return state.phase === 'complete' && state.scores.length > 0 ? enteredPlacings(state) : null;
  }

  const computed = new Map<number, { place: number; source: PlacingSource }>();
  for (const final of completed.finals) {
    const { homeSlot, awaySlot, score } = final;
    if (!score || homeSlot === null || awaySlot === null) continue;
    const [winnerPlace, loserPlace] = parsePlacementLabel(final.label);
    if (!winnerPlace) continue;
    // A final that was not run ties both teams on the higher place.
    const homeWon = score.homeOutcome === 'win' || score.homeOutcome === 'not-run';
    const awayWon = score.awayOutcome === 'win' || score.awayOutcome === 'not-run';
    computed.set(homeSlot, { place: homeWon ? winnerPlace : loserPlace, source: 'final' });
    computed.set(awaySlot, { place: awayWon ? winnerPlace : loserPlace, source: 'final' });
  }

  for (const { place, ref } of PLACING_REFS[state.teamCount] ?? []) {
    const slot = resolveFinalsRef(ref, completed.r2Standings, completed.r1Standings, NO_TIEBREAKS);
    if (slot !== null && !computed.has(slot)) computed.set(slot, { place, source: 'group' });
  }

  // If one team and one place are left (e.g. 5th of 5), that is its place.
  const unplaced = state.teams.filter((t) => !computed.has(t.slot));
  const free = freePlaces(
    [...computed.values()].map((c) => c.place),
    state.teamCount,
  );
  if (unplaced.length === 1 && free.length === 1) {
    computed.set(unplaced[0].slot, { place: free[0], source: 'group' });
  }

  const placings = state.teams.map((team): TeamPlacing => {
    const auto = computed.get(team.slot) ?? null;
    const official = state.placings[team.slot] ?? null;
    return {
      slot: team.slot,
      name: team.name,
      place: official ?? auto?.place ?? null,
      source: official !== null ? 'official' : (auto?.source ?? null),
      computedPlace: auto?.place ?? null,
    };
  });

  return placings.sort(
    (a, b) => (a.place ?? Infinity) - (b.place ?? Infinity) || a.name.localeCompare(b.name),
  );
}

/** A results-only or stopped-early discipline's places, as entered. */
function enteredPlacings(state: DisciplineState): TeamPlacing[] {
  const placings = state.teams.map((team): TeamPlacing => {
    const place = state.placings[team.slot] ?? null;
    return {
      slot: team.slot,
      name: team.name,
      place,
      source: place === null ? null : 'entered',
      computedPlace: place,
    };
  });
  return placings.sort(
    (a, b) => (a.place ?? Infinity) - (b.place ?? Infinity) || a.name.localeCompare(b.name)
  );
}

/**
 * Places not yet taken. Joint places take up the places after them, so two
 * teams on joint 3rd leave 3rd and 4th taken.
 */
function freePlaces(places: number[], teamCount: number): number[] {
  const counts = new Map<number, number>();
  for (const p of places) counts.set(p, (counts.get(p) ?? 0) + 1);
  const taken = new Set<number>();
  for (const [place, count] of counts) {
    for (let i = 0; i < count; i++) taken.add(place + i);
  }
  return Array.from({ length: teamCount }, (_, i) => i + 1).filter((p) => !taken.has(p));
}

/**
 * A finished discipline's results for the CSV export, matching the on-screen
 * table: every team's place, shared places marked "Joint", and teams without
 * a place last with no position. Null until the discipline is complete.
 */
export function roundResults(state: DisciplineState): FinalResult[] | null {
  const placings = computeRoundPlacings(state);
  if (!placings) return null;
  const count = new Map<number, number>();
  for (const p of placings) if (p.place !== null) count.set(p.place, (count.get(p.place) ?? 0) + 1);
  return placings.map((p) => ({
    position: p.place ?? 0,
    teamName: p.name,
    placementLabel:
      p.place === null
        ? 'No place'
        : `${count.get(p.place)! > 1 ? 'Joint ' : ''}${formatOrdinal(p.place)}`,
  }));
}

// From the "League Points Lookup" sheet: fixed points for the top three, then
// one point fewer per place, never below 1. The sheet stops at 30th; 31st is
// assumed to score 1 like the places before it.
const TOP_THREE_POINTS: Record<DisciplineKey, [number, number, number]> = {
  mixed: [30, 28, 26],
  ladies: [15, 13, 11],
  board: [10, 8, 6],
};

const FOURTH_PLACE_POINTS: Record<DisciplineKey, number> = { mixed: 25, ladies: 10, board: 5 };

/** League points for finishing in `place` (1-based) in a round. */
export function leaguePoints(discipline: DisciplineKey, place: number): number {
  if (place <= 3) return TOP_THREE_POINTS[discipline][place - 1];
  return Math.max(1, FOURTH_PLACE_POINTS[discipline] - (place - 4));
}
