import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { CONFIRM_GUARD_MS } from '../shared/ConfirmDialog';
import { TiebreakRacesPanel } from './TiebreakRacesPanel';
import { tiebreakRaceOutcome, type TiebreakRace } from '../../domain/tiebreakRaces';
import type { Score, TeamStanding } from '../../domain/types';

const store = () => useEventStore.getState();

const renderWithAccess = (ui: ReactNode, canEdit: boolean) =>
  render(<EditAccessContext.Provider value={canEdit}>{ui}</EditAccessContext.Provider>);

const standing = (slot: number, points: number): TeamStanding => ({
  slot,
  points,
  wins: 0,
  losses: 0,
  dsqs: 0,
  played: 0,
});

// Kings (1), Imperial (2) and Bristol (3) level on 3 points; Bath (4) on 0.
const base = [standing(1, 3), standing(2, 3), standing(3, 3), standing(4, 0)];

// Originals: r1-1 Kings v Imperial, r1-3 Imperial v Bristol, r1-5 Bristol v Kings.
const races: TiebreakRace[] = [
  { raceId: 'tb-A-r1-1', originalRaceId: 'r1-1', homeSlot: 2, awaySlot: 1 },
  { raceId: 'tb-A-r1-3', originalRaceId: 'r1-3', homeSlot: 3, awaySlot: 2 },
  { raceId: 'tb-A-r1-5', originalRaceId: 'r1-5', homeSlot: 1, awaySlot: 3 },
];

const teamNames = new Map([
  [1, 'Kings'],
  [2, 'Imperial'],
  [3, 'Bristol'],
  [4, 'Bath'],
]);

const tbWin = (race: TiebreakRace, winner: number): Score => ({
  raceId: race.raceId,
  homeSlot: race.homeSlot,
  awaySlot: race.awaySlot,
  homeOutcome: race.homeSlot === winner ? 'win' : 'loss',
  awayOutcome: race.awaySlot === winner ? 'win' : 'loss',
});

type PanelState = 'off' | 'on' | 'stale';

function panel(state: PanelState, opts: { canChange?: boolean; scores?: Score[] } = {}) {
  const scores = opts.scores ?? [];
  return (
    <TiebreakRacesPanel
      discipline="mixed"
      groupKey="A"
      label="Group A"
      tiedSlots={[1, 2, 3]}
      races={races}
      state={state}
      outcome={state === 'on' ? tiebreakRaceOutcome(base, races, scores) : null}
      teamNames={teamNames}
      canChange={opts.canChange ?? true}
    />
  );
}

/** Switch the group on in the store and record results, then render. */
function renderOn(canEdit: boolean, scores: Score[] = [], canChange = true) {
  store().setTiebreakRaces('mixed', 'A', [1, 2, 3]);
  for (const s of scores) store().recordResult('mixed', s);
  return renderWithAccess(panel('on', { scores, canChange }), canEdit);
}

