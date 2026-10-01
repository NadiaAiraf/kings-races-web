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

const tiedTeams = [
  { slot: 1, name: 'Kings', points: 3 },
  { slot: 2, name: 'Imperial', points: 3 },
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

    it('shows input, remove and reset to editors', () => {
      renderWithAccess(<TeamEntryView discipline="mixed" />, true);
      expect(screen.getByPlaceholderText('Team name')).toBeTruthy();
      expect(screen.getByLabelText('Remove Kings')).toBeTruthy();
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
    it('shows a waiting message instead of the confirm button without onConfirm', () => {
      renderWithAccess(<FinalsReadyBanner />, false);
      expect(screen.queryByText('Confirm Finals')).toBeNull();
      expect(screen.getByText('Waiting for an official to confirm finals.')).toBeTruthy();
    });
  });

  describe('TiebreakResolver', () => {
    it('shows the tie without reorder or confirm controls to viewers', () => {
      renderWithAccess(
        <TiebreakResolver discipline="mixed" groupKey="A" tiedTeams={tiedTeams} onResolved={() => {}} />,
        false
      );
      expect(screen.queryByText('Confirm Order')).toBeNull();
      expect(screen.queryByLabelText('Move Kings up')).toBeNull();
      expect(screen.getByText(/Waiting for an official to resolve the tie/)).toBeTruthy();
    });

    it('lets editors confirm the order', () => {
      renderWithAccess(
        <TiebreakResolver discipline="mixed" groupKey="A" tiedTeams={tiedTeams} onResolved={() => {}} />,
        true
      );
      fireEvent.click(screen.getByText('Confirm Order'));
      expect(useEventStore.getState().disciplines.mixed.manualTiebreaks.A).toEqual([1, 2]);
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
