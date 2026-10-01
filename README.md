# Kings Races Web

A mobile-first PWA for Kings Ski Club race officials to run university dry slope parallel slalom championship events from their phone. It handles team entry, race order generation, live result recording, group standings, multi-round tournament flow (R1 - R2 - Finals), final results and CSV export, and works offline slope-side.

**Live example:** https://nadiaairaf.github.io/kings-races-web/

## Getting started

```bash
npm ci
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run the test suite |
| `npm run lint` | Lint the codebase |

## Deployment

Every push to `master` is built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, Zustand and React Router. Data is stored in the browser's localStorage.
