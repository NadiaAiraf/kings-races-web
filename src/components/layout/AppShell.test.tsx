import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { AppShell } from './AppShell';

const renderShellRoot = () => {
  const { container } = render(
    <EditAccessContext.Provider value={false}>
      <AppShell />
    </EditAccessContext.Provider>,
  );
  return container.firstElementChild as HTMLElement;
};

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
