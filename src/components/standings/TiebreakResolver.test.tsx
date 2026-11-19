import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { TiebreakResolver } from './TiebreakResolver';
import type { HeadToHeadDefault } from '../../domain/headToHead';

const renderWithAccess = (ui: ReactNode, canEdit: boolean) =>
  render(<EditAccessContext.Provider value={canEdit}>{ui}</EditAccessContext.Provider>);

const kings = { slot: 1, points: 3, wins: 1, losses: 0, dsqs: 0, played: 1 };
const imperial = { slot: 2, points: 3, wins: 1, losses: 0, dsqs: 0, played: 1 };

const imperialWon: HeadToHeadDefault = {
  order: [imperial, kings],
  notes: [{ winnerSlot: 2, loserSlot: 1, raceNums: [7], wins: 1, losses: 0 }],
  seeded: [],
};

const resolverProps = {
  discipline: 'mixed' as const,
  groupKey: 'A',
  label: 'Group A',
  standings: [kings, imperial],
  savedOrder: undefined,
  teamNames: new Map([
    [1, 'Kings'],
    [2, 'Imperial'],
  ]),
  canChange: true,
};

const noteText = 'Imperial placed above Kings: won their head-to-head race (Race 7)';

const rowNames = () =>
  screen.getAllByText(/^(Kings|Imperial)$/).map((el) => el.textContent);

describe('TiebreakResolver head-to-head default', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
    useEventStore.getState().setTeams('mixed', [
      { slot: 1, name: 'Kings' },
      { slot: 2, name: 'Imperial' },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it('opens with the head-to-head winner first when no order is saved', () => {
    renderWithAccess(<TiebreakResolver {...resolverProps} headToHead={imperialWon} />, true);

    expect(rowNames()).toEqual(['Imperial', 'Kings']);
  });

  it('explains the default order under the pair', () => {
    renderWithAccess(<TiebreakResolver {...resolverProps} headToHead={imperialWon} />, true);

    expect(screen.getByText(noteText)).toBeTruthy();
  });

  it('saves the head-to-head order when the official confirms', () => {
    renderWithAccess(<TiebreakResolver {...resolverProps} headToHead={imperialWon} />, true);

    fireEvent.click(screen.getByText('Confirm order'));

    expect(useEventStore.getState().disciplines.mixed.manualTiebreaks.A).toEqual([2, 1]);
  });

  it('still lets the official swap the pair before confirming', () => {
    renderWithAccess(<TiebreakResolver {...resolverProps} headToHead={imperialWon} />, true);

    fireEvent.click(screen.getByLabelText('Move Imperial down'));
    fireEvent.click(screen.getByText('Confirm order'));

    expect(useEventStore.getState().disciplines.mixed.manualTiebreaks.A).toEqual([1, 2]);
  });

  it('keeps a valid saved order over the head-to-head default', () => {
    renderWithAccess(
      <TiebreakResolver {...resolverProps} savedOrder={[1, 2]} headToHead={imperialWon} />,
      true
    );

    expect(screen.getByText('Group A: order set manually')).toBeTruthy();
    expect(screen.getByText(/1\. Kings/)).toBeTruthy();
  });

  it('starts the Change draft from the saved order, not the head-to-head default', () => {
    renderWithAccess(
      <TiebreakResolver {...resolverProps} savedOrder={[1, 2]} headToHead={imperialWon} />,
      true
    );

    fireEvent.click(screen.getByText('Change'));

    expect(rowNames()).toEqual(['Kings', 'Imperial']);
  });

  it('shows viewers only the waiting message, without the note', () => {
    renderWithAccess(<TiebreakResolver {...resolverProps} headToHead={imperialWon} />, false);

    expect(screen.getByText(/Waiting for an official to set the finishing order/)).toBeTruthy();
    expect(screen.queryByText(noteText)).toBeNull();
  });
});

describe('TiebreakResolver seeded suggestion', () => {
  const bristol = { slot: 3, points: 3, wins: 1, losses: 0, dsqs: 0, played: 1 };
  const seededProps = {
    ...resolverProps,
    standings: [kings, imperial, bristol],
    teamNames: new Map([
      [1, 'Kings'],
      [2, 'Imperial'],
      [3, 'Bristol'],
    ]),
  };
  const seededDefault: HeadToHeadDefault = {
    order: [kings, imperial, bristol],
    notes: [],
    seeded: [
      {
        slots: [1, 2, 3],
        firstPlace: 1,
        top: { winnerSlot: 1, loserSlot: 2, raceNums: [4], wins: 1, losses: 0 },
        lowestSeedSlot: 3,
      },
    ],
  };

  beforeEach(() => useEventStore.getState().resetEvent());
  afterEach(() => cleanup());

  it('shows the seeded explanation when there is no tie-break race result', () => {
    renderWithAccess(<TiebreakResolver {...seededProps} headToHead={seededDefault} />, true);

    expect(screen.getByText('Bristol is the lowest seed, so 3rd.')).toBeTruthy();
  });

  it('drops the seeded explanation once tie-break races give the order', () => {
    renderWithAccess(
      <TiebreakResolver
        {...seededProps}
        headToHead={seededDefault}
        tiebreakOrder={[bristol, imperial, kings]}
      />,
      true
    );

    expect(screen.queryByText('Bristol is the lowest seed, so 3rd.')).toBeNull();
  });
});
