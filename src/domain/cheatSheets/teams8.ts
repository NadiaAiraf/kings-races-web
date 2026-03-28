import type { TournamentStructure } from '../types';

export const TEAMS_8: TournamentStructure = {
  teamCount: 8,
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
    { letter: 'B', teamSlots: [11, 12, 13, 14] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 11, awaySlot: 12 },
    { raceNum: 4, homeSlot: 13, awaySlot: 14 },
    { raceNum: 5, homeSlot: 2, awaySlot: 3 },
    { raceNum: 6, homeSlot: 4, awaySlot: 1 },
    { raceNum: 7, homeSlot: 12, awaySlot: 13 },
    { raceNum: 8, homeSlot: 14, awaySlot: 11 },
    { raceNum: 9, homeSlot: 1, awaySlot: 3 },
    { raceNum: 10, homeSlot: 2, awaySlot: 4 },
    { raceNum: 11, homeSlot: 11, awaySlot: 13 },
    { raceNum: 12, homeSlot: 12, awaySlot: 14 },
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
        { positionCode: 'B3', letter: 'F', label: 'Third B' },
        { positionCode: 'A4', letter: 'G', label: 'Loser A' },
        { positionCode: 'B4', letter: 'H', label: 'Loser B' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'E', awayLetter: 'F' },
        { raceNum: 2, homeLetter: 'G', awayLetter: 'H' },
        { raceNum: 3, homeLetter: 'F', awayLetter: 'G' },
        { raceNum: 4, homeLetter: 'H', awayLetter: 'E' },
        { raceNum: 5, homeLetter: 'E', awayLetter: 'G' },
        { raceNum: 6, homeLetter: 'F', awayLetter: 'H' },
      ],
    },
  ],
  finals: [
    { label: '7th/8th', homeRef: 'Third Group II', awayRef: 'Loser Group II' },
    { label: '5th/6th', homeRef: 'Winner Group II', awayRef: 'Second Group II' },
    { label: '3rd/4th', homeRef: 'Third Group I', awayRef: 'Loser Group I' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Second Group I' },
  ],
  roundOneRaceCount: 12,
  roundTwoRaceCount: 12,
};
