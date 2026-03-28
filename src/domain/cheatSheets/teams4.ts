import type { TournamentStructure } from '../types';

export const TEAMS_4: TournamentStructure = {
  teamCount: 4,
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 2, awaySlot: 3 },
    { raceNum: 4, homeSlot: 4, awaySlot: 1 },
    { raceNum: 5, homeSlot: 1, awaySlot: 3 },
    { raceNum: 6, homeSlot: 2, awaySlot: 4 },
    { raceNum: 7, homeSlot: 2, awaySlot: 1 },
    { raceNum: 8, homeSlot: 4, awaySlot: 3 },
    { raceNum: 9, homeSlot: 3, awaySlot: 2 },
    { raceNum: 10, homeSlot: 1, awaySlot: 4 },
    { raceNum: 11, homeSlot: 3, awaySlot: 1 },
    { raceNum: 12, homeSlot: 4, awaySlot: 2 },
  ],
  finals: [
    { label: '3rd/4th', homeRef: '3rd Group A', awayRef: 'Loser Group A' },
    { label: '1st/2nd', homeRef: 'Winner Group A', awayRef: '2nd Group A' },
  ],
  roundOneRaceCount: 12,
};
