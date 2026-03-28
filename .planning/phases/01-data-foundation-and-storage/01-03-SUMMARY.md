---
phase: 01-data-foundation-and-storage
plan: 03
subsystem: store
tags: [zustand, persist, localStorage, state-management]

requires:
  - "Domain types (EventState, DisciplineState, Score, Team) from plan 01"
provides:
  - "Zustand store with persist middleware (useEventStore)"
  - "Automatic localStorage persistence on every mutation"
  - "Version-stamped storage with migration hook"
  - "Store types (EventStoreState, EventStoreActions)"
affects:
  - "All future UI components consume useEventStore"
  - "All future features inherit data safety from persist middleware"

tech_stack:
  added: [zustand/middleware persist]
  patterns: [zustand-persist, immutable-state-updates, upsert-pattern]

key_files:
  created:
    - src/store/eventStore.ts
    - src/store/types.ts
    - src/store/eventStore.test.ts

decisions:
  - "Storage key 'kings-races-event' for localStorage"
  - "Version 1 stamped from day one with no-op migrate function"
  - "partialize excludes action functions from serialization"
  - "recordResult uses upsert pattern (filter + append) for score corrections"

metrics:
  duration: 93s
  tasks_completed: 1
  tests_added: 18
  tests_total: 335
  completed: "2026-03-28T21:48:00Z"
---

# Phase 01 Plan 03: Zustand Store with Persist Middleware Summary

Zustand store with persist middleware auto-saving all event state to localStorage on every mutation, version-stamped at v1 with migration hook ready for future schema changes.

## What Was Built

### Store Types (`src/store/types.ts`)
- `EventStoreState` extending `EventState` from domain types
- `EventStoreActions` interface with all 7 store actions

### Event Store (`src/store/eventStore.ts`)
- Zustand store created with `create<EventStoreState & EventStoreActions>()(persist(...))`
- Storage key: `kings-races-event`
- Version: 1 (stamped in persisted JSON)
- Migration hook present (no-op for v1, ready for future schema changes)
- `partialize` excludes action functions from serialization
- Initial state: all 3 disciplines at phase 'setup' with empty teams/scores

### Store Actions
- `setTeams` - sets teams array and updates teamCount for a discipline
- `recordResult` - upserts a score (replaces existing by raceId)
- `clearResult` - removes a score by raceId
- `setActiveDiscipline` - switches active discipline
- `setDisciplinePhase` - transitions a discipline's phase
- `setManualTiebreak` - stores ordered slots for tiebreak resolution
- `resetEvent` - returns all state to initial values

### Test Coverage (`src/store/eventStore.test.ts`)
- 18 tests covering all actions, initial state, and persistence
- Persistence tests verify localStorage write on mutation
- Version stamp test confirms `version: 1` in persisted JSON
- Tab death simulation: state reconstructs from localStorage after store destruction

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx vitest run` -- 335 tests pass (18 new store tests + 317 existing)
2. `npx tsc --noEmit` -- clean TypeScript compilation
3. `npm run build` -- Vite production build succeeds
4. All must_haves truths verified:
   - App state persists to localStorage on every mutation (tested)
   - App fully reconstructs state from localStorage on load (tested)
   - State survives simulated tab death (tested)
   - Store version is stamped from day one (tested)
   - All three disciplines have independent state (tested)

## Known Stubs

None -- all store actions are fully implemented with real logic.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| a10473d | test | Add failing tests for Zustand event store (RED) |
| 61bbae7 | feat | Implement Zustand store with persist middleware (GREEN) |

## Self-Check: PASSED
