import { useCallback, useState } from 'react';
import type { DisciplineKey } from '../domain/types';

function readChoice(key: string): boolean | null {
  try {
    const value = localStorage.getItem(key);
    if (value === 'open') return true;
    if (value === 'closed') return false;
    return null;
  } catch {
    return null;
  }
}

function writeChoice(key: string, open: boolean): void {
  try {
    localStorage.setItem(key, open ? 'open' : 'closed');
  } catch {
    // Storage unavailable: the choice still holds for this session.
  }
}

/**
 * Whether a round's races are shown on the Races tab. Incomplete rounds are
 * always open; a complete round is folded unless this device opened it.
 */
export function useRoundFold(
  eventId: string,
  discipline: DisciplineKey,
  round: 'r1' | 'r2',
  complete: boolean
): { open: boolean; toggle: () => void } {
  const key = `kings-races:round-fold:${eventId}:${discipline}:${round}`;
  const [memory, setMemory] = useState<Record<string, boolean>>({});
  const choice = memory[key] ?? readChoice(key);
  const open = complete ? (choice ?? false) : true;

  const toggle = useCallback(() => {
    const next = !open;
    setMemory((prev) => ({ ...prev, [key]: next }));
    writeChoice(key, next);
  }, [key, open]);

  return { open, toggle };
}
