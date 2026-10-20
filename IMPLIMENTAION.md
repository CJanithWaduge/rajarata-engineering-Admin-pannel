# IMPLEMENTATION.md

Phase-based implementation plan for the **Rajarata Engineering Admin Panel** (React + Vite + TypeScript + Tailwind, Firebase BaaS).

This document is the source of truth for *what to build* and *how it is proven*. `AGENTS.md` covers rules that apply to every phase; this file covers Phase 1 only, plus the locked decisions later phases must stay compatible with.

---

## Implementation status

- **Phase 1 implemented.** Firebase init from `.env`, login page, admin gate (`admins/{uid}`), route guards, password-reset flow, app shell, and security rules are in place.
- Verified locally: `npm run lint` clean; `npm run test:run` → 10 files / 69 tests passing; `npm run build` succeeds (warns that the Firebase chunk exceeds 500 kB — expected, code-split later).
- `.env` is populated and gitignored; `.env.example` holds placeholders.
- Firebase provisioning done for `rajarata-engineering-admin`: Firestore API enabled, database `default` created in `asia-south1` (named, because the free Spark plan blocks creating `(default)` via the API), `firestore.rules` deployed to it, Email/Password provider enabled, admin user `chamudithawaduge2346@gmail.com` present, and `admins/FmxCoF9bZZd1Rt15WewJCV5MtTF2` written with `role: owner`, `active: true`. `.firebaserc` pins the project; `firebase.json` maps the rules to database `default`.
- Still outstanding: the manual cases (LOG-012, 024, 026, 032) against the live project (they need a real browser session).
- UI theme is ported from the public site (`../rajarata-engineering-public-site`): Plus Jakarta Sans, brand red palette, Material-3 surfaces, 18px cards / 12px controls. Tokens live in `src/index.css`; the brand mark is `src/components/brand/BrandLogo.tsx`.

---

## Phase 1 — Admin Login Page

### Goal

A protected admin login surface that authenticates via Firebase Authentication, verifies the user is a provisioned **admin**, and gates the entire CRUD dashboard behind that session. No dashboard features are built in this phase; only the auth shell and a placeholder protected route so the gate can be proven.

### In scope

- Firebase SDK initialization (`src/lib/firebase.ts`) and typed env access.
- Login page (email + password) with client-side validation, loading, and mapped error states.
- "Forgot password" flow via `sendPasswordResetEmail`.
- Email/password authentication via `signInWithEmailAndPassword`.
- Admin authorization check against Firestore `admins/{uid}`.
- Session persistence + auth-state bootstrap via `onAuthStateChanged`.
- Route guarding: protected routes, guest-only login route, redirect-back-after-login.
- Placeholder `/dashboard` page and app-level `AdminLayout` shell.
- Sign-out control in the shell.
- Firebase Security Rules for `admins/*`.
- Unit + integration tests for everything above (see test cases).
- Tailwind CSS wired up (v4) so the login page is actually styled.

### Out of scope (later phases)

- CRUD for contact info, hero, services, gallery (Phase 2+).
- Firebase Storage uploads and media management.
- Admin user management UI (admins are provisioned manually in Firebase Console).
- Self-service registration. **There is no public sign-up in this product.**
- "Remember me" toggle, MFA, social SSO, magic links.
- Toast/notification system beyond the inline login feedback needed here.

---

### Locked decisions (do not silently change)

| Area | Decision | Reason |
| --- | --- | --- |
| Firebase | Modular SDK v12+, ES modules, single init module | Avoids duplicate `initializeApp` and dual session state |
| Admin identity | Auth user **plus** a Firestore doc `admins/{uid}` with `active !== false` | Firebase Auth alone cannot express "is an admin"; enables revocation without deleting the account |
| Revocation | Deleting/deactivating `admins/{uid}` blocks the next login and next protected entry | Simple, auditable, no custom-claims server needed in Phase 1 |
| Routing | `react-router-dom` v7 with `createBrowserRouter` (data router) | Guards compose as route-level wrappers, no redirect loops in components |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` plugin, `@import "tailwindcss"` in `src/index.css` | Current Tailwind; no `tailwind.config.js`/`postcss.config.js` needed |
| Forms | `react-hook-form` + `zod` | Same pattern must be reused for every Phase 2 CRUD form |
| Persistence | Firebase default `browserLocalPersistence` | Session survives reload; no toggle in Phase 1 |
| Env | `.env` is the **only** source of Firebase config (Authentication + Firestore); key names are `VITE_FIREBASE_*`, validated at startup, fail fast | Matches `AGENTS.md`; no business data and no hardcoded config in source |
| Error wording | One generic credential message for all auth credential failures | Prevents email enumeration |

### Dependencies added in this phase (installed)

Runtime:

- `firebase`
- `react-router-dom`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`

