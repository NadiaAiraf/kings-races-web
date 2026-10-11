import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines } from '../../store/initialState';
import { playedDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { RoundPlacingsTable } from './RoundPlacingsTable';

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
    // 7 teams: 1st/2nd from the final, 5th-7th from group II, 3rd/4th open.
    useEventStore.setState({
      disciplines: { ...createInitialDisciplines(), mixed: playedDiscipline(7) },
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
    expect(screen.getAllByRole('row')[1].textContent).toContain('30');
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
    const winner = store().disciplines.mixed.teams[0];
    store().setPlacing('mixed', winner.slot, 4);
    renderTable(true);

    fireEvent.change(screen.getByLabelText(`Place for ${winner.name}`), { target: { value: '' } });

    expect(store().disciplines.mixed.placings).toEqual({});
  });
});
