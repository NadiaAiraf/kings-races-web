# Feature Landscape

**Domain:** Mobile-first race/tournament management for university ski club parallel slalom events
**Researched:** 2026-03-28

## Table Stakes

Features users expect. Missing = product feels incomplete or officials go back to the spreadsheet.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Team entry per discipline | Core setup -- officials need to register teams (Mixed, Board, Ladies) before anything else works | Low | Must support varying team counts per discipline (up to 32 Mixed, up to 17 Board/Ladies) |
| Auto-generated race order from cheat sheets | The spreadsheet does this today. Replicating exact matchup sequences (4-32 teams) is non-negotiable for official trust | Medium | Pre-computed sequences must be hardcoded/replicated exactly -- this is the core logic |
| Race list display (matchup view) | Officials need to see "Team A vs Team B" in order, at a glance, slope-side | Low | Large text, high contrast for outdoor readability |
| Result recording per matchup | Win (3pts) / Loss (1pt) / DSQ (0pts) -- the primary interaction loop during an event | Low | Must be fast: 2 taps maximum per matchup result. Gloved fingers = large touch targets |
| Live-updating group standings | Officials and spectators check standings constantly during round-robin. The spreadsheet auto-calculates this | Medium | Real-time recalculation as results are entered. Show wins, losses, DSQs, total points |
| Finals bracket generation | After group stage, placement matches (1st/2nd, 3rd/4th, etc.) are determined by standings | Medium | Auto-seed from group results. Must handle odd team counts and placement logic |
| Final results view | Officials need to see and announce final standings per discipline | Low | Clear ranking display with team names and positions |
| Three independent disciplines | Mixed, Board, Ladies run separately within one event -- officials switch between them | Low | Tab or navigation between disciplines. Each has its own state |
| Mobile-first responsive UI | This is used on a phone, slope-side, possibly in gloves. Desktop is secondary | Medium | Large touch targets (min 48px), high contrast, no tiny dropdowns. Landscape and portrait |
| Offline tolerance | Slope-side connectivity is unreliable. Data loss mid-event is catastrophic | Medium | Client-side storage (localStorage). App must not break when offline. No server dependency for v1 |
| Undo / correct a result | Mistakes happen. An official must be able to fix an incorrectly recorded result | Low | Critical for trust. Changing a result must cascade to standings recalculation |

## Differentiators

Features that set this apart from the spreadsheet and generic tournament apps. Not strictly required but add real value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Current race" focus mode | Show only the current matchup prominently with big action buttons, auto-advance to next race after recording | Low | The killer UX feature. Generic apps show a list; this guides the official through each race sequentially |
| Progress indicator | "Race 14 of 28" or progress bar showing how far through the round-robin group stage | Low | Reduces cognitive load. Officials know exactly where they are in the event |
| Quick-glance standings overlay | Swipe or tap to see standings without leaving the result-entry flow | Low | Officials get asked "who's winning?" constantly. Fast access matters |
| CSV export of results | Export final results for record-keeping, sharing with league organisers | Low | The spreadsheet outputs this today. Needed for continuity with existing processes |
| PWA / Add to Home Screen | Feels like a native app, launches without browser chrome, caches for offline | Medium | Huge perceived quality boost. Service worker for offline asset caching |
| Event history (local) | Browse past events stored on the device | Low | Nice for reference but not critical for v1. LocalStorage can hold a few events |
| Visual bracket display | Graphical bracket for finals (not just a list) | Medium | Makes finals stage feel professional. Generic bracket rendering |
| Discipline summary dashboard | Overview showing progress across all three disciplines at a glance | Low | Useful when running a full event day |
| Shake to undo | Physical gesture to undo last action -- useful with gloves | Low | Cold-weather UX differentiator. Fun and practical |
| QR code sharing of results | Generate QR code linking to results page so spectators can view on their own phones | Medium | Requires either a shareable URL or exported data format. Could be v2 |

## Anti-Features

