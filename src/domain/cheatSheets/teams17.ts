import type { TournamentStructure } from '../types';

export const TEAMS_17: TournamentStructure = {
  teamCount: 17,
  seedMap: [1, 11, 21, 31, 41, 51, 52, 43, 33, 23, 13, 3, 2, 12, 22, 32, 42],
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3] },
    { letter: 'B', teamSlots: [21, 22, 23] },
    { letter: 'C', teamSlots: [41, 42, 43] },
    { letter: 'D', teamSlots: [11, 12, 13] },
    { letter: 'E', teamSlots: [31, 32, 33] },
    { letter: 'F', teamSlots: [51, 52] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 11, awaySlot: 12 },
    { raceNum: 3, homeSlot: 21, awaySlot: 22 },
    { raceNum: 4, homeSlot: 31, awaySlot: 32 },
    { raceNum: 5, homeSlot: 41, awaySlot: 42 },
    { raceNum: 6, homeSlot: 51, awaySlot: 52 },
    { raceNum: 7, homeSlot: 2, awaySlot: 3 },
    { raceNum: 8, homeSlot: 12, awaySlot: 13 },
    { raceNum: 9, homeSlot: 22, awaySlot: 23 },
    { raceNum: 10, homeSlot: 32, awaySlot: 33 },
    { raceNum: 11, homeSlot: 42, awaySlot: 43 },
    { raceNum: 12, homeSlot: 52, awaySlot: 51 },
    { raceNum: 13, homeSlot: 3, awaySlot: 1 },
    { raceNum: 14, homeSlot: 13, awaySlot: 11 },
    { raceNum: 15, homeSlot: 23, awaySlot: 21 },
    { raceNum: 16, homeSlot: 33, awaySlot: 31 },
    { raceNum: 17, homeSlot: 43, awaySlot: 41 },
    { raceNum: 18, homeSlot: 51, awaySlot: 52 },
  ],
  roundTwoGroups: [
    {
      groupNum: 'I',
      seedingEntries: [
        { positionCode: 'A1', letter: 'A', label: 'Winner A' },
        { positionCode: 'B1', letter: 'B', label: 'Winner B' },
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
        { positionCode: 'D1', letter: 'D', label: 'Winner D' },
        { positionCode: 'E1', letter: 'E', label: 'Winner E' },
        { positionCode: 'F1', letter: 'F', label: 'Winner F' },
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
        { positionCode: 'A2', letter: 'G', label: 'Runner Up A' },
        { positionCode: 'B2', letter: 'H', label: 'Runner Up B' },
        { positionCode: 'C2', letter: 'I', label: 'Runner Up C' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'G', awayLetter: 'H' },
        { raceNum: 2, homeLetter: 'H', awayLetter: 'I' },
        { raceNum: 3, homeLetter: 'I', awayLetter: 'G' },

      ],
    },
    {
      groupNum: 'IV',
      seedingEntries: [
        { positionCode: 'D2', letter: 'J', label: 'Runner Up D' },
        { positionCode: 'E2', letter: 'K', label: 'Runner Up E' },
        { positionCode: 'F2', letter: 'L', label: 'Runner Up F' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'J', awayLetter: 'K' },
        { raceNum: 2, homeLetter: 'K', awayLetter: 'L' },
        { raceNum: 3, homeLetter: 'L', awayLetter: 'J' },

      ],
    },
    {
      groupNum: 'V',
      seedingEntries: [
        { positionCode: 'A3', letter: 'M', label: 'Loser A' },
        { positionCode: 'B3', letter: 'N', label: 'Loser B' },
        { positionCode: 'C3', letter: 'O', label: 'Loser C' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'M', awayLetter: 'N' },
        { raceNum: 2, homeLetter: 'N', awayLetter: 'O' },
        { raceNum: 3, homeLetter: 'O', awayLetter: 'M' },

      ],
    },
    {
      groupNum: 'VI',
      seedingEntries: [
        { positionCode: 'D3', letter: 'P', label: 'Loser D' },
        { positionCode: 'E3', letter: 'Q', label: 'Loser E' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'P', awayLetter: 'Q' },
        { raceNum: 2, homeLetter: 'Q', awayLetter: 'P' },
        { raceNum: 3, homeLetter: 'P', awayLetter: 'Q' },

      ],
    },
  ],
  finals: [
    { label: '15th/16th', homeRef: 'Second Group V', awayRef: 'Second Group VI' },
    { label: '13th/14th', homeRef: 'Winner Group V', awayRef: 'Winner Group VI' },
    { label: '11th/12th', homeRef: 'Loser Group III', awayRef: 'Loser Group IV' },
    { label: '9th/10th', homeRef: 'Second Group III', awayRef: 'Second Group IV' },
    { label: '7th/8th', homeRef: 'Winner Group III', awayRef: 'Winner Group IV' },
    { label: '5th/6th', homeRef: 'Loser Group I', awayRef: 'Loser Group II' },
    { label: '3rd/4th', homeRef: 'Second Group I', awayRef: 'Second Group II' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Winner Group II' },
  ],
  roundOneRaceCount: 18,
  roundTwoRaceCount: 18,
};
