# AGENTS.md

## Current state

- Vite 8 + React 19 + TypeScript 7 + Tailwind 4 admin panel, scaffolded from `create-vite` `react-ts` and linted with **oxlint** (not ESLint).
- Phase 1 (login, admin authorization, route guards) is implemented. Phase 2 (content CRUD, Storage uploads) is **not** built yet; `/dashboard` is a placeholder.
- `main` has no commits yet. Verify work against files, not git history.
- The Firestore content schema (hero, contact, services, gallery) has not been decided. Do not invent collection names or field shapes; `admins/{uid}` is the only agreed collection.

## Product and stack

- React + Vite + Tailwind admin panel for the Rajarata Engineering public website.
- Firebase Authentication (admin login), Firestore (all dynamic site content), Firebase Storage (media, Phase 2).
- This repo is the admin/CRUD surface only. The public website is separate and reads the same Firestore data.

## UI theme (mirrors the public site)

- The public site lives at `../rajarata-engineering-public-site`. Its `src/styles/global.css` (`@theme`) and `UI-UX-design/precision_industrial_engineering/DESIGN.md` are the design source; this repo mirrors those tokens in `src/index.css`.
- Use the semantic utilities, not raw hex or default Tailwind colours: `bg-primary-container` / `text-on-primary`, `bg-background`, `text-on-surface`, `text-secondary`, `border-outline-variant`, `rounded-card` (18px) / `rounded-control` (12px) / `rounded-chip` (6px), `shadow-card` / `shadow-overlay`, and the type scale (`font-headline-sm text-headline-sm`, `font-body-md`, `font-label-caps`, …).
- Brand red is `#af101a` with `#d32f2f` for primary fills; surfaces are the Material-3 greys (`#f9f9f9` background, `#ffffff` cards). Do not reintroduce slate/emerald/blue palettes.
- Typography is **Plus Jakarta Sans**, loaded from Google Fonts in `index.html`. Do not swap the font without updating the public site too.
- The brand mark in `src/components/brand/BrandLogo.tsx` mirrors the public site's `Logo.astro`; keep its geometry and colours in sync. Two deliberate differences, both documented in the component: the viewBox is `0 0 148 50` (the design's 240-wide box carried ~94 units of dead space, so a centred logo rendered ~37px left of centre) and the wordmark baselines sit 1.5 units higher for optical centring on the tile. `variant="dark"` inverts it for the login hero (red tile, white bolt) — the light variant is unchanged.
- The login screen is a dark hero, not the light dashboard: `public/login-bg.webp` (optimised from the root `Log-In-page-bg.png`; only the WebP ships) behind scrims, with form controls on `tone="dark"` (`TextField`/`PasswordField`). The `auth-*` tokens in `src/index.css` exist only for that screen — do not use them in dashboard views.
- `public/favicon.svg` is the brand mark (dark tile, red bolt, orange dot), not the Vite default.
- Do not edit the public-site repo as part of an admin-panel change; if a shared token must change, change both deliberately.

## Non-negotiable content rules

- Never hardcode editable site content in JSX, constants, mock files, or seed data: hero copy, contact numbers, WhatsApp numbers, emails, addresses, service descriptions, image URLs, social links.
- `.env` holds Firebase config only (`VITE_FIREBASE_*`) and is gitignored. Never print, echo, stage, or copy its values into source or docs.
- Anything prefixed `VITE_` is bundled into the client and publicly readable. The Firebase web config is not a secret; protection comes from Security Rules, not env secrecy.
- `.env.example` must contain placeholders only. Site content never becomes a `VITE_` key.
- Do not add fallback/demo content when a Firestore read fails; surface an error/empty state instead.

## Firebase and auth conventions

- `src/lib/firebase.ts` is the only module that calls `initializeApp`, `getAuth`, or `getFirestore`; it exports `app`, `auth`, `db`. Storage stays uninitialized until Phase 2.
- Login is email/password only. `signInAdmin` in `src/features/auth/authService.ts` performs the credential sign-in **and** verifies `admins/{uid}` exists with `active !== false`; otherwise it signs out and throws a `not-admin` error.
- Any authenticated Firebase user is **not** automatically an admin. Admin docs are provisioned manually in Firebase Console; the client never writes `admins/*`.
- Auth state lives in `AuthProvider` (single `onAuthStateChanged` subscription) and is consumed via `useAuth()`. Do not call `firebase/auth` from components.
- `RequireAdmin` and `GuestOnly` are route-level guards. Guarding is UX only — `firestore.rules` is the security boundary.
- Firestore rules are default-deny: only `admins/{uid}` (self-read) is allowed today. Every new content path needs an explicit rule; otherwise the feature is not done.
- Media flow (Phase 2): upload to Storage → `getDownloadURL()` → save the URL in Firestore; delete replaced objects.
- Save feedback must be immediate: disable the submit control while writing and show success/error feedback after the write settles.

## Firebase project wiring (first-run checklist)

