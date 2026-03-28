import type { TournamentStructure } from '../types';

export const TEAMS_12: TournamentStructure = {
  teamCount: 12,
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3] },
    { letter: 'B', teamSlots: [11, 12, 13] },
    { letter: 'C', teamSlots: [21, 22, 23] },
    { letter: 'D', teamSlots: [31, 32, 33] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 11, awaySlot: 12 },
    { raceNum: 3, homeSlot: 21, awaySlot: 22 },
    { raceNum: 4, homeSlot: 31, awaySlot: 32 },
    { raceNum: 5, homeSlot: 2, awaySlot: 3 },
    { raceNum: 6, homeSlot: 12, awaySlot: 13 },
    { raceNum: 7, homeSlot: 22, awaySlot: 23 },
    { raceNum: 8, homeSlot: 32, awaySlot: 33 },
    { raceNum: 9, homeSlot: 3, awaySlot: 1 },
    { raceNum: 10, homeSlot: 13, awaySlot: 11 },
    { raceNum: 11, homeSlot: 23, awaySlot: 21 },
    { raceNum: 12, homeSlot: 33, awaySlot: 31 },
  ],
  roundTwoGroups: [
    {
      groupNum: 'I',
      seedingEntries: [
        { positionCode: 'A1', letter: 'A', label: 'Winner A' },
        { positionCode: 'B2', letter: 'B', label: 'Runner Up B' },
        { positionCode: 'C1', letter: 'C', label: 'Winner C' },
        { positionCode: 'D2', letter: 'D', label: 'Runner Up D' },
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
        { positionCode: 'A2', letter: 'E', label: 'Runner Up A' },
        { positionCode: 'B1', letter: 'F', label: 'Winner B' },
        { positionCode: 'C2', letter: 'G', label: 'Runner Up C' },
        { positionCode: 'D1', letter: 'H', label: 'Winner D' },
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
        { positionCode: 'A3', letter: 'I', label: 'Loser A' },
        { positionCode: 'B3', letter: 'J', label: 'Loser B' },
        { positionCode: 'C3', letter: 'K', label: 'Loser C' },
        { positionCode: 'D3', letter: 'L', label: 'Loser D' },
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
  ],
  finals: [
    { label: '7th/8th', homeRef: 'Loser Group I', awayRef: 'Loser Group II' },
    { label: '5th/6th', homeRef: 'Third Group I', awayRef: 'Third Group II' },
    { label: '3rd/4th', homeRef: 'Second Group I', awayRef: 'Second Group II' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Winner Group II' },
  ],
  roundOneRaceCount: 12,
  roundTwoRaceCount: 18,
};
