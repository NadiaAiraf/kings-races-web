import type { TournamentStructure } from '../types';

export const TEAMS_7: TournamentStructure = {
  teamCount: 7,
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
    { letter: 'B', teamSlots: [11, 12, 13] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 11, awaySlot: 12 },
    { raceNum: 4, homeSlot: 2, awaySlot: 3 },
    { raceNum: 5, homeSlot: 4, awaySlot: 1 },
    { raceNum: 6, homeSlot: 12, awaySlot: 13 },
    { raceNum: 7, homeSlot: 1, awaySlot: 3 },
    { raceNum: 8, homeSlot: 2, awaySlot: 4 },
    { raceNum: 9, homeSlot: 13, awaySlot: 11 },
  ],
  roundTwoGroups: [
    {
      groupNum: 'I',
      seedingEntries: [
        { positionCode: 'A1', letter: 'A', label: 'Winner A' },
        { positionCode: 'B1', letter: 'B', label: 'Winner B' },
        { positionCode: 'A2', letter: 'C', label: 'Runner Up A' },
        { positionCode: 'B2', letter: 'D', label: 'Runner Up B' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'A', awayLetter: 'B' },
        { raceNum: 2, homeLetter: 'C', awayLetter: 'D' },
        { raceNum: 3, homeLetter: 'B', awayLetter: 'C' },
        { raceNum: 4, homeLetter: 'D', awayLetter: 'A' },
        { raceNum: 5, homeLetter: 'A', awayLetter: 'C' },
        { raceNum: 6, homeLetter: 'B', awayLetter: 'D' },
      ],
    },
    {
      groupNum: 'II',
      seedingEntries: [
        { positionCode: 'A3', letter: 'E', label: 'Third A' },
        { positionCode: 'B3', letter: 'F', label: 'Loser B' },
        { positionCode: 'A4', letter: 'G', label: 'Loser A' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'E', awayLetter: 'F' },
        { raceNum: 2, homeLetter: 'F', awayLetter: 'G' },
        { raceNum: 3, homeLetter: 'G', awayLetter: 'E' },
      ],
    },
  ],
  finals: [
    { label: '1st/2nd', homeRef: 'Winner I', awayRef: 'Runner up I' },
  ],
  roundOneRaceCount: 9,
  roundTwoRaceCount: 9,
};
