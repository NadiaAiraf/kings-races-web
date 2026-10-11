import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventStore } from '../store/eventStore';
import { useR2State } from './useR2State';
import { playedDiscipline } from '../domain/__fixtures__/playedDiscipline';

describe('useR2State race order', () => {
  beforeEach(() => {
    const mixed = playedDiscipline(25);
    // Round 1 played, Round 2 not started.
    mixed.scores = mixed.scores.filter((s) => s.raceId.startsWith('r1-'));
    mixed.phase = 'round-two';
    useEventStore.setState({ disciplines: { ...useEventStore.getState().disciplines, mixed } });
  });

  it("runs Round 2 in the spreadsheet's interleaved order", () => {
    const { result } = renderHook(() => useR2State('mixed'));
    expect(result.current!.r2Races.slice(0, 3).map((r) => r.raceId)).toEqual([
      'r2-VI-1',
      'r2-VI-2',
      'r2-I-1',
    ]);
  });

  it('numbers Round 2 races in running order', () => {
    const { result } = renderHook(() => useR2State('mixed'));
    const races = result.current!.r2Races;
    expect(races.map((r) => r.raceNum)).toEqual(races.map((_, i) => i + 1));
  });

  it('makes the first race of the running order the current race', () => {
    const { result } = renderHook(() => useR2State('mixed'));
    expect(result.current!.currentR2Race!.raceId).toBe('r2-VI-1');
  });
});
