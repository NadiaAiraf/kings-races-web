# Domain Pitfalls: Cheat Sheet Accuracy Fixes

**Domain:** Tournament seeding data modification in a live system with 380+ tests
**Researched:** 2026-03-30
**Confidence:** HIGH (based on direct codebase analysis + domain knowledge)

## Critical Pitfalls

### Pitfall 1: Changing Group `teamSlots` Breaks Existing localStorage Data

**What goes wrong:**
The current cheat sheet files define groups with specific `teamSlots` arrays (e.g., Group A: `[1, 2, 3, 4]`, Group B: `[11, 12, 13, 14]`). If fixing the serpentine seeding pattern requires reassigning which slot numbers belong to which groups, any user with an in-progress event in localStorage will have scores keyed to the OLD slot numbers. Their `scores` array contains `Score` objects with `homeSlot` and `awaySlot` referencing the old mapping. After the code update, the app looks up races using the NEW slot assignments, but the stored scores reference the old ones. Result: scores silently "disappear" from standings because the slot numbers no longer match any group. The event appears to have no results, mid-competition.

**Why it happens:**
The Zustand persist store (version 1, key `kings-races-event`) serializes `disciplines[].scores[]` with literal slot numbers. The `TournamentStructure` is static code, not stored data. When the code changes but the stored data does not, slot numbers become orphaned. The current `migrate` function is a no-op (`return persistedState as EventStoreState`).

**Consequences:**
- In-progress events silently lose all scored results (scores exist but match no group)
- `calculateGroupStandings` returns 0 points for all teams (no matching scores)
- R2 seeding resolves to wrong teams or nulls
- Official sees blank standings mid-event, loses trust permanently

**Prevention:**
1. **Bump `STORAGE_VERSION` to 2** and write a real migration in `eventStore.ts` that maps old slot numbers to new slot numbers for every score in every discipline
2. **If slot numbering changes are unnecessary, do not change them.** The seeding fix may only need to reorder which teams go into which groups (changing `GroupDefinition.teamSlots` order) without changing the slot numbers themselves. Prefer this approach.
3. **If slot numbers MUST change:** create a mapping table `oldSlot -> newSlot` per team count, and apply it in the migration function to all `Score.homeSlot`, `Score.awaySlot`, `Team.slot`, and `manualTiebreaks` values
4. **Test the migration** with a snapshot of real localStorage data from v1.0/v1.1 events
5. **Add a "data version mismatch" warning** in the UI if the user's stored version does not match expected

**Detection:**
- Any diff that changes numbers inside `teamSlots` arrays without a corresponding store migration
- Any diff that changes `roundOneRaces` slot numbers without migration
- Test that loads a v1 localStorage snapshot and verifies scores still resolve correctly after the code change

---

### Pitfall 2: Serpentine Seeding Misread from xlsx -- `data_only` vs Formula Mode in openpyxl

**What goes wrong:**
The xlsx master spreadsheet likely uses formulas to compute group assignments (serpentine draft: team 1 -> Group A, team 2 -> Group B, ..., team N -> Group B, team N+1 -> Group A, etc.). When extracting data with openpyxl, there are two modes:
- `data_only=True`: Returns the last-cached cell values (what Excel stored on last save). These are correct IF the file was last saved with all formulas evaluated.
- `data_only=False` (default): Returns formula strings like `=IF(MOD(ROW(),2)=0,...)`, not values.

If the xlsx was saved by a tool that does not evaluate formulas (Google Sheets export, LibreOffice, programmatic save), `data_only=True` returns `None` for formula cells. The extractor silently produces `null` or `0` for group assignments, and the developer fills in guessed values or skips teams.

**Why it happens:**
openpyxl cannot evaluate Excel formulas. It can only read cached results that Excel stored on the last manual save. Many xlsx files circulated between users have stale or missing cached values. This is the single most common source of "the data I extracted doesn't match what I see in Excel" bugs.

**Consequences:**
- Group assignments extracted as `None`/`0` instead of actual team slots
- Seeding maps silently wrong for some team counts but correct for others (whichever were manually saved last)
- Bugs only discovered when an official runs a specific team count that was not manually verified

