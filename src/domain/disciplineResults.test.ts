import { describe, it, expect } from 'vitest';
import { buildResultsForDiscipline } from './disciplineResults';
import { playedDiscipline } from './__fixtures__/playedDiscipline';

describe('buildResultsForDiscipline', () => {
  it('is null until the discipline is complete', () => {
    expect(buildResultsForDiscipline(playedDiscipline(8, { phase: 'finals' }))).toBeNull();
  });

  // 24 and 25 teams seed Round 2 by label only (blank positionCode).
  it.each([8, 24, 25])('lists a result for every finalist with %i teams', (count) => {
    const state = playedDiscipline(count);
    const results = buildResultsForDiscipline(state)!;
    const finalsRaced = state.scores.filter((s) => s.raceId.startsWith('fin-')).length;

    expect(results).toHaveLength(finalsRaced * 2);
  });
});
