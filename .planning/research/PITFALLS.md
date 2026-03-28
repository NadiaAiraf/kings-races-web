# Pitfalls Research

**Domain:** Mobile-first race management (parallel slalom ski racing, slope-side use)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Safari/iOS localStorage Eviction Destroys Event Data Mid-Competition

**What goes wrong:**
Safari on iOS can evict localStorage and IndexedDB data after as little as 7 days of inactivity, or when the user clears Safari history (which also purges PWA caches). On iOS 17+, IndexedDB connections can drop entirely, wiping localStorage in the process. An official who sets up teams on Friday could arrive Saturday to find all data gone. Worse, if the phone's memory is under pressure during an event (common with photos, other apps), the browser may evict data mid-session.

**Why it happens:**
Apple's WebKit enforces aggressive storage policies. Script-writable storage (localStorage, IndexedDB, Cache API) is capped at approximately 50MB per origin and is subject to eviction if the PWA/site has not been visited recently. This is not a bug -- it is documented WebKit policy. Developers building "client-side only" apps often discover this only in production.

**How to avoid:**
- Call `navigator.storage.persist()` on first load and prompt the user to grant permission -- this significantly reduces eviction risk
- Save after every single user action (every result entry, every team addition) -- not on page unload or at intervals
- Provide a one-tap "Export Event Backup" as JSON that the official can share/save before leaving the slope
- Display a clear "data loaded from storage" indicator on app open so officials immediately know if data is missing
- Consider IndexedDB as primary storage (async, higher quota) with localStorage as a fast fallback for critical state

**Warning signs:**
- Testing only on Chrome desktop where localStorage is never evicted
- No backup/export feature in the first build
- No "data health check" on app startup
- Assuming 5MB localStorage limit is plenty without checking IndexedDB quotas

**Phase to address:**
Phase 1 (data layer foundation). The storage strategy must be right from day one -- retrofitting persistence into a localStorage-dependent app is painful. Export/import backup should ship in the same phase as data entry.

---

### Pitfall 2: Cheat Sheet Race Order Mismatch -- Off-by-One or Wrong Sequence

**What goes wrong:**
The app generates a race order that differs from the existing spreadsheet cheat sheets. Even one swapped matchup means officials cannot cross-reference with their paper backup, trust breaks down immediately, and the app gets abandoned mid-event. With 29 different cheat sheets (4 through 32 teams), any algorithmic generation approach will inevitably diverge from the original hand-tuned sequences.

**Why it happens:**
Developers try to generate round-robin schedules algorithmically (circle method, balanced scheduling, etc.) instead of encoding the exact pre-computed sequences. The spreadsheet cheat sheets may not follow any standard algorithm -- they were likely hand-crafted or adjusted for operational constraints (e.g., ensuring a team does not race back-to-back, or specific lane alternation patterns). An algorithm that produces a "correct" round-robin will not produce the "right" round-robin.

**How to avoid:**
- Hard-code every cheat sheet as a static lookup table, exactly as it appears in the spreadsheet -- do NOT generate them algorithmically
- Extract every cheat sheet from the spreadsheet (all 29 team counts: 4-32) and encode them as structured data (array of matchup pairs in order)
- Write an automated test for each team count that asserts the exact matchup sequence matches the spreadsheet
- Have the race official verify at least 3 team counts (small, medium, large) against the paper cheat sheets before the first event

**Warning signs:**
- Any code that "calculates" race order rather than looking it up
- No test comparing output to the original spreadsheet
- Cheat sheet data entered by hand without verification tooling
- Assuming the circle method or any standard algorithm matches the existing sheets

**Phase to address:**
Phase 1 (core data model). This is the single highest-risk item. The cheat sheets are the contract between the app and the officials' trust. They must be encoded and verified before any UI work on race display.

---

### Pitfall 3: Accidental Result Entry or Navigation Destroys Scoring State