**Prevention:**
1. **Open the xlsx in Excel (not LibreOffice/Google Sheets) and Ctrl+Shift+F9 (recalculate all) then Save** before running any extraction script
2. **Validate every extracted value against a known-good manual reading** for at least 5 team counts: 4 (minimum), 7 (R2 boundary), 12 (4 groups of 3), 16 (4 groups of 4), 32 (maximum)
3. **If using openpyxl programmatically:** cross-check `data_only=True` output against `data_only=False` output. If any formula cell returns `None` in data_only mode, the cached value is missing.
4. **Consider using `xlcalc` or `formulas` Python packages** to actually evaluate Excel formulas, or export from Excel to CSV first
5. **Write a verification script** that compares extracted seeding against the serpentine pattern mathematically: for N teams in G groups, team `i` goes to group `(i-1) % G` on odd passes and `G - 1 - ((i-1) % G)` on even passes

**Detection:**
- Any team count where group sizes do not sum to the total team count
- Any team count where a group contains slots that overlap with another group
- Extracted group with all-zero or all-null team slots

---

### Pitfall 3: R2 Seeding Order Depends on R1 Group Structure -- Changing One Breaks the Other

**What goes wrong:**
The R2 `seedingEntries` contain labels like `"Winner A"`, `"Runner Up B"`, `"Third C"` that reference R1 group letters. The `parseSeedingLabel` function in `r2Seeding.ts` extracts the group letter and position, then looks up the team from R1 standings by group letter. If the seeding fix changes which R1 group a team is in (e.g., moves team 5 from Group A to Group B), then all R2 seeding labels that reference Group A or B potentially resolve to different teams. But the R2 race ORDER (which matchups happen) also needs to change because the xlsx has different R2 races for different group compositions.

The trap: a developer fixes the R1 group assignments to match the xlsx serpentine draft, runs the R1 tests (they pass), but forgets to also update the R2 `seedingEntries` and `roundTwoGroups[].races` to match the xlsx's R2 sheet. R1 looks correct, R2 silently uses the wrong matchup order.

**Why it happens:**
R1 and R2 data are stored in the same `TournamentStructure` object but serve different purposes. R1 group structure determines who races whom. R2 seeding references R1 results. If you change R1 groups without also verifying R2, the data is internally inconsistent. The existing structural integrity tests (in `cheatSheets.test.ts`) verify that R1 races reference valid slots and race counts match, but do NOT verify that R2 seeding labels reference valid R1 group letters.

**Consequences:**
- R2 groups seeded with wrong teams (e.g., "Winner A" resolves correctly, but "Runner Up B" is the runner up of the WRONG group B because groups were reshuffled)
- Finals matchups between wrong teams
- Results look plausible but are subtly wrong -- the hardest kind of bug to catch

**Prevention:**
1. **Always update R1 groups and R2 seeding as an atomic unit** per team count. Never commit a cheat sheet with changed R1 groups but unchanged R2 data.
2. **Add a structural test:** for every team count with R2, verify that every group letter referenced in R2 `seedingEntries` labels actually exists as an R1 group letter. The test in `cheatSheets.test.ts` does not currently do this.
3. **Add a cross-reference test:** for each R2 group, verify that the seeding entry labels reference distinct R1 groups (no duplicate group references where the xlsx expects them to be distinct).
4. **Verify R2 data directly from the xlsx** rather than assuming it stays the same when R1 changes.

**Detection:**
- Diff that modifies `groups` array without also modifying `roundTwoGroups`
- R2 seeding label references a group letter (e.g., "Winner F") where group F does not exist in the R1 `groups` array
- Test: resolve all R2 seeding entries with mock R1 standings and verify no `null` returns

---

### Pitfall 4: Off-by-One in Serpentine Seed Numbering (0-indexed vs 1-indexed)

**What goes wrong:**
The xlsx serpentine draft assigns teams to groups using 1-indexed team numbers (Team 1, Team 2, ... Team N). The code uses 1-indexed slot numbers (slot 1, 2, 3, ...). But the serpentine PATTERN calculation uses modular arithmetic that naturally produces 0-indexed results. A developer writes the serpentine logic as `groupIndex = (teamIndex) % numGroups` (0-indexed) and the reverse pass as `groupIndex = numGroups - 1 - (teamIndex % numGroups)`, but forgets to adjust for 1-indexed team slots. Result: Team 1 goes to the wrong group, or the last team in each pass is assigned to the wrong group.

**Why it happens:**
The slot numbering scheme in this codebase is non-sequential: Group A uses slots 1-4, Group B uses 11-14, Group C uses 21-24, etc. (tens digit = group index, ones digit = position within group). This makes the off-by-one less obvious because you cannot visually scan for "team 5 in group 1 instead of group 2" -- you have to trace slot 5 vs slot 11 through the group mapping. The gap-based slot numbering was designed for human readability in the xlsx (Group A is the 1s, Group B is the 11s) but makes automated verification harder.

