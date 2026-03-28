import type { TournamentStructure } from '../types';

export const TEAMS_13: TournamentStructure = {
  teamCount: 13,
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
    { letter: 'B', teamSlots: [11, 12, 13] },
    { letter: 'C', teamSlots: [21, 22, 23] },
    { letter: 'D', teamSlots: [31, 32, 33] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 11, awaySlot: 12 },
    { raceNum: 4, homeSlot: 21, awaySlot: 22 },
    { raceNum: 5, homeSlot: 31, awaySlot: 32 },
    { raceNum: 6, homeSlot: 2, awaySlot: 3 },
    { raceNum: 7, homeSlot: 4, awaySlot: 1 },
    { raceNum: 8, homeSlot: 12, awaySlot: 13 },
    { raceNum: 9, homeSlot: 22, awaySlot: 23 },
    { raceNum: 10, homeSlot: 32, awaySlot: 33 },
    { raceNum: 11, homeSlot: 1, awaySlot: 3 },
    { raceNum: 12, homeSlot: 2, awaySlot: 4 },
    { raceNum: 13, homeSlot: 13, awaySlot: 11 },
    { raceNum: 14, homeSlot: 23, awaySlot: 21 },
    { raceNum: 15, homeSlot: 33, awaySlot: 31 },
  ],
  roundTwoGroups: [
    {
      groupNum: 'I',
      seedingEntries: [
        { positionCode: 'A1', letter: 'A', label: 'Winner A' },
        { positionCode: 'C1', letter: 'B', label: 'Winner C' },
        { positionCode: 'B2', letter: 'C', label: 'Runner Up B' },
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
        { positionCode: 'B1', letter: 'D', label: 'Winner B' },
        { positionCode: 'D1', letter: 'E', label: 'Winner D' },
        { positionCode: 'A2', letter: 'F', label: 'Runner Up A' },
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
        { positionCode: 'C2', letter: 'H', label: 'Runner Up C' },
        { positionCode: 'D2', letter: 'I', label: 'Runner Up D' },
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
        { positionCode: 'A4', letter: 'J', label: 'Loser A' },
        { positionCode: 'B3', letter: 'K', label: 'Loser B' },
        { positionCode: 'C3', letter: 'L', label: 'Loser C' },
        { positionCode: 'D3', letter: 'M', label: 'Loser D' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'J', awayLetter: 'K' },
        { raceNum: 2, homeLetter: 'L', awayLetter: 'M' },
        { raceNum: 3, homeLetter: 'K', awayLetter: 'L' },
        { raceNum: 4, homeLetter: 'M', awayLetter: 'J' },
        { raceNum: 5, homeLetter: 'J', awayLetter: 'L' },
        { raceNum: 6, homeLetter: 'K', awayLetter: 'M' },
      ],
    },
  ],
  finals: [
    { label: '11th/12th', homeRef: 'Third Group III', awayRef: 'Third Group IV' },
    { label: '9th/10th', homeRef: 'Second Group III', awayRef: 'Second Group IV' },
    { label: '7th/8th', homeRef: 'Winner Group III', awayRef: 'Winner Group IV' },
    { label: '5th/6th', homeRef: 'Third Group I', awayRef: 'Third Group II' },
    { label: '3rd/4th', homeRef: 'Second Group I', awayRef: 'Second Group II' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Winner Group II' },
  ],
  roundOneRaceCount: 15,
  roundTwoRaceCount: 15,
};