Dev:

- `tailwindcss`
- `@tailwindcss/vite`
- `vitest`
- `jsdom`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`

> Do not add `dotenv`, an axios wrapper, or a state library (Redux/Zustand) in Phase 1. Firebase + React context is sufficient.
> Vite loads `.env` automatically, so `dotenv` is never needed here.

---

### Environment configuration (`.env`) — required

`.env` exists at the repo root and is ignored by `.gitignore`. Fill it with the six required values below before the login page can run; an empty or partial `.env` must fail fast rather than render. Every value comes from **Firebase Console → Project settings → General → Your apps → Web app (`</>`)**. The seventh key is optional (see the database note after the table).

`.env` (real values — never committed):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_ID=
```

`.env.example` (committed, placeholders only, same keys):

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
VITE_FIREBASE_DATABASE_ID=default
```

How each key is consumed:

| Env key | Feeds | Phase |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | `initializeApp` config → Authentication + Firestore requests | 1 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `initializeApp` config → Authentication | 1 |
| `VITE_FIREBASE_PROJECT_ID` | `initializeApp` config → **Firestore project** selection | 1 |
| `VITE_FIREBASE_APP_ID` | `initializeApp` config → app identity | 1 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `initializeApp` config | 1 |
| `VITE_FIREBASE_STORAGE_BUCKET` | `initializeApp` config → Firebase Storage | reserved; read in Phase 1, used in Phase 2 |
| `VITE_FIREBASE_DATABASE_ID` *(optional)* | `getFirestore(app, …)` → **Firestore database** selection; defaults to `(default)` when unset | 1 |

Constraints:

- Firestore needs no separate URL; `firebase.ts` calls `getFirestore(app, env.VITE_FIREBASE_DATABASE_ID)`.
- **This deployment uses the named database `default`, not `(default)`.** Google blocks creating the standard `(default)` database through the API on the free Spark plan (`This API method requires billing to be enabled`), so `databases/default` was created in `asia-south1` instead. Consequences: the value must stay in sync with `"database"` in `firebase.json` (rules are per database), and any future Admin SDK / Cloud Functions code must pass the same id. Switching to `(default)` later is an env + `firebase.json` change only — no code change.
- No Firebase value may appear anywhere in `src/` — only `VITE_FIREBASE_*` references via `src/lib/env.ts`.
- `VITE_*` values are embedded in the client bundle and are **public by design**. The API key is not a secret; access is enforced by Firebase Security Rules, not by hiding these values.
- Changing `.env` requires restarting `npm run dev` (Vite does not hot-reload env values).
- Never add `VITE_` keys for site content (WhatsApp number, phone, hero text). Those live in Firestore, per `AGENTS.md`.

Setup prerequisites for anyone running Phase 1: fill `.env` (including `VITE_FIREBASE_DATABASE_ID`), enable **Email/Password** under Firebase Console → Authentication → Sign-in method, create the Firestore database named in that variable, deploy the rules (`npm run deploy:rules`), and provision the signing-in user plus their `admins/{uid}` document.

---

### Folder structure (as implemented)

```
.
├─ .env.example                     # placeholder VITE_FIREBASE_* values (committed)
├─ .env                             # real Firebase keys; gitignored
├─ .firebaserc                      # pins CLI project to rajarata-engineering-admin
├─ firebase.json                    # maps firestore.rules to named database "default"
├─ firestore.rules                  # default-deny + admins/{uid} self-read
├─ index.html                       # noindex, theme-color, Plus Jakarta Sans from Google Fonts
├─ Log-In-page-bg.png                # login backdrop source (design original; not shipped)
├─ public/login-bg.webp              # optimised login backdrop used by LoginPage (120 kB)
├─ public/favicon.svg               # brand mark (dark tile, red bolt, orange dot)
├─ package.json                     # dev/build/lint/preview/test/test:run
├─ tsconfig.json / tsconfig.app.json / tsconfig.node.json
├─ vite.config.ts                   # react + tailwind plugins + vitest `test` block
└─ src/
   ├─ main.tsx                      # createRoot + index.css
   ├─ App.tsx                       # AuthProvider + RouterProvider only
   ├─ index.css                     # @theme tokens mirrored from the public site + base styles
   ├─ test/
   │  └─ setup.ts                   # jest-dom matchers + RTL cleanup
   ├─ lib/
   │  ├─ env.ts                     # validates VITE_FIREBASE_*, throws listing missing keys
   │  ├─ firebase.ts                # single initializeApp; exports app, auth, db
   │  └─ __tests__/
   │     ├─ env.test.ts
   │     └─ firebase.test.ts
   ├─ components/
   │  ├─ brand/
   │  │  └─ BrandLogo.tsx           # brand mark mirrored from the public site Logo.astro
   │  ├─ ui/
   │  │  ├─ Button.tsx              # variants, loading spinner, disabled/aria-busy
   │  │  ├─ TextField.tsx           # label + input + error/hint + aria wiring
   │  │  ├─ PasswordField.tsx       # TextField + show/hide toggle (aria-pressed)
   │  │  ├─ Alert.tsx               # error/info/success inline message (role=alert/status)
   │  │  └─ FullPageSpinner.tsx     # auth-bootstrap loading state
   │  └─ layout/
   │     └─ AdminLayout.tsx         # protected shell: header, admin email, sign out, <Outlet/>
   ├─ routes/
   │  ├─ paths.ts                   # ROUTES constants (root, login, dashboard)
   │  ├─ redirect.ts                # getRedirectTarget: same-origin return path validation
   │  ├─ router.tsx                 # createBrowserRouter; composes guards + pages
   │  └─ __tests__/
   │     └─ redirect.test.ts
   ├─ pages/
   │  ├─ DashboardPage.tsx          # Phase 2 placeholder
   │  └─ NotFoundPage.tsx           # public 404
   └─ features/
      └─ auth/
         ├─ types.ts                # AuthUser, AdminProfile, AuthStatus, AuthErrorCode
         ├─ authService.ts          # signInAdmin, signOutAdmin, sendAdminResetEmail, fetchAdminProfile
         ├─ errors.ts               # Firebase code -> AuthErrorCode -> user message
         ├─ context.ts              # AuthContext + AuthContextValue (no JSX)
         ├─ AuthProvider.tsx        # single onAuthStateChanged subscription + login/logout
         ├─ useAuth.ts              # typed hook; throws outside the provider
         ├─ schema.ts               # zod loginSchema + resetSchema
         ├─ components/
         │  ├─ LoginForm.tsx        # RHF + zod, submit states, redirect after login
         │  └─ ForgotPasswordDialog.tsx  # reset-email request with neutral confirmation
         ├─ pages/
         │  └─ LoginPage.tsx        # composition: branding + LoginForm
         ├─ guards/
         │  ├─ RequireAdmin.tsx     # spinner / redirect to login / <Outlet/>
         │  └─ GuestOnly.tsx        # redirects authenticated admins away from /login
         └─ __tests__/
            ├─ errors.test.ts
            ├─ schema.test.ts
            ├─ authService.test.ts
            ├─ AuthProvider.test.tsx
            ├─ LoginForm.test.tsx
            ├─ guards.test.tsx
            └─ LoginPage.test.tsx
