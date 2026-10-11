import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { createInitialDisciplines } from '../store/initialState';
import { playedDiscipline } from '../domain/__fixtures__/playedDiscipline';
import { useR2State } from '../hooks/useR2State';
import { RaceListView } from './races/RaceListView';
import { ResultCell } from './standings/ResultCell';

const store = () => useEventStore.getState();

/** 8 teams with Round 1 done and no Round 2 races recorded yet. */
function startRoundTwo() {
  const mixed = playedDiscipline(8, { phase: 'round-two' });
  mixed.scores = mixed.scores.filter((s) => s.raceId.startsWith('r1-'));
  useEventStore.setState({ disciplines: { ...createInitialDisciplines(), mixed } });
}

function notRun(raceId: string) {
  const race = renderHook(() => useR2State('mixed')).result.current!.r2Races.find(
    (r) => r.raceId === raceId
  )!;
  store().recordResult('mixed', {
    raceId,
    homeSlot: race.homeSlot!,
    awaySlot: race.awaySlot!,
    homeOutcome: 'not-run',
    awayOutcome: 'not-run',
  });
  return race;
}

describe('Round 2: race not run', () => {
  beforeEach(() => {
    // jsdom has no scrollIntoView; the race list scrolls to the next card.
    Element.prototype.scrollIntoView = vi.fn();
    startRoundTwo();
  });

  afterEach(() => cleanup());

  it('offers "Race not run" on the open Round 2 card', () => {
    render(
      <EditAccessContext.Provider value={true}>
        <RaceListView discipline="mixed" />
      </EditAccessContext.Provider>
    );
    expect(screen.getByRole('button', { name: 'Race not run' })).toBeTruthy();
  });

  it('records the race as not run for both teams', () => {
    render(
      <EditAccessContext.Provider value={true}>
        <RaceListView discipline="mixed" />
      </EditAccessContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Race not run' }));

    const r2 = store().disciplines.mixed.scores.filter((s) => s.raceId.startsWith('r2-'));
    expect(r2.map((s) => [s.homeOutcome, s.awayOutcome])).toEqual([['not-run', 'not-run']]);
  });

  it('gives neither team points or a race played', () => {
    const race = notRun('r2-I-1');
    const standings = renderHook(() => useR2State('mixed')).result.current!.r2Standings.I;
    for (const slot of [race.homeSlot, race.awaySlot]) {
      expect(standings.find((s) => s.slot === slot)).toMatchObject({ points: 0, played: 0 });
    }
  });

  it('counts a race not run as done, so Round 2 can finish', () => {
    const races = renderHook(() => useR2State('mixed')).result.current!.r2Races;
    for (const race of races) notRun(race.raceId);
    expect(renderHook(() => useR2State('mixed')).result.current!.allR2Scored).toBe(true);
  });
});

describe('ResultCell', () => {
  afterEach(() => cleanup());

  it('shows a race not run as a dash, not a 0-point DSQ', () => {
    render(<ResultCell outcome="not-run" />);
    expect(screen.getByText('–')).toBeTruthy();
  });
});