**Consequences:**
- One team in each group is wrong (the boundary team between serpentine passes)
- For small team counts (4-6), the error might not matter (only 2 groups, serpentine reduces to simple alternation)
- For larger team counts (20+), the error cascades through R2 and finals
- Tests that only check small team counts pass; bugs hide in 17+ team counts

**Prevention:**
1. **Do not implement serpentine algorithmically for validation.** Instead, extract the EXACT group assignments from the xlsx for each team count and hard-code them, then compare against the current cheat sheet data.
2. **If algorithmic validation is needed:** write the serpentine as a pure function, test it independently with known inputs/outputs from the xlsx, THEN use it to validate the cheat sheets.
3. **Test ALL 29 team counts, not a subset.** The serpentine boundary behavior changes with team count. A test that passes for 8, 12, and 16 teams may fail for 9, 13, or 17.
4. **Specifically test the boundary teams:** the last team in each serpentine pass (e.g., for 4 groups: teams 4, 5, 8, 9, 12, 13...) are where off-by-one errors manifest.

**Detection:**
- Any team count where group sizes are unbalanced differently than expected (e.g., xlsx says groups of [4,3,3,3] but code has [3,4,3,3])
- A team slot appearing in two groups (impossible by design, but a symptom of wrong assignment)
- The existing test `all R1 race slots are valid group member slots` catches some cases but not seeding order errors

---

## Moderate Pitfalls

### Pitfall 5: Test Fixture Hardcoding Creates False Confidence

**What goes wrong:**
The existing 380+ tests include hardcoded expected values derived from the CURRENT (potentially wrong) cheat sheet data. When fixing the cheat sheets to match the xlsx, the developer updates the cheat sheet data files AND the test expected values simultaneously. The tests pass, but only because the expected values were changed to match the new code, not because the new code was verified against the xlsx. The tests prove internal consistency, not correctness against the source of truth.

**Why it happens:**
Tests like `expect(resolved).toEqual({ A: 1, B: 11, C: 2, D: 12 })` in `r2Seeding.test.ts` use hardcoded slot numbers that are correct only if the cheat sheet data is correct. If the cheat sheet for 8 teams is wrong, these expected values are also wrong. Fixing the cheat sheet AND the test expectation simultaneously creates a "chasing your own tail" pattern where both are wrong in the same way.

**Prevention:**
1. **Ground truth tests must come from the xlsx, not from the code.** Before changing any cheat sheet, extract the expected group assignments, R1 races, R2 seeding, and finals from the xlsx into a separate "golden data" file or test fixture. Then assert the code matches that golden data.
2. **Never update cheat sheet data and test expected values in the same commit** without first establishing the expected values from the xlsx independently.
3. **Create a separate "xlsx verification" test file** that imports the golden data and compares it against `getCheatSheet(n)` for every team count. This test should be written BEFORE any cheat sheet modifications.
4. **Mark tests that use hardcoded expectations with a comment** indicating the source: `// Expected values from xlsx sheet "8 Teams", cells B3:E6`

**Detection:**
- PR where cheat sheet `.ts` files and test `.test.ts` files both change expected values simultaneously with no independent verification source
- No "golden data" file or xlsx-derived fixture in the test suite
- Test descriptions that say "resolves correctly" without specifying what "correctly" means

---

### Pitfall 6: Partial Cheat Sheet Updates Leave Inconsistent State Across Team Counts

**What goes wrong:**
The developer fixes seeding for team counts 8-16 (the most common cases), verifies those team counts manually, and ships. Team counts 17-32 still have the old (wrong) seeding. Or worse: the developer fixes the R1 groups for all 29 team counts but only fixes R2 for the team counts they tested manually. The app works correctly for 8-team events but produces wrong R2 matchups for 25-team events. This is not caught until an actual event with 25 teams.

**Why it happens:**
29 team counts is tedious. Each has its own file (`teams4.ts` through `teams32.ts`). It is psychologically tempting to fix the "important" ones and defer the rest. The xlsx may have different sheet layouts for different team counts, making extraction non-uniform. Some team counts (e.g., 25-32 with 8 groups) have much more complex R2 structures than others (4-6 with no R2 at all).