```

`AuthContext.tsx` from the earlier draft was split into `context.ts` (context object + value type) and `AuthProvider.tsx` (component) so the provider file exports only a component and satisfies `react/only-export-components`. `AuthErrorAlert.tsx` and `ForbiddenPage.tsx` were not needed in Phase 1; error rendering lives in `Alert` + `LoginForm`.

Rules for this tree:

- All auth logic lives under `src/features/auth/`; pages and guards import from the feature, never from `firebase/auth` directly.
- `LoginPage.tsx` is composition only — no Firebase imports, no validation logic. It renders the dark hero: `public/login-bg.webp` (`object-cover`) under two scrims, `BrandLogo variant="dark"`, and the form card (`bg-auth-surface-raised/80` + `backdrop-blur-xl`, red top border). Works with no JavaScript-driven layout.
- Form controls on the hero pass `tone="dark"` (`TextField`/`PasswordField`), which swaps label/input/error/hint colours to the `auth-*` tokens and sets `[color-scheme:dark]` so browser autofill stays dark. The default `tone="light"` is what Phase 2 forms use.
- `src/lib/firebase.ts` is the only file allowed to call `initializeApp` / `getAuth` / `getFirestore`.
- Components in `src/components/ui/` must stay domain-agnostic so Phase 2 forms reuse them unchanged.

---

### File-by-file specification

#### `src/lib/env.ts`

- Single reader of `.env`. Reads `import.meta.env` for exactly: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. The optional `VITE_FIREBASE_DATABASE_ID` is read too and falls back to `(default)` when empty.
- Exports a frozen typed object. If any required value is missing/empty, throw one error listing every missing key, e.g. `Missing Firebase env vars: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID`. Optional keys never throw.
- Never substitute a default, placeholder, or demo project for a missing key.
- Never logs values (they are public, but logging config is noise and leaks project IDs into shared logs).
- Fail-fast must happen during `main.tsx` startup, before render, so a half-configured app never shows a login form.

#### `src/lib/firebase.ts`

- The only module that imports `initializeApp`, `getAuth`, `getFirestore`.
- Builds the config object from `env` (see key mapping table above) and calls `initializeApp` exactly once.
- Exports `app`, `auth`, `db`. `auth` powers the login page; `db` is the Firestore database — Phase 1 only reads `admins/{uid}` from it.
- Firebase Storage is intentionally **not** initialized until Phase 2, even though `VITE_FIREBASE_STORAGE_BUCKET` is already present in `.env`.
- No `console.log` of config, and no hardcoded fallback config if `env` is missing (importing `env` guarantees validation already ran).

#### `src/features/auth/types.ts`

- `AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'`.
- `AdminProfile = { uid, email, displayName?, role: 'owner' | 'admin', active: boolean }`.
- `AuthErrorCode` union covering: `invalid-credentials`, `invalid-email`, `user-disabled`, `too-many-requests`, `network`, `not-admin`, `provider-disabled`, `domain-not-authorized`, `firestore-not-ready`, `firestore-permission-denied`, `config-error`, `unknown`.

