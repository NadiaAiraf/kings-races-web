import { useState, useEffect } from 'react';
import { useEventStore } from '../../store/eventStore';
import { DisciplineTabs } from './DisciplineTabs';
import { SubTabs } from './SubTabs';
import type { SubTabKey } from './SubTabs';
import { ProgressBar } from '../shared/ProgressBar';
import { TeamEntryView } from '../teams/TeamEntryView';
import { RaceListView } from '../races/RaceListView';
import { ScoringFocusView } from '../scoring/ScoringFocusView';
import { StandingsView } from '../standings/StandingsView';
import { FinalsView } from '../finals/FinalsView';
import { useCurrentRace } from '../../hooks/useCurrentRace';
import { useDisciplineState } from '../../hooks/useDisciplineState';
import { useR2State } from '../../hooks/useR2State';
import { useStandings } from '../../hooks/useStandings';
import { useFinalsState } from '../../hooks/useFinalsState';
import { areAllR1RacesScored } from '../../domain/r2Seeding';

export function AppShell() {
  const activeDiscipline = useEventStore((s) => s.activeDiscipline);
  const setActiveDiscipline = useEventStore((s) => s.setActiveDiscipline);
  const setDisciplinePhase = useEventStore((s) => s.setDisciplinePhase);
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('teams');
  const [showStandings, setShowStandings] = useState(false);

  const { scores, structure, phase } = useDisciplineState(activeDiscipline);
  const { currentIndex, totalRaces, scoredR1, scoredR2 } =
    useCurrentRace(activeDiscipline);
  useR2State(activeDiscipline);
  const standingsResult = useStandings(activeDiscipline);
  const finalsState = useFinalsState(activeDiscipline);

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

  return (
    <div className="flex flex-col min-h-screen min-h-dvh max-w-[430px] mx-auto bg-white">
      <DisciplineTabs active={activeDiscipline} onSelect={setActiveDiscipline} />
      {showStandings ? (
        <StandingsView
          discipline={activeDiscipline}
          onClose={() => setShowStandings(false)}
        />
      ) : (
        <>
          <SubTabs active={activeSubTab} onSelect={setActiveSubTab} />
          <main className="flex-1 overflow-y-auto px-4 py-4" role="tabpanel">
            {activeSubTab === 'teams' && <TeamEntryView discipline={activeDiscipline} />}
            {activeSubTab === 'races' && <RaceListView discipline={activeDiscipline} />}
            {activeSubTab === 'score' && <ScoringFocusView discipline={activeDiscipline} />}
            {activeSubTab === 'finals' && <FinalsView discipline={activeDiscipline} />}
            {activeSubTab === 'standings' && (
              <StandingsView discipline={activeDiscipline} asTab={true} />
            )}
          </main>
          {activeSubTab !== 'teams' && activeSubTab !== 'standings' && (
            <button
              onClick={() => setShowStandings(true)}
              className="fixed bottom-16 right-4 max-w-[430px] bg-blue-600 text-white px-4 min-h-14 rounded-lg shadow-lg text-sm font-semibold z-20"
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
