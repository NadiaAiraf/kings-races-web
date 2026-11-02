import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { EventInfoContext } from '../../events/eventInfo';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines } from '../../store/initialState';
import { playedDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { getCheatSheet } from '../../domain/cheatSheets';
import { RaceListView } from './RaceListView';

const firstRace = getCheatSheet(8).roundOneRaces[0];
const firstRaceId = `r1-${firstRace.raceNum}`;

/** 8 teams in Round 1 with only the first race scored. */
function firstRaceScored() {
  const mixed = playedDiscipline(8, { phase: 'group-stage' });
  mixed.scores = mixed.scores.filter((s) => s.raceId === firstRaceId);
  useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed } });
}

/** The accessible label of the first Round 1 race card. */
function firstCardLabel() {
  const { teams } = useEventStore.getState().disciplines.mixed;
  const name = (slot: number) => teams.find((t) => t.slot === slot)!.name;
  return `Race ${firstRace.raceNum}: ${name(firstRace.homeSlot)} versus ${name(firstRace.awaySlot)}`;
}

function renderList() {
  return render(
    <EventInfoContext.Provider value={{ id: 'e1', name: 'Test', date: '', round: null }}>
      <EditAccessContext.Provider value={true}>
        <RaceListView discipline="mixed" />
      </EditAccessContext.Provider>
    </EventInfoContext.Provider>
  );
}

describe('Races tab: clearing a result', () => {
  beforeEach(() => {
    // jsdom has no scrollIntoView; the race list scrolls to the next card.
    Element.prototype.scrollIntoView = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('removes the race score from the store', () => {
    firstRaceScored();
    renderList();

    fireEvent.click(screen.getByLabelText(firstCardLabel()));
    fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));

    const { scores } = useEventStore.getState().disciplines.mixed;
    expect(scores.find((s) => s.raceId === firstRaceId)).toBeUndefined();
  });

  it('keeps the cleared card open, ready to be scored again', () => {
    firstRaceScored();
    renderList();

    fireEvent.click(screen.getByLabelText(firstCardLabel()));
    fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));

    expect(screen.getByLabelText(firstCardLabel()).getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Clear result' })).toBeNull();
  });
});