#### `src/features/auth/errors.ts`

Single mapping table from Firebase error `code` to `AuthErrorCode` to a user-facing string. Must not leak implementation detail. Unknown codes collapse to `unknown`.

| Firebase code | AuthErrorCode | User-facing message |
| --- | --- | --- |
| `auth/invalid-credential` | `invalid-credentials` | Email or password is incorrect. |
| `auth/wrong-password` | `invalid-credentials` | Email or password is incorrect. |
| `auth/user-not-found` | `invalid-credentials` | Email or password is incorrect. |
| `auth/invalid-email` | `invalid-email` | Enter a valid email address. |
| `auth/user-disabled` | `user-disabled` | This account has been disabled. Contact the site owner. |
| `auth/too-many-requests` | `too-many-requests` | Too many attempts. Wait a few minutes and try again. |
| `auth/network-request-failed` | `network` | Network error. Check your connection and try again. |
| `auth/operation-not-allowed` | `provider-disabled` | Email/password sign-in is disabled. Enable it under Authentication > Sign-in method. |
| `auth/unauthorized-domain` | `domain-not-authorized` | Add this domain under Authentication > Settings > Authorized domains. |
| `auth/configuration-not-found` | `config-error` | Firebase is misconfigured; check `VITE_FIREBASE_*` in `.env`. |
| `auth/invalid-api-key` | `config-error` | Firebase is misconfigured; check `VITE_FIREBASE_*` in `.env`. |
| `permission-denied` (Firestore) | `firestore-permission-denied` | Firestore denied access to the admin record; deploy `firestore.rules`. |
| `failed-precondition`, `not-found` (Firestore) | `firestore-not-ready` | Firestore is not set up for this project; create the database. |
| `unavailable`, `deadline-exceeded` (Firestore) | `network` | Network error. Check your connection and try again. |
| anything else | `unknown` | Sign-in is temporarily unavailable. Please try again. |

`not-admin` is produced by `authService`, not by Firebase.

The admin check runs against Firestore *after* the credential sign-in, so Firestore codes map here too. Outside tests the raw code is logged as `[auth] <mapped-code> (raw: <firebase-code>)` so a vague message can be traced from the console.

#### `src/features/auth/authService.ts`

Exports plain async functions (no React), so they are unit-testable with `vi.mock`:

- `signInAdmin(email: string, password: string): Promise<AdminProfile>` — trim email; `signInWithEmailAndPassword`; fetch `admins/{uid}`; if doc missing or `active === false`, immediately `signOut` and throw `not-admin`; otherwise return the profile.
- `signOutAdmin(): Promise<void>`.
- `sendAdminResetEmail(email: string): Promise<void>` — always resolves the same neutral way for existing and unknown emails.
- `fetchAdminProfile(uid: string): Promise<AdminProfile | null>` — `getDoc(doc(db, 'admins', uid))`, no `console.log` of data.

#### `src/features/auth/context.ts` + `AuthProvider.tsx` + `useAuth.ts`

- `context.ts` holds `AuthContext` and `AuthContextValue` (no JSX) so the provider file exports a component only.
- On mount, subscribe to `onAuthStateChanged`. While the first callback has not fired, `status === 'loading'`.
- On an authenticated Firebase user, re-check `admins/{uid}` (revocation support). If the check fails or the admin is inactive, sign out and set `unauthenticated` with a `not-admin` error surfaced to the login page.
- Exposes: `status`, `user`, `admin`, `error`, `login(email, password)`, `logout()`, `clearError()`.
- `login` resolves with the mapped `AuthError` (or `null` on success) instead of throwing, so the form does not need a try/catch.
- `useAuth()` throws a descriptive error if used outside the provider.

