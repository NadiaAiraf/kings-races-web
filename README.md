# Kings Races

A mobile-first PWA for Kings Ski Club race officials to run university dry slope parallel slalom championship rounds from a phone, replacing the cheat-sheet spreadsheet. Approved officials sign in with email and password to create and score rounds; everyone else sees rounds read-only.

Live app: https://nadiaairaf.github.io/kings-races-web/

## Features

- Team entry per discipline (Mixed, Board and Ladies)
- Race orders from 28 pre-computed cheat-sheet sequences covering 4-31 teams
- 1-tap result recording, with notes on individual races
- Group standings with race-by-race grids and tiebreaks
- Multi-round flow: R1, R2 and finals, including rounds stopped early
- Final results and CSV export
- Seasons and leagues with league points and season standings
- Read-only view for anyone who is not an approved official
- Soft delete: deleted rounds are archived to `deletedEvents`
- Installable PWA that keeps working offline slope-side

## Tech stack

React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Zustand, React Router, Firebase Auth and Firestore (with an offline cache), vite-plugin-pwa and Vitest. See [CLAUDE.md](CLAUDE.md) for detail.

Data lives in Firestore with a persistent local cache, so rounds stay readable and writes queue while offline, then flush on reconnect.

## Getting started

Prerequisites:

- Node 26, pinned in `.nvmrc` (for example `nvm use`)
- Java, only for the Firebase emulators and the rules tests

```sh
npm i -g corepack@0.35.0 && corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Fill in `.env.local` from Firebase console > Project settings > General > Your apps > Web app. The app refuses to start if any of the four config values is missing.

- `VITE_FIREBASE_API_KEY` - web app API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project id
- `VITE_FIREBASE_APP_ID` - web app id
- `VITE_FIREBASE_USE_EMULATORS` - `true` to use the local emulators (default `false`)

These config values are public by design; access is enforced by `firestore.rules`.

### Using the Firebase emulators

1. Run `pnpm emulators` (Firestore on port 8080, Auth on port 9099).
2. In `.env.local`, set `VITE_FIREBASE_USE_EMULATORS=true` and `VITE_FIREBASE_PROJECT_ID=demo-kings-races`. The other config values can be placeholders.
3. Run `pnpm dev`.

The emulators start empty. To test editing, create a user in the Auth emulator and an `approvedUsers/{uid}` document in the Firestore emulator. Production builds refuse to start with the emulator flag set.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the unit and component tests once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:rules` | Run the Firestore rules tests against the Firestore emulator |
| `pnpm emulators` | Start the Firestore and Auth emulators (project `demo-kings-races`) |
| `pnpm preview` | Serve the production build locally |

## Project layout

- `src/domain` - pure race logic, including `src/domain/cheatSheets`
- `src/store` - Zustand event store (not persisted)
- `src/events` - Firestore event documents, sync and repository
- `src/seasons` - seasons, leagues, league points and season standings
- `src/auth`, `src/firebase` - sign-in and Firebase setup
- `src/components` - UI by area (finals, layout, races, results, scoring, season, shared, standings, teams)
- `src/pages`, `src/hooks`, `src/lib` - routes, hooks and helpers
- `rules/` - Firestore rules tests
- `firestore.rules`, `firebase.json` - security rules and emulator config
- `scripts/` - Python helpers that extract cheat-sheet data
- `public/` - PWA icons
- `.github/workflows/` - CI and deploy

## Access control

`firestore.rules` is the real access control; the app only hides controls. A user may create and score rounds if a document exists at `approvedUsers/{uid}`. That allowlist is managed by hand in the Firebase console. Everyone else is read-only.

The rules are not deployed by CI. Run `pnpm test:rules`, then deploy by hand:

```sh
npx firebase deploy --only firestore:rules --project <projectId>
```

## CI and deployment

`.github/workflows/ci.yml` runs on pull requests, pushes to `master` and weekly (Monday 06:00 UTC):

- `test` - `pnpm lint`, `pnpm test`, `pnpm build`
- `rules` - `pnpm test:rules` on Java 21
- `dependency-audit` - `pnpm audit --prod --audit-level moderate`

`.github/workflows/deploy.yml` publishes to GitHub Pages after CI passes on a push to `master`, or on manual dispatch. It builds with `BASE_URL=/kings-races-web/` and needs these repository variables under Settings > Secrets and variables > Actions > Variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

The deploy fails if any of them is missing.

## Contributing

- Branch as `af/<brief-descriptor>`
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:` and so on)
- Open pull requests against `master`
- CI must be green before merging
