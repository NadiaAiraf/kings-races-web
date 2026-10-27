import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ConfirmDialog, CONFIRM_GUARD_MS } from './ConfirmDialog';

function renderDialog(onConfirm = vi.fn()) {
  render(
    <ConfirmDialog
      triggerLabel="Delete R3"
      title="Delete R3 - Hemel?"
      description="This removes the round for everyone."
      confirmLabel="Delete R3"
      onConfirm={onConfirm}
    />
  );
  return onConfirm;
}

function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Delete R3' }));
  return screen.getByRole('alertdialog');
}

describe('ConfirmDialog', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders only the trigger until tapped', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Delete R3' })).toBeTruthy();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('opens a labelled modal without confirming', () => {
    const onConfirm = renderDialog();
    const dialog = openDialog();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby')!);
    const desc = document.getElementById(dialog.getAttribute('aria-describedby')!);
    expect(title?.textContent).toBe('Delete R3 - Hemel?');
    expect(desc?.textContent).toBe('This removes the round for everyone.');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('focuses Cancel when opened', () => {
    renderDialog();
    const dialog = openDialog();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Cancel' }));
  });

  it('closes on Cancel without confirming', () => {
    const onConfirm = renderDialog();
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('closes on Escape without confirming', () => {
    const onConfirm = renderDialog();
    openDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('closes on a backdrop click but not a click inside the panel', () => {
    const onConfirm = renderDialog();
    const dialog = openDialog();
    fireEvent.click(dialog);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    fireEvent.click(dialog.parentElement!);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('ignores a confirm straight after opening, so a double tap cannot delete', () => {
    vi.useFakeTimers();
    const onConfirm = renderDialog();
    const dialog = openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete R3' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeTruthy();

    act(() => vi.advanceTimersByTime(CONFIRM_GUARD_MS));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete R3' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