#### `src/features/auth/guards/RequireAdmin.tsx`

- `loading` → render `FullPageSpinner`, never the protected content.
- `unauthenticated` → `<Navigate to="/login" replace state={{ from: location }} />`.
- authenticated but no admin profile → sign out, redirect to `/login` with a `not-admin` state.
- otherwise → render `<Outlet />`.

#### `src/features/auth/guards/GuestOnly.tsx`

- `loading` → spinner.
- authenticated admin → redirect to `/dashboard`.
- otherwise → render `<Outlet />` (so `/login` is reachable).

#### `src/routes/router.tsx`

```
/                 -> redirect to /dashboard (guarded)
/login            -> GuestOnly -> LoginPage
/dashboard        -> RequireAdmin -> AdminLayout -> DashboardPage
*                 -> NotFoundPage
```

#### Login page UX contract (must be implemented, and is tested)

- Fields: Email (`type="email"`, `autoComplete="username"`, `autoFocus`), Password (`type="password"`, `autoComplete="current-password"`, show/hide toggle with `aria-pressed`).
- Validation runs on submit and on blur; the submit handler never fires a network call when the schema fails.
- While the request is in flight: submit button shows a spinner and is disabled, both fields are disabled, a second click cannot issue a second request.
- On failure: inline `Alert` with the mapped message, `role="alert"` / `aria-live="polite"`, focus moves to the error or the first invalid field; the email value is preserved and the password is cleared.
- On success: redirect to the `from` location if present and same-origin, else `/dashboard`. Never redirect to an external URL.
- `Forgot password` opens the reset flow; it never reveals whether the email exists.
- Layout works at 360px width and on desktop; no horizontal scroll; visible focus rings; all targets ≥ 40px tall.
- No credentials are logged to the console, and no error object is rendered raw to the user.

---

### Security Rules (Phase 1)

`firestore.rules` — only an admin can read their own admin record; nobody can write it from the client (provisioning is manual).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Notes:

- The catch-all deny is deliberate: Phase 2 content paths must be added explicitly with their own rules, not inherited.
- Storage rules are deferred to Phase 2; do not enable client uploads before then.

---

### Test strategy

- Runner: Vitest 5 + jsdom, configured in the `test` block of `vite.config.ts`, with `src/test/setup.ts` registering `@testing-library/jest-dom` and RTL cleanup. Globals are **off**: import `describe`, `it`, `expect`, `vi` from `vitest`.
- Levels used in Phase 1:
  - **Unit** — `errors.ts`, `schema.ts`, `authService.ts`, `env.ts`, `firebase.ts`, `redirect.ts` (mock `firebase/app`|`firebase/auth`|`firebase/firestore` and `src/lib/firebase`, assert config, call sequence, and error translation). No network, no emulator.
  - **Integration** — `AuthProvider`, `LoginForm`, guards, `LoginPage` with React Testing Library and `user-event`, using a mocked `authService` / fake `onAuthStateChanged`.
  - **Manual** — real Firebase project checks that cannot be asserted cheaply in jsdom (persistence across reload, real rate limiting).
- Do not test Firebase SDK internals. Assert on your own service boundary and rendered output.
- E2E (Playwright) is intentionally not part of Phase 1.

Test data (assumed seeded in a dev/staging Firebase project):

| Alias | Value | Purpose |
| --- | --- | --- |
| `ADMIN_EMAIL` | `admin@rajarata.test` | Active admin |
| `ADMIN_PASSWORD` | `CorrectHorse1!` | Valid password |
| `WRONG_PASSWORD` | `NotThePassword9!` | Credential failure |
| `UNKNOWN_EMAIL` | `nobody@rajarata.test` | Enumeration check |
| `NON_ADMIN_EMAIL` | `user@rajarata.test` | Auth user with no `admins` doc |
| `INACTIVE_ADMIN_EMAIL` | `inactive@rajarata.test` | `admins/{uid}.active === false` |
| `DISABLED_EMAIL` | `disabled@rajarata.test` | Firebase `user-disabled` |
| `MALFORMED_EMAIL` | `admin@` | Client-side validation |

Scripts (already in `package.json`):

- `test` → `vitest` (watch)
- `test:run` → `vitest run`
- Single test file: `npm run test:run -- src/features/auth/__tests__/authService.test.ts`

