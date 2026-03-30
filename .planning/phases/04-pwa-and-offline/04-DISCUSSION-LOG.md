# Phase 4: PWA and Offline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 04-pwa-and-offline
**Areas discussed:** App identity, Caching strategy

---

## App Identity

### App Name

| Option | Description | Selected |
|--------|-------------|----------|
| Kings Races | Short, recognizable | ✓ |
| Kings Ski Club | Full club name | |
| Race Manager | Generic | |
| Something else | Custom name | |

**User's choice:** Kings Races

### Theme Color

| Option | Description | Selected |
|--------|-------------|----------|
| Blue (current accent) | Match blue-600 #2563EB | ✓ |
| Club colours | User provides brand colours | |
| You decide | Claude picks | |

**User's choice:** Blue (current accent)

---

## Caching Strategy

### Updates

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-update silently | Background download, active on next visit | ✓ |
| Prompt to update | Show banner | |
| You decide | Claude picks | |

**User's choice:** Initially asked "it's a web app why do they need to get a new version?" — explained that PWA caches files so updates need service worker refresh. Agreed to auto-update silently.

### Offline

| Option | Description | Selected |
|--------|-------------|----------|
| Standard precache | Cache all app assets | ✓ |
| Show offline indicator | Subtle indicator when offline | |
| Both | Precache + indicator | |

**User's choice:** Standard precache — sufficient since localStorage already handles data persistence.

---

## Deferred Ideas

- **Hosting/deployment:** User has Squarespace domain for club website. Explained Squarespace can't host custom React apps. Recommended Netlify/Vercel/GitHub Pages with subdomain pointing. Deferred to post-v1.

## Claude's Discretion

PWA icon generation, manifest details, service worker config, offline indicator.
