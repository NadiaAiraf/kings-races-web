import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import { DisciplineTabs } from './DisciplineTabs';
import { SubTabs } from './SubTabs';
import type { SubTabKey } from './SubTabs';
import { ProgressBar } from '../shared/ProgressBar';
import { TeamEntryView } from '../teams/TeamEntryView';
import { RaceListView } from '../races/RaceListView';
import { ScoringFocusView } from '../scoring/ScoringFocusView';
import { useCurrentRace } from '../../hooks/useCurrentRace';

export function AppShell() {
  const activeDiscipline = useEventStore((s) => s.activeDiscipline);
  const setActiveDiscipline = useEventStore((s) => s.setActiveDiscipline);
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('teams');
  const [showStandings, setShowStandings] = useState(false);
  const { currentIndex, totalRaces } = useCurrentRace(activeDiscipline);

  // When all races scored, currentIndex is -1; show total instead of 0
  const raceProgress = currentIndex >= 0 ? currentIndex + 1 : (totalRaces > 0 ? totalRaces : 0);

  // Suppress unused variable warning -- showStandings is prepared for Plan 02-05
  void showStandings;
  void setShowStandings;

  return (
    <div className="flex flex-col min-h-screen min-h-dvh max-w-[430px] mx-auto bg-white">
      <DisciplineTabs active={activeDiscipline} onSelect={setActiveDiscipline} />
      <SubTabs active={activeSubTab} onSelect={setActiveSubTab} />
      <main className="flex-1 overflow-y-auto px-4 py-4" role="tabpanel">
        {activeSubTab === 'teams' && <TeamEntryView discipline={activeDiscipline} />}
        {activeSubTab === 'races' && <RaceListView discipline={activeDiscipline} />}
        {activeSubTab === 'score' && <ScoringFocusView discipline={activeDiscipline} />}
      </main>
      <ProgressBar current={raceProgress} total={totalRaces} />
    </div>
  );
}
