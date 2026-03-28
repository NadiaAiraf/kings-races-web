import type { TournamentStructure } from '../types';

export const TEAMS_11: TournamentStructure = {
  teamCount: 11,
  groups: [
    { letter: 'A', teamSlots: [1, 2, 3, 4] },
    { letter: 'B', teamSlots: [21, 22, 23, 24] },
    { letter: 'C', teamSlots: [31, 32, 33] },
  ],
  roundOneRaces: [
    { raceNum: 1, homeSlot: 1, awaySlot: 2 },
    { raceNum: 2, homeSlot: 3, awaySlot: 4 },
    { raceNum: 3, homeSlot: 21, awaySlot: 22 },
    { raceNum: 4, homeSlot: 23, awaySlot: 24 },
    { raceNum: 5, homeSlot: 31, awaySlot: 32 },
    { raceNum: 6, homeSlot: 2, awaySlot: 3 },
    { raceNum: 7, homeSlot: 4, awaySlot: 1 },
    { raceNum: 8, homeSlot: 22, awaySlot: 23 },
    { raceNum: 9, homeSlot: 24, awaySlot: 21 },
    { raceNum: 10, homeSlot: 32, awaySlot: 33 },
    { raceNum: 11, homeSlot: 1, awaySlot: 3 },
    { raceNum: 12, homeSlot: 2, awaySlot: 4 },
    { raceNum: 13, homeSlot: 21, awaySlot: 23 },
    { raceNum: 14, homeSlot: 22, awaySlot: 24 },
    { raceNum: 15, homeSlot: 33, awaySlot: 31 },
  ],
  roundTwoGroups: [
    {
      groupNum: 'I',
      seedingEntries: [
        { positionCode: 'A1', letter: 'A', label: 'Winner A' },
        { positionCode: 'B2', letter: 'B', label: 'Runner Up B' },
        { positionCode: 'C1', letter: 'C', label: 'Winner C' },
        { positionCode: 'A3', letter: 'D', label: 'Runner Up D' },
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
        { positionCode: 'B3', letter: 'H', label: 'Winner D' },
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
        { positionCode: 'A4', letter: 'I', label: 'Loser A' },
        { positionCode: 'B4', letter: 'J', label: 'Loser B' },
        { positionCode: 'C3', letter: 'K', label: 'Loser C' },
      ],
      races: [
        { raceNum: 1, homeLetter: 'I', awayLetter: 'J' },
        { raceNum: 2, homeLetter: 'J', awayLetter: 'K' },
        { raceNum: 3, homeLetter: 'K', awayLetter: 'I' },
      ],
    },
  ],
  finals: [
    { label: '7th/8th', homeRef: 'Loser Group I', awayRef: 'Loser Group II' },
    { label: '5th/6th', homeRef: 'Third Group I', awayRef: 'Third Group II' },
    { label: '3rd/4th', homeRef: 'Second Group I', awayRef: 'Second Group II' },
    { label: '1st/2nd', homeRef: 'Winner Group I', awayRef: 'Winner Group II' },
  ],
  roundOneRaceCount: 15,
  roundTwoRaceCount: 15,
};
