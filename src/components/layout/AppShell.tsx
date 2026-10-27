import { useState, useEffect, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useEventStore } from '../../store/eventStore';
import { DisciplineTabs } from './DisciplineTabs';
import { SubTabs } from './SubTabs';
import type { SubTabKey } from './SubTabs';
import { useCanEdit } from '../../auth/editAccess';
import type { DisciplineKey } from '../../domain/types';
import { ProgressBar } from '../shared/ProgressBar';
import { TeamEntryView } from '../teams/TeamEntryView';
import { RaceListView } from '../races/RaceListView';
import { StandingsView } from '../standings/StandingsView';
import { useCurrentRace } from '../../hooks/useCurrentRace';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useR2State } from '../../hooks/useR2State';
import { useStandings } from '../../hooks/useStandings';
import { useFinalsState } from '../../hooks/useFinalsState';
import { areAllR1RacesScored } from '../../domain/r2Seeding';
import { DISCIPLINE_KEYS } from '../../events/eventDoc';

const SUB_TAB_KEYS: readonly SubTabKey[] = ['teams', 'races', 'standings'];

function parseKey<K extends string>(value: string | null, keys: readonly K[]): K | null {
  return keys.find((key) => key === value) ?? null;
}

interface AppShellProps {
  /** Rendered above the discipline tabs, e.g. the open event's name. */
  header?: ReactNode;
}

export function AppShell({ header }: AppShellProps) {
  const storedDiscipline = useEventStore((s) => s.activeDiscipline);
  const setActiveDiscipline = useEventStore((s) => s.setActiveDiscipline);
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);
  const [searchParams, setSearchParams] = useSearchParams();
  // The open discipline and tab live in the URL so a reload or a shared link
  // keeps them. Without ?d the round opens on the last discipline chosen this session.
  const activeDiscipline = parseKey(searchParams.get('d'), DISCIPLINE_KEYS) ?? storedDiscipline;
  const selectedSubTab = parseKey(searchParams.get('v'), SUB_TAB_KEYS) ?? 'teams';
  // Viewers only follow the racing, so the Teams tab is for officials.
  // Derived rather than stored so signing in or out switches tabs at once.
  const canEdit = useCanEdit();
  const activeSubTab = !canEdit && selectedSubTab === 'teams' ? 'races' : selectedSubTab;
  const [showStandings, setShowStandings] = useState(false);

  function setParam(key: 'd' | 'v', value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );
  }

  function selectDiscipline(d: DisciplineKey) {
    setActiveDiscipline(d);
    setParam('d', d);
  }

  const { scores, structure, phase } = useDisciplineState(activeDiscipline);
  const { currentIndex, totalRaces, scoredR1, scoredR2 } =
    useCurrentRace(activeDiscipline);
  useR2State(activeDiscipline);
  const standingsResult = useStandings(activeDiscipline);
  const finalsState = useFinalsState(activeDiscipline);

  // These transitions run on every client, viewers included, because the
  // phase is derived from scores. Only approved clients persist them (via
  // startEventSync), and only the phase field is written, so several
  // approved devices making the same transition cannot overwrite scores.

  // Phase auto-transition: group-stage -> round-two
  useEffect(() => {
    if (
      (phase === 'group-stage' || phase === 'setup') &&
      structure &&
      structure.roundTwoGroups &&
      structure.roundTwoGroups.length > 0 &&
      areAllR1RacesScored(scores, structure) &&
      standingsResult
    ) {
      // Check no ties in any R1 group
      const anyTies = Object.values(standingsResult.tiesByGroup).some((t) => t);
      if (!anyTies) {
        setDisciplinePhase(activeDiscipline, 'round-two');
      }
    }
  }, [phase, structure, scores, standingsResult, activeDiscipline, setDisciplinePhase]);

  // Phase auto-transition: finals -> complete (when all finals scored)
  useEffect(() => {
    if (phase === 'finals' && finalsState && finalsState.finalsPhase === 'all-scored') {
      setDisciplinePhase(activeDiscipline, 'complete');
    }
  }, [phase, finalsState, activeDiscipline, setDisciplinePhase]);

  // Combined progress for progress bar
  const totalScored = scoredR1 + scoredR2;
  // When all races scored, show total instead of 0
  const raceProgress =
    totalScored > 0 && totalScored >= totalRaces ? totalRaces : totalScored > 0 ? totalScored : currentIndex >= 0 ? currentIndex + 1 : totalRaces > 0 ? totalRaces : 0;

  const disciplineBg: Record<DisciplineKey, string> = {
    mixed: 'bg-blue-50',
    board: 'bg-green-50',
    ladies: 'bg-red-50',
  };

  // Results tables follow the discipline colour. Ladies keeps the club red default.
  const disciplineTableColours: Record<DisciplineKey, CSSProperties> = {
    mixed: { '--color-table-head': '#1d4ed8', '--color-table-stripe': '#dbeafe' } as CSSProperties,
    board: { '--color-table-head': '#15803d', '--color-table-stripe': '#dcfce7' } as CSSProperties,
    ladies: {},
  };

  return (
    <div
      className={`flex flex-col min-h-screen min-h-dvh max-w-[430px] md:max-w-3xl mx-auto ${disciplineBg[activeDiscipline]}`}
      style={disciplineTableColours[activeDiscipline]}
    >
      {header}
      <DisciplineTabs active={activeDiscipline} onSelect={selectDiscipline} />
      {showStandings ? (
        <StandingsView
          discipline={activeDiscipline}
          onClose={() => setShowStandings(false)}
        />
      ) : (
        <>
          <SubTabs showTeams={canEdit} active={activeSubTab} onSelect={(v) => setParam('v', v)} />
          <main className="flex-1 overflow-y-auto px-4 py-4" role="tabpanel">
            {activeSubTab === 'teams' && <TeamEntryView discipline={activeDiscipline} />}
            {activeSubTab === 'races' && <RaceListView discipline={activeDiscipline} />}
            {activeSubTab === 'standings' && (
              <StandingsView discipline={activeDiscipline} asTab={true} />
            )}
          </main>
          {activeSubTab !== 'teams' && activeSubTab !== 'standings' && (
            <button
              onClick={() => setShowStandings(true)}
              className="fixed bottom-16 right-[max(1rem,calc((100vw-430px)/2+1rem))] md:right-[max(1rem,calc((100vw-48rem)/2+1rem))] bg-brand-600 text-white px-4 min-h-14 rounded-sm shadow-lg text-sm font-semibold z-20"
            >
              Standings
            </button>
          )}
          <ProgressBar current={raceProgress} total={totalRaces} />
        </>
      )}
    </div>
  );
}