**What goes wrong:**
An official wearing gloves on a cold slope accidentally taps the wrong team's result (Win instead of Loss), navigates backward losing unsaved state, or double-taps a button that fires twice. With standard touch targets (the WCAG AA minimum is only 24x24 CSS pixels), gloved fingers hit the wrong element frequently. The official does not notice during a fast-paced race and the error propagates through group standings and finals seeding.

**Why it happens:**
Touch targets designed for bare-finger indoor use are unusable with gloves. Touchscreen gloves have imprecise conductive fingertips. Standard mobile UI patterns (swipe-to-go-back, small buttons, no undo) are hostile to the slope-side environment. Developers test indoors with bare hands and never simulate the actual use conditions.

**How to avoid:**
- Minimum touch targets of 48x48dp (Android Material) or larger -- for gloved use, aim for 56-64px minimum with generous spacing between targets
- Every result entry must be reversible with a single tap (undo/change, not a confirmation dialog that adds more small targets)
- Disable browser swipe-to-navigate gestures via CSS `overscroll-behavior: none` and `touch-action` properties
- Use high-contrast, large visual feedback (the entire row changes color on result entry, not a small checkbox)
- Save to storage on every interaction so back-button/refresh never loses data
- Add a "confirm results" step before finalizing a group, allowing review and correction of all results at once

**Warning signs:**
- Touch targets under 48px
- No undo mechanism for result entry
- Testing only on desktop or with bare hands
- No visual distinction between "result entered" and "result not yet entered"
- Swipe gestures not disabled

**Phase to address:**
Phase 2 (result entry UI). The interaction design for result recording is the most critical UX surface. It must be designed for gloves and cold from the start, not patched later.

---

### Pitfall 4: Tiebreaker Logic Not Defined or Inconsistent with Existing Rules

**What goes wrong:**
Two or more teams finish the group stage with identical points. The app either crashes, shows them in arbitrary order, or uses a tiebreaker method that differs from what the officials expect. In round-robin formats, ties are extremely common (e.g., the "circle of death" where A beats B, B beats C, C beats A -- all finish with identical records). This directly affects who advances to finals and in which seeding position.

**Why it happens:**
Developers implement points accumulation but defer tiebreaker logic as an edge case. In practice, ties happen in most events. The existing spreadsheet likely has implicit tiebreaker rules that officials apply mentally or that are embedded in obscure formula logic. Without explicit documentation of the tiebreaker hierarchy, the app will guess wrong.

**How to avoid:**
- Interview the race official to document the exact tiebreaker hierarchy BEFORE writing any standings logic (e.g., head-to-head result, then point differential, then coin flip/race-off)
- Implement tiebreakers as a composable chain of comparator functions, not ad-hoc conditionals
- Display the tiebreaker reason in the standings UI ("Team A ranked above Team B on head-to-head")
- Write explicit tests for every tiebreaker scenario: 2-way tie, 3-way circular tie, all teams tied
- Include a manual override for the official to break ties that the algorithm cannot resolve

**Warning signs:**
- Standings sort only by total points with no secondary criteria
- No test cases with tied teams
- Tiebreaker rules not documented anywhere in the codebase
- No manual override escape hatch

**Phase to address:**
Phase 1 (scoring engine) for the logic, Phase 2 (standings UI) for display. The tiebreaker rules must be captured during requirements gathering and encoded in the scoring engine before standings display is built.

---

### Pitfall 5: Browser Tab Killed by OS Memory Management During Event

**What goes wrong:**
The official switches to their camera app to photograph a crash, checks a text message, or the phone locks during a break. When they return to the browser, the tab has been killed and reloaded by iOS/Android memory management. If the app relies on in-memory state (React state, JavaScript variables) rather than persistent storage, all unsaved progress is lost. The official is mid-event with 50+ results recorded and suddenly sees a blank app.

