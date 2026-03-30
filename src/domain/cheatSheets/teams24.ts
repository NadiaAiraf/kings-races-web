import type { TournamentStructure } from '../types';

export const TEAMS_24: TournamentStructure = {
  teamCount: 24,
  seedMap: [1, 11, 21, 31, 41, 51, 61, 71, 73, 63, 53, 43, 33, 23, 13, 3, 2, 12, 22, 32, 42, 52, 62, 72],
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3] },
    { letter: 'B', teamSlots: [21, 22, 23] },
    { letter: 'C', teamSlots: [41, 42, 43] },
    { letter: 'D', teamSlots: [61, 62, 63] },
    { letter: 'E', teamSlots: [11, 12, 13] },
    { letter: 'F', teamSlots: [31, 32, 33] },
    { letter: 'G', teamSlots: [51, 52, 53] },
    { letter: 'H', teamSlots: [71, 72, 73] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 11, awaySlot: 12 },
    { raceNum: 3, homeSlot: 21, awaySlot: 22 },
    { raceNum: 4, homeSlot: 31, awaySlot: 32 },
    { raceNum: 5, homeSlot: 41, awaySlot: 42 },
    { raceNum: 6, homeSlot: 51, awaySlot: 52 },
    { raceNum: 7, homeSlot: 61, awaySlot: 62 },
    { raceNum: 8, homeSlot: 71, awaySlot: 72 },
    { raceNum: 9, homeSlot: 2, awaySlot: 3 },
    { raceNum: 10, homeSlot: 12, awaySlot: 13 },
    { raceNum: 11, homeSlot: 22, awaySlot: 23 },
    { raceNum: 12, homeSlot: 32, awaySlot: 33 },
    { raceNum: 13, homeSlot: 42, awaySlot: 43 },
    { raceNum: 14, homeSlot: 52, awaySlot: 53 },
    { raceNum: 15, homeSlot: 62, awaySlot: 63 },
    { raceNum: 16, homeSlot: 72, awaySlot: 73 },
    { raceNum: 17, homeSlot: 3, awaySlot: 1 },
    { raceNum: 18, homeSlot: 13, awaySlot: 11 },
    { raceNum: 19, homeSlot: 23, awaySlot: 21 },
    { raceNum: 20, homeSlot: 33, awaySlot: 31 },
    { raceNum: 21, homeSlot: 43, awaySlot: 41 },
    { raceNum: 22, homeSlot: 53, awaySlot: 51 },
    { raceNum: 23, homeSlot: 63, awaySlot: 61 },
    { raceNum: 24, homeSlot: 73, awaySlot: 71 },
  ],
  roundTwoGroups: [
    {
      groupNum: 'I',
      seedingEntries: [
        { positionCode: '', letter: 'A', label: 'Winner A' },
        { positionCode: '', letter: 'B', label: 'Winner B' },
        { positionCode: '', letter: 'C', label: 'Winner C' },
        { positionCode: '', letter: 'D', label: 'Winner D' },
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
        { positionCode: '', letter: 'E', label: 'Winner E' },
        { positionCode: '', letter: 'F', label: 'Winner f' },
        { positionCode: '', letter: 'G', label: 'Winner G' },
        { positionCode: '', letter: 'H', label: 'Winner H' },
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
    {
      groupNum: 'III',
      seedingEntries: [
        { positionCode: '', letter: 'I', label: 'Runner Up A' },
        { positionCode: '', letter: 'J', label: 'Runner up B' },
        { positionCode: '', letter: 'K', label: 'Runner up C' },
        { positionCode: '', letter: 'L', label: 'Runner up D' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'I', awayLetter: 'J' },
        { raceNum: 2, homeLetter: 'K', awayLetter: 'L' },
        { raceNum: 3, homeLetter: 'J', awayLetter: 'K' },
        { raceNum: 4, homeLetter: 'L', awayLetter: 'I' },
        { raceNum: 5, homeLetter: 'I', awayLetter: 'K' },
        { raceNum: 6, homeLetter: 'J', awayLetter: 'L' },

      ],
    },
    {
      groupNum: 'IV',
      seedingEntries: [
        { positionCode: '', letter: 'M', label: 'Runner Up E' },
        { positionCode: '', letter: 'N', label: 'Runner Up F' },
        { positionCode: '', letter: 'O', label: 'Runner Up G' },
        { positionCode: '', letter: 'P', label: 'Runner Up H' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'M', awayLetter: 'N' },
        { raceNum: 2, homeLetter: 'O', awayLetter: 'P' },
        { raceNum: 3, homeLetter: 'N', awayLetter: 'O' },
        { raceNum: 4, homeLetter: 'P', awayLetter: 'M' },
        { raceNum: 5, homeLetter: 'M', awayLetter: 'O' },
        { raceNum: 6, homeLetter: 'N', awayLetter: 'P' },

      ],
    },
    {
      groupNum: 'V',
      seedingEntries: [
        { positionCode: '', letter: 'Q', label: 'Loser A' },
        { positionCode: '', letter: 'R', label: 'Loser B' },
        { positionCode: '', letter: 'S', label: 'Loser C' },
        { positionCode: '', letter: 'T', label: 'Loser D' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'Q', awayLetter: 'R' },
        { raceNum: 2, homeLetter: 'S', awayLetter: 'T' },
        { raceNum: 3, homeLetter: 'R', awayLetter: 'S' },
        { raceNum: 4, homeLetter: 'T', awayLetter: 'Q' },
        { raceNum: 5, homeLetter: 'Q', awayLetter: 'S' },
        { raceNum: 6, homeLetter: 'R', awayLetter: 'T' },

      ],
    },
    {
      groupNum: 'VI',
      seedingEntries: [
        { positionCode: '', letter: 'U', label: 'Loser E' },
        { positionCode: '', letter: 'V', label: 'Loser F' },
        { positionCode: '', letter: 'W', label: 'Loser G' },
        { positionCode: '', letter: 'X', label: 'Loser H' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'U', awayLetter: 'V' },
        { raceNum: 2, homeLetter: 'W', awayLetter: 'X' },
        { raceNum: 3, homeLetter: 'V', awayLetter: 'W' },
        { raceNum: 4, homeLetter: 'X', awayLetter: 'U' },
        { raceNum: 5, homeLetter: 'U', awayLetter: 'W' },
        { raceNum: 6, homeLetter: 'V', awayLetter: 'X' },

      ],
    },
  ],
  finals: [
    { label: '15th/16th', homeRef: 'Loser Group III', awayRef: 'Loser Group IV' },
    { label: '13th/14th', homeRef: 'Third Group III', awayRef: 'Third Group IV' },
    { label: '11th/12th', homeRef: 'Second Group III', awayRef: 'Second Group IV' },
    { label: '9th/10th', homeRef: 'Winner Group III', awayRef: 'Winner Group IV' },
    { label: '7th/8th', homeRef: 'Loser Group I', awayRef: 'Loser Group II' },
    { label: '5th/6th', homeRef: 'Third Group I', awayRef: 'Third Group II' },
    { label: '3rd/4th', homeRef: 'Second Group I', awayRef: 'Second Group II' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Winner Group II' },
  ],
  roundOneRaceCount: 24,
  roundTwoRaceCount: 36,
};
