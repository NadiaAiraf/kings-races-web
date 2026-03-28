# Phase 1: Data Foundation and Storage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 01-data-foundation-and-storage
**Areas discussed:** Cheat sheet extraction, Tiebreaker rules, Group structure

---

## Cheat Sheet Extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Extract from xlsx | Pull all race orders programmatically from the spreadsheet | |
| Some sheets differ | Not all sheets follow the same pattern | ✓ |
| I'll provide manually | User provides race orders manually | |

**User's choice:** Some sheets differ — each sheet follows roughly similar but not exactly the same logic depending on number of teams, so extract each individually.

**Follow-up: Disciplines identical?**
Verified programmatically that race orders are identical across Mixed/Board/Ladies for the same team count (checked 6 Teams vs 6 Teams Board vs 6 Teams Ladies).

**Follow-up: Tournament presentation**

| Option | Description | Selected |
|--------|-------------|----------|
| Three phases | Show Round 1, Round 2, Finals separately | |
| One sequence | Flatten into single race list | |
| Match the sheets | Replicate spreadsheet's presentation structure | ✓ |

**User's choice:** Match the sheets — however the spreadsheet presents it, replicate that.

---

## Tiebreaker Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Head-to-head result | Team that won direct matchup ranks higher | |
| Official decides | Organiser makes judgment call | ✓ |
| Not sure | Hasn't come up or don't remember | |

**User's choice:** Official decides.

**Follow-up: How to handle in app**

| Option | Description | Selected |
|--------|-------------|----------|
| Flag and let official rank | Highlight tie, official taps to set order | ✓ |
| Auto-rank, allow override | Pick an order, let official swap | |
| Don't worry about it | Show equal, sort it out manually | |

**User's choice:** Flag and let official rank.

---

## Group Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Exact assignments matter | Replicate spreadsheet's team-to-group mapping | ✓ |
| Any balanced split | As long as groups are even, assignment doesn't matter | |
| Not sure | Check the sheets | |

**User's choice:** Exact assignments matter — they are intentionally seeded.

**Notes:** Programmatic analysis confirmed:
- 4-6 teams: single group round-robin
- 8+ teams: multiple groups (Group A, B, C...) → Round 2 cross-group → Finals
- Group count scales with team count

---

## Claude's Discretion

User selected "You decide the rest" for data model shape, storage internals, TypeScript types, Zustand store design, test framework.

## Deferred Ideas

None — discussion stayed within phase scope.
