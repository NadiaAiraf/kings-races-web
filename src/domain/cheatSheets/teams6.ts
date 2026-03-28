import type { TournamentStructure } from '../types';

export const TEAMS_6: TournamentStructure = {
  teamCount: 6,
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4, 5, 6] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 5, awaySlot: 6 },
    { raceNum: 4, homeSlot: 2, awaySlot: 3 },
    { raceNum: 5, homeSlot: 4, awaySlot: 5 },
    { raceNum: 6, homeSlot: 6, awaySlot: 1 },
    { raceNum: 7, homeSlot: 3, awaySlot: 1 },
    { raceNum: 8, homeSlot: 4, awaySlot: 6 },
    { raceNum: 9, homeSlot: 5, awaySlot: 2 },
    { raceNum: 10, homeSlot: 1, awaySlot: 4 },
    { raceNum: 11, homeSlot: 2, awaySlot: 6 },
    { raceNum: 12, homeSlot: 3, awaySlot: 5 },
    { raceNum: 13, homeSlot: 5, awaySlot: 1 },
    { raceNum: 14, homeSlot: 4, awaySlot: 2 },
    { raceNum: 15, homeSlot: 6, awaySlot: 3 },
  ],
  finals: [
    { label: '5th/6th', homeRef: '5th Group A', awayRef: 'Loser Group A' },
    { label: '3rd/4th', homeRef: '3rd Group A', awayRef: '4th Group A' },
    { label: '1st/2nd', homeRef: 'Winner Group A', awayRef: '2nd Group A' },
  ],
  roundOneRaceCount: 15,
};