**Why it happens:**
Mobile operating systems aggressively reclaim memory from background browser tabs. Safari on iOS is particularly aggressive -- a single tab switch can trigger a full page reload. Developers who test in desktop browsers or in the foreground never encounter this. SPAs that hold state in memory and only persist "on save" or "on unmount" lose everything.

**How to avoid:**
- Treat localStorage/IndexedDB as the source of truth, not React/app state -- the app should be able to fully reconstruct its view from storage at any moment
- Save to storage synchronously on every state change, not on debounce timers
- On page load, always hydrate from storage first, then render -- the "cold start" path IS the normal path
- Use the `visibilitychange` event as an additional save trigger, but never as the only save trigger
- Test by force-killing the browser tab after every major interaction and verifying full recovery

**Warning signs:**
- App state lives in React useState/useReducer without mirroring to storage
- "Save" button exists (implies data can be unsaved)
- No hydration-from-storage logic on mount
- App shows empty/default state on refresh instead of last known state

**Phase to address:**
Phase 1 (data layer). The storage-first architecture pattern must be established from the very first feature. Every subsequent feature inherits this pattern.

---

### Pitfall 6: Sunlight Readability and Screen Contrast Failures

**What goes wrong:**
The app is unusable in direct sunlight or bright overcast conditions on a ski slope. Light gray text, low-contrast status indicators, thin fonts, and subtle color differences between "entered" and "not entered" states disappear. The official cannot tell which races have been scored, cannot read team names, and makes errors or gives up.

**Why it happens:**
Developers design and test in indoor lighting with high-quality monitors. Standard design frameworks (Material, Tailwind defaults) use subtle grays and low-contrast secondary text that look elegant indoors but vanish outdoors. Color-only status indicators (green for win, red for loss) fail for colorblind users AND in washed-out sunlight conditions.

**How to avoid:**
- Use WCAG AAA contrast ratios (7:1) as the minimum, not AA (4.5:1) -- outdoor use demands higher contrast than standard accessibility
- Black text on white backgrounds for all critical information (team names, scores, race order)
- Status indicators must use shape/icon AND color AND text (checkmark + green + "WIN", not just a green dot)
- Large font sizes: 16px absolute minimum for body text, 20px+ for scores and team names
- Test by setting phone brightness to maximum and going outside on a bright day -- if you squint, it fails
- Avoid dark mode as the default -- bright screens are more readable in sunlight

**Warning signs:**
- Any text with contrast ratio below 7:1
- Status conveyed by color alone
- Body font size below 16px
- Dark theme as default or only option
- Never tested outdoors

**Phase to address:**
Phase 2 (UI implementation). The design system/tokens should be established with outdoor readability as a core constraint, not as an afterthought accessibility pass.

---

### Pitfall 7: Group-to-Finals Transition Logic Errors

**What goes wrong:**
The app incorrectly seeds teams into finals brackets. Teams are placed in wrong positions, placement matches are generated incorrectly (e.g., 1st plays 2nd instead of the expected 1st-vs-2nd final with 3rd-vs-4th consolation), or the finals bracket does not match the expected structure for the number of qualifying teams. Officials lose confidence and revert to the spreadsheet.

**Why it happens:**
The group-to-finals transition is the most complex logic in the app. It depends on correct tiebreaker resolution, correct seeding order, and a finals bracket structure that may vary by team count. Developers often focus on the group stage (the bulk of the races) and treat finals as a simple extension, but finals have their own ordering rules, placement match structures, and edge cases (byes, odd numbers of qualifying teams).

**How to avoid:**
- Document the exact finals bracket structure for every team count scenario from the existing spreadsheet
- Encode finals bracket templates as static data (like the cheat sheets), not generated algorithmically
- The group-to-finals transition should be a single, testable function: takes group standings, returns seeded finals bracket
- Write end-to-end tests: enter known results, verify final standings match what the spreadsheet would produce
- Allow manual seeding override in case the algorithm gets it wrong -- an escape hatch is essential for v1

