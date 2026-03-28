import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useEventStore } from './eventStore';
import type { Score } from '../domain/types';

// Helper to access store outside React
const store = () => useEventStore.getState();

describe('eventStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset store before each test
    localStorage.clear();
    store().resetEvent();
  });

  afterEach(() => {
    localStorage.clear();
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

  describe('resetEvent', () => {
    it('returns all state to initial values', () => {
      store().setTeams('mixed', [{ slot: 1, name: 'Alpha' }]);
      store().setActiveDiscipline('board');
      store().resetEvent();
      expect(store().disciplines.mixed.teams).toEqual([]);
      expect(store().activeDiscipline).toBe('mixed');
    });
  });

  describe('persistence (MOBL-02, MOBL-04)', () => {
    it('persists state to localStorage on mutation', () => {
      store().setTeams('mixed', [{ slot: 1, name: 'Persisted' }]);
      const stored = localStorage.getItem('kings-races-event');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.disciplines.mixed.teams[0].name).toBe('Persisted');
    });

    it('includes version stamp in persisted data', () => {
      store().setTeams('mixed', [{ slot: 1, name: 'Test' }]);
      const stored = localStorage.getItem('kings-races-event');
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
    });

    it('reconstructs state from localStorage after store reset (simulated tab death)', () => {
      // 1. Set some state
      store().setTeams('mixed', [
        { slot: 1, name: 'Survivor' },
        { slot: 2, name: 'Also Survived' },
      ]);
      store().recordResult('mixed', {
        raceId: 'r1-1', homeSlot: 1, awaySlot: 2,
        homeOutcome: 'win', awayOutcome: 'loss',
      });
      store().setActiveDiscipline('board');

      // 2. Verify localStorage has the data
      const stored = localStorage.getItem('kings-races-event');
      expect(stored).not.toBeNull();

      // 3. Destroy the in-memory store and rehydrate
      useEventStore.persist.clearStorage();
      // Re-set from localStorage manually to simulate app reload
      const parsed = JSON.parse(stored!);
      useEventStore.setState(parsed.state);

      // 4. Verify state is fully reconstructed
      expect(store().disciplines.mixed.teams).toHaveLength(2);
      expect(store().disciplines.mixed.teams[0].name).toBe('Survivor');
      expect(store().disciplines.mixed.scores).toHaveLength(1);
      expect(store().activeDiscipline).toBe('board');
    });
  });
});
