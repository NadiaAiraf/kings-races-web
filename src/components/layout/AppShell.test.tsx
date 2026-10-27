import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { AppShell } from './AppShell';

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
