# AGENTS.md

## Current state

- Vite 8 + React 19 + TypeScript 7 + Tailwind 4 admin panel, scaffolded from `create-vite` `react-ts` and linted with **oxlint** (not ESLint).
- Phase 1 (login, admin authorization, route guards), Phase 2 (`site/settings`), Phase 3 (`site/home` + Home image storage), Phase 4 (`site/services` + public Services hydration), Phase 5 (`site/about` + About hero image), and Phase 6 (`site/projects` + public Projects hydration) are implemented in code. `/dashboard` is still a placeholder.
- Home and About images currently use the **inline-media fallback**: compressed raster images are stored as `data:image/...;base64,...` URLs inside `site/home` and `site/about`, because the Firebase project is on Spark and has no Storage bucket. Inline mode is the default; set `VITE_FIREBASE_INLINE_MEDIA=false` to use the Storage pipeline once a bucket exists.
- `main` has no commits yet. Verify work against files, not git history.
- The content schema is locked for the five implemented singletons: `site/settings`, `site/home`, `site/services`, `site/about`, and `site/projects`. `admins/{uid|email}` is the admin allowlist. Do not invent collection names or field shapes for later phases.
- `site/services` is one page-level document: fixed counts of 8 services, 4 quick links, 4 metrics, 6 process steps, 2 CTA points, and 4 suitable-for chips per service. Numbers, anchors, accents, and emphasis are derived from slot order, not stored. Every editable text field is optional; a blank value means keep the public page's build-time content for that slot (same optional/blank semantics as `site/about`). Contact details, footer copy, images, and SEO stay outside this document.
- `site/home` always stores a `hero` map and exactly three `featuredProjects` slots, but a slot may be blank. A blank slot is an empty map, not seeded content; the public site keeps its build-time hero/card for it. A started section must be complete (image + required text).
- `site/about` is one page-level document: one hero image plus fixed counts of 3 snapshots, 4 milestones, 5 pillars, 5 method steps, and 6 sectors. Milestone accents, pillar/method numbering, and card order are derived from slot order. Icons come from the `ABOUT_ICONS` allowlist. **Every field is optional**: a blank string, a blank icon, or an unchanged/cleared hero image is stored as an empty value and means "keep the public page's build-time content for that slot". Fixed array counts and the top-level keys are still enforced. Hero alt text is required only when an admin-supplied hero image is present. “Based In” plus the CTA phone/WhatsApp actions remain owned by `site/settings`; contact details, footer, header/nav, images beyond the hero, and SEO stay outside this document. The public About page now hydrates from this document through the `data-about-*` hooks in the public site repo (`src/lib/aboutContentParser.ts`, `src/lib/aboutContent.ts`, `src/lib/watchAboutContent.ts`, and the `data-about-*` attributes on the About components), so an admin save reaches the public page on reload.
- `site/projects` is one page-level document: hero copy, exactly 6 fixed project cards, 3 track-record columns, and CTA copy. Each project stores its category (required, from the `PROJECT_CATEGORIES` allowlist) plus optional sub tag, location, year, type placeholder, title, summary, reference, and spec label/value/detail. Each card may hold an **optional image**: validated in the browser with the Home card gate, optimized, then stored inline as a compressed raster data URL (default; all six inline URLs must stay under `PROJECT_INLINE_MEDIA_DOC_BUDGET` = 900,000 chars) or uploaded to Storage at `projects/cards/<1-6>/...` once a bucket exists (5 MB cap is 3 MB per card in `storage.rules`). An admin-supplied image always requires its alt text; clearing the image keeps the public page's build-time artwork. Replacing a stored image deletes the old object, and a failed write rolls back new uploads. Contact details, footer copy, and SEO stay outside this document. The public Projects page hydrates from this document through the `data-project-*` / `data-projects-*` hooks in the public site repo (`src/lib/projectsContentParser.ts`, `src/lib/projectsContent.ts`, `src/lib/watchProjectsContent.ts`, and the `data-project-card` / `data-project-image` hooks per card), so an admin save reaches the public page on reload.

