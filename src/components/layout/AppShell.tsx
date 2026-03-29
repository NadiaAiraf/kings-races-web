import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import { DisciplineTabs } from './DisciplineTabs';
import { SubTabs } from './SubTabs';
import type { SubTabKey } from './SubTabs';
import { ProgressBar } from '../shared/ProgressBar';
import { TeamEntryView } from '../teams/TeamEntryView';
import { RaceListView } from '../races/RaceListView';
import { ScoringFocusView } from '../scoring/ScoringFocusView';
import { StandingsView } from '../standings/StandingsView';
import { useCurrentRace } from '../../hooks/useCurrentRace';

export function AppShell() {
  const activeDiscipline = useEventStore((s) => s.activeDiscipline);
  const setActiveDiscipline = useEventStore((s) => s.setActiveDiscipline);
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('teams');
  const [showStandings, setShowStandings] = useState(false);
  const { currentIndex, totalRaces } = useCurrentRace(activeDiscipline);

  // When all races scored, currentIndex is -1; show total instead of 0
  const raceProgress = currentIndex >= 0 ? currentIndex + 1 : (totalRaces > 0 ? totalRaces : 0);

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
          </main>
          {activeSubTab !== 'teams' && (
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
