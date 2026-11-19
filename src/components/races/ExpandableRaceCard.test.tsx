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

describe('ExpandableRaceCard clear result', () => {
  afterEach(() => cleanup());

  const homeWin: Score = {
    raceId: 'fin-1',
    homeSlot: 1,
    awaySlot: 2,
    homeOutcome: 'win',
    awayOutcome: 'loss',
  };

  it('shows a "Clear result" button on an expanded, scored card', () => {
    renderCard({ score: homeWin, onClear: () => {} });
    expect(screen.getByRole('button', { name: 'Clear result' })).toBeTruthy();
  });

  it('hides "Clear result" on an expanded, unscored card', () => {
    renderCard({ onClear: () => {} });
    expect(screen.queryByRole('button', { name: 'Clear result' })).toBeNull();
  });

  it('hides "Clear result" on a collapsed, scored card', () => {
    renderCard({ score: homeWin, isExpanded: false, onClear: () => {} });
    expect(screen.queryByRole('button', { name: 'Clear result' })).toBeNull();
  });

  it('hides "Clear result" from a viewer who cannot edit', () => {
    renderCard({ score: homeWin, onClear: () => {} }, false);
    expect(screen.queryByRole('button', { name: 'Clear result' })).toBeNull();
  });

  it('clears the race when tapped without collapsing the card', () => {
    const cleared: string[] = [];
    const expanded: string[] = [];
    renderCard({
      score: homeWin,
      onClear: (raceId: string) => cleared.push(raceId),
      onExpand: (raceId: string) => expanded.push(raceId),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));

    expect(cleared).toEqual(['fin-1']);
    expect(expanded).toEqual([]);
  });

  it('clears a race that was recorded as not run', () => {
    const cleared: string[] = [];
    renderCard({
      allowNotRun: true,
      score: notRun,
      onClear: (raceId: string) => cleared.push(raceId),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear result' }));

    expect(cleared).toEqual(['fin-1']);
  });
});

describe('ExpandableRaceCard collapsed team row', () => {
  afterEach(() => cleanup());

  const homeWin: Score = {
    raceId: 'fin-1',
    homeSlot: 1,
    awaySlot: 2,
    homeOutcome: 'win',
    awayOutcome: 'loss',
  };

  it("lays the row out as a three-column grid with 'vs' in the middle column", () => {
    renderCard({ isExpanded: false, score: homeWin }, false);

    const row = screen.getByText('vs').parentElement!;
    expect(row.classList.contains('grid')).toBe(true);
    expect(row.classList.contains('grid-cols-[1fr_auto_1fr]')).toBe(true);
    expect(row.children.length).toBe(3);
    expect(row.children[1].textContent).toBe('vs');
  });

  it("puts the home name on the outer edge and its badge next to 'vs'", () => {
    renderCard({ isExpanded: false, score: homeWin }, false);

    const homeSide = screen.getByText('vs').parentElement!.children[0];
    expect(homeSide.firstElementChild!.textContent).toBe('Kings');
    expect(homeSide.lastElementChild!.textContent).toBe('W');
    expect(homeSide.classList.contains('justify-between')).toBe(true);
  });

  it("mirrors the away side with its badge next to 'vs' and the name on the outer edge", () => {
    renderCard({ isExpanded: false, score: homeWin }, false);

    const awaySide = screen.getByText('vs').parentElement!.children[2];
    expect(awaySide.firstElementChild!.textContent).toBe('L');
    expect(awaySide.lastElementChild!.textContent).toBe('Imperial');
  });

  it('wraps a long team name inside its own column', () => {
    renderCard({ isExpanded: false, score: homeWin, homeTeamName: 'Southampton 1' }, false);

    const name = screen.getByText('Southampton 1');
    expect(name.classList.contains('min-w-0')).toBe(true);
    expect(name.classList.contains('break-words')).toBe(true);
    expect(screen.getByText('W').classList.contains('shrink-0')).toBe(true);
  });

  it("keeps the 'Not run' chip in the middle column", () => {
    renderCard({ isExpanded: false, score: notRun }, false);

    const row = screen.getByText('Not run').parentElement!;
    expect(row.classList.contains('grid')).toBe(true);
    expect(row.children[1].textContent).toBe('Not run');
    expect(screen.queryByText('W')).toBeNull();
    expect(screen.queryByText('L')).toBeNull();
  });
});

describe('ExpandableRaceCard expanded team row', () => {
  afterEach(() => cleanup());

  it("keeps the collapsed three-column row with 'vs' when expanded", () => {
    renderCard({ isExpanded: true });

    const row = screen.getByText('vs').parentElement!;
    expect(row.classList.contains('grid-cols-[1fr_auto_1fr]')).toBe(true);
    expect(row.children[0].textContent).toBe('Kings');
    expect(row.children[2].textContent).toBe('Imperial');
  });

  it('shows each team name once, above the scoring buttons', () => {
    renderCard({ isExpanded: true });

    expect(screen.getAllByText('Kings')).toHaveLength(1);
    expect(screen.getAllByText('Imperial')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /win/i })).toHaveLength(2);
  });
});

describe('ExpandableRaceCard discipline accent', () => {
  afterEach(() => cleanup());

  const cardEl = () => screen.getByLabelText('Race 2: Kings versus Imperial');

  it('labels a Ladies card and gives it a red stripe', () => {
    renderCard({ discipline: 'ladies' });

    expect(screen.getByText('Ladies')).toBeTruthy();
    expect(cardEl().classList.contains('border-l-4')).toBe(true);
    expect(cardEl().classList.contains('border-l-red-600')).toBe(true);
  });

  it('labels a Mixed card and gives it a blue stripe', () => {
    renderCard({ discipline: 'mixed' });

    expect(screen.getByText('Mixed')).toBeTruthy();
    expect(cardEl().classList.contains('border-l-blue-600')).toBe(true);
  });

  it('labels a Board card and gives it a green stripe', () => {
    renderCard({ discipline: 'board' });

    expect(screen.getByText('Board')).toBeTruthy();
    expect(cardEl().classList.contains('border-l-green-700')).toBe(true);
  });

  it('shows no label or stripe without a discipline', () => {
    renderCard({});

    expect(screen.queryByText(/^(Mixed|Ladies|Board)$/)).toBeNull();
    expect(cardEl().classList.contains('border-l-4')).toBe(false);
  });

  it('shows the label to viewers and keeps the accessible name', () => {
    renderCard({ discipline: 'ladies' }, false);

    expect(screen.getByText('Ladies')).toBeTruthy();
    expect(cardEl().getAttribute('aria-label')).toBe('Race 2: Kings versus Imperial');
  });
});
