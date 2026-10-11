/**
 * Places decided without a final, from the FINAL RESULT block of each
 * "N Teams" sheet in reference/cheat-sheets-v1.4.xlsx. A ref names a group
 * position in the same format as finals refs (see resolveFinalsRef). Team
 * counts whose finals place every team have no entry.
 *
 * Copied verbatim, including the sheet's own inconsistencies (e.g. 29-31
 * teams list "2nd Group VIII" twice for joint 27th). A ref that resolves to a
 * team already placed is skipped, leaving that place for an official.
 */
export const PLACING_REFS: Record<number, ReadonlyArray<{ place: number; ref: string }>> = {
  7: [
    { place: 5, ref: 'Winner II' },
    { place: 6, ref: 'Second II' },
    { place: 7, ref: 'Loser II' },
  ],
  9: [
    { place: 7, ref: 'Winner Group III' },
    { place: 8, ref: 'Runner Up Group III' },
    { place: 9, ref: 'Loser Group III' },
  ],
  10: [
    { place: 7, ref: 'Winner Group III' },
    { place: 8, ref: '2nd Group III' },
    { place: 9, ref: '3rd Group III' },
    { place: 10, ref: 'Loser Group III' },
  ],
  11: [
    { place: 9, ref: 'Winner Group III' },
    { place: 10, ref: 'Runner Up Group III' },
    { place: 11, ref: 'Loser Group III' },
  ],
  12: [
    { place: 9, ref: 'Winner Group III' },
    { place: 10, ref: '2nd Group III' },
    { place: 11, ref: '3rd Group III' },
    { place: 12, ref: 'Loser Group III' },
  ],
  13: [
    { place: 13, ref: 'Loser Group IV' },
  ],
  15: [
    { place: 9, ref: 'Winner Group III' },
    { place: 10, ref: 'Runner Up Group III' },
    { place: 11, ref: 'Loser Group III' },
    { place: 12, ref: 'Winner Group IV' },
    { place: 13, ref: '2nd Group IV' },
    { place: 14, ref: '3rd Group IV' },
    { place: 15, ref: 'Loser Group IV' },
  ],
  17: [
    { place: 17, ref: 'Loser Group V' },
  ],
  19: [
    { place: 19, ref: 'Loser Group VI' },
  ],
  21: [
    { place: 7, ref: 'Loser Group I' },
    { place: 14, ref: 'Loser Group III' },
    { place: 21, ref: 'Loser Group V' },
  ],
  23: [
    { place: 23, ref: 'Loser Group V' },
  ],
  25: [
    { place: 25, ref: 'Loser Group VI' },
  ],
  26: [
    { place: 25, ref: 'Winner Group VII' },
    { place: 26, ref: 'Loser Group VII' },
  ],
  27: [
    { place: 25, ref: 'Winner Group VII' },
    { place: 26, ref: 'Runner up Group VII' },
    { place: 27, ref: 'Loser Group VII' },
  ],
  28: [
    { place: 25, ref: 'Winner Group VII' },
    { place: 26, ref: '2nd Group VII' },
    { place: 27, ref: '3rd Group VII' },
    { place: 28, ref: 'Loser Group VII' },
  ],
  29: [
    { place: 25, ref: 'Winner Group VII' },
    { place: 25, ref: 'Winner Group VIII' },
    { place: 27, ref: '2nd Group VIII' },
    { place: 27, ref: '2nd Group VIII' },
    { place: 29, ref: 'Loser Group VII' },
  ],
  30: [
    { place: 25, ref: 'Winner Group VII' },
    { place: 25, ref: 'Winner Group VIII' },
    { place: 27, ref: '2nd Group VIII' },
    { place: 27, ref: '2nd Group VIII' },
    { place: 29, ref: 'Loser Group VII' },
    { place: 29, ref: 'Loser Group VIII' },
  ],
  31: [
    { place: 25, ref: 'Winner Group VII' },
    { place: 25, ref: 'Winner Group VIII' },
    { place: 27, ref: '2nd Group VIII' },
    { place: 27, ref: '2nd Group VIII' },
    { place: 29, ref: '3rd Group VII' },
    { place: 29, ref: 'Loser Group VIII' },
    { place: 31, ref: 'Loser Group VII' },
  ],
};
