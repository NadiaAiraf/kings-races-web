# Requirements: Kings Races Web v1.2

**Defined:** 2026-03-30
**Core Value:** A race official can run an entire event from their phone -- entering teams, seeing the race order, recording results live, and viewing group standings at any time.

## v1.2 Requirements

Cheat sheet accuracy -- fix group seeding and validate all race data against the master xlsx source of truth.

### Seeding

- [ ] **SEED-01**: Team-to-group assignment must follow the xlsx serpentine draft pattern for all 29 team counts (4-32), where top seeds are spread across groups rather than filling sequentially
- [x] **SEED-02**: A `seedMap` array must be added to each cheat sheet's `TournamentStructure` defining the exact seed-to-slot mapping from the xlsx

### Race Order

- [x] **R2ORD-01**: Round 2 race order must exactly match the xlsx cheat sheet for all applicable team counts (8+)

### Validation

- [x] **VALID-01**: All 29 cheat sheet seed mappings must be validated against the xlsx source of truth with automated tests
- [x] **VALID-02**: R1 race order for all 29 team counts must be validated against the xlsx source of truth
- [x] **VALID-03**: R2 race order for all 29 team counts must be validated against the xlsx source of truth

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | This is a data accuracy milestone only |
| Finals structure changes | Finals matchup structures verified correct by research |
| UI changes | Seeding fix is domain/data layer only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEED-01 | Phase 9 | Pending |
| SEED-02 | Phase 9 | Complete |
| R2ORD-01 | Phase 9 | Complete |
| VALID-01 | Phase 8 | Complete |
| VALID-02 | Phase 8 | Complete |
| VALID-03 | Phase 8 | Complete |

**Coverage:**
- v1.2 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30*
