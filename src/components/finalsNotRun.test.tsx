import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { useFinalResults } from '../hooks/useFinalResults';
import { useFinalsState } from '../hooks/useFinalsState';
import { getCheatSheet } from '../domain/cheatSheets';
import { assignSlots } from '../domain/assignSlots';
import { RaceListView } from './races/RaceListView';

const store = () => useEventStore.getState();

/** 4 teams, slots 1..4 finish 1st..4th in Round 1 with no ties. */
function playGroupStage() {
  store().setTeams('mixed', assignSlots(['Kings', 'Imperial', 'UCL', 'LSE']));
  for (const race of getCheatSheet(4).roundOneRaces) {
    const homeWins = race.homeSlot < race.awaySlot;
    store().recordResult('mixed', {
      raceId: `r1-${race.raceNum}`,
      homeSlot: race.homeSlot,
      awaySlot: race.awaySlot,
      homeOutcome: homeWins ? 'win' : 'loss',
      awayOutcome: homeWins ? 'loss' : 'win',
    });
  }
  store().setDisciplinePhase('mixed', 'finals');
}

const slotName = (slot: number) =>
  store().disciplines.mixed.teams.find((t) => t.slot === slot)!.name;

describe('finals: race not run', () => {
  beforeEach(() => {
    store().resetEvent();
    playGroupStage();
  });

  afterEach(() => cleanup());

  it('offers "Race not run" on the open finals card', () => {
    render(
      <EditAccessContext.Provider value={true}>
        <RaceListView discipline="mixed" />
      </EditAccessContext.Provider>
    );
    expect(screen.getByRole('button', { name: 'Race not run' })).toBeTruthy();
  });

  it('counts a not-run final as done so finals can complete', () => {
    render(
      <EditAccessContext.Provider value={true}>
        <RaceListView discipline="mixed" />
      </EditAccessContext.Provider>
    );
    // First finals card (3rd/4th) is open: mark it not run, then win the final.
    fireEvent.click(screen.getByRole('button', { name: 'Race not run' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Win' })[0]);

    const { result } = renderHook(() => useFinalsState('mixed'));
    expect(result.current?.finalsPhase).toBe('all-scored');
  });

  it('shows both 3rd/4th teams as joint 3rd in the final results', () => {
    const { result: finals } = renderHook(() => useFinalsState('mixed'));
    const [thirdFourth, final] = finals.current!.finalsWithNames;
    store().recordResult('mixed', {
      raceId: thirdFourth.raceId,
      homeSlot: thirdFourth.homeSlot!,
      awaySlot: thirdFourth.awaySlot!,
      homeOutcome: 'not-run',
      awayOutcome: 'not-run',
    });
    store().recordResult('mixed', {
      raceId: final.raceId,
      homeSlot: final.homeSlot!,
      awaySlot: final.awaySlot!,
      homeOutcome: 'win',
      awayOutcome: 'loss',
    });

    const { result } = renderHook(() => useFinalResults('mixed'));
    expect(result.current!.map((r) => [r.position, r.teamName, r.placementLabel])).toEqual([
      [1, slotName(final.homeSlot!), '1st'],
      [2, slotName(final.awaySlot!), '2nd'],
      [3, slotName(thirdFourth.homeSlot!), 'Joint 3rd'],
      [3, slotName(thirdFourth.awaySlot!), 'Joint 3rd'],
    ]);
  });
});