## Product and stack

- React + Vite + Tailwind admin panel for the Rajarata Engineering public website.
- Firebase Authentication (admin login), Firestore (all dynamic site content, including inline Home/About media), Firebase Storage (optional Home/About media when a bucket is provisioned).
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
- `.env` holds Firebase config and runtime flags only (`VITE_FIREBASE_*`) and is gitignored. Never print, echo, stage, or copy its values into source or docs.
- Anything prefixed `VITE_` is bundled into the client and publicly readable. The Firebase web config is not a secret; protection comes from Security Rules, not env secrecy.
- `.env.example` must contain placeholders only. Site content never becomes a `VITE_` key.
- Do not add fallback/demo content when a Firestore read fails; surface an error/empty state instead.

## Firebase and auth conventions

- `src/lib/firebase.ts` is the only module that calls `initializeApp`, `getAuth`, `getFirestore`, or `getStorage`; it exports `app`, `auth`, `db`, `storage`. The validated Storage upload/delete engine lives in `src/lib/media/storage.ts`; Home (`src/features/home/storageService.ts`) and About (`src/features/about/media.ts`) delegate to it. Inline conversion lives behind `src/features/home/inlineMedia.ts`. Do not call `firebase/storage` from components.
- Login is email/password only. `signInAdmin` in `src/features/auth/authService.ts` performs the credential sign-in **and** verifies the account is provisioned as an admin; otherwise it signs out and throws a `not-admin` error.
- An admin record can be keyed two ways, and both are supported deliberately:
  - `admins/{uid}` — canonical, revocation-friendly (delete/deactivate the doc).
  - `admins/{email}` (lowercase) — console-friendly allowlist, so provisioning is "create the Auth user, then add a document whose ID is that email".
  The client checks `{uid}` first, then the lowercased email. `firestore.rules` allows a signed-in user to read either record only if it matches their own uid or email.
- Any authenticated Firebase user is **not** automatically an admin. Admin docs are provisioned manually in Firebase Console (or the Admin SDK); the client never writes `admins/*`.
- Auth state lives in `AuthProvider` (single `onAuthStateChanged` subscription) and is consumed via `useAuth()`. Do not call `firebase/auth` from components.
- `RequireAdmin` and `GuestOnly` are route-level guards. Guarding is UX only — `firestore.rules` is the security boundary.
- Firestore rules are default-deny: `admins/{uid|email}` (self-read), `site/settings` (public read, admin write), `site/home` (public read, admin write), `site/services` (public read, admin write with fixed-count and top-level key checks), `site/about` (public read, admin write with fixed-count and top-level key checks), and `site/projects` (public read, admin write with fixed-count and top-level key checks) are the allowed paths today. `storage.rules` allows public reads of `home/hero/*`, `home/projects/*`, `about/hero/*`, `projects/cards/*`, and `settings/logo/*` (admin-only writes; 3 MB cap per card/project image, 5 MB for hero/logo). Every new content path needs an explicit rule; otherwise the feature is not done.
- Media flow (implemented for Home, About, and Projects): validate in the browser → optimize oversized files with the Canvas API (source caps 25 MB / 60 MP; no new dependency) → revalidate the optimized file → then either upload to Storage (`getDownloadURL()`, save URL/path/metadata) or, unless `VITE_FIREBASE_INLINE_MEDIA=false`, encode the compressed file as a raster data URL and save it in `site/home` / `site/about` / `site/projects`. Delete replaced Storage objects and roll back new uploads if the document write fails.
- Inline mode is a deliberate Spark-plan fallback, not a general-purpose image CDN. Limits: hero ≤ 160 KB, fitted up to 1600×1200; each card ≤ 90 KB, fitted up to 1200×900; logo ≤ 90 KB, exactly 1080×1080 with 1:1 aspect ratio; and all encoded URLs together must stay under `INLINE_MEDIA_DOC_BUDGET` (900,000 characters) so the document stays below Firestore's 1 MiB limit. The About hero reuses the hero caps and the single encoded URL must stay under `ABOUT_INLINE_MEDIA_DOC_BUDGET` (900,000 characters). Compression tries progressively lower qualities; if it cannot meet the cap, the save fails instead of silently writing an oversized doc.
- The public site accepts `https:` image URLs and raster `data:image/{jpeg,png,webp};base64,...` URLs. It must keep rejecting `data:image/svg+xml` and every other scheme.
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

