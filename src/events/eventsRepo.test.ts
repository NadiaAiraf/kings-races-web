import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fs = vi.hoisted(() => ({
  snap: { exists: (): boolean => true, data: (): Record<string, unknown> => ({}) },
  batch: { set: vi.fn(), delete: vi.fn(), commit: vi.fn(async () => {}) },
  writeBatch: vi.fn(),
}));

vi.mock('../firebase/app', () => ({ db: {} }));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  // Refs are plain { path } objects so assertions can name the document.
  const pathOf = (parent: { path?: string }, segments: string[]) =>
    [parent.path, ...segments].filter(Boolean).join('/');
  return {
    ...actual,
    collection: (parent: { path?: string }, ...segments: string[]) => ({
      path: pathOf(parent, segments),
    }),
    doc: (parent: { path?: string }, ...segments: string[]) => ({
      path: pathOf(parent, segments),
    }),
    getDoc: async () => fs.snap,
    writeBatch: fs.writeBatch,
    serverTimestamp: () => 'SERVER_TIMESTAMP',
  };
});

import { deleteEvent } from './eventsRepo';

describe('deleteEvent', () => {
  beforeEach(() => {
    fs.batch.set.mockClear();
    fs.batch.delete.mockClear();
    fs.batch.commit.mockClear();
    fs.writeBatch.mockReset();
    fs.writeBatch.mockReturnValue(fs.batch);
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('archives the whole event and deletes it in one batch', async () => {
    const raw = { name: 'R1 - Hemel', date: '2026-11-14', disciplines: { mixed: {} } };
    fs.snap = { exists: () => true, data: () => raw };

    await deleteEvent('ev1', 'u1');

    expect(fs.writeBatch).toHaveBeenCalledTimes(1);
    expect(fs.batch.set).toHaveBeenCalledWith(
      { path: 'deletedEvents/ev1_1700000000000' },
      { eventId: 'ev1', event: raw, deletedBy: 'u1', deletedAt: 'SERVER_TIMESTAMP' }
    );
    expect(fs.batch.delete).toHaveBeenCalledWith({ path: 'events/ev1' });
    expect(fs.batch.commit).toHaveBeenCalledTimes(1);
  });

  it('rejects without writing when the event is already gone', async () => {
    fs.snap = { exists: () => false, data: () => ({}) };

    await expect(deleteEvent('ev1', 'u1')).rejects.toThrow(/ev1/);

    expect(fs.writeBatch).not.toHaveBeenCalled();
    expect(fs.batch.commit).not.toHaveBeenCalled();
  });
});
