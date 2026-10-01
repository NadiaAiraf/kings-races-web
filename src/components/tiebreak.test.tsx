import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { EditAccessContext } from '../auth/editAccess';
import { useEventStore } from '../store/eventStore';
import { useFinalsState } from '../hooks/useFinalsState';
import { getCheatSheet } from '../domain/cheatSheets';
import { assignSlots } from '../domain/assignSlots';
import type { RaceMatchup, Score } from '../domain/types';
import { RaceListView } from './races/RaceListView';

const store = () => useEventStore.getState();

/**
 * Score R1 so teams finish in `rank` order (index 0 strongest), except the
 * teams in `tied`, who end level on points: a pair that meets twice splits
 * its meetings, and a group of three that meets once beats each other in a
 * cycle (first beats second, second beats third, third beats first).
 */
function scoreRoundOne(teamCount: number, rank: number[], tied: number[]) {
  const structure = getCheatSheet(teamCount);
  const strength = new Map(rank.map((slot, i) => [slot, i]));
  const meetings = new Map<string, number>();
  const pairKey = (race: RaceMatchup) =>
    [race.homeSlot, race.awaySlot].sort((a, b) => a - b).join('-');
  const totalMeetings = new Map<string, number>();
  for (const race of structure.roundOneRaces) {
    totalMeetings.set(pairKey(race), (totalMeetings.get(pairKey(race)) ?? 0) + 1);
  }

  const scores: Score[] = structure.roundOneRaces.map((race: RaceMatchup) => {
    const key = pairKey(race);
    const meeting = meetings.get(key) ?? 0;
    meetings.set(key, meeting + 1);
    const home = tied.indexOf(race.homeSlot);
    const away = tied.indexOf(race.awaySlot);
    let homeWins: boolean;
    if (home >= 0 && away >= 0 && totalMeetings.get(key)! > 1) {
      homeWins = (home < away) === (meeting === 0);
    } else if (home >= 0 && away >= 0) {
      homeWins = away === (home + 1) % tied.length;
    } else {
      homeWins = strength.get(race.homeSlot)! < strength.get(race.awaySlot)!;
    }
    return {
      raceId: `r1-${race.raceNum}`,
      homeSlot: race.homeSlot,
      awaySlot: race.awaySlot,
      homeOutcome: homeWins ? 'win' : 'loss',
      awayOutcome: homeWins ? 'loss' : 'win',
    };
  });
  for (const score of scores) store().recordResult('mixed', score);
}

function enterTeams(count: number) {
  store().setTeams(
    'mixed',
    assignSlots(Array.from({ length: count }, (_, i) => `Team ${i + 1}`))
  );
  store().setDisciplinePhase('mixed', 'group-stage');
}

const renderAsOfficial = (ui: React.ReactNode) =>
  render(<EditAccessContext.Provider value={true}>{ui}</EditAccessContext.Provider>);

