import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisclosureTriangle } from './DisclosureTriangle';
import { RoundHeader } from '../races/RoundHeader';

describe('DisclosureTriangle', () => {
  it('is marked open when open', () => {
    const { container } = render(<DisclosureTriangle open />);
    expect(container.querySelector('svg')?.getAttribute('data-state')).toBe('open');
  });

  it('is marked closed when closed', () => {
    const { container } = render(<DisclosureTriangle open={false} />);
    expect(container.querySelector('svg')?.getAttribute('data-state')).toBe('closed');
  });

  it('is hidden from screen readers, which read aria-expanded instead', () => {
    const { container } = render(<DisclosureTriangle open />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('RoundHeader disclosure triangle', () => {
  it('shows a closed triangle on a collapsed round', () => {
    render(<RoundHeader label="Round 1" isActive collapsible open={false} onToggle={() => {}} />);
    const button = screen.getByRole('button', { name: 'Round 1' });
    expect(button.querySelector('svg')?.getAttribute('data-state')).toBe('closed');
  });

  it('shows an open triangle on an expanded round', () => {
    render(<RoundHeader label="Round 1" isActive collapsible open onToggle={() => {}} />);
    const button = screen.getByRole('button', { name: 'Round 1' });
    expect(button.querySelector('svg')?.getAttribute('data-state')).toBe('open');
  });

  it('does not use a theme-remapped grey, so it stays visible on the dark header', () => {
    render(<RoundHeader label="Round 1" isActive collapsible open onToggle={() => {}} />);
    const svg = screen.getByRole('button', { name: 'Round 1' }).querySelector('svg');
    expect(svg?.getAttribute('class')).not.toMatch(/text-slate-/);
  });
});
