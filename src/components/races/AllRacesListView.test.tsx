import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { EventInfoContext } from '../../events/eventInfo';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines, createInitialDisciplineState } from '../../store/initialState';
import {
  playedDiscipline,
  roundOneWonByLowerSlot,
  stoppedEarlyDiscipline,
} from '../../domain/__fixtures__/playedDiscipline';
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

function renderList(canEdit = true, onOpenDiscipline?: (d: DisciplineKey) => void) {
  return render(
    <EventInfoContext.Provider value={{ id: 'e1', name: 'Test', date: '', round: null }}>
      <EditAccessContext.Provider value={canEdit}>
        <AllRacesListView onOpenDiscipline={onOpenDiscipline} />
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

/** The Round 1 card for `race` in the named discipline section. */
function card(sectionName: 'Mixed' | 'Ladies' | 'Board', race: RaceMatchup) {
  const discipline = sectionName.toLowerCase() as DisciplineKey;
  return section(`Round 1 ${sectionName}`).getByLabelText(cardLabel(discipline, race));
}

/** A discipline in the finals with every finals race still to run. */
function finalsUnscored(count: number): DisciplineState {
  const played = playedDiscipline(count, { phase: 'finals' });
  return { ...played, scores: played.scores.filter((s) => !s.raceId.startsWith('fin-')) };
}

const R2_COUNT_8 =
  getCheatSheet(8).roundTwoRaceCount ??
  (getCheatSheet(8).roundTwoGroups ?? []).reduce((n, g) => n + g.races.length, 0);

const isExpanded = (el: HTMLElement) => el.getAttribute('aria-expanded') === 'true';

const expandedCards = () =>
  screen.queryAllByLabelText(CARD_LABEL).filter((el) => isExpanded(el));

describe('All races list', () => {
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

  it('shows Round 1, Round 2 and Finals, each split Mixed, Ladies, Board', () => {
    setDisciplines({});

    renderList();

    const rounds = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    const disciplines = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(rounds).toEqual(['Round 1', 'Round 2', 'Finals']);
    expect(disciplines).toEqual(Array(3).fill(['Mixed', 'Ladies', 'Board']).flat());
  });

  it('lists each section in its cheat sheet race order', () => {
    setDisciplines({});

    renderList();

    const labels = section('Round 1 Mixed').getAllByLabelText(CARD_LABEL).map((el) => el.getAttribute('aria-label'));
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
    fireEvent.click(section('Round 1 Ladies').getByRole('button', { name: 'Clear result' }));

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
    fireEvent.click(section('Round 1 Ladies').getByRole('button', { name: 'Clear result' }));

    expect(isExpanded(card('Ladies', first))).toBe(true);
  });

  it('saves a note on a Board card to Board', () => {
    const first = FOUR_TEAM_RACES[0];
    setDisciplines({});
    renderList();

    fireEvent.click(card('Board', first));
    const box = section('Round 1 Board').getByLabelText('Race note');
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

    expect(section('Round 1 Board').getByText('No teams entered yet.')).toBeTruthy();
    expect(section('Round 1 Board').queryAllByLabelText(CARD_LABEL)).toEqual([]);
  });

  it('shows a note and no cards for a results-only discipline', () => {
    setDisciplines({ ladies: { ...playedDiscipline(4), scores: [] } });

    renderList();

    expect(section('Round 1 Ladies').getByText(/Results entered after the event/)).toBeTruthy();
    expect(section('Round 1 Ladies').queryAllByLabelText(CARD_LABEL)).toEqual([]);
  });

  it('shows a stopped-early discipline with a note and its cards', () => {
    setDisciplines({ mixed: stoppedEarlyDiscipline(8, 3) });

    renderList();

    expect(section('Round 1 Mixed').getByText(/Stopped early/)).toBeTruthy();
    expect(section('Round 1 Mixed').getAllByLabelText(CARD_LABEL)).toHaveLength(MIXED_RACES.length);
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

  it('shows a Round 2 placeholder before Round 2 starts', () => {
    setDisciplines({});

    renderList();

    const r2 = section('Round 2 Mixed');
    expect(r2.getByText(`Round 2 - ${R2_COUNT_8} races, seeded from Round 1 results`)).toBeTruthy();
    expect(r2.queryAllByLabelText(CARD_LABEL)).toEqual([]);
  });

  it('says when a format has no Round 2', () => {
    setDisciplines({});

    renderList();

    expect(section('Round 2 Ladies').getByText('No Round 2 in this format.')).toBeTruthy();
    expect(section('Round 2 Ladies').queryAllByLabelText(CARD_LABEL)).toEqual([]);
  });

  it('shows Round 2 cards with their group once Round 2 starts', () => {
    setDisciplines({ mixed: roundOneWonByLowerSlot(8, { phase: 'round-two' }) });

    renderList();

    const cards = section('Round 2 Mixed').getAllByLabelText(CARD_LABEL);
    expect(cards).toHaveLength(R2_COUNT_8);
    expect(cards.every((c) => c.textContent?.includes('Group '))).toBe(true);
  });

  it('shows a finals placeholder while the group stage is running', () => {
    setDisciplines({});

    renderList();

    expect(section('Finals Mixed').getByText('Finals seeded from group stage results')).toBeTruthy();
  });

  it("points to the discipline's tab when its finals are ready to confirm", () => {
    const onOpen = vi.fn();
    setDisciplines({ ladies: roundOneWonByLowerSlot(4) });
    renderList(true, onOpen);

    const finals = section('Finals Ladies');
    expect(finals.getByText('Finals ready to confirm on the Ladies tab.')).toBeTruthy();
    expect(finals.queryByRole('button', { name: /Confirm Finals/i })).toBeNull();
    fireEvent.click(finals.getByRole('button', { name: 'Open Ladies' }));
    expect(onOpen).toHaveBeenCalledWith('ladies');
  });

  it("points to the discipline's tab when tied standings block the finals", () => {
    setDisciplines({ ladies: inRoundOne(4, FOUR_TEAM_RACES) });
    renderList(true, vi.fn());

    const finals = section('Finals Ladies');
    expect(finals.getByText('Resolve tied standings on the Ladies tab before finals.')).toBeTruthy();
    expect(finals.getByRole('button', { name: 'Open Ladies' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Move .* up/i })).toBeNull();
  });

  it('shows the finals cards once finals are confirmed', () => {
    setDisciplines({ mixed: finalsUnscored(8) });

    renderList();

    const finals = section('Finals Mixed');
    expect(finals.getAllByLabelText(CARD_LABEL)).toHaveLength(getCheatSheet(8).finals.length);
    expect(finals.getAllByText('FINAL')).toHaveLength(1);
  });

  it('says the finals were not raced for a stopped-early discipline', () => {
    setDisciplines({ mixed: stoppedEarlyDiscipline(8, 3) });

    renderList();

    expect(section('Finals Mixed').getByText('Not raced: the round was stopped early.')).toBeTruthy();
  });

  it('labels and colours every card and heading by discipline', () => {
    setDisciplines({});

    renderList();

    const ladies = section('Round 1 Ladies');
    const cards = ladies.getAllByLabelText(CARD_LABEL);
    expect(cards.every((c) => c.textContent?.includes('Ladies'))).toBe(true);
    expect(cards.every((c) => c.classList.contains('border-l-red-600'))).toBe(true);
    expect(ladies.getByRole('heading', { level: 3 }).classList.contains('text-red-700')).toBe(true);
  });

  it('moves on from the last Round 1 race to the first Mixed Round 2 race', () => {
    const lastBoard = FOUR_TEAM_RACES[FOUR_TEAM_RACES.length - 1];
    setDisciplines({
      mixed: roundOneWonByLowerSlot(8, { phase: 'round-two' }),
      ladies: roundOneWonByLowerSlot(4),
      board: inRoundOne(4, FOUR_TEAM_RACES.slice(0, -1)),
    });
    renderList();

    fireEvent.click(within(card('Board', lastBoard)).getAllByRole('button', { name: 'Win' })[0]);

    expect(expandedCards()).toEqual([section('Round 2 Mixed').getAllByLabelText(CARD_LABEL)[0]]);
  });

  it('opens the first finals race on mount when every earlier race is scored', () => {
    setDisciplines({ mixed: finalsUnscored(8), ladies: playedDiscipline(4), board: playedDiscipline(4) });

    renderList();

    expect(expandedCards()).toEqual([section('Finals Mixed').getAllByLabelText(CARD_LABEL)[0]]);
  });

  it('shows viewers the list read-only', () => {
    setDisciplines({});

    renderList(false);

    expect(screen.getAllByLabelText(CARD_LABEL).length).toBeGreaterThan(0);
    expect(expandedCards()).toEqual([]);
    expect(screen.queryAllByRole('button', { name: 'Win' })).toEqual([]);
  });
});
