import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines } from '../../store/initialState';
import {
  playedDiscipline,
  withUnplaceableTeams,
} from '../../domain/__fixtures__/playedDiscipline';
import { RoundPlacingsTable } from './RoundPlacingsTable';
import { leaguePoints } from '../../domain/roundPlacings';

const store = () => useEventStore.getState();

function renderTable(canEdit: boolean) {
  return render(
    <EditAccessContext.Provider value={canEdit}>
      <RoundPlacingsTable discipline="mixed" />
    </EditAccessContext.Provider>
  );
}

describe('RoundPlacingsTable', () => {
  beforeEach(() => {
    // 8 teams, two of which nothing can place.
    useEventStore.setState({
      disciplines: {
        ...createInitialDisciplines(),
        mixed: withUnplaceableTeams(playedDiscipline(8), 2),
      },
    });
  });

  afterEach(() => cleanup());

  it('shows nothing until the discipline is complete', () => {
    useEventStore.setState({ disciplines: createInitialDisciplines() });
    const { container } = renderTable(false);
    expect(container.textContent).toBe('');
  });

  it('shows league points for a placed team', () => {
    renderTable(false);
    // The first row is the best-placed team; the place is the row's first cell.
    const cells = screen.getAllByRole('row')[1].querySelectorAll('td');
    const place = Number(cells[0].textContent);
    expect(cells[2].textContent).toBe(String(leaguePoints('mixed', place)));
  });

  it('says how many teams still need a place', () => {
    renderTable(false);
    expect(screen.getByRole('status').textContent).toMatch(/2 teams need a place/);
  });

  it('marks unplaced teams for viewers without offering to edit', () => {
    renderTable(false);
    expect(screen.getAllByText('Needs a place')).toHaveLength(2);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it("stores an official's place for an unplaced team", () => {
    renderTable(true);
    const row = screen.getAllByText('Needs a place')[0].closest('tr')!;

    fireEvent.change(within(row).getByRole('combobox'), { target: { value: '3' } });

    expect(Object.values(store().disciplines.mixed.placings)).toEqual([3]);
    expect(screen.getAllByText('Needs a place')).toHaveLength(1);
  });

  it('shows plain places with no dropdown for placed teams', () => {
    renderTable(true);
    const placed = store().disciplines.mixed.teams[2];
    expect(screen.queryByLabelText(`Place for ${placed.name}`)).toBeNull();
  });

  it('lets an official correct a placed team after tapping "Correct places"', () => {
    const team = store().disciplines.mixed.teams[2];
    renderTable(true);

    fireEvent.click(screen.getByText('Correct places'));
    const select = screen.getByLabelText(`Place for ${team.name}`) as HTMLSelectElement;
    const other = select.value === '8' ? '7' : '8';
    fireEvent.change(select, { target: { value: other } });

    expect(store().disciplines.mixed.placings).toEqual({ [team.slot]: Number(other) });
  });

  it('clears a correction when the computed place is chosen again', () => {
    renderTable(true);
    fireEvent.click(screen.getByText('Correct places'));
    const team = store().disciplines.mixed.teams[2];
    const select = screen.getByLabelText(`Place for ${team.name}`) as HTMLSelectElement;
    const computed = select.value;

    fireEvent.change(select, { target: { value: computed === '8' ? '7' : '8' } });
    fireEvent.change(screen.getByLabelText(`Place for ${team.name}`), { target: { value: computed } });

    expect(store().disciplines.mixed.placings).toEqual({});
  });

  it('labels only corrected places, not ones from the finals', () => {
    const team = store().disciplines.mixed.teams[2];
    store().setPlacing('mixed', team.slot, 8);
    renderTable(false);
    expect(screen.queryByText('Final')).toBeNull();
    expect(screen.getAllByText('Corrected')).toHaveLength(1);
  });

  it('does not offer corrections to viewers', () => {
    renderTable(false);
    expect(screen.queryByText('Correct places')).toBeNull();
  });
});
