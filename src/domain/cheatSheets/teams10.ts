import type { TournamentStructure } from '../types';

export const TEAMS_10: TournamentStructure = {
  teamCount: 10,
  seedMap: [1, 11, 21, 23, 13, 4, 2, 12, 22, 3],
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
    { letter: 'B', teamSlots: [11, 12, 13] },
    { letter: 'C', teamSlots: [21, 22, 23] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 11, awaySlot: 12 },
    { raceNum: 4, homeSlot: 21, awaySlot: 22 },
    { raceNum: 5, homeSlot: 2, awaySlot: 3 },
    { raceNum: 6, homeSlot: 4, awaySlot: 1 },
    { raceNum: 7, homeSlot: 12, awaySlot: 13 },
    { raceNum: 8, homeSlot: 22, awaySlot: 23 },
    { raceNum: 9, homeSlot: 1, awaySlot: 3 },
    { raceNum: 10, homeSlot: 2, awaySlot: 4 },
    { raceNum: 11, homeSlot: 13, awaySlot: 11 },
    { raceNum: 12, homeSlot: 23, awaySlot: 21 },
  ],
  roundTwoGroups: [
    {
      groupNum: 'I',
      seedingEntries: [
        { positionCode: 'A1', letter: 'A', label: 'Winner A' },
        { positionCode: 'B2', letter: 'B', label: 'Runner Up B' },
        { positionCode: 'C1', letter: 'C', label: 'Winner C' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'A', awayLetter: 'B' },
        { raceNum: 2, homeLetter: 'B', awayLetter: 'C' },
        { raceNum: 3, homeLetter: 'C', awayLetter: 'A' },

      ],
    },
    {
      groupNum: 'II',
      seedingEntries: [
        { positionCode: 'A2', letter: 'D', label: 'Runner Up A' },
        { positionCode: 'B1', letter: 'E', label: 'Winner B' },
        { positionCode: 'C2', letter: 'F', label: 'Runner Up C' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'D', awayLetter: 'E' },
        { raceNum: 2, homeLetter: 'E', awayLetter: 'F' },
        { raceNum: 3, homeLetter: 'F', awayLetter: 'D' },

      ],
    },
    {
      groupNum: 'III',
      seedingEntries: [
        { positionCode: 'A3', letter: 'G', label: 'Third A' },
        { positionCode: 'B3', letter: 'H', label: 'Loser B' },
        { positionCode: 'C3', letter: 'I', label: 'Loser C' },
        { positionCode: 'A4', letter: 'J', label: 'Loser A' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'G', awayLetter: 'H' },
        { raceNum: 2, homeLetter: 'I', awayLetter: 'J' },
        { raceNum: 3, homeLetter: 'H', awayLetter: 'I' },
        { raceNum: 4, homeLetter: 'J', awayLetter: 'G' },
        { raceNum: 5, homeLetter: 'G', awayLetter: 'I' },
        { raceNum: 6, homeLetter: 'H', awayLetter: 'J' },

      ],
    },
  ],
  finals: [
    { label: '5th/6th', homeRef: 'Third Group I', awayRef: 'Third Group II' },
    { label: '3rd/4th', homeRef: 'Second Group I', awayRef: 'Second Group II' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Winner Group II' },
  ],
  roundOneRaceCount: 12,
  roundTwoRaceCount: 12,
};
