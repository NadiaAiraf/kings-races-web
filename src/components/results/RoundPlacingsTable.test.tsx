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

  it('clears an official place back to the computed one', () => {
    const winner = store().disciplines.mixed.teams[2];
    store().setPlacing('mixed', winner.slot, 4);
    renderTable(true);

    fireEvent.change(screen.getByLabelText(`Place for ${winner.name}`), { target: { value: '' } });

    expect(store().disciplines.mixed.placings).toEqual({});
  });
});
