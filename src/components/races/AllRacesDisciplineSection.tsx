import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ExpandableRaceCard } from './ExpandableRaceCard';
import { DISCIPLINE_ACCENT } from '../shared/disciplineAccent';
import { DISCIPLINE_LABELS } from '../../domain/csvExport';
import { getCheatSheet } from '../../domain/cheatSheets';
import { isResultsOnly, isStoppedEarly } from '../../domain/roundPlacings';
import { COMBINED_ROUND_LABELS, combinedRaceKey, type CombinedRound } from '../../domain/combinedRaceOrder';
import type { R2State } from '../../hooks/useR2State';
import type { useFinalsState } from '../../hooks/useFinalsState';
import type { DisciplineKey, DisciplineState, RaceOutcome, Score } from '../../domain/types';

type FinalsState = ReturnType<typeof useFinalsState>;

export interface ScoreResult {
  raceId: string;
  homeSlot: number;
  awaySlot: number;
  homeOutcome: RaceOutcome;
  awayOutcome: RaceOutcome;
}

interface AllRacesDisciplineSectionProps {
  discipline: DisciplineKey;
  round: CombinedRound;
  state: DisciplineState;
  r2State: R2State | null;
  finalsState: FinalsState;
  expandedKey: string | null;
  onToggle: (key: string) => void;
  onScore: (discipline: DisciplineKey, key: string, result: ScoreResult) => void;
  onClear: (discipline: DisciplineKey, raceId: string) => void;
  onNoteChange: (discipline: DisciplineKey, raceId: string, note: string) => void;
  registerCard: (key: string, el: HTMLDivElement) => void;
  /** Opens this discipline's own Races tab, where finals are confirmed and ties resolved. */
  onOpenDiscipline?: (discipline: DisciplineKey) => void;
}

interface CardSpec {
  raceId: string;
  raceNum: number;
  homeTeamName: string;
  awayTeamName: string;
  homeSlot: number;
  awaySlot: number;
  score: Score | undefined;
  groupLabel?: string;
  matchupLabel?: string;
  seedingContext?: string;
  isFinalMatch?: boolean;
  allowNotRun?: boolean;
}

const note = (text: string) => <p className="text-sm text-slate-500 px-4 py-2">{text}</p>;
const quiet = (text: string) => <p className="text-sm text-slate-400 px-4 py-2">{text}</p>;