Test files shipped with Phase 1:

| File | Covers |
| --- | --- |
| `src/lib/__tests__/env.test.ts` | Config read, trimming, fail-fast missing keys (LOG-028) |
| `src/lib/__tests__/firebase.test.ts` | `initializeApp` gets env values; single init (LOG-033) |
| `src/features/auth/__tests__/errors.test.ts` | Firebase code → message mapping (LOG-003, 007, 008, 011, 012, 013) |
| `src/features/auth/__tests__/schema.test.ts` | Email/password validation (LOG-005, 006, 020) |
| `src/features/auth/__tests__/authService.test.ts` | Sign-in + admin gate + sign-out + reset (LOG-001, 002, 009, 010, 014, 018, 019) |
| `src/features/auth/__tests__/AuthProvider.test.tsx` | Bootstrap, session restore, login/logout state (LOG-001, 009, 014, 025, 026) |
| `src/features/auth/__tests__/LoginForm.test.tsx` | Validation, submit states, error focus, toggle, reset dialog (LOG-005, 006, 007, 015, 016, 017, 018, 019, 020) |
| `src/features/auth/__tests__/guards.test.tsx` | Protected/guest routing and loading states (LOG-021, 022, 023, 024) |
| `src/features/auth/__tests__/LoginPage.test.tsx` | Login page composition + session error surface (LOG-009, 010) |
| `src/routes/__tests__/redirect.test.ts` | Same-origin redirect safety (LOG-021) |

Note: the table below is the execution log; `Actual Results` stays `Not run` until each case is exercised. Automated coverage is provided by the Vitest suite above, and the cases marked **(Manual)** still require a real Firebase project.

---

### Test cases

Each case below must be automated unless marked **(Manual)**. `Actual Results` is filled during execution.

