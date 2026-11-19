import { describe, it, expect, beforeEach } from 'vitest';
import { useEventStore } from './eventStore';
import type { Score } from '../domain/types';

// Helper to access store outside React
const store = () => useEventStore.getState();

describe('eventStore', () => {
  beforeEach(() => {
    store().resetEvent();
  });

  describe('initial state', () => {
    it('has three disciplines', () => {
      const s = store();
      expect(s.disciplines.mixed).toBeDefined();
      expect(s.disciplines.board).toBeDefined();
      expect(s.disciplines.ladies).toBeDefined();
    });

    it('all disciplines start in setup phase', () => {
      const s = store();
      expect(s.disciplines.mixed.phase).toBe('setup');
      expect(s.disciplines.board.phase).toBe('setup');
      expect(s.disciplines.ladies.phase).toBe('setup');
    });

    it('all disciplines start with empty teams and scores', () => {
      const s = store();
      expect(s.disciplines.mixed.teams).toEqual([]);
      expect(s.disciplines.mixed.scores).toEqual([]);
      expect(s.disciplines.mixed.teamCount).toBe(0);
    });

    it('active discipline defaults to mixed', () => {
      expect(store().activeDiscipline).toBe('mixed');
    });
  });

  describe('setTeams', () => {
    it('sets teams and updates teamCount', () => {
      store().setTeams('mixed', [
        { slot: 1, name: 'Alpha' },
        { slot: 2, name: 'Beta' },
      ]);
      expect(store().disciplines.mixed.teams).toHaveLength(2);
      expect(store().disciplines.mixed.teamCount).toBe(2);
    });

    it('does not affect other disciplines', () => {
      store().setTeams('mixed', [{ slot: 1, name: 'Alpha' }]);
      expect(store().disciplines.board.teams).toEqual([]);
    });
  });

  describe('recordResult', () => {
    const score: Score = {
      raceId: 'r1-1',
      homeSlot: 1,
      awaySlot: 2,
      homeOutcome: 'win',
      awayOutcome: 'loss',
    };

    it('adds a score', () => {
      store().recordResult('mixed', score);
      expect(store().disciplines.mixed.scores).toHaveLength(1);
      expect(store().disciplines.mixed.scores[0].raceId).toBe('r1-1');
    });

    it('replaces existing score with same raceId (upsert)', () => {
      store().recordResult('mixed', score);
      const corrected: Score = { ...score, homeOutcome: 'loss', awayOutcome: 'win' };
      store().recordResult('mixed', corrected);
      expect(store().disciplines.mixed.scores).toHaveLength(1);
      expect(store().disciplines.mixed.scores[0].homeOutcome).toBe('loss');
    });
  });

  describe('clearResult', () => {
    it('removes score by raceId', () => {
      store().recordResult('mixed', {
        raceId: 'r1-1', homeSlot: 1, awaySlot: 2,
        homeOutcome: 'win', awayOutcome: 'loss',
      });
      store().clearResult('mixed', 'r1-1');
      expect(store().disciplines.mixed.scores).toHaveLength(0);
    });

    it('does not affect other scores', () => {
      store().recordResult('mixed', {
        raceId: 'r1-1', homeSlot: 1, awaySlot: 2,
        homeOutcome: 'win', awayOutcome: 'loss',
      });
      store().recordResult('mixed', {
        raceId: 'r1-2', homeSlot: 3, awaySlot: 4,
        homeOutcome: 'win', awayOutcome: 'loss',
      });
      store().clearResult('mixed', 'r1-1');
      expect(store().disciplines.mixed.scores).toHaveLength(1);
      expect(store().disciplines.mixed.scores[0].raceId).toBe('r1-2');
    });
  });

  describe('setActiveDiscipline', () => {
    it('changes active discipline', () => {
      store().setActiveDiscipline('board');
      expect(store().activeDiscipline).toBe('board');
    });
  });

  describe('setDisciplinePhase', () => {
    it('changes discipline phase', () => {
      store().setDisciplinePhase('mixed', 'group-stage');
      expect(store().disciplines.mixed.phase).toBe('group-stage');
    });

    it('does not affect other disciplines', () => {
      store().setDisciplinePhase('mixed', 'group-stage');
      expect(store().disciplines.board.phase).toBe('setup');
    });
  });

  describe('setManualTiebreak', () => {
    it('stores ordered slots for a group', () => {
      store().setManualTiebreak('mixed', 'A', [2, 1, 3, 4]);
      expect(store().disciplines.mixed.manualTiebreaks['A']).toEqual([2, 1, 3, 4]);
    });
  });

  describe('setPlacing', () => {
    it("stores an official's place for a team slot", () => {
      store().setPlacing('mixed', 11, 7);
      expect(store().disciplines.mixed.placings).toEqual({ '11': 7 });
    });

    it('removes the place when set to null', () => {
      store().setPlacing('mixed', 11, 7);
      store().setPlacing('mixed', 11, null);
      expect(store().disciplines.mixed.placings).toEqual({});
    });
  });

  describe('setNote', () => {
    it('stores a trimmed note for a race', () => {
      store().setNote('mixed', 'r1-1', '  Summit racer 2 DSQ  ');
      expect(store().disciplines.mixed.notes).toEqual({ 'r1-1': 'Summit racer 2 DSQ' });
    });

    it('removes the note when set to empty text', () => {
      store().setNote('mixed', 'r1-1', 'late start');
      store().setNote('mixed', 'r1-1', '');
      expect(store().disciplines.mixed.notes).toEqual({});
    });

    it('removes the note when set to whitespace-only text', () => {
      store().setNote('mixed', 'r1-1', 'late start');
      store().setNote('mixed', 'r1-1', '   ');
      expect(store().disciplines.mixed.notes).toEqual({});
    });

    it('caps the stored note at 200 characters', () => {
      store().setNote('mixed', 'r1-1', 'x'.repeat(250));
      expect(store().disciplines.mixed.notes['r1-1']).toHaveLength(200);
    });

    it('leaves other disciplines as the same object', () => {
      const board = store().disciplines.board;
      store().setNote('mixed', 'r1-1', 'late start');
      expect(store().disciplines.board).toBe(board);
    });

    it('leaves the state unchanged when the note is the same', () => {
      store().setNote('mixed', 'r1-1', 'late start');
      const mixed = store().disciplines.mixed;
      store().setNote('mixed', 'r1-1', ' late start ');
      expect(store().disciplines.mixed).toBe(mixed);
    });
  });

  describe('setTiebreakRaces', () => {
    const tb = (raceId: string): Score => ({
      raceId,
      homeSlot: 3,
      awaySlot: 2,
      homeOutcome: 'win',
      awayOutcome: 'loss',
    });

    it('stores the tied slots for the group', () => {
      store().setTiebreakRaces('mixed', 'A', [2, 3, 4]);
      expect(store().disciplines.mixed.tiebreakRaces).toEqual({ A: [2, 3, 4] });
    });

    it('removes stale tie-break results for the group when switched on', () => {
      store().recordResult('mixed', tb('tb-A-r1-1'));
      store().setTiebreakRaces('mixed', 'A', [2, 3, 4]);
      expect(store().disciplines.mixed.scores).toEqual([]);
    });

    it('keeps round, finals and other groups\' tie-break results', () => {
      const kept = [tb('r1-1'), tb('r2-I-1'), tb('fin-0'), tb('tb-B-r1-2'), tb('tb-r2-I-r2-I-1')];
      for (const s of kept) store().recordResult('mixed', s);
      store().recordResult('mixed', tb('tb-A-r1-1'));
      store().setTiebreakRaces('mixed', 'A', null);
      expect(store().disciplines.mixed.scores).toEqual(kept);
    });

    it('removes the flag and the group\'s tie-break results when switched off', () => {
      store().setTiebreakRaces('mixed', 'A', [2, 3, 4]);
      store().recordResult('mixed', tb('tb-A-r1-1'));
      store().setTiebreakRaces('mixed', 'A', null);
      expect(store().disciplines.mixed).toMatchObject({ tiebreakRaces: {}, scores: [] });
    });

    it('leaves other groups\' flags when one is switched off', () => {
      store().setTiebreakRaces('mixed', 'A', [2, 3, 4]);
      store().setTiebreakRaces('mixed', 'B', [5, 6, 7]);
      store().setTiebreakRaces('mixed', 'A', null);
      expect(store().disciplines.mixed.tiebreakRaces).toEqual({ B: [5, 6, 7] });
    });

    it('does not let Round 2 group I clear group II results', () => {
      store().recordResult('mixed', tb('tb-r2-II-r2-II-1'));
      store().setTiebreakRaces('mixed', 'r2-I', null);
      expect(store().disciplines.mixed.scores).toHaveLength(1);
    });

    it('leaves other disciplines as the same object', () => {
      const board = store().disciplines.board;
      store().setTiebreakRaces('mixed', 'A', [2, 3, 4]);
      expect(store().disciplines.board).toBe(board);
    });
  });

  describe('resetDiscipline', () => {
    it('clears race notes', () => {
      store().setNote('mixed', 'r1-1', 'late start');
      store().resetDiscipline('mixed');
      expect(store().disciplines.mixed.notes).toEqual({});
    });

    it('clears tie-break races', () => {
      store().setTiebreakRaces('mixed', 'A', [2, 3, 4]);
      store().resetDiscipline('mixed');
      expect(store().disciplines.mixed.tiebreakRaces).toEqual({});
    });
  });

  describe('resetEvent', () => {
    it('clears tie-break races', () => {
      store().setTiebreakRaces('mixed', 'A', [2, 3, 4]);
      store().resetEvent();
      expect(store().disciplines.mixed.tiebreakRaces).toEqual({});
    });

    it('returns all state to initial values', () => {
      store().setTeams('mixed', [{ slot: 1, name: 'Alpha' }]);
      store().setActiveDiscipline('board');
      store().resetEvent();
      expect(store().disciplines.mixed.teams).toEqual([]);
      expect(store().activeDiscipline).toBe('mixed');
    });
  });

  describe('persistence', () => {
    it('does not write to localStorage, leaving any pre-Firebase event intact', () => {
      localStorage.clear();
      localStorage.setItem('kings-races-event', '{"legacy":true}');

      store().setTeams('mixed', [{ slot: 1, name: 'Alpha' }]);

      expect(localStorage.getItem('kings-races-event')).toBe('{"legacy":true}');
      expect(localStorage.length).toBe(1);
      localStorage.clear();
    });
  });
});