- `src/lib/` — `env.ts` (validates the required `VITE_FIREBASE_*` keys, fails fast, defaults the optional `VITE_FIREBASE_DATABASE_ID`), `firebase.ts`, and `media/storage.ts` (shared validated-image upload/delete engine).
- `src/features/auth/` — `types.ts`, `errors.ts`, `schema.ts`, `authService.ts`, `context.ts`, `AuthProvider.tsx`, `useAuth.ts`, `components/`, `pages/`, `guards/`.
- `src/features/home/` — `constants.ts` (Storage and inline image limits), `mediaMode.ts` (`VITE_FIREBASE_INLINE_MEDIA`), `inlineMedia.ts` (FileReader → data URL), `homeContentService.ts`, `storageService.ts` (delegates to `src/lib/media/storage.ts`), validation/compression modules, `components/`, `pages/`.
- `src/features/services/` — `constants.ts` (fixed counts, text limits, icon/anchor allowlists), `types.ts`, `schema.ts` (whole-page zod schema), `defaults.ts` (empty form state only, no site copy), `errors.ts`, `servicesContentService.ts`, `useServicesContent.ts`, `components/`, `pages/ServicesContentPage.tsx`.
- `src/features/about/` — `constants.ts` (fixed counts, text limits, `ABOUT_ICONS`, `aboutTextHint`), `types.ts`, `schema.ts` (optional-text form schema + strict stored-document schema), `defaults.ts` (empty form state only, no site copy), `errors.ts`, `media.ts` (Home image gate → About Storage folder or inline data URL), `aboutContentService.ts`, `useAboutContent.ts`, `components/`, `pages/AboutContentPage.tsx`.
- `src/features/projects/` — `constants.ts` (fixed counts, `PROJECT_CATEGORIES` allowlist, `PROJECT_TEXT_LIMITS`, `PROJECT_STORAGE_ROOT`), `types.ts`, `schema.ts` (optional-text form schema; category required from the allowlist; categories required but texts optional), `defaults.ts` (empty form state only, no site copy), `errors.ts`, `media.ts` (Home card image gate → Storage folder `projects/cards/<1-6>` or inline data URL), `projectsContentService.ts`, `useProjectsContent.ts`, `components/` (incl. `ProjectImageField` per card), `pages/ProjectsContentPage.tsx`.
- Contact details and the site logo are edited on the **Site Settings** page (`src/features/settings/`) which writes to `site/settings` with `{ merge: true }`. The logo is validated with the Home hero image gate (extension, MIME, file signature, decode, dimensions, aspect, in-browser optimization) and stored either inline as a raster data URL (default, all encoded URLs must stay under `LOGO_INLINE_MEDIA_DOC_BUDGET` = 900,000 chars) or uploaded to Storage at `settings/logo/{fileName}` once a bucket exists (5 MB cap per `storage.rules`). An admin-supplied logo requires alt text. Clearing the logo keeps the public page's build-time SVG. The public header hydrates the logo through `data-site-logo-image` / `data-site-logo-svg` hooks in `src/lib/watchSiteSettings.ts`.
- `src/components/ui/` — domain-agnostic form/UI primitives reused by all CRUD forms (`Button`, `TextField`, `PasswordField`, `TextArea`, `SelectField`, `Alert`, `Toast`, `CollapsibleSection`, `UnsavedChangesGuard`, `FullPageSpinner`).
- `src/components/brand/BrandLogo.tsx` — brand mark mirrored from the public site.
- `src/components/layout/AdminLayout.tsx` — protected shell: fixed sidebar navigation with a persisted collapse-to-icon-rail state (`localStorage` key `rajarata-admin.sidebar-collapsed`), an off-canvas drawer below `lg`, and sign-out in the sidebar footer. Icons live in `src/components/layout/icons.tsx` (inline SVG, no icon dependency).
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
- `npm run test:emulator` — starts the Auth/Firestore/Storage emulators (project `demo-rajarata-home`, named database `default`), runs every `*.emulator.test.ts`, then shuts them down. Requires Java for the Firestore emulator. `npm run test:emulator:only` runs the same suite against emulators you started yourself.
- `npm run deploy:rules` — deploy `firestore.rules` and `storage.rules` with `npx firebase-tools` (project pinned in `.firebaserc`). Requires `npx firebase-tools login` once, the named Firestore database to exist, and Firebase Storage to be provisioned.

