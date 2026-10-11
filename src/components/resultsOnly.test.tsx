import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { createInitialDisciplines } from '../store/initialState';
import { assignSlots } from '../domain/assignSlots';
import { RaceListView } from './races/RaceListView';
import { StandingsView } from './standings/StandingsView';
import { TeamEntryView } from './teams/TeamEntryView';

function enterResults() {
  const teams = assignSlots(['Kings', 'UCL', 'LSE', 'Bath', 'Exeter']);
  useEventStore.setState({
    disciplines: {
      ...createInitialDisciplines(),
      mixed: {
        teams,
        teamCount: teams.length,
        phase: 'complete',
        scores: [],
        manualTiebreaks: {},
        placings: Object.fromEntries(teams.map((t, i) => [String(t.slot), i + 1])),
      },
    },
  });
}

const asOfficial = (ui: React.ReactNode) =>
  render(<EditAccessContext.Provider value={true}>{ui}</EditAccessContext.Provider>);

describe('a round entered without races', () => {
  beforeEach(enterResults);
  afterEach(() => cleanup());

  it('shows the final places and points on the standings tab', () => {
    asOfficial(<StandingsView discipline="mixed" asTab />);
    expect(screen.getByText('Final Results: Mixed')).toBeTruthy();
    expect(screen.getByText(/no races were recorded/)).toBeTruthy();
  });

  it('does not show empty group tables', () => {
    asOfficial(<StandingsView discipline="mixed" asTab />);
    expect(screen.queryByText('Round 1 Standings')).toBeNull();
  });

  it('explains there are no races instead of an empty schedule', () => {
    asOfficial(<RaceListView discipline="mixed" />);
    expect(screen.getByText('No races recorded')).toBeTruthy();
    expect(screen.queryByText('Round 1')).toBeNull();
  });

  it('locks the teams', () => {
    asOfficial(<TeamEntryView discipline="mixed" />);
    expect(screen.queryByLabelText('Remove Kings')).toBeNull();
    expect(screen.queryByLabelText('Move UCL up')).toBeNull();
  });
});
