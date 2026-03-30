import type { TournamentStructure } from '../types';

export const TEAMS_5: TournamentStructure = {
  teamCount: 5,
  seedMap: [1, 5, 4, 2, 3],
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4, 5] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 2, awaySlot: 3 },
    { raceNum: 4, homeSlot: 4, awaySlot: 5 },
    { raceNum: 5, homeSlot: 5, awaySlot: 1 },
    { raceNum: 6, homeSlot: 4, awaySlot: 2 },
    { raceNum: 7, homeSlot: 5, awaySlot: 3 },
    { raceNum: 8, homeSlot: 1, awaySlot: 4 },
    { raceNum: 9, homeSlot: 2, awaySlot: 5 },
    { raceNum: 10, homeSlot: 3, awaySlot: 1 },
  ],
  finals: [
    { label: '3rd/4th', homeRef: '3rd Group A', awayRef: '4th Group A' },
    { label: '1st/2nd', homeRef: 'Winner Group A', awayRef: '2nd Group A' },
  ],
  roundOneRaceCount: 10,
};
