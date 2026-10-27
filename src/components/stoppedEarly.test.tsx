import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { createInitialDisciplines } from '../store/initialState';
import {
  jointPlacings19,
  stoppedEarlyDiscipline,
} from '../domain/__fixtures__/playedDiscipline';
import type { DisciplineState } from '../domain/types';
import { RaceListView } from './races/RaceListView';
import { StandingsView } from './standings/StandingsView';

/** 19 teams stopped after 42 races (mid round two), as in production. */
function mixedStoppedEarly(): DisciplineState {
  const mixed = stoppedEarlyDiscipline(19, 42);
  return { ...mixed, placings: jointPlacings19(mixed) };
}

function useMixed(mixed: DisciplineState) {
  useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed } });
}

const asOfficial = (ui: React.ReactNode) =>
  render(<EditAccessContext.Provider value={true}>{ui}</EditAccessContext.Provider>);

const mixedScores = () => useEventStore.getState().disciplines.mixed.scores;

describe('a round stopped early', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    localStorage.clear();
    useMixed(mixedStoppedEarly());
  });
  afterEach(() => cleanup());

  describe('Races tab', () => {
    // Stopped part way through Round 2 (21 + 9 races), so Round 2 stays open
    // with unscored races an official might otherwise try to record.
    beforeEach(() => useMixed(stoppedEarlyDiscipline(19, 30)));

    it('lists the races that were run instead of "No races recorded"', () => {
      asOfficial(<RaceListView discipline="mixed" />);
      expect(screen.getByText('Round 1')).toBeTruthy();
      expect(screen.getAllByLabelText(/^Race \d+: /).length).toBeGreaterThan(0);
      expect(screen.queryByText('No races recorded')).toBeNull();
    });

    it('says the round was stopped early', () => {
      asOfficial(<RaceListView discipline="mixed" />);
      expect(screen.getByText(/Stopped early: places entered by officials\./)).toBeTruthy();
    });

    it('does not let an official record another result', () => {
      asOfficial(<RaceListView discipline="mixed" />);
      const before = mixedScores().length;

      for (const card of screen.getAllByLabelText(/^Race \d+: /)) fireEvent.click(card);

      expect(screen.queryAllByRole('button', { name: 'Win' })).toHaveLength(0);
      expect(mixedScores()).toHaveLength(before);
    });

    it('does not show finals that were never raced', () => {
      asOfficial(<RaceListView discipline="mixed" />);
      expect(screen.queryByText('TBD')).toBeNull();
      expect(screen.queryByText(/Teams not yet resolved/)).toBeNull();
      expect(screen.getByText('Not raced: the round was stopped early.')).toBeTruthy();
    });
  });

  describe('Stds tab', () => {
    it('shows the final places with a stopped-early note', () => {
      asOfficial(<StandingsView discipline="mixed" asTab />);
      expect(screen.getByText('Final Results: Mixed')).toBeTruthy();
      expect(screen.getByText('Stopped early: places entered by officials.')).toBeTruthy();
    });

    it('still shows the group standings that were raced', () => {
      asOfficial(<StandingsView discipline="mixed" asTab />);
      expect(screen.getByText('Round 1 Standings')).toBeTruthy();
    });

    it('lets an official set a place for a team without one', () => {
      const mixed = mixedStoppedEarly();
      const missing = mixed.teams[0];
      delete mixed.placings[missing.slot];
      useMixed(mixed);

      asOfficial(<StandingsView discipline="mixed" asTab />);

      expect(screen.getByLabelText(`Place for ${missing.name}`)).toBeTruthy();
    });

    it('does not show Round 2 groups for a round stopped during Round 1', () => {
      useMixed(stoppedEarlyDiscipline(19, 5));
      asOfficial(<StandingsView discipline="mixed" asTab />);
      expect(screen.queryByText('Round 2 Standings')).toBeNull();
    });
  });
});
