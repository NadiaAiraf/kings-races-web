# Requirements: Kings Races Web v1.1

**Defined:** 2026-03-30
**Core Value:** A race official can run an entire event from their phone — entering teams, seeing the race order, recording results live, and viewing group standings at any time.

## v1.1 Requirements

Bug fixes and UX improvements to v1.0.

### Navigation

- [x] **NAV-01**: Merge Races and Score tabs into a single "Races" tab that shows the race list with inline scoring capability

### Scoring Bugs

- [x] **SCORE-01**: After selecting DSQ for a team in a matchup, that team's Win button must be disabled — cannot select DSQ then Win for the same team
- [x] **SCORE-02**: Outcome selection must be mutually exclusive per team — selecting a new outcome clears the previous one

### Standings Calculation

- [ ] **STAND-01**: Round 1 standings must only count Round 1 race results (not R2 or finals)
- [ ] **STAND-02**: Round 2 standings must only count Round 2 race results (not R1 or finals)
- [ ] **STAND-03**: R1 and R2 are distinct rounds used for seeding — not cumulative point totals

### Finals Placement

- [ ] **FINAL-01**: Final event positions (1st, 2nd, 3rd, etc.) are determined solely by finals matchup results
- [ ] **FINAL-02**: Group stage results (R1 + R2) determine only who races who in the finals — they do not determine final placement

## Out of Scope

| Feature | Reason |
|---------|--------|
| Season standings | v2 feature — different data model |
| New features | This is a bug fix milestone only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 6 | Complete |
| SCORE-01 | Phase 6 | Complete |
| SCORE-02 | Phase 6 | Complete |
| STAND-01 | Phase 7 | Pending |
| STAND-02 | Phase 7 | Pending |
| STAND-03 | Phase 7 | Pending |
| FINAL-01 | Phase 7 | Pending |
| FINAL-02 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation*
