import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { EventInfoContext } from '../../events/eventInfo';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines } from '../../store/initialState';
import { playedDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { getCheatSheet } from '../../domain/cheatSheets';
import type { DisciplineState } from '../../domain/types';
import { RaceListView } from './RaceListView';

function setMixed(mixed: DisciplineState) {
  useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed } });
}

/** 8 teams with Round 1 done and no Round 2 races recorded yet. */
function roundOneComplete() {
  const mixed = playedDiscipline(8, { phase: 'round-two' });
  mixed.scores = mixed.scores.filter((s) => s.raceId.startsWith('r1-'));
  setMixed(mixed);
}

/** The accessible label of the first Round 1 race card. */
function firstRoundOneCardLabel() {
  const { teams } = useEventStore.getState().disciplines.mixed;
  const race = getCheatSheet(8).roundOneRaces[0];
  const name = (slot: number) => teams.find((t) => t.slot === slot)!.name;
  return `Race ${race.raceNum}: ${name(race.homeSlot)} versus ${name(race.awaySlot)}`;
}

function renderList(eventId = 'e1') {
  return render(
    <EventInfoContext.Provider value={{ id: eventId, name: 'Test', date: '', round: null }}>
      <EditAccessContext.Provider value={true}>
        <RaceListView discipline="mixed" />
      </EditAccessContext.Provider>
    </EventInfoContext.Provider>
  );
}

describe('Races tab: folding completed rounds', () => {
  beforeEach(() => {
    // jsdom has no scrollIntoView; the race list scrolls to the next card.
    Element.prototype.scrollIntoView = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('collapses Round 1 once every Round 1 race is scored', () => {
    roundOneComplete();
    renderList();
    const bar = screen.getByRole('button', { name: 'Round 1' });
    expect(bar.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByLabelText(firstRoundOneCardLabel())).toBeNull();
  });

  it('opens a folded round when its bar is tapped, and closes it again', () => {
    roundOneComplete();
    renderList();
    const bar = screen.getByRole('button', { name: 'Round 1' });

    fireEvent.click(bar);
    expect(bar.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByLabelText(firstRoundOneCardLabel())).toBeTruthy();

    fireEvent.click(bar);
    expect(bar.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByLabelText(firstRoundOneCardLabel())).toBeNull();
  });

  it('remembers the choice for the event across remounts', () => {
    roundOneComplete();
    renderList('e1');
    fireEvent.click(screen.getByRole('button', { name: 'Round 1' }));
    cleanup();

    renderList('e1');
    expect(screen.getByRole('button', { name: 'Round 1' }).getAttribute('aria-expanded')).toBe(
      'true'
    );
  });

  it('keeps the choice separate per event', () => {
    roundOneComplete();
    renderList('e1');
    fireEvent.click(screen.getByRole('button', { name: 'Round 1' }));
    cleanup();

    renderList('e2');
    expect(screen.getByRole('button', { name: 'Round 1' }).getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('still renders and toggles when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    roundOneComplete();
    renderList();
    const bar = screen.getByRole('button', { name: 'Round 1' });
    expect(bar.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(bar);
    expect(bar.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByLabelText(firstRoundOneCardLabel())).toBeTruthy();
  });

  it('leaves an incomplete round open with a plain heading', () => {
    const mixed = playedDiscipline(8, { phase: 'group-stage' });
    mixed.scores = mixed.scores.filter((s) => s.raceId.startsWith('r1-')).slice(0, 3);
    setMixed(mixed);
    renderList();
    expect(screen.queryByRole('button', { name: 'Round 1' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Round 1' })).toBeTruthy();
    expect(screen.getByLabelText(firstRoundOneCardLabel())).toBeTruthy();
  });

  it('collapses Round 2 once all its races are scored', () => {
    const mixed = playedDiscipline(8, { phase: 'finals' });
    mixed.scores = mixed.scores.filter((s) => !s.raceId.startsWith('fin-'));
    setMixed(mixed);
    renderList();
    expect(screen.getByRole('button', { name: 'Round 2' }).getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('never folds Finals', () => {
    const mixed = playedDiscipline(8, { phase: 'finals' });
    mixed.scores = mixed.scores.filter((s) => !s.raceId.startsWith('fin-'));
    setMixed(mixed);
    renderList();
    expect(screen.queryByRole('button', { name: 'Finals' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Finals' })).toBeTruthy();
  });
});