**Warning signs:**
- Finals bracket logic implemented without reference to the existing spreadsheet structure
- No end-to-end test from team entry through to final standings
- Assumption that finals structure is the same regardless of team count
- No manual override for seeding

**Phase to address:**
Phase 3 (finals bracket). This should be its own phase, not bundled with group stage, because the logic is distinct and the testing requirements are different.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing all state in localStorage as one big JSON blob | Simple to implement, easy to debug | Cannot query, slow for large events, risk of corruption if write fails mid-serialize | MVP only -- migrate to structured IndexedDB by v2 |
| Hard-coding cheat sheets as JS arrays | Fast, correct, no generation bugs | 29 arrays in source code, tedious to update if rules change | Always acceptable -- correctness trumps elegance for static reference data |
| No automated tests for scoring engine | Ship faster | Scoring bugs discovered during live events destroy trust | Never acceptable -- scoring engine must have tests from day one |
| Single-page app with all disciplines in one view | Simple routing, fewer navigation bugs | UI becomes cluttered with 3 disciplines | Acceptable for v1 with tab-based discipline switching |
| No data migration strategy for localStorage schema changes | Ship v1 faster | Any schema change in v2 breaks existing saved events | Acceptable for v1 IF you version-stamp stored data from the start |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recalculating all standings on every result entry | UI lag after entering a result, noticeable on older phones | Incremental update: only recalculate the affected group's standings | With 32 teams and 100+ matchups, recalc-all becomes noticeable on budget phones |
| Serializing entire event state to localStorage on every change | Jank/freeze after tap, dropped inputs | Only write the changed entity (one result, one team) or use IndexedDB with granular keys | Event state exceeds ~100KB of JSON |
| Rendering all races in a single scrollable list | Scroll lag, slow initial paint | Virtualize the list or paginate by group/round -- only render the current group's races | 100+ race rows with result indicators |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No data export/backup mechanism | Single phone failure = entire event lost, no recovery | Ship export-to-JSON and import-from-JSON in v1, before the first live event |
| Storing event data only in one browser on one device | Phone dies, gets dropped in snow, battery dies in cold | Provide shareable backup (copy JSON to clipboard, share via OS share sheet) |
| No schema versioning in stored data | Future updates corrupt or silently drop old event data | Add a `version` field to all stored data from day one, write migration functions |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring text input for team names on slope | Typing with gloves is nearly impossible, errors and frustration | Pre-populate university list for autocomplete/selection, allow free text as fallback |
| Multi-step wizard for result entry (select race, select winner, confirm) | Too many taps per result, slows down event pacing | Single-screen: show the matchup, tap the winning team name once to record, show undo |
| Small "Submit" / "Next" buttons at bottom of scroll | Gloved finger misses, accidental taps on adjacent elements | Full-width action buttons, minimum 56px height, sticky at bottom of viewport |
| No indication of progress through the race list | Official loses track of which race is next, scrolls up and down | Auto-scroll to next unscored race, highlight it prominently, show "Race 14 of 56" counter |
| Confirmation dialogs for routine actions | Extra tap for every result, dialog buttons are small | Use undo pattern instead -- record immediately, show undo toast for 5 seconds |
| No visual distinction between disciplines | Official enters result in wrong discipline | Color-coded headers/borders per discipline (Mixed/Board/Ladies), always visible |

## "Looks Done But Isn't" Checklist

