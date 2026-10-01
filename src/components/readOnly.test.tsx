import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { TeamEntryView } from './teams/TeamEntryView';
import { ExpandableRaceCard } from './races/ExpandableRaceCard';
import { FinalsReadyBanner } from './finals/FinalsReadyBanner';
import { TiebreakResolver } from './standings/TiebreakResolver';
import { FinalsMatchupCard } from './finals/FinalsMatchupCard';
import { OutcomeButton } from './scoring/OutcomeButton';
import type { ResolvedFinalsMatchupWithNames } from '../hooks/useFinalsState';

const renderWithAccess = (ui: ReactNode, canEdit: boolean) =>
  render(<EditAccessContext.Provider value={canEdit}>{ui}</EditAccessContext.Provider>);

const raceCardProps = {
  raceId: 'r1-1',
  raceNum: 1,
  homeTeamName: 'Kings',
  awayTeamName: 'Imperial',
  homeSlot: 1,
  awaySlot: 2,
  score: undefined,
  isExpanded: true,
  onExpand: () => {},
  onScore: () => {},
};

const tiedStandings = [
  { slot: 1, points: 3, wins: 1, losses: 0, dsqs: 0, played: 1 },
  { slot: 2, points: 3, wins: 1, losses: 0, dsqs: 0, played: 1 },
];

const finalsMatchup: ResolvedFinalsMatchupWithNames = {
  label: '1st/2nd',
  homeRef: 'Winner A',
  awayRef: 'Winner B',
  homeSlot: 1,
  awaySlot: 2,
  index: 0,
  raceId: 'fin-0',
  homeTeamName: 'Kings',
  awayTeamName: 'Imperial',
  score: null,
};

describe('read-only mode', () => {
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

  describe('defaults', () => {
    it('is read-only when no edit access is provided', () => {
      render(<TeamEntryView discipline="mixed" />);
      expect(screen.queryByPlaceholderText('Team name')).toBeNull();
    });
  });

  describe('TeamEntryView', () => {
    it('shows the team list to viewers', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, false);
      expect(screen.getByText('1. Kings')).toBeTruthy();
    });

    it('hides the team input from viewers', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, false);
      expect(screen.queryByPlaceholderText('Team name')).toBeNull();
    });

    it('hides remove buttons from viewers', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, false);
      expect(screen.queryByLabelText('Remove Kings')).toBeNull();
    });

    it('hides the reset button from viewers', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, false);
      expect(screen.queryByText('Reset Mixed')).toBeNull();
    });

    it('shows the team input to editors', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, true);
      expect(screen.getByPlaceholderText('Team name')).toBeTruthy();
    });

    it('shows remove buttons to editors', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, true);
      expect(screen.getByLabelText('Remove Kings')).toBeTruthy();
    });

    it('shows the reset button to editors', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, true);
      expect(screen.getByText('Reset Mixed')).toBeTruthy();
    });
  });

  describe('ExpandableRaceCard', () => {
    it('never shows scoring buttons to viewers, even when asked to expand', () => {
      renderWithAccess(<ExpandableRaceCard {...raceCardProps} />, false);
      expect(screen.queryAllByRole('button', { name: 'Win' })).toHaveLength(0);
    });

    it('does not call onExpand when a viewer taps the card', () => {
      let expanded = false;
      renderWithAccess(
        <ExpandableRaceCard
          {...raceCardProps}
          isExpanded={false}
          onExpand={() => {
            expanded = true;
          }}
        />,
        false
      );
      fireEvent.click(screen.getByLabelText('Race 1: Kings versus Imperial'));
      expect(expanded).toBe(false);
    });

    it('shows scoring buttons to editors', () => {
      renderWithAccess(<ExpandableRaceCard {...raceCardProps} />, true);
      expect(screen.getAllByRole('button', { name: 'Win' })).toHaveLength(2);
    });
  });

  describe('FinalsReadyBanner', () => {
    it('shows viewers a waiting message instead of the confirm button', () => {
      renderWithAccess(<FinalsReadyBanner onConfirm={() => {}} />, false);
      expect(screen.queryByText('Confirm Finals')).toBeNull();
      expect(screen.getByText('Waiting for an official to confirm finals.')).toBeTruthy();
    });

    it('lets editors confirm finals', () => {
      let confirmed = false;
      renderWithAccess(
        <FinalsReadyBanner
          onConfirm={() => {
            confirmed = true;
          }}
        />,
        true
      );
      fireEvent.click(screen.getByText('Confirm Finals'));
      expect(confirmed).toBe(true);
    });
  });

  describe('TiebreakResolver', () => {
    const resolverProps = {
      discipline: 'mixed' as const,
      groupKey: 'A',
      label: 'Group A',
      standings: tiedStandings,
      savedOrder: undefined,
      teamNames: new Map([
        [1, 'Kings'],
        [2, 'Imperial'],
      ]),
      canChange: true,
    };

    it('shows viewers the tie without reorder or confirm controls', () => {
      renderWithAccess(<TiebreakResolver {...resolverProps} />, false);
      expect(screen.queryByText('Confirm order')).toBeNull();
      expect(screen.queryByLabelText('Move Kings down')).toBeNull();
      expect(screen.getByText(/Waiting for an official to set the finishing order/)).toBeTruthy();
    });

    it('lets editors confirm the order', () => {
      renderWithAccess(<TiebreakResolver {...resolverProps} />, true);
      fireEvent.click(screen.getByText('Confirm order'));
      expect(useEventStore.getState().disciplines.mixed.manualTiebreaks.A).toEqual([1, 2]);
    });

    it('shows editors the saved order with a Change button once resolved', () => {
      renderWithAccess(<TiebreakResolver {...resolverProps} savedOrder={[2, 1]} />, true);
      expect(screen.getByText('Group A: order set manually')).toBeTruthy();
      expect(screen.getByText('Change')).toBeTruthy();
    });

    it('hides Change once the next stage has started', () => {
      renderWithAccess(
        <TiebreakResolver {...resolverProps} savedOrder={[2, 1]} canChange={false} />,
        true
      );
      expect(screen.queryByText('Change')).toBeNull();
    });

    it('shows viewers nothing once the tie is resolved', () => {
      renderWithAccess(<TiebreakResolver {...resolverProps} savedOrder={[2, 1]} />, false);
      expect(screen.queryByText(/Group A/)).toBeNull();
    });
  });

  describe('OutcomeButton', () => {
    it('is disabled for viewers even if a caller renders it', () => {
      renderWithAccess(<OutcomeButton outcome="win" selected={false} onSelect={() => {}} />, false);
      expect((screen.getByRole('button', { name: 'Win' }) as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('FinalsMatchupCard', () => {
    it('hides scoring buttons from viewers', () => {
      renderWithAccess(
        <FinalsMatchupCard matchup={finalsMatchup} discipline="mixed" isActive canScore />,
        false
      );
      expect(screen.queryAllByRole('button', { name: 'Win' })).toHaveLength(0);
    });

    it('hides the edit button for a scored final from viewers', () => {
      const scored = {
        ...finalsMatchup,
        score: { raceId: 'fin-0', homeSlot: 1, awaySlot: 2, homeOutcome: 'win', awayOutcome: 'loss' } as const,
      };
      renderWithAccess(
        <FinalsMatchupCard matchup={scored} discipline="mixed" isActive canScore />,
        false
      );
      expect(screen.queryByText('Edit')).toBeNull();
    });
  });
});