**Prevention:**
1. **Treat all 29 team counts as a single atomic change.** Either all are correct or none are shipped.
2. **Automate the extraction** from xlsx to TypeScript for all team counts. A Python script that reads the xlsx and generates all 29 `teams*.ts` files ensures consistency.
3. **The existing parameterized test** in `cheatSheets.test.ts` (which loops `for (let n = 4; n <= 32; n++)`) is good -- make sure it covers the NEW structural constraints (serpentine seeding verification, R2 group letter cross-references).
4. **Create a checklist:** for each team count, mark off R1 groups verified, R1 races verified, R2 seeding verified, R2 races verified, finals verified. All cells must be checked.

**Detection:**
- `git diff` shows changes to `teams8.ts` through `teams16.ts` but not `teams17.ts` through `teams32.ts`
- Some team counts pass the new seeding tests while others fail
- Missing R2 data for team counts that should have it (7+)

---

### Pitfall 7: Race Number Renumbering Breaks Score `raceId` References

**What goes wrong:**
If fixing the R2 race order requires changing `raceNum` values in `roundTwoGroups[].races`, then existing scores stored with raceIds like `r2-I-3` (meaning R2, Group I, Race 3) no longer match. The score exists in localStorage but the race it refers to has been renumbered. Similar to Pitfall 1 but specifically for R2 race IDs.

**Why it happens:**
The `raceId` format is `r2-{groupNum}-{raceNum}` (visible in `areAllR2RacesScored`). If the xlsx shows a different race order for R2 (different matchup sequence), changing the `raceNum` on each `RoundTwoRace` changes the raceId. Stored scores become orphaned.

**Prevention:**
1. **Check if the R2 race ORDER (which matchups happen in which sequence) actually needs to change**, or only the R2 SEEDING (which teams are assigned to which R2 groups). Often only the seeding is wrong, not the race schedule within R2 groups.
2. **If race numbers must change:** include this in the storage migration (Pitfall 1). Map old `r2-{group}-{oldNum}` to `r2-{group}-{newNum}`.
3. **Prefer keeping race numbers stable** even if the matchup content changes. If Race 1 in R2 Group I used to be A vs B and now it is A vs C, the raceNum stays 1 -- only the team slot resolution changes via the seeding entries.

**Detection:**
- Diff that changes `raceNum` values in `roundTwoGroups[].races`
- After update, `areAllR2RacesScored` returns false for previously-scored events

---

### Pitfall 8: The `positionCode` Field Is Vestigial and Misleading

**What goes wrong:**
The `RoundTwoSeeding` type has a `positionCode` field (e.g., `'A1'`, `'B2'`). Some cheat sheets populate it (e.g., `teams8.ts` has `positionCode: 'A1'`), while others leave it empty (e.g., `teams24.ts` has `positionCode: ''`). A developer modifying seeding data might try to make `positionCode` consistent or use it as the source of truth for seeding logic. But the actual seeding resolution uses `label` (parsed by `parseSeedingLabel`), not `positionCode`. Changing `positionCode` does nothing functionally but creates a false sense of having fixed something.

**Why it happens:**
`positionCode` was likely part of the original data extraction from xlsx but is not used by any runtime code. It exists in the type definition and the data files but is dead weight. Developers unfamiliar with the codebase will assume it matters.

**Prevention:**
1. **Ignore `positionCode` during the seeding fix.** It is not used by `parseSeedingLabel` or any other runtime function.
2. **Document in the type definition** that `positionCode` is informational only and not used for seeding resolution.
3. **Optionally remove it** from the type and all data files to eliminate confusion, but only as a separate cleanup commit.

**Detection:**
- PR review comment: "Did you update `positionCode` too?" -- the answer should be "it doesn't matter, `label` drives the logic"

---

## Minor Pitfalls

### Pitfall 9: Inconsistent Casing in xlsx Labels

**What goes wrong:**
The xlsx contains label strings with inconsistent casing: `"Winner f"` (lowercase group letter in teams24), `"Runner up B"` (lowercase "up" in teams24), `"3rd  A"` (double space in teams25). The `parseSeedingLabel` function already handles these with normalization (`.replace(/\s+/g, ' ')` and `.toUpperCase()`). But when extracting NEW data from the xlsx, a developer might "clean up" the labels to be consistent (e.g., always `"Winner F"` instead of `"Winner f"`), which is fine -- OR might introduce new inconsistencies that `parseSeedingLabel` does not handle (e.g., `"1st A"` instead of `"Winner A"` -- currently not in the switch statement).

**Prevention:**
1. **Extract labels EXACTLY as they appear in the xlsx**, including casing quirks. The parser already handles known variations.
2. **If adding new label patterns** (e.g., `"1st"`, `"4th"`, `"5th"`), add them to the `parseSeedingLabel` switch statement AND add test cases.
3. **Run the full test suite after extraction** -- the existing label-parsing tests cover the known anomalies.

