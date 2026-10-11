import { describe, it, expect } from 'vitest';
import { resolveCompletedDiscipline } from './disciplineResults';
import { playedDiscipline } from './__fixtures__/playedDiscipline';

describe('resolveCompletedDiscipline', () => {
  it('is null until the discipline is complete', () => {
    expect(resolveCompletedDiscipline(playedDiscipline(8, { phase: 'finals' }))).toBeNull();
  });

  // 24 and 25 teams seed Round 2 by label only (blank positionCode).
  it.each([8, 24, 25])('resolves both teams of every final with %i teams', (count) => {
    const { finals } = resolveCompletedDiscipline(playedDiscipline(count))!;
    expect(finals.every((f) => f.homeSlot !== null && f.awaySlot !== null)).toBe(true);
  });
});
