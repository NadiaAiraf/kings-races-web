import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import type { Score } from '../../domain/types';
import { ExpandableRaceCard } from './ExpandableRaceCard';

type ScoreResult = Parameters<CardProps['onScore']>[0];

type CardProps = React.ComponentProps<typeof ExpandableRaceCard>;

const baseProps: CardProps = {
  raceId: 'fin-1',
  raceNum: 2,
  homeTeamName: 'Kings',
  awayTeamName: 'Imperial',
  homeSlot: 1,
  awaySlot: 2,
  score: undefined,
  isExpanded: true,
  onExpand: () => {},
  onScore: () => {},
};

const notRun: Score = {
  raceId: 'fin-1',
  homeSlot: 1,
  awaySlot: 2,
  homeOutcome: 'not-run',
  awayOutcome: 'not-run',
};

const renderCard = (props: Partial<CardProps>, canEdit = true) =>
  render(
    <EditAccessContext.Provider value={canEdit}>
      <ExpandableRaceCard {...baseProps} {...props} />
    </EditAccessContext.Provider>
  );

describe('ExpandableRaceCard race not run', () => {
  afterEach(() => cleanup());

  it('offers "Race not run" on finals cards', () => {
    renderCard({ allowNotRun: true });
    expect(screen.getByRole('button', { name: 'Race not run' })).toBeTruthy();
  });

  it('does not offer "Race not run" on group races', () => {
    renderCard({});
    expect(screen.queryByRole('button', { name: 'Race not run' })).toBeNull();
  });

  it('records both teams as not run', () => {
    const recorded: ScoreResult[] = [];
    renderCard({
      allowNotRun: true,
      onScore: (r: ScoreResult) => {
        recorded.push(r);
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Race not run' }));

    expect(recorded).toEqual([
      { raceId: 'fin-1', homeSlot: 1, awaySlot: 2, homeOutcome: 'not-run', awayOutcome: 'not-run' },
    ]);
  });

  it('shows a not-run final as "Not run" when collapsed', () => {
    renderCard({ allowNotRun: true, isExpanded: false, score: notRun }, false);
    expect(screen.getByText('Not run')).toBeTruthy();
  });

  it('marks the button as selected when the race was not run', () => {
    renderCard({ allowNotRun: true, score: notRun });
    const button = screen.getByRole('button', { name: 'Race not run' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('ExpandableRaceCard notes', () => {
  afterEach(() => cleanup());

  const note = "Summit racer 2 DSQ'd at gate 4";

  it('shows a saved note to a signed-out viewer on a collapsed card', () => {
    renderCard({ note, isExpanded: false }, false);
    expect(screen.getByText(note)).toBeTruthy();
  });

  it('shows a saved note to a viewer who cannot edit when the card is marked expanded', () => {
    renderCard({ note, isExpanded: true }, false);
    expect(screen.getByText(note)).toBeTruthy();
  });

  it('shows a saved note to an official on a collapsed card', () => {
    renderCard({ note, isExpanded: false, onNoteChange: () => {} });
    expect(screen.getByText(note)).toBeTruthy();
  });

  it('gives an official a "Race note" textarea on the expanded card, prefilled with the saved note', () => {
    renderCard({ note, onNoteChange: () => {} });
    const textarea = screen.getByRole('textbox', { name: 'Race note' }) as HTMLTextAreaElement;
    expect(textarea.value).toBe(note);
  });

  it('shows the note only in the textarea when an official expands the card', () => {
    renderCard({ note, onNoteChange: () => {} });
    expect(screen.queryByText(note, { ignore: 'textarea' })).toBeNull();
  });

  it('gives viewers who cannot edit no textarea', () => {
    renderCard({ note, onNoteChange: () => {} }, false);
    expect(screen.queryByRole('textbox', { name: 'Race note' })).toBeNull();
  });

  it('limits the textarea to 200 characters', () => {
    renderCard({ onNoteChange: () => {} });
    expect(screen.getByRole('textbox', { name: 'Race note' }).getAttribute('maxLength')).toBe('200');
  });

  it('saves the typed note when the textarea loses focus', () => {
    const saved: [string, string][] = [];
    renderCard({ onNoteChange: (raceId: string, text: string) => saved.push([raceId, text]) });
    const textarea = screen.getByRole('textbox', { name: 'Race note' });

    fireEvent.change(textarea, { target: { value: 'Late start' } });
    fireEvent.blur(textarea);

    expect(saved).toEqual([['fin-1', 'Late start']]);
  });

  it('removes the note when cleared and left', () => {
    const saved: [string, string][] = [];
    renderCard({ note, onNoteChange: (raceId: string, text: string) => saved.push([raceId, text]) });
    const textarea = screen.getByRole('textbox', { name: 'Race note' });

    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.blur(textarea);

    expect(saved).toEqual([['fin-1', '']]);
  });

  it('does not save on blur when the text is unchanged', () => {
    const saved: [string, string][] = [];
    renderCard({ note, onNoteChange: (raceId: string, text: string) => saved.push([raceId, text]) });

    fireEvent.blur(screen.getByRole('textbox', { name: 'Race note' }));

    expect(saved).toEqual([]);
  });

  it('does not collapse the card when the textarea is clicked', () => {
    const expanded: string[] = [];
    renderCard({ onNoteChange: () => {}, onExpand: (raceId: string) => expanded.push(raceId) });

    fireEvent.click(screen.getByRole('textbox', { name: 'Race note' }));

    expect(expanded).toEqual([]);
  });
});