describe('completing a tied group manually', () => {
  beforeEach(() => {
    store().resetEvent();
  });

  afterEach(() => {
    cleanup();
  });

  describe('single group, no Round 2 (4 teams)', () => {
    // Group A slots 1..4: 1 wins everything, 2 and 3 tie, 4 last.
    beforeEach(() => {
      enterTeams(4);
      scoreRoundOne(4, [1, 2, 3, 4], [2, 3]);
    });

    it('blocks finals while the tie is unresolved', () => {
      const { result } = renderHook(() => useFinalsState('mixed'));
      expect(result.current?.finalsPhase).toBe('blocked-ties');
    });

    it('unblocks finals once the official confirms an order', () => {
      renderAsOfficial(<RaceListView discipline="mixed" />);
      fireEvent.click(screen.getByText('Confirm order'));

      const { result } = renderHook(() => useFinalsState('mixed'));
      expect(result.current?.finalsPhase).toBe('ready');
    });

    it('keeps the outright winner first after the tie is resolved', () => {
      renderAsOfficial(<RaceListView discipline="mixed" />);
      fireEvent.click(screen.getByLabelText('Move Team 3 up'));
      fireEvent.click(screen.getByText('Confirm order'));

      const { result } = renderHook(() => useFinalsState('mixed'));
      const final = result.current!.finalsWithNames.find((m) => m.label === '1st/2nd')!;
      const thirdFourth = result.current!.finalsWithNames.find((m) => m.label === '3rd/4th')!;
      // Winner A is slot 1; 2nd is now the team moved up (slot 3).
      expect([final.homeSlot, final.awaySlot]).toEqual([1, 3]);
      expect([thirdFourth.homeSlot, thirdFourth.awaySlot]).toEqual([2, 4]);
    });

    it('only lets tied teams be reordered', () => {
      renderAsOfficial(<RaceListView discipline="mixed" />);
      expect(screen.queryByLabelText('Move Team 1 down')).toBeNull();
      expect(screen.queryByLabelText('Move Team 4 up')).toBeNull();
    });

    it('drops the saved order when a changed result breaks the tie', () => {
      renderAsOfficial(<RaceListView discipline="mixed" />);
      fireEvent.click(screen.getByLabelText('Move Team 3 up'));
      fireEvent.click(screen.getByText('Confirm order'));
      cleanup();

      // Re-score 3 v 4 so team 4 wins: team 3 now trails team 2 on points.
      const race = getCheatSheet(4).roundOneRaces.find(
        (r) => [r.homeSlot, r.awaySlot].includes(3) && [r.homeSlot, r.awaySlot].includes(4)
      )!;
      act(() =>
        store().recordResult('mixed', {
          raceId: `r1-${race.raceNum}`,
          homeSlot: race.homeSlot,
          awaySlot: race.awaySlot,
          homeOutcome: race.homeSlot === 4 ? 'win' : 'loss',
          awayOutcome: race.homeSlot === 4 ? 'loss' : 'win',
        })
      );

      const { result } = renderHook(() => useFinalsState('mixed'));
      const final = result.current!.finalsWithNames.find((m) => m.label === '1st/2nd')!;
      expect([final.homeSlot, final.awaySlot]).toEqual([1, 2]);
    });

    it('asks again when a changed result creates a tie the saved order does not settle', () => {
      renderAsOfficial(<RaceListView discipline="mixed" />);
      fireEvent.click(screen.getByText('Confirm order'));
      cleanup();

      const beat = (winner: number, loser: number, meeting = 0) => {
        const race = getCheatSheet(4).roundOneRaces.filter(
          (r) =>
            [r.homeSlot, r.awaySlot].includes(winner) && [r.homeSlot, r.awaySlot].includes(loser)
        )[meeting];
        act(() =>
          store().recordResult('mixed', {
            raceId: `r1-${race.raceNum}`,
            homeSlot: race.homeSlot,
            awaySlot: race.awaySlot,
            homeOutcome: race.homeSlot === winner ? 'win' : 'loss',
            awayOutcome: race.homeSlot === winner ? 'loss' : 'win',
          })
        );
      };
      // Points were 1:18, 2:12, 3:12, 4:6. After team 4 beats 1 and 2 once
      // each: 1:16, 3:12, 2:10, 4:10. Teams 2 and 4 are now level, and the
      // saved order (which put 2 above 3) no longer fits the points.
      beat(4, 1);
      beat(4, 2);

      const { result } = renderHook(() => useFinalsState('mixed'));
      expect(result.current?.finalsPhase).toBe('blocked-ties');
    });
  });

  describe('Round 1 tie when the format has Round 2 (8 teams)', () => {
    beforeEach(() => {
      enterTeams(8);
      // Groups A (1-4) and B (11-14) meet once each: 1, 2, 3 tie in a cycle.
      scoreRoundOne(8, [1, 2, 3, 4, 11, 12, 13, 14], [1, 2, 3]);
    });

    it('shows a resolver for the tied Round 1 group', () => {
      renderAsOfficial(<RaceListView discipline="mixed" />);
      expect(screen.getByText('Resolve tie: Group A')).toBeTruthy();
    });

    it('moves on to Round 2 once the Round 1 tie is resolved', () => {
      renderAsOfficial(<RaceListView discipline="mixed" />);
      fireEvent.click(screen.getByText('Confirm order'));
      cleanup();

      // AppShell runs the phase transition; mirror its condition via the store.
      const { result } = renderHook(() => useFinalsState('mixed'));
      expect(result.current).not.toBeNull();
      expect(store().disciplines.mixed.manualTiebreaks.A).toEqual([1, 2, 3, 4]);
      // useStandings no longer reports a tie, so AppShell will advance.
      expect(screen.queryByText('Resolve tie: Group A')).toBeNull();
    });
  });
});