- The app talks to the project in `.env` (`VITE_FIREBASE_PROJECT_ID`, currently `rajarata-engineering-admin`). `.firebaserc` pins the same project for the CLI, and `firebase.json` maps `firestore.rules` to the **named** database `default`.
- **Named database, not `(default)`.** Google only allows creating the standard `(default)` database through the API on a billing-enabled (Blaze) plan; this project is on Spark. `databases/default` was created instead, so:
  - `VITE_FIREBASE_DATABASE_ID=default` selects it (`firebase.ts` calls `getFirestore(app, env.VITE_FIREBASE_DATABASE_ID)`). Set it to `(default)` to switch back — no code change.
  - `firebase.json` must keep `"database": "default"` in the `firestore` array, or the rules deploy silently targets a database that does not exist. Rules live per database.
  - Any future Admin SDK / Cloud Functions code must pass the same database id.
- Before login can succeed, all of these must be true in that project:
  1. **The Firestore database named in `VITE_FIREBASE_DATABASE_ID` exists.** Auth succeeding but the admin check failing produces a `firestore-not-ready` error; a missing Firestore API/database surfaces as `failed-precondition` / `not-found` / "Cloud Firestore API has not been used".
  2. `firestore.rules` is deployed (`npm run deploy:rules`) and allows the signed-in admin to read their own `admins/{uid}` doc.
  3. Email/Password provider is enabled.
  4. The signing-in user exists in Authentication **and** has an `admins/{uid}` document with `active: true` (see `signInAdmin`).
- Diagnose with the CLI: `npx firebase-tools login:list`, then `gcloud firestore databases list --project rajarata-engineering-admin`. Check the active CLI project with `npx firebase-tools use` — if it points somewhere else, deploy goes to the wrong project.
- Error codes are mapped in `src/features/auth/errors.ts`. The app shows a plain message and logs `[auth] <mapped-code> (raw: <firebase-code>)` to the console outside tests — check the console first when a login message is vague. Unmapped codes fall back to `unknown`.

## Code layout

- `src/lib/` — `env.ts` (validates the required `VITE_FIREBASE_*` keys, fails fast, defaults the optional `VITE_FIREBASE_DATABASE_ID`) and `firebase.ts`.
- `src/features/auth/` — `types.ts`, `errors.ts`, `schema.ts`, `authService.ts`, `context.ts`, `AuthProvider.tsx`, `useAuth.ts`, `components/`, `pages/`, `guards/`.
- `src/components/ui/` — domain-agnostic form/UI primitives reused by all later CRUD forms (`Button`, `TextField`, `PasswordField`, `Alert`, `FullPageSpinner`).
- `src/components/brand/BrandLogo.tsx` — brand mark mirrored from the public site.
- `src/components/layout/AdminLayout.tsx` — protected shell with sign-out.
- `src/routes/` — `paths.ts`, `redirect.ts` (same-origin redirect validation), `router.tsx`.
- `src/pages/` — dashboard placeholder and public 404.
- Tests live in `__tests__/` next to the code they cover (e.g. `src/features/auth/__tests__/`).
- No path alias is configured in `vite.config.ts`/`tsconfig`; use relative imports unless you add one deliberately.

## Commands

Run from the repo root with npm (a `package-lock.json` exists; do not switch package managers):

- `npm run dev` — Vite dev server. Restart after changing `.env` (env values are not hot-reloaded).
- `npm run build` — `tsc -b && vite build`. This is the only typecheck; there is no separate `typecheck` script.
- `npm run lint` — `oxlint` (config `.oxlintrc.json`). No `lint --fix` alias; use `npx oxlint --fix`.
- `npm run test` — Vitest watch mode.
- `npm run test:run` — single CI-style run.
- Single file: `npm run test:run -- src/features/auth/__tests__/authService.test.ts`.
- `npm run deploy:rules` — deploy `firestore.rules` with `npx firebase-tools` (project pinned in `.firebaserc`). Requires `npx firebase-tools login` once.

## Testing quirks

- Vitest 5 + jsdom. Config lives in the `test` block of `vite.config.ts`; setup is `src/test/setup.ts` (jest-dom + RTL cleanup).
- Globals are **off**: import `describe`, `it`, `expect`, `vi` from `vitest` explicitly.
- Firebase is never hit in tests. Mock the service boundary (`../authService`) or `firebase/*` modules with `vi.mock` + `vi.hoisted`; stub env with `vi.stubEnv` + `vi.resetModules` for `src/lib/env.ts`.
- No emulator or test credentials are set up. Do not add tests that require a live Firebase project; the four manual cases in `IMPLIMENTAION.md` cover real-network behavior.

## Toolchain quirks

- `tsconfig.app.json` has `strict`, `verbatimModuleSyntax` (use `import type`), and `erasableSyntaxOnly` (no enums, namespaces, or constructor parameter properties).
- Tailwind 4 uses the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css`; there is no `tailwind.config.js` or `postcss.config.js`. Do not add them unless you migrate deliberately.
- The production build warns that the Firebase bundle exceeds 500 kB. It is expected; address it with route/feature code-splitting, not by raising the warning limit.
- `firestore.rules` is deployed by `npm run deploy:rules`; the project is pinned in `.firebaserc`. Deploying requires the Firestore database to exist first.

## Before finishing a change

- Confirm no site content, contact details, or media URLs were hardcoded.
- Confirm `.env` was not modified into source, printed, or staged, and no service-account key was added.
- Confirm new Firestore/Storage paths have matching rules; otherwise the feature is not done.
- Run `npm run lint`, `npm run test:run`, and `npm run build`.
- Update this file when commands, folder conventions, or schema decisions change.