## Testing quirks

- Vitest 5 + jsdom. Config lives in the `test` block of `vite.config.ts`; setup is `src/test/setup.ts` (jest-dom + RTL cleanup).
- Globals are **off**: import `describe`, `it`, `expect`, `vi` from `vitest` explicitly.
- Unit tests never hit Firebase. Mock the service boundary (`../authService`) or `firebase/*` modules with `vi.mock` + `vi.hoisted`; stub env with `vi.stubEnv` + `vi.resetModules` for `src/lib/env.ts`.
- Emulator tests are the exception: they import the real `src/lib/firebase.ts` after stubbing env and set `VITE_FIREBASE_USE_EMULATOR=true`, which makes `firebase.ts` connect to ports 9099/8080/9199 from `firebase.json`. They seed `admins/{uid}` through the Firestore REST API with `Authorization: Bearer owner` (client writes to `admins/*` are denied by design), then exercise real rules. They are excluded from `test:run`; run them with `npm run test:emulator`.
- Unit tests force `VITE_FIREBASE_INLINE_MEDIA=false` in `src/test/setup.ts` so Storage-path tests are deterministic; the inline test file stubs it to `true` before importing the service. `home.emulator.test.ts` and `about.emulator.test.ts` also force inline mode off because they cover the Storage path. Do not rely on the developer's `.env` for either mode.
- Do not add tests that require a live Firebase project; the manual cases in `IMPLIMENTAION.md` cover real-network behavior, including HOME-022 (public hydration), HOME-023 (Storage upload on Spark), and ABOUT-020 (public hydration once the reader exists).

## Toolchain quirks

- `tsconfig.app.json` has `strict`, `verbatimModuleSyntax` (use `import type`), and `erasableSyntaxOnly` (no enums, namespaces, or constructor parameter properties).
- Tailwind 4 uses the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css`; there is no `tailwind.config.js` or `postcss.config.js`. Do not add them unless you migrate deliberately.
- The production build warns that the Firebase bundle exceeds 500 kB. It is expected; address it with route/feature code-splitting, not by raising the warning limit.
- `firestore.rules` and `storage.rules` are deployed by `npm run deploy:rules`; the project is pinned in `.firebaserc`. Deploying requires the Firestore database and a Storage bucket to exist first. The Storage rules use the cross-service path `/databases/default/documents/admins/...`; if `VITE_FIREBASE_DATABASE_ID` is switched to `(default)`, that path must change with it.

## Before finishing a change

- Confirm no site content, contact details, or media URLs were hardcoded.
- Confirm `.env` was not modified into source, printed, or staged, and no service-account key was added.
- Confirm new Firestore/Storage paths have matching rules; otherwise the feature is not done.
- Confirm inline media is intentional: it is the default unless `VITE_FIREBASE_INLINE_MEDIA=false`; keep each image under its inline cap, the combined Home encoded URLs under `INLINE_MEDIA_DOC_BUDGET`, and the About hero under `ABOUT_INLINE_MEDIA_DOC_BUDGET`.
- Run `npm run lint`, `npm run test:run`, and `npm run build`.
- Update this file when commands, folder conventions, or schema decisions change.