- [ ] **Race order display:** Looks correct for 8 teams but verify ALL team counts (4-32) -- edge cases at 4, 5, and 32 teams are where bugs hide
- [ ] **Standings table:** Shows correct points but does not handle tiebreakers -- test with tied teams
- [ ] **Finals bracket:** Works for even numbers but breaks with odd qualifying team counts or byes
- [ ] **Data persistence:** Works in testing but not verified after tab kill, phone restart, or 7-day gap on Safari
- [ ] **Result entry:** Works with bare fingers but not tested with gloves in cold conditions
- [ ] **Export:** Generates a file but the file cannot be re-imported to restore an event
- [ ] **Responsive layout:** Looks good on iPhone 15 but breaks on iPhone SE (small screen) or older Android devices
- [ ] **Multiple disciplines:** Each discipline works in isolation but switching between them during an event causes state confusion or displays wrong discipline's data
- [ ] **Screen readability:** Passes WCAG AA contrast checks indoors but unreadable in outdoor sunlight

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Data loss from storage eviction | HIGH | If no backup exists, re-enter all data manually. Prevention (export feature) is the only real mitigation. |
| Wrong race order discovered mid-event | HIGH | Cannot fix mid-event without restarting. Must have verified cheat sheets before first use. |
| Scoring error from mis-tap | LOW | If undo exists, tap undo. If not, find the matchup in the race list and change the result. Standings should auto-recalculate. |
| Tiebreaker produces wrong seeding | MEDIUM | Manual override of seeding allows the official to correct. Without override, must recalculate manually off-app. |
| Browser tab killed, data lost | LOW-HIGH | If storage-first architecture: LOW (reload recovers everything). If in-memory state: HIGH (all unsaved work lost). |
| Phone dies in cold weather | MEDIUM | Battery death is common in cold. If backup was exported, load on another phone. If not, event data is lost until phone charges. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Safari storage eviction | Phase 1 (data layer) | Test: kill tab, restart phone, wait 7 days, verify data survives |
| Cheat sheet mismatch | Phase 1 (data model) | Automated tests comparing every team count (4-32) against spreadsheet |
| Accidental tap / glove usability | Phase 2 (result entry UI) | Physical test: enter 10 results wearing ski gloves outdoors |
| Tiebreaker logic errors | Phase 1 (scoring) + Phase 2 (standings UI) | Test suite with all tie scenarios, official review of tiebreaker rules |
| Tab killed / memory management | Phase 1 (data layer) | Test: enter data, switch to camera, return -- verify no data loss |
| Sunlight readability | Phase 2 (UI design system) | Outdoor test on a bright day, verify all text/status readable |
| Group-to-finals transition | Phase 3 (finals bracket) | End-to-end test: known results in, verify correct final standings out |
| Phone battery death | Phase 1 (export/backup) | Test: export, open on different device, verify full event restore |

## Sources

- [Updates to Storage Policy - WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/) -- official Safari storage eviction policy
- [PWA iOS Limitations and Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) -- comprehensive iOS PWA limitations
- [Apple Developer Forums - localStorage in iOS 13 resetting](https://developer.apple.com/forums/thread/125041) -- localStorage eviction reports
- [Apple Developer Forums - Safari iOS PWA Data Persistence](https://developer.apple.com/forums/thread/710157) -- PWA data persistence issues
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- browser storage quota documentation
- [WCAG 2.5.8 Target Size Minimum](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide) -- touch target size guidelines
- [Smashing Magazine - Accessible Target Sizes](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) -- practical touch target guidance
- [Baymard - Handling Accidental Taps on Touch Devices](https://baymard.com/blog/handling-accidental-taps-on-touch-devices) -- accidental tap prevention strategies
- [Round-Robin Tournament System - MTG Old Frame](https://mtgoldframe.com/the-round-robin-tournament-system-rules-scoring-and-tiebreakers/) -- tiebreaker rules and circular ties
- [How To Run a Round Robin Tournament - Waresport](https://www.waresport.com/blog/how-to-run-a-round-robin-tournament) -- common tournament management mistakes
- [RxDB - Downsides of Offline First](https://rxdb.info/downsides-of-offline-first.html) -- offline-first architecture pitfalls

---
*Pitfalls research for: mobile-first race management (parallel slalom ski racing)*
*Researched: 2026-03-28*