/** One discipline's races within one round of the All races view, or why there are none yet. */
export function AllRacesDisciplineSection({
  discipline,
  round,
  state,
  r2State,
  finalsState,
  expandedKey,
  onToggle,
  onScore,
  onClear,
  onNoteChange,
  registerCard,
  onOpenDiscipline,
}: AllRacesDisciplineSectionProps) {
  const label = DISCIPLINE_LABELS[discipline];
  const stoppedEarly = isStoppedEarly(state);

  function renderCard(spec: CardSpec) {
    const key = combinedRaceKey(discipline, spec.raceId);
    return (
      <div
        key={key}
        ref={(el) => {
          if (el) registerCard(key, el);
        }}
      >
        <ExpandableRaceCard
          {...spec}
          discipline={discipline}
          isExpanded={!stoppedEarly && expandedKey === key}
          note={state.notes[spec.raceId]}
          onNoteChange={(id, text) => onNoteChange(discipline, id, text)}
          // The cleared card is already the expanded one, so it stays open for re-scoring.
          onClear={(id) => onClear(discipline, id)}
          onExpand={() => {
            if (stoppedEarly) return;
            onToggle(key);
          }}
          onScore={(result) => onScore(discipline, key, result)}
        />
      </div>
    );
  }

  function pointer(text: string) {
    return (
      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        <p className="text-sm text-slate-600">{text}</p>
        {onOpenDiscipline && (
          <button
            type="button"
            className="min-h-[44px] px-4 text-sm font-semibold text-brand-600 rounded-sm focus-visible:ring-2 focus-visible:ring-brand-600"
            onClick={() => onOpenDiscipline(discipline)}
          >
            Open {label}
          </button>
        )}
      </div>
    );
  }

  function roundOne(): ReactNode {
    if (state.teamCount < 4) return note('No teams entered yet.');
    if (isResultsOnly(state)) return note('Results entered after the event. No races recorded.');
    const names = new Map(state.teams.map((t) => [t.slot, t.name]));
    const scores = new Map(state.scores.map((s) => [s.raceId, s]));
    return (
      <>
        {stoppedEarly && note('Stopped early: places entered by officials.')}
        {getCheatSheet(state.teamCount).roundOneRaces.map((race) => {
          const raceId = `r1-${race.raceNum}`;
          return renderCard({
            raceId,
            raceNum: race.raceNum,
            homeTeamName: names.get(race.homeSlot) ?? `Team ${race.homeSlot}`,
            awayTeamName: names.get(race.awaySlot) ?? `Team ${race.awaySlot}`,
            homeSlot: race.homeSlot,
            awaySlot: race.awaySlot,
            score: scores.get(raceId),
          });
        })}
      </>
    );
  }

  function roundTwo(): ReactNode {
    const structure = getCheatSheet(state.teamCount);
    if (!structure.roundTwoGroups?.length) return quiet('No Round 2 in this format.');
    const started = state.phase === 'round-two' || (r2State?.scoredR2Races ?? 0) > 0;
    if (started && r2State) {
      return r2State.r2Races.map((race) =>
        renderCard({
          raceId: race.raceId,
          raceNum: race.raceNum,
          homeTeamName: race.homeTeamName,
          awayTeamName: race.awayTeamName,
          homeSlot: race.homeSlot ?? 0,
          awaySlot: race.awaySlot ?? 0,
          score: r2State.r2ScoreMap.get(race.raceId),
          groupLabel: `Group ${race.groupNum}`,
          allowNotRun: true,
        }),
      );
    }
    const count =
      structure.roundTwoRaceCount ?? structure.roundTwoGroups.reduce((n, g) => n + g.races.length, 0);
    return quiet(`Round 2 - ${count} races, seeded from Round 1 results`);
  }

  function finals(): ReactNode {
    if (stoppedEarly) return note('Not raced: the round was stopped early.');
    switch (finalsState?.finalsPhase) {
      case 'confirmed':
      case 'all-scored':
        return finalsState.finalsWithNames.map((matchup) =>
          matchup.homeSlot !== null && matchup.awaySlot !== null ? (
            renderCard({
              raceId: matchup.raceId,
              raceNum: matchup.index + 1,
              homeTeamName: matchup.homeTeamName,
              awayTeamName: matchup.awayTeamName,
              homeSlot: matchup.homeSlot,
              awaySlot: matchup.awaySlot,
              score: matchup.score ?? undefined,
              matchupLabel: matchup.label,
              seedingContext: `${matchup.homeRef} vs ${matchup.awayRef}${
                matchup.optional ? ' · If time allows' : ''
              }`,
              isFinalMatch: matchup.label.startsWith('1st/'),
              allowNotRun: true,
            })
          ) : (
            <p key={matchup.raceId} className="text-sm text-slate-400 py-2">
              {matchup.label} - Teams not yet resolved
            </p>
          ),
        );
      case 'ready':
        return pointer(`Finals ready to confirm on the ${label} tab.`);
      case 'blocked-ties':
        return pointer(`Resolve tied standings on the ${label} tab before finals.`);
      default:
        return quiet('Finals seeded from group stage results');
    }
  }

  return (
    <section aria-label={`${COMBINED_ROUND_LABELS[round]} ${label}`}>
      <h3
        className={clsx(
          'text-base font-semibold border-l-4 pl-2 mt-4 mb-2',
          DISCIPLINE_ACCENT[discipline].heading,
        )}
      >
        {label}
      </h3>
      {round === 'r1' ? roundOne() : round === 'r2' ? roundTwo() : finals()}
    </section>
  );
}
