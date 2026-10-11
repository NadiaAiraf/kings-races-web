import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { EventDetail } from '../events/eventDoc';
import type { LeagueTeams } from './leagueTeams';
import { emptyLeagueTeams } from './leagueTeams';
import { useLeagueRounds } from './useLeagueRounds';

// Firestore boundary: capture each listener so the test can deliver data.
const fake = vi.hoisted(() => ({
  rounds: {} as Record<string, { onData: (e: EventDetail[]) => void; onError: (e: Error) => void }>,
  teams: null as null | { onData: (t: LeagueTeams) => void; onError: (e: Error) => void },
  active: 0,
}));

vi.mock('../events/eventsRepo', () => ({
  subscribeLeagueRounds: (
    seasonId: string,
    _league: string,
    onData: (e: EventDetail[]) => void,
    onError: (e: Error) => void
  ) => {
    fake.rounds[seasonId] = { onData, onError };
    fake.active++;
    return () => fake.active--;
  },
}));

vi.mock('./seasonsRepo', () => ({
  subscribeLeagueTeams: (
    _s: string,
    _l: string,
    onData: (t: LeagueTeams) => void,
    onError: (e: Error) => void
  ) => {
    fake.teams = { onData, onError };
    fake.active++;
    return () => fake.active--;
  },
}));

const R2 = { seasonId: '2026-27', league: 'southern' as const, roundNumber: 2, venue: 'Hemel' };

describe('useLeagueRounds', () => {
  beforeEach(() => {
    fake.rounds = {};
    fake.teams = null;
    fake.active = 0;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it("waits for last season's rounds before reporting ready", () => {
    const { result } = renderHook(() => useLeagueRounds(R2));
    act(() => {
      fake.rounds['2026-27'].onData([]);
      fake.teams!.onData(emptyLeagueTeams());
    });
    expect(result.current).toBeNull();

    act(() => fake.rounds['2025-26'].onData([]));
    expect(result.current).not.toBeNull();
  });

  it('waits for the league team list before reporting ready', () => {
    const { result } = renderHook(() => useLeagueRounds(R2));
    act(() => {
      fake.rounds['2026-27'].onData([]);
      fake.rounds['2025-26'].onData([]);
    });
    expect(result.current).toBeNull();
  });

  it("treats last season as empty if it fails to load, so entry isn't blocked", () => {
    const { result } = renderHook(() => useLeagueRounds(R2));
    act(() => {
      fake.rounds['2026-27'].onData([]);
      fake.teams!.onData(emptyLeagueTeams());
      fake.rounds['2025-26'].onError(new Error('unavailable'));
    });
    expect(result.current!.lastSeason).toEqual([]);
  });

  it('stops listening when passed null', () => {
    const { rerender } = renderHook(({ round }) => useLeagueRounds(round), {
      initialProps: { round: R2 as typeof R2 | null },
    });
    expect(fake.active).toBe(3);

    rerender({ round: null });
    expect(fake.active).toBe(0);
  });
});
