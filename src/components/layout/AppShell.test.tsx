import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { AppShell } from './AppShell';
import { createInitialDisciplines } from '../../store/initialState';
import { playedDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { getCheatSheet } from '../../domain/cheatSheets';
import type { DisciplineState, Score } from '../../domain/types';

function LocationProbe() {
  const location = useLocation();
  const navigationType = useNavigationType();
  return (
    <>
      <span data-testid="search">{location.search}</span>
      <span data-testid="navigation-type">{navigationType}</span>
    </>
  );
}

const renderShellRoot = ({
  path = '/events/e1',
  canEdit = false,
  initialEntries = [path],
}: { path?: string; canEdit?: boolean; initialEntries?: string[] } = {}) => {
  const { container } = render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
      <EditAccessContext.Provider value={canEdit}>
        <AppShell />
      </EditAccessContext.Provider>
      <LocationProbe />
    </MemoryRouter>,
  );
  return container.firstElementChild as HTMLElement;
};

const isSelected = (name: string) =>
  screen.getByRole('tab', { name }).getAttribute('aria-selected') === 'true';

const search = () => new URLSearchParams(screen.getByTestId('search').textContent ?? '');

describe('AppShell table colours', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  afterEach(() => cleanup());

  it('gives Mixed tables a blue header and stripes', () => {
    useEventStore.setState({ activeDiscipline: 'mixed' });

    const root = renderShellRoot();

    expect(root.style.getPropertyValue('--color-table-head')).toBe('#1d4ed8');
    expect(root.style.getPropertyValue('--color-table-stripe')).toBe('#dbeafe');
  });

  it('gives Board tables a green header and stripes', () => {
    useEventStore.setState({ activeDiscipline: 'board' });

    const root = renderShellRoot();

    expect(root.style.getPropertyValue('--color-table-head')).toBe('#15803d');
    expect(root.style.getPropertyValue('--color-table-stripe')).toBe('#dcfce7');
  });

  it('leaves Ladies tables on the club red default', () => {
    useEventStore.setState({ activeDiscipline: 'ladies' });

    const root = renderShellRoot();

    expect(root.style.getPropertyValue('--color-table-head')).toBe('');
    expect(root.style.getPropertyValue('--color-table-stripe')).toBe('');
  });
});

describe('AppShell discipline and tab in the URL', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  afterEach(() => cleanup());

  it('opens the discipline and tab named in the URL', () => {
    renderShellRoot({ path: '/events/e1?d=ladies&v=standings', canEdit: true });

    expect(isSelected('Ladies')).toBe(true);
    expect(isSelected('Stds')).toBe(true);
  });

  it('writes the tapped discipline to the URL, keeping other params', () => {
    renderShellRoot({ path: '/events/e1?keep=1', canEdit: true });

    fireEvent.click(screen.getByRole('tab', { name: 'Ladies' }));

    expect(search().get('d')).toBe('ladies');
    expect(search().get('keep')).toBe('1');
  });

  it('writes the tapped tab to the URL alongside the discipline', () => {
    renderShellRoot({ path: '/events/e1?keep=1', canEdit: true });

    fireEvent.click(screen.getByRole('tab', { name: 'Ladies' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Races' }));

    expect(search().get('d')).toBe('ladies');
    expect(search().get('v')).toBe('races');
    expect(isSelected('Races')).toBe(true);
  });

  it('remembers the tapped discipline in the store for rounds opened without ?d', () => {
    renderShellRoot({ canEdit: true });

    fireEvent.click(screen.getByRole('tab', { name: 'Ladies' }));

    expect(useEventStore.getState().activeDiscipline).toBe('ladies');
  });

  it('replaces the history entry rather than pushing one', () => {
    renderShellRoot({ initialEntries: ['/prev', '/events/e1'], canEdit: true });

    fireEvent.click(screen.getByRole('tab', { name: 'Board' }));

    expect(screen.getByTestId('navigation-type').textContent).toBe('REPLACE');
  });

  it('falls back to the stored discipline and Teams when the params are invalid', () => {
    useEventStore.setState({ activeDiscipline: 'board' });

    renderShellRoot({ path: '/events/e1?d=nope&v=bogus', canEdit: true });

    expect(isSelected('Board')).toBe(true);
    expect(isSelected('Teams')).toBe(true);
  });

  it('falls back to the stored discipline and Teams when the params are missing', () => {
    useEventStore.setState({ activeDiscipline: 'board' });

    renderShellRoot({ canEdit: true });

    expect(isSelected('Board')).toBe(true);
    expect(isSelected('Teams')).toBe(true);
  });

  it('shows a viewer Races for v=teams without rewriting the URL', () => {
    renderShellRoot({ path: '/events/e1?v=teams' });

    expect(isSelected('Races')).toBe(true);
    expect(screen.queryByRole('tab', { name: 'Teams' })).toBeNull();
    expect(search().get('v')).toBe('teams');
  });
});

/**
 * 8 teams with every Round 1 race scored and nothing after. The lower slot
 * always wins, giving a strict order in every group, so there are no ties.
 */
function r1CompleteNoTies(): DisciplineState {
  const scores: Score[] = getCheatSheet(8).roundOneRaces.map((r) => {
    const homeWins = r.homeSlot < r.awaySlot;
    return {
      raceId: `r1-${r.raceNum}`,
      homeSlot: r.homeSlot,
      awaySlot: r.awaySlot,
      homeOutcome: homeWins ? 'win' : 'loss',
      awayOutcome: homeWins ? 'loss' : 'win',
    };
  });
  return { ...playedDiscipline(8, { phase: 'group-stage' }), scores };
}

describe('AppShell phase transitions', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvent();
  });

  afterEach(() => cleanup());

  it('moves a non-active discipline to round two when its Round 1 is complete', () => {
    useEventStore.setState({
      disciplines: { ...createInitialDisciplines(), mixed: r1CompleteNoTies() },
    });

    renderShellRoot({ path: '/events/e1?d=board' });

    expect(useEventStore.getState().disciplines.mixed.phase).toBe('round-two');
  });

  it('completes a non-active discipline when every final is scored', () => {
    useEventStore.setState({
      disciplines: {
        ...createInitialDisciplines(),
        ladies: playedDiscipline(8, { phase: 'finals' }),
      },
    });

    renderShellRoot({ path: '/events/e1?d=board' });

    expect(useEventStore.getState().disciplines.ladies.phase).toBe('complete');
  });
});

