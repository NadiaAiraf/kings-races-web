import { describe, it, expect } from 'vitest';
import { newTeamNames, parseLeagueTeams, validateNewTeamNames } from './leagueTeams';

describe('parseLeagueTeams', () => {
  it('reads each discipline list', () => {
    expect(parseLeagueTeams({ mixed: ['Kings 1'] }).mixed).toEqual(['Kings 1']);
  });

  it('drops entries that are not team names and keeps the rest', () => {
    expect(parseLeagueTeams({ board: ['Kings', 3, '', 'x'.repeat(61), 'UCL'] }).board).toEqual([
      'Kings',
      'UCL',
    ]);
  });

  it('treats a list that is not an array as empty', () => {
    expect(parseLeagueTeams({ board: 'Kings' }).board).toEqual([]);
  });
});

describe('newTeamNames', () => {
  it('takes one team per pasted line, trimmed', () => {
    expect(newTeamNames('Kings 1\n  UCL  2 \n\n', [])).toEqual(['Kings 1', 'UCL 2']);
  });

  it('skips teams already on the list, ignoring case', () => {
    expect(newTeamNames('kings 1\nLSE 1', ['Kings 1'])).toEqual(['LSE 1']);
  });

  it('skips a team pasted twice', () => {
    expect(newTeamNames('LSE 1\nLSE 1', [])).toEqual(['LSE 1']);
  });
});

describe('validateNewTeamNames', () => {
  it('accepts more than 31 teams', () => {
    const names = Array.from({ length: 34 }, (_, i) => `Team ${i + 1}`);
    expect(validateNewTeamNames(names, [])).toBeNull();
  });

  it('rejects an empty addition', () => {
    expect(validateNewTeamNames([], [])).toBe('Enter at least one new team');
  });

  it('rejects going over 100 teams', () => {
    const existing = Array.from({ length: 100 }, (_, i) => `Team ${i + 1}`);
    expect(validateNewTeamNames(['One more'], existing)).toMatch(/100/);
  });

  it('rejects an overlong name', () => {
    expect(validateNewTeamNames(['x'.repeat(61)], [])).toMatch(/60/);
  });
});
