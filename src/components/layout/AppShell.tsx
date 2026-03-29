import { useState } from 'react';
import { useEventStore } from '../../store/eventStore';
import { DisciplineTabs } from './DisciplineTabs';
import { SubTabs } from './SubTabs';
import type { SubTabKey } from './SubTabs';
import { ProgressBar } from '../shared/ProgressBar';

export function AppShell() {
  const activeDiscipline = useEventStore((s) => s.activeDiscipline);
  const setActiveDiscipline = useEventStore((s) => s.setActiveDiscipline);
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('teams');
  const [showStandings, setShowStandings] = useState(false);

  // Suppress unused variable warning -- showStandings is prepared for Plan 02-05
  void showStandings;
  void setShowStandings;

  return (
    <div className="flex flex-col min-h-screen min-h-dvh max-w-[430px] mx-auto bg-white">
      <DisciplineTabs active={activeDiscipline} onSelect={setActiveDiscipline} />
      <SubTabs active={activeSubTab} onSelect={setActiveSubTab} />
      <main className="flex-1 overflow-y-auto px-4 py-4" role="tabpanel">
        {activeSubTab === 'teams' && <div className="text-slate-500">Teams view placeholder</div>}
        {activeSubTab === 'races' && <div className="text-slate-500">Races view placeholder</div>}
        {activeSubTab === 'score' && <div className="text-slate-500">Score view placeholder</div>}
      </main>
      <ProgressBar current={0} total={0} />
    </div>
  );
}
