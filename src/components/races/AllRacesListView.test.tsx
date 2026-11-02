import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { EventInfoContext } from '../../events/eventInfo';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines, createInitialDisciplineState } from '../../store/initialState';
import { playedDiscipline, stoppedEarlyDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { getCheatSheet } from '../../domain/cheatSheets';
import type { DisciplineKey, DisciplineState, RaceMatchup, Score } from '../../domain/types';
import { AllRacesListView } from './AllRacesListView';

const MIXED_RACES = getCheatSheet(8).roundOneRaces;
const FOUR_TEAM_RACES = getCheatSheet(4).roundOneRaces;

const CARD_LABEL = /^Race \d+: /;

const homeWin = (race: RaceMatchup): Score => ({
  raceId: `r1-${race.raceNum}`,
  homeSlot: race.homeSlot,
  awaySlot: race.awaySlot,
  homeOutcome: 'win',
  awayOutcome: 'loss',
});

/** A discipline in Round 1 with only the given races scored. */
function inRoundOne(count: number, scored: RaceMatchup[] = []): DisciplineState {
  return { ...playedDiscipline(count, { phase: 'group-stage' }), scores: scored.map(homeWin) };
}

function setDisciplines(overrides: Partial<Record<DisciplineKey, DisciplineState>>) {
  useEventStore.setState({
    disciplines: {
      ...createInitialDisciplines(),
      mixed: inRoundOne(8),
      ladies: inRoundOne(4),
      board: inRoundOne(4),
      ...overrides,
    },
  });
}

function renderList(canEdit = true) {
  return render(
    <EventInfoContext.Provider value={{ id: 'e1', name: 'Test', date: '', round: null }}>
      <EditAccessContext.Provider value={canEdit}>
        <AllRacesListView />
      </EditAccessContext.Provider>
    </EventInfoContext.Provider>,
  );
}

const section = (name: string) => within(screen.getByRole('region', { name }));

/** The accessible label of `race`'s card, using that discipline's team names. */
function cardLabel(discipline: DisciplineKey, race: RaceMatchup) {
  const { teams } = useEventStore.getState().disciplines[discipline];
  const name = (slot: number) => teams.find((t) => t.slot === slot)!.name;
  return `Race ${race.raceNum}: ${name(race.homeSlot)} versus ${name(race.awaySlot)}`;
}

/** The card for `race` in the named discipline section. */
function card(sectionName: 'Mixed' | 'Ladies' | 'Board', race: RaceMatchup) {
  const discipline = sectionName.toLowerCase() as DisciplineKey;
  return section(sectionName).getByLabelText(cardLabel(discipline, race));
}

const isExpanded = (el: HTMLElement) => el.getAttribute('aria-expanded') === 'true';

const expandedCards = () =>
  screen.queryAllByLabelText(CARD_LABEL).filter((el) => isExpanded(el));

describe('All R1 race list', () => {
  beforeEach(() => {
    // jsdom has no scrollIntoView; the list scrolls to the next card.
    Element.prototype.scrollIntoView = vi.fn();
    localStorage.clear();
    useEventStore.getState().resetEvent();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the sections in Mixed, Ladies, Board order', () => {
    setDisciplines({});

    renderList();

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Mixed', 'Ladies', 'Board']);
  });

  it('lists each section in its cheat sheet race order', () => {
    setDisciplines({});

    renderList();

    const labels = section('Mixed').getAllByLabelText(CARD_LABEL).map((el) => el.getAttribute('aria-label'));
    expect(labels).toEqual(MIXED_RACES.map((r) => cardLabel('mixed', r)));
  });

  it('expands only the first Mixed race on mount when nothing is scored', () => {
    setDisciplines({});

    renderList();

    expect(expandedCards()).toEqual([card('Mixed', MIXED_RACES[0])]);
  });

  it('writes a score for the last Mixed race to Mixed only', () => {
    const last = MIXED_RACES[MIXED_RACES.length - 1];
    setDisciplines({ mixed: inRoundOne(8, MIXED_RACES.slice(0, -1)) });
    renderList();

    fireEvent.click(within(card('Mixed', last)).getAllByRole('button', { name: 'Win' })[0]);

    const { disciplines } = useEventStore.getState();
    expect(disciplines.mixed.scores.some((s) => s.raceId === `r1-${last.raceNum}`)).toBe(true);
    expect(disciplines.ladies.scores).toEqual([]);
    expect(disciplines.board.scores).toEqual([]);
  });

  it('moves on to the first Ladies race after the last Mixed race is scored', () => {
    const last = MIXED_RACES[MIXED_RACES.length - 1];
    setDisciplines({ mixed: inRoundOne(8, MIXED_RACES.slice(0, -1)) });
    renderList();

    fireEvent.click(within(card('Mixed', last)).getAllByRole('button', { name: 'Win' })[0]);

    expect(expandedCards()).toEqual([card('Ladies', FOUR_TEAM_RACES[0])]);
  });

  it('clears a Ladies result without touching the Mixed race with the same id', () => {
    const first = FOUR_TEAM_RACES[0];
    setDisciplines({ mixed: inRoundOne(8, [first]), ladies: inRoundOne(4, [first]) });
    renderList();

    fireEvent.click(card('Ladies', first));
    fireEvent.click(section('Ladies').getByRole('button', { name: 'Clear result' }));

    const { disciplines } = useEventStore.getState();
    const raceId = `r1-${first.raceNum}`;
    expect(disciplines.ladies.scores.find((s) => s.raceId === raceId)).toBeUndefined();
    expect(disciplines.mixed.scores.find((s) => s.raceId === raceId)).toBeDefined();
  });

  it('keeps the cleared card open', () => {
    const first = FOUR_TEAM_RACES[0];
    setDisciplines({ ladies: inRoundOne(4, [first]) });
    renderList();

    fireEvent.click(card('Ladies', first));
    fireEvent.click(section('Ladies').getByRole('button', { name: 'Clear result' }));

    expect(isExpanded(card('Ladies', first))).toBe(true);
  });

  it('saves a note on a Board card to Board', () => {
    const first = FOUR_TEAM_RACES[0];
    setDisciplines({});
    renderList();

    fireEvent.click(card('Board', first));
    const box = section('Board').getByLabelText('Race note');
    fireEvent.change(box, { target: { value: 'Gate 3 reset' } });
    fireEvent.blur(box);

    const { disciplines } = useEventStore.getState();
    expect(disciplines.board.notes[`r1-${first.raceNum}`]).toBe('Gate 3 reset');
    expect(disciplines.ladies.notes).toEqual({});
  });

  it('expands a Ladies race without expanding the Mixed race with the same id', () => {
    const first = FOUR_TEAM_RACES[0];
    setDisciplines({});
    renderList();

    fireEvent.click(card('Ladies', first));

    expect(expandedCards()).toEqual([card('Ladies', first)]);
  });

  it('shows a note and no cards for a discipline without teams', () => {
    setDisciplines({ board: createInitialDisciplineState() });

    renderList();

    expect(section('Board').getByText('No teams entered yet.')).toBeTruthy();
    expect(section('Board').queryAllByLabelText(CARD_LABEL)).toEqual([]);
  });

  it('shows a note and no cards for a results-only discipline', () => {
    setDisciplines({ ladies: { ...playedDiscipline(4), scores: [] } });

    renderList();

    expect(section('Ladies').getByText(/Results entered after the event/)).toBeTruthy();
    expect(section('Ladies').queryAllByLabelText(CARD_LABEL)).toEqual([]);
  });

  it('shows a stopped-early discipline with a note and its cards', () => {
    setDisciplines({ mixed: stoppedEarlyDiscipline(8, 3) });

    renderList();

    expect(section('Mixed').getByText(/Stopped early/)).toBeTruthy();
    expect(section('Mixed').getAllByLabelText(CARD_LABEL)).toHaveLength(MIXED_RACES.length);
  });

  it('skips a stopped-early discipline when choosing the race to open', () => {
    setDisciplines({ mixed: stoppedEarlyDiscipline(8, 3) });

    renderList();

    expect(expandedCards()).toEqual([card('Ladies', FOUR_TEAM_RACES[0])]);
  });

  it('does not expand a stopped-early card when tapped', () => {
    const unscored = MIXED_RACES[5];
    setDisciplines({ mixed: stoppedEarlyDiscipline(8, 3) });
    renderList();

    fireEvent.click(card('Mixed', unscored));

    expect(isExpanded(card('Mixed', unscored))).toBe(false);
  });

  it('shows viewers the list read-only', () => {
    setDisciplines({});

    renderList(false);

    expect(screen.getAllByLabelText(CARD_LABEL).length).toBeGreaterThan(0);
    expect(expandedCards()).toEqual([]);
    expect(screen.queryAllByRole('button', { name: 'Win' })).toEqual([]);
  });
});
