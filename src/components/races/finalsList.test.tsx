import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EditAccessContext } from '../../auth/editAccess';
import { useEventStore } from '../../store/eventStore';
import { createInitialDisciplines } from '../../store/initialState';
import { playedDiscipline } from '../../domain/__fixtures__/playedDiscipline';
import { RaceListView } from './RaceListView';

describe('finals list for 25 teams', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    // Group stage and Round 2 done, no finals raced yet.
    const mixed = playedDiscipline(25, { phase: 'finals' });
    mixed.scores = mixed.scores.filter((s) => !s.raceId.startsWith('fin-'));
    useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed } });
    render(
      <EditAccessContext.Provider value={false}>
        <RaceListView discipline="mixed" />
      </EditAccessContext.Provider>
    );
  });

  afterEach(() => cleanup());

  it('lists the twelve finals from the sheet, each place once', () => {
    expect(screen.getByText('23rd/24th')).toBeTruthy();
    expect(screen.queryByText('29th/30th')).toBeNull();
    expect(screen.getAllByText(/^\d+\w+\/\d+\w+$/)).toHaveLength(12);
  });

  it('marks only the 1st/2nd race as the final', () => {
    expect(screen.getAllByText('FINAL')).toHaveLength(1);
  });

  it('notes the finals raced only if time allows', () => {
    expect(screen.getAllByText(/If time allows/)).toHaveLength(3);
  });
});