| Test Case ID | Test Case Scenario | Test Case | Pre-Conditions | Test Steps | Test Data | Expected Results | Post-Condition | Actual Results |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LOG-001 | Successful admin login (happy path) | Active admin signs in with valid credentials | App running; `admins/{uid}` exists with `active: true`; user on `/login` | 1. Open `/login` 2. Enter `ADMIN_EMAIL` 3. Enter `ADMIN_PASSWORD` 4. Click Sign in | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Auth resolves; `admins/{uid}` read; landing on `/dashboard`; `status === 'authenticated'`; no console errors | Admin session active and persists for subsequent requests | Not run |
| LOG-002 | Email normalization | Leading/trailing whitespace in email is trimmed | Same as LOG-001 | 1. Enter `  ADMIN_EMAIL  ` 2. Enter `ADMIN_PASSWORD` 3. Submit | Padded `ADMIN_EMAIL` | Login succeeds; the trimmed email is what is sent to Firebase | Session active | Not run |
| LOG-003 | Password is case-sensitive | Login rejected when password case is altered | Same as LOG-001 | 1. Enter `ADMIN_EMAIL` 2. Enter lowercase-cased password 3. Submit | `ADMIN_EMAIL`, `correcthorse1!` | Login fails with `invalid-credentials` message; no session created | User remains on `/login` | Not run |
| LOG-004 | Keyboard submit | Enter key in password field submits the form once | User on `/login` | 1. Focus password 2. Type `ADMIN_PASSWORD` 3. Press Enter | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Exactly one sign-in request is issued; navigation to `/dashboard` | Session active | Not run |
| LOG-005 | Malformed email blocked client-side | Invalid email never reaches Firebase | User on `/login` | 1. Enter `MALFORMED_EMAIL` 2. Enter `ADMIN_PASSWORD` 3. Submit | `MALFORMED_EMAIL` | Inline validation error on email; `signInAdmin` is not called; no network request | Form still editable | Not run |
| LOG-006 | Empty submission blocked | Submitting an empty form is rejected locally | User on `/login` | 1. Leave both fields empty 2. Submit | (empty) | Both fields show required errors; no request issued | Form still editable; focus on email | Not run |
| LOG-007 | Wrong password | Valid email with wrong password | `ADMIN_EMAIL` exists | 1. Enter `ADMIN_EMAIL` 2. Enter `WRONG_PASSWORD` 3. Submit | `ADMIN_EMAIL`, `WRONG_PASSWORD` | Generic message `Email or password is incorrect.`; email preserved; password cleared; user stays on `/login` | No session; can retry | Not run |
| LOG-008 | Unknown email does not enumerate | Nonexistent account returns same message as LOG-007 | None | 1. Enter `UNKNOWN_EMAIL` 2. Enter any password 3. Submit | `UNKNOWN_EMAIL`, `WRONG_PASSWORD` | Message identical to LOG-007; no hint that the account is missing | No session | Not run |
| LOG-009 | Authenticated non-admin is rejected | Auth user without an `admins` doc cannot enter | `NON_ADMIN_EMAIL` exists in Auth, no Firestore doc | 1. Sign in with `NON_ADMIN_EMAIL` and valid password | `NON_ADMIN_EMAIL`, valid password | Firebase auth succeeds, then `signOut` is called; message reports no admin access; no dashboard content rendered | Signed out; remains outside protected routes | Not run |
| LOG-010 | Deactivated admin is rejected | `admins/{uid}.active === false` blocks access | `INACTIVE_ADMIN_EMAIL` with `active: false` | 1. Sign in with `INACTIVE_ADMIN_EMAIL` | `INACTIVE_ADMIN_EMAIL`, valid password | Access denied with not-admin message; session terminated | Signed out | Not run |
| LOG-011 | Disabled Firebase account | `auth/user-disabled` is mapped correctly | `DISABLED_EMAIL` disabled in Firebase | 1. Sign in with `DISABLED_EMAIL` | `DISABLED_EMAIL`, valid password | Message `This account has been disabled. Contact the site owner.`; no session | Signed out | Not run |
| LOG-012 | Rate limiting | Too many failed attempts is surfaced, not swallowed | Project reachable | 1. Submit wrong credentials repeatedly until Firebase throttles | `ADMIN_EMAIL`, `WRONG_PASSWORD` (repeated) | Message `Too many attempts. Wait a few minutes and try again.`; form re-enabled; no crash | Can retry after cooldown | Not run **(Manual)** |
| LOG-013 | Network failure | Offline/blocked network shows a retryable error | DevTools set to Offline | 1. Submit valid credentials while offline | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Network error message shown; button returns to enabled state; no stuck spinner | User can retry once online | Not run |
| LOG-014 | Firestore failure after auth | Admin lookup failure does not leave a half session | Firestore read forced to fail (mock or rules) | 1. Submit valid credentials for an active admin | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Error surfaced; user signed out; no partial admin state | Signed out; retry possible | Not run |
| LOG-015 | No duplicate submissions | Rapid double click issues one request | User on `/login` | 1. Fill valid credentials 2. Double click Sign in quickly | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Button disabled after first click; exactly one `signInAdmin` call | Single navigation to `/dashboard` | Not run |
| LOG-016 | Loading state during request | UI communicates progress and blocks edits | Sign-in request artificially delayed | 1. Submit valid credentials 2. Observe form while pending | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Button shows spinner and is disabled; both inputs disabled; no alternative action triggers a second request | UI returns to idle state on completion | Not run |
| LOG-017 | Password visibility toggle | Show/hide works and is announced | User on `/login` | 1. Type a password 2. Click the visibility toggle 3. Click again | Any password | Input type switches `password` ↔ `text`; icon/label updates; `aria-pressed` reflects state; value unchanged | Value preserved | Not run |
| LOG-018 | Password reset for existing account | Reset email is requested for a real admin | `ADMIN_EMAIL` exists | 1. Click Forgot password 2. Enter `ADMIN_EMAIL` 3. Submit | `ADMIN_EMAIL` | `sendPasswordResetEmail` called; neutral confirmation shown | Dialog closes; user can return to login | Not run |
| LOG-019 | Password reset does not enumerate | Reset for unknown email looks identical | None | 1. Click Forgot password 2. Enter `UNKNOWN_EMAIL` 3. Submit | `UNKNOWN_EMAIL` | Same neutral confirmation as LOG-018; no error revealing the account is missing | Dialog closes | Not run |
| LOG-020 | Password reset validation | Invalid reset email is blocked locally | Reset flow open | 1. Submit empty 2. Submit `MALFORMED_EMAIL` | (empty), `MALFORMED_EMAIL` | Required/invalid messages shown; no reset request issued | Field still editable | Not run |
| LOG-021 | Redirect back to intended route | Deep link survives the login round-trip | Admin session valid | 1. Open `/dashboard` while signed out 2. Sign in with valid admin credentials | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | After login the user lands on `/dashboard`, not a hardcoded home | On `/dashboard` | Not run |
| LOG-022 | Guest-only login route | Signed-in admin is bounced off `/login` | Admin already authenticated | 1. Navigate to `/login` | — | Redirect to `/dashboard`; login form not shown | On `/dashboard` | Not run |
| LOG-023 | Protected route blocks anonymous | No protected content flashes before redirect | No session | 1. Navigate directly to `/dashboard` | — | Immediate redirect to `/login` with `from` state; dashboard markup never rendered | On `/login` | Not run |
| LOG-024 | Auth bootstrap state | No login-page flash while auth is resolving | Session exists in storage | 1. Reload the app at `/dashboard` 2. Observe first paint | — | Full-page spinner on first paint; no flash of `/login` or of empty dashboard | Resolves to `/dashboard` | Not run **(Manual)** |
| LOG-025 | Sign out | Sign out clears the session | Admin authenticated on `/dashboard` | 1. Click Sign out 2. Press browser Back | — | Returned to `/login`; protected content not restored via Back | Signed out | Not run |
| LOG-026 | Session persistence | Session survives a full reload | Admin authenticated | 1. Reload the browser at `/dashboard` | — | Still authenticated as the same admin; no re-login prompt | Session active | Not run **(Manual)** |
| LOG-027 | Unknown route while signed out | 404 stays public and does not leak shell | No session | 1. Navigate to `/does-not-exist` | — | NotFound page renders; no admin shell or data | Still signed out | Not run |
| LOG-028 | Missing env configuration | App fails fast with an actionable error | `VITE_FIREBASE_API_KEY` removed | 1. Start the dev server 2. Load the app | Env without API key | Startup throws listing the missing key; app does not render a broken login form | Dev fixes `.env` | Not run |
| LOG-029 | Accessibility wiring | Fields, errors, and status are announced correctly | User on `/login` | 1. Inspect labels and attributes 2. Trigger validation errors 3. Trigger a credential error | `MALFORMED_EMAIL`, `WRONG_PASSWORD` | Each input has a programmatically associated label; invalid fields set `aria-invalid` and `aria-describedby`; errors announced via live region; focus moves to the first invalid field | Screen-reader-friendly form | Not run |
| LOG-030 | Keyboard-only operation | Entire flow is operable without a mouse | User on `/login` | 1. Tab through fields and controls 2. Submit 3. Open and complete reset 4. Sign out | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | All controls reachable in a logical order with visible focus; no keyboard trap | Flow completes | Not run |
| LOG-031 | No credential leakage | Secrets are not persisted or logged in plaintext | DevTools open against a real login | 1. Sign in 2. Inspect console and localStorage 3. Inspect Application storage | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Password never appears in console, localStorage, or rendered HTML; no raw Firebase error object rendered | Only SDK-managed session data exists | Not run |
| LOG-032 | Autofill compatibility | Password managers can fill the form | Browser with saved credentials | 1. Trigger autofill on `/login` | Saved credentials | Autofill fills both fields; submitted credentials are trimmed and validated normally | Login succeeds | Not run **(Manual)** |
| LOG-033 | `.env` drives Auth and Firestore | Unit test proves config comes from env, not hardcoded | `.env` populated; test mocks `import.meta.env` | 1. Mock all six `VITE_FIREBASE_*` values 2. Import `src/lib/firebase.ts` 3. Assert `initializeApp` received those exact values 4. Assert `auth` and `db` are non-null | Mocked distinct values per key, e.g. `PROJECT_ID=rajarata-test-123` | `initializeApp` called once with all six values from env; no literal project string exists in `src/`; `auth` and `db` initialized from the same `app` | Config is env-driven; swapping `.env` swaps project | Not run |

