import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { EventInfoContext } from '../../events/eventInfo';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines } from '../../store/initialState';
import { playedDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { getCheatSheet } from '../../domain/cheatSheets';
import { RaceListView } from './RaceListView';
import { roundOneCardSpecs } from './allRacesCards';

const structure = getCheatSheet(8);

/** The group letter a Round 1 race belongs to, from the cheat sheet. */
function groupOf(homeSlot: number) {
  return structure.groups.find((g) => g.teamSlots.includes(homeSlot))!.letter;
}

function renderList() {
  return render(
    <EventInfoContext.Provider value={{ id: 'e1', name: 'Test', date: '', round: null }}>
      <EditAccessContext.Provider value={false}>
        <RaceListView discipline="board" />
      </EditAccessContext.Provider>
    </EventInfoContext.Provider>
  );
}

describe('All races Round 1 cards', () => {
  it('label each race with its Round 1 group', () => {
    const board = playedDiscipline(8, { phase: 'group-stage' });
    const specs = roundOneCardSpecs(board);
    expect(specs.map((s) => s.groupLabel)).toEqual(
      structure.roundOneRaces.map((r) => `Group ${groupOf(r.homeSlot)}`)
    );
  });
});

describe('Discipline Races tab cards', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    localStorage.clear();
    const board = playedDiscipline(8, { phase: 'group-stage' });
    board.scores = [];
    useEventStore.setState({ disciplines: { ...createInitialDisciplines(), board } });
  });

  afterEach(() => {
    cleanup();
  });

  function roundOneCards() {
    return screen.getAllByLabelText(/^Race \d+:/);
  }

  it('show the Round 1 group on each card', () => {
    renderList();
    const cards = roundOneCards();
    cards.forEach((card, i) => {
      expect(card.textContent).toContain(`Group ${groupOf(structure.roundOneRaces[i].homeSlot)}`);
    });
  });

  it('carry the discipline label like the All races cards', () => {
    renderList();
    expect(roundOneCards().every((c) => c.textContent?.includes('Board'))).toBe(true);
  });

  it('carry the discipline colour stripe like the All races cards', () => {
    renderList();
    expect(roundOneCards().every((c) => c.className.includes('border-l-green-700'))).toBe(true);
  });
});