describe('TiebreakRacesPanel', () => {
  beforeEach(() => {
    store().resetEvent();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('switched off', () => {
    it('offers officials a Run tie-break races button', () => {
      renderWithAccess(panel('off'), true);

      expect(
        screen.getByRole('button', { name: 'Run tie-break races' }).getAttribute('aria-pressed')
      ).toBe('false');
    });

    it('shows no race cards', () => {
      renderWithAccess(panel('off'), true);

      expect(screen.queryByLabelText(/^Tie-break 1:/)).toBeNull();
    });

    it('stores the tied slots for the group when pressed', () => {
      renderWithAccess(panel('off'), true);

      fireEvent.click(screen.getByRole('button', { name: 'Run tie-break races' }));

      expect(store().disciplines.mixed.tiebreakRaces).toEqual({ A: [1, 2, 3] });
    });

    it('renders nothing for viewers', () => {
      const { container } = renderWithAccess(panel('off'), false);

      expect(container.textContent).toBe('');
    });

    it('offers no button once the group can no longer change', () => {
      renderWithAccess(panel('off', { canChange: false }), true);

      expect(screen.queryByRole('button', { name: 'Run tie-break races' })).toBeNull();
    });
  });

  describe('switched on', () => {
    it('shows one card per tie-break race, numbered in order', () => {
      renderOn(true);

      expect(screen.getAllByLabelText(/^Tie-break \d:/)).toHaveLength(3);
    });

    it('swaps home and away from the original meeting', () => {
      renderOn(true);

      expect(screen.getByLabelText('Tie-break 1: Imperial versus Kings')).toBeTruthy();
    });

    it('records a tap on the card under the tie-break race id', () => {
      renderOn(true);

      const card = screen.getByLabelText('Tie-break 1: Imperial versus Kings');
      fireEvent.click(card);
      fireEvent.click(within(card).getAllByRole('button', { name: 'Win' })[0]);

      expect(store().disciplines.mixed.scores).toEqual([
        { raceId: 'tb-A-r1-1', homeSlot: 2, awaySlot: 1, homeOutcome: 'win', awayOutcome: 'loss' },
      ]);
    });

    it('turns off at once with no tie-break results', () => {
      renderOn(true);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel tie-break races' }));

      expect(store().disciplines.mixed.tiebreakRaces).toEqual({});
    });

    it('asks before removing tie-break results', () => {
      renderOn(true, [tbWin(races[0], 2), tbWin(races[1], 3)]);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel tie-break races' }));

      const dialog = screen.getByRole('alertdialog');
      expect(dialog.textContent).toContain('Remove tie-break results?');
      expect(dialog.textContent).toContain(
        'This removes 2 tie-break results for Group A for everyone.'
      );
    });

    it('removes the flag and the results when confirmed', () => {
      vi.useFakeTimers();
      renderOn(true, [tbWin(races[0], 2)]);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel tie-break races' }));
      act(() => vi.advanceTimersByTime(CONFIRM_GUARD_MS));

      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));

      expect(store().disciplines.mixed).toMatchObject({ tiebreakRaces: {}, scores: [] });
    });

    it('keeps the flag and the results when the dialog is cancelled', () => {
      renderOn(true, [tbWin(races[0], 2)]);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel tie-break races' }));

      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));

      expect(store().disciplines.mixed).toMatchObject({
        tiebreakRaces: { A: [1, 2, 3] },
        scores: [tbWin(races[0], 2)],
      });
    });

    it('shows viewers the race cards', () => {
      renderOn(false);

      expect(screen.getAllByLabelText(/^Tie-break \d:/)).toHaveLength(3);
    });

    it('shows viewers no toggle', () => {
      renderOn(false);

      expect(screen.queryByRole('button', { name: /tie-break races/ })).toBeNull();
    });

    it('shows cards but no toggle once the group can no longer change', () => {
      renderOn(true, [], false);

      expect({
        cards: screen.getAllByLabelText(/^Tie-break \d:/).length,
        toggle: screen.queryByRole('button', { name: /tie-break races/ }),
      }).toEqual({ cards: 3, toggle: null });
    });
  });

  describe('outcome', () => {
    it('says the tie-break races decide the order when every team is separated', () => {
      // Kings beats both, Imperial beats Bristol: Kings 2, Imperial 1, Bristol 0.
      renderOn(true, [tbWin(races[0], 1), tbWin(races[1], 2), tbWin(races[2], 1)]);

      expect(
        screen.getByText(
          'Tie-break races decide the order: Kings 2 wins, Imperial 1, Bristol 0. Check the order below and press Confirm order.'
        )
      ).toBeTruthy();
    });

    it('tells officials to settle teams still level their own way', () => {
      // One win each.
      renderOn(true, [tbWin(races[0], 2), tbWin(races[1], 3), tbWin(races[2], 1)]);

      expect(
        screen.getByText(
          'Kings, Imperial and Bristol are still level after the tie-break races. Settle it your own way, e.g. rock, paper, scissors or a beer drinking contest, then set the order below.'
        )
      ).toBeTruthy();
    });

    it('says nothing about the order until every race is scored', () => {
      renderOn(true, [tbWin(races[0], 1)]);

      expect(screen.queryByText(/decide the order|still level/)).toBeNull();
    });
  });

  describe('stale', () => {
    it('tells officials the tie has changed and offers to run them again', () => {
      renderWithAccess(panel('stale'), true);

      expect({
        note: !!screen.getByText('The tie has changed since tie-break races were started.'),
        run: !!screen.getByRole('button', { name: 'Run tie-break races' }),
      }).toEqual({ note: true, run: true });
    });

    it('shows no old race cards', () => {
      renderWithAccess(panel('stale'), true);

      expect(screen.queryByLabelText(/^Tie-break \d:/)).toBeNull();
    });

    it('renders nothing for viewers', () => {
      const { container } = renderWithAccess(panel('stale'), false);

      expect(container.textContent).toBe('');
    });
  });
});
