# Phase 3: Finals and Results - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 03-finals-and-results
**Areas discussed:** Finals transition, Bracket display, CSV export format

---

## Finals Transition

### Trigger Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect | Finals auto-populate when all groups scored | |
| Manual trigger | Official taps 'Start Finals' | |
| Both | Auto-populate + require confirmation tap | ✓ |

**User's choice:** Both — auto-populate when ready, require confirmation before scoring.

### Tie Resolution Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Block finals | Block until ties resolved | ✓ |
| Prompt at transition | Show tie screen when groups complete | |
| You decide | Claude picks | |

**User's choice:** Block finals until ties are resolved.

---

## Bracket Display

### Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Simple matchup list | Vertical list of placement matches | ✓ |
| Tree bracket | Classic tournament bracket tree | |
| Card-based bracket | Cards grouped visually | |

**User's choice:** Simple matchup list — mobile-friendly.

### Seeding Context

| Option | Description | Selected |
|--------|-------------|----------|
| Just finals matchups | Clean, no group context | |
| Include seeding context | Show why teams are seeded | ✓ |

**User's choice:** Include seeding context (e.g., "Winner Group A vs Runner-up Group B").

---

## CSV Export Format

### Content

| Option | Description | Selected |
|--------|-------------|----------|
| Final standings | Position, team, discipline | ✓ |
| Group stage results | Every race result | |
| Points breakdown | Points, W/L/DSQ counts | |
| Match the spreadsheet | Replicate existing format | ✓ |

**User's choice:** Final standings + match the spreadsheet format.

### Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per discipline | Separate CSV per discipline | |
| Combined | One file for whole event | ✓ |
| Both options | Let official choose | |

**User's choice:** One combined CSV for the whole event.

---

## Claude's Discretion

Finals scoring reuse, results view layout, confirm button design, CSV download mechanism, bracket navigation integration.

## Deferred Ideas

None.
