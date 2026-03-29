# Phase 2: Core Event Flow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 02-core-event-flow
**Areas discussed:** Scoring interface, Navigation flow, Standings overlay

---

## Scoring Interface

### Result Entry Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Tap the winner | Show both team names as large buttons, tap winner | |
| Three buttons each | Show Win / Loss / DSQ buttons for each team | ✓ |
| Swipe-based | Swipe left/right on race card | |

**User's choice:** Three buttons each — more explicit, no ambiguity.

### DSQ Rules

| Option | Description | Selected |
|--------|-------------|----------|
| One winner, one loser/DSQ | Normal race: one team wins. DSQ replaces a loss | ✓ |
| Both can DSQ | Both teams can be disqualified | |
| More complex | Different DSQ rules | |

**User's choice:** One winner, one loser/DSQ.

### Auto-Advance

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-advance | Automatically move to next unscored race | ✓ |
| Manual advance | Stay until official taps Next | |
| Auto with delay | Brief confirmation then advance | |

**User's choice:** Auto-advance immediately.

---

## Navigation Flow

### Discipline Switching

| Option | Description | Selected |
|--------|-------------|----------|
| Top tabs | Persistent tabs at top | ✓ |
| Bottom nav | Bottom navigation bar | |
| Dropdown/menu | Header selector | |

**User's choice:** Top tabs — always visible.

### Event Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Linear guided | Step-by-step wizard | |
| Free navigation | All sections always accessible | ✓ |
| Hybrid | Linear then free | |

**User's choice:** Free navigation.

### Sections Within Discipline

| Option | Description | Selected |
|--------|-------------|----------|
| All four sections | Team Entry, Race List, Scoring Focus, Standings | ✓ |
| Combine race + scoring | Race list IS the scoring view | |
| Let me describe | Custom sections | |

**User's choice:** All four sections.

### Section Access

| Option | Description | Selected |
|--------|-------------|----------|
| Sub-tabs | Secondary tabs below discipline tabs | ✓ |
| Sidebar/menu | Hamburger menu | |
| Cards on home | Discipline home screen with cards | |
| You decide | Claude picks | |

**User's choice:** Sub-tabs.

### Team Entry Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Simple text list | Numbered text inputs | |
| Add one at a time | Single input + Add button | ✓ |
| You decide | Claude picks | |

**User's choice:** Add one at a time.

### Round Transitions

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-transition | Automatically show Round 2 when Round 1 done | |
| Manual transition | Official taps button to move rounds | |
| Show all rounds | All visible, later rounds greyed out | ✓ |

**User's choice:** Show all rounds — Round 2 greyed out until Round 1 complete.

---

## Standings Overlay

### Display Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet | Swipe up from bottom | |
| Full-screen toggle | Tap button to flip to standings | ✓ |
| Split screen | Always visible below scoring | |
| You decide | Claude picks | |

**User's choice:** Full-screen toggle.

### Standings Content

| Option | Description | Selected |
|--------|-------------|----------|
| Team name + points | Just essentials | ✓ |
| W/L/DSQ breakdown | Wins, losses, DSQs per team | |
| Race-by-race results | Full grid (like spreadsheet boxes) | ✓ |
| Tie indicators | Highlight tied teams | ✓ |

**User's choice:** Team name + points, race-by-race results grid, and tie indicators. (Not W/L/DSQ breakdown as separate columns.)

---

## Claude's Discretion

User selected "You decide the rest" for: colour scheme, visual design, component library, layout details, progress bar, undo UI pattern, sub-tab styling.

## Deferred Ideas

None — discussion stayed within phase scope.