Coverage traceability:

- Happy path / session: LOG-001, 021, 022, 024, 025, 026
- Validation: LOG-005, 006, 020, 028
- Error mapping: LOG-003, 007, 008, 009, 010, 011, 012, 013, 014
- UX states: LOG-015, 016, 017, 023, 029, 030, 031, 032
- Password reset: LOG-018, 019, 020
- Normalization / edge: LOG-002, 004, 027
- Config / `.env`: LOG-028, 033

---

### Definition of Done — Phase 1

- [ ] Tailwind renders (no unstyled login page, no leftover `App.css` template styles).
- [ ] `.env` is filled with all six `VITE_FIREBASE_*` values, is gitignored, and `.env.example` commits placeholders only.
- [x] Email/Password sign-in provider is enabled in the Firebase project referenced by `.env`.
- [x] `npm run build` and `npm run lint` pass.
- [x] `npm run test:run` passes with all automated cases above green.
- [ ] LOG-012, 024, 026, 032 recorded as executed manually in the results column.
- [x] `firestore.rules` deployed (to named database `default`) and no client write path to `admins/*` exists.
- [ ] No Firebase import outside `src/lib/firebase.ts` and `src/features/auth/`.
- [ ] Signing in with a non-admin or deactivated account cannot reach `/dashboard` by any route.
- [ ] `AGENTS.md` conventions honored (no hardcoded content, no business data in `.env`, guards are not the only security layer).
