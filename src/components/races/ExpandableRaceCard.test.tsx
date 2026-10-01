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