**Detection:**
- New label pattern that does not match any case in `parseSeedingLabel` -- `resolveR2TeamSlot` returns `null`
- R2 group has fewer resolved teams than expected

---

### Pitfall 10: Finals `homeRef`/`awayRef` Strings Not Updated After R2 Structure Change

**What goes wrong:**
Finals matchups reference R2 group standings with strings like `"Winner Group I"`, `"Second Group II"`. The `resolveFinalsRef` function in `finalsSeeding.ts` parses these. If the R2 fix changes the number of R2 groups or their numbering (e.g., adding Group V for a team count that previously only had Groups I-IV), the finals refs must also be updated. The teams7 anomaly (`"Winner I"` without "Group") shows that these strings are already fragile.

**Prevention:**
1. **Extract finals data from the xlsx at the same time as R2 data** -- do not assume finals remain unchanged.
2. **Add a structural test:** for every team count, verify that every `homeRef` and `awayRef` in `finals[]` can be resolved by `resolveFinalsRef` against mock R2 standings containing all the expected group numbers.
3. **The `parsePositionWord` function** supports: winner, 2nd/second/runner up, 3rd/third, 4th, 5th, loser/last. If the xlsx uses other terms for larger team counts (e.g., "6th"), add them.

**Detection:**
- `resolveFinalsRef` returning `null` for a finals matchup in a team count that previously worked
- Finals matchup referencing a group number that does not exist in `roundTwoGroups`

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| xlsx data extraction | Pitfall 2 (formula caching), Pitfall 9 (casing) | Open in Excel, recalculate, extract raw values. Preserve exact label strings. |
| R1 group seeding fixes | Pitfall 1 (localStorage breakage), Pitfall 4 (off-by-one) | Prefer reordering groups without changing slot numbers. Bump storage version if slots change. |
| R2 race order fixes | Pitfall 3 (R1/R2 coupling), Pitfall 7 (raceId breakage) | Update R1 and R2 atomically. Keep raceNums stable if possible. |
| Test updates | Pitfall 5 (false confidence from co-updated tests) | Establish golden data from xlsx BEFORE modifying code. Write verification tests first. |
| Shipping partial fixes | Pitfall 6 (inconsistent team counts) | All 29 team counts or nothing. Automated extraction. |
| Finals verification | Pitfall 10 (stale finals refs) | Extract and verify finals data alongside R2 data. |
| Ignoring dead fields | Pitfall 8 (positionCode confusion) | Document that positionCode is unused. Do not waste effort updating it. |

## Integration Risk Matrix

| Component Changed | Affects | Risk Level | Test Coverage |
|---|---|---|---|
| `GroupDefinition.teamSlots` | Scoring, standings, R2 seeding, localStorage data | CRITICAL | Parameterized test covers structure but NOT seeding correctness |
| `RoundTwoGroupDefinition.seedingEntries` | R2 team resolution, finals seeding | HIGH | `r2Seeding.test.ts` covers 8-team case only |
| `RoundTwoRace.raceNum` | Score raceId mapping, `areAllR2RacesScored` | HIGH | Basic coverage in `r2Seeding.test.ts` |
| `FinalsMatchup.homeRef`/`awayRef` | Finals team resolution | MEDIUM | `finalsSeeding.test.ts` covers pattern parsing |
| `RoundOneRaces` order/content | Race display, scoring UI | MEDIUM | Structural integrity test verifies slot validity |
| `positionCode` | Nothing (dead field) | NONE | No runtime dependency |

## Sources

- Direct codebase analysis of `src/domain/cheatSheets/`, `src/domain/r2Seeding.ts`, `src/domain/finalsSeeding.ts`, `src/domain/scoring.ts`, `src/store/eventStore.ts`
- openpyxl documentation on `data_only` mode: https://openpyxl.readthedocs.io/en/stable/optimised.html
- Zustand persist middleware migration docs: https://docs.pmnd.rs/zustand/integrations/persisting-store-data#version
- Existing test suite analysis: `cheatSheets.test.ts` (structural integrity), `r2Seeding.test.ts` (R2 resolution), `finalsSeeding.test.ts` (finals resolution), `eventStore.test.ts` (persistence)

---
*Pitfalls research for: cheat sheet accuracy fixes (group seeding + R2 race order)*
*Researched: 2026-03-30*