Features to explicitly NOT build. These add complexity without matching the use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User authentication / accounts | Single official runs the event. Auth adds friction, setup time, and password recovery complexity for zero value in v1 | Open the app and start. Add auth only if multi-user collaboration is needed later |
| Server-side database | Introduces hosting costs, deployment complexity, and a hard dependency on connectivity -- the opposite of what slope-side needs | LocalStorage for v1. If persistence across devices is needed later, consider optional cloud sync |
| Real-time multi-user collaboration | Only one official records results per discipline. Conflict resolution for concurrent edits is a massive complexity trap | Single-user model. If needed later, simple "last write wins" with event locking |
| Individual racer tracking | Teams are the unit, not individuals. Tracking 5 racers per team across relay legs is a different product | Track teams only. Individual stats can be a future season-level feature |
| Season/league standings | Cross-event aggregation (R1-R4) is a fundamentally different data model. Mixing it in will complicate the single-event flow | Build the single-event tool first. Season standings is a separate milestone with its own data model |
| Automated timing integration | Hardware timing systems (RFID, photocells) are for FIS-level races, not university dry slope club events | Manual result entry. The official watches the race and taps the winner |
| Spectator-facing live website | Adds hosting, real-time sync, and a second UI surface to maintain | QR code to exported results or a simple share link is sufficient |
| Complex tiebreaker rules | Head-to-head, goal difference, etc. The current spreadsheet uses simple point totals | Points determine standings. If ties occur, officials resolve manually. Add tiebreakers only if actually needed |
| Registration / sign-up forms | Teams are entered by the official, not self-registered. Adding forms, validation, and email means building a different product | Official types in team names. That's it |
| Payment / fee collection | Not the job of the race management tool | Use existing university club payment processes |

## Feature Dependencies

```
Team Entry → Race Order Generation → Race List Display
                                          ↓
                                    Result Recording → Live Group Standings → Finals Bracket Generation
                                                                                      ↓
                                                                              Final Results View
                                                                                      ↓
                                                                                CSV Export

Three Disciplines (wraps all of the above -- each discipline is an independent instance)

PWA / Offline → Service Worker (enhances all features but is not a blocker)
```

**Critical path:** Team Entry -> Race Order -> Result Recording -> Standings -> Finals -> Results. Everything else is enhancement.

## MVP Recommendation

**Prioritize (Phase 1 -- Minimum Viable Event):**
1. Team entry per discipline (table stakes, enables everything else)
2. Race order generation from cheat sheets (table stakes, core logic)
3. Race list display with result recording (table stakes, the primary interaction)
4. Live group standings (table stakes, officials need this constantly)
5. Current race focus mode (differentiator, but low complexity and transforms the UX)

**Phase 2 -- Complete Event Flow:**
6. Finals bracket generation and result recording
7. Final results view
8. CSV export
9. Undo/correct results with cascade

**Phase 3 -- Polish and Reliability:**
10. PWA with offline caching
11. Visual bracket display
12. Progress indicator and dashboard
13. Event history

**Defer indefinitely:**
- Season standings: Different data model, different milestone
- Individual racer tracking: Different product scope
- Multi-user collaboration: Solves a problem that doesn't exist yet

## Sources

- [Challonge - Tournament Formats](https://challonge.com/) -- Industry standard for tournament bracket/round-robin management features
- [All-Play-All Round Robin Features](https://www.allplayall.app/features) -- Closest comparable for round-robin scoring and standings
- [Tourney Tournament App](https://tourneymaker.app/) -- Mobile tournament management with real-time standings
- [FierScore - School Sports Management](https://fierscore.com/) -- PWA example with offline-first tournament scoring
- [CourtHive TMX](https://github.com/CourtHive/TMX) -- Open source tournament manager PWA
- [LeagueLobster Round Robin Generator](https://scheduler.leaguelobster.com/round-robin-generator/) -- Scheduling and standings features
- [BracketHQ](https://brackethq.com/) -- Bracket generation and management