describe('AppShell All races view', () => {
  beforeEach(() => {
    // jsdom has no scrollIntoView; the race list scrolls to the next card.
    Element.prototype.scrollIntoView = vi.fn();
    useEventStore.getState().resetEvent();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds All races after the three discipline tabs', () => {
    renderShellRoot({ canEdit: true });

    const tabs = within(screen.getByRole('tablist', { name: 'Discipline' })).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Mixed', 'Board', 'Ladies', 'All races']);
  });

  it('writes d=all to the URL and selects All races when tapped', () => {
    renderShellRoot({ canEdit: true });

    fireEvent.click(screen.getByRole('tab', { name: 'All races' }));

    expect(search().get('d')).toBe('all');
    expect(isSelected('All races')).toBe(true);
  });

  it('leaves the stored discipline alone when All races is tapped', () => {
    useEventStore.setState({ activeDiscipline: 'board' });
    renderShellRoot({ canEdit: true });

    fireEvent.click(screen.getByRole('tab', { name: 'All races' }));

    expect(useEventStore.getState().activeDiscipline).toBe('board');
  });

  it('hides the section tabs and the Standings button in the All races view', () => {
    renderShellRoot({ canEdit: true });

    fireEvent.click(screen.getByRole('tab', { name: 'All races' }));

    expect(screen.queryByRole('tablist', { name: 'Section' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Standings' })).toBeNull();
  });

  it('opens the All races view from d=all on a neutral background', () => {
    const root = renderShellRoot({ path: '/events/e1?d=all', canEdit: true });

    expect(isSelected('All races')).toBe(true);
    expect(root.className).toContain('bg-slate-50');
  });

  it('shows combined Round 1 and Round 2 progress across disciplines', () => {
    const mixedRaces = getCheatSheet(8).roundOneRaces;
    const mixed = playedDiscipline(8, { phase: 'group-stage' });
    mixed.scores = mixed.scores.filter((s) =>
      [mixedRaces[0], mixedRaces[1]].some((r) => s.raceId === `r1-${r.raceNum}`),
    );
    const ladies = { ...playedDiscipline(6, { phase: 'group-stage' }), scores: [] };
    useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed, ladies } });

    renderShellRoot({ path: '/events/e1?d=all', canEdit: true });

    const mixedR2 = (getCheatSheet(8).roundTwoGroups ?? []).reduce((n, g) => n + g.races.length, 0);
    const total = mixedRaces.length + mixedR2 + getCheatSheet(6).roundOneRaces.length;
    expect(screen.getByText(`Race 2 of ${total}`)).toBeTruthy();
  });
});
