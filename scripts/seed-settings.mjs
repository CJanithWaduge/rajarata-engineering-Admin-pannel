/**
 * One-time seed for the `site/settings` singleton.
 *
 * Usage (from the admin-panel repo root):
 *
 *   node scripts/seed-settings.mjs --email <admin-email>
 *
 * Prompts for the admin password (never echoed, never stored), signs in with
 * the Firebase Auth REST API, then writes the document with the Firestore REST
 * API so `firestore.rules` (admin-only write) is genuinely exercised.
 *
 * Values come from `--phone`, `--whatsapp`, `--email-address`, `--address`,
 * `--facebook`, `--location` or from SEED_* environment variables. Nothing is
 * hardcoded here — this script must stay free of site content.
 *
 * Refuses to overwrite an existing document unless `--force` is passed.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const API_KEY = process.env.VITE_FIREBASE_API_KEY;
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const DATABASE_ID = process.env.VITE_FIREBASE_DATABASE_ID || '(default)';

const DOC_PATH = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/site/settings`;
const BASE = 'https://firestore.googleapis.com/v1';

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (!API_KEY || !PROJECT_ID) {
  fail(
    'VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID must be set.\n' +
      '  PowerShell:  node --env-file=.env scripts/seed-settings.mjs --email <admin>',
  );
}

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const adminEmail = flag('email');
if (!adminEmail) {
  fail('Pass the admin account with --email <address> so the write is authenticated.');
}

const values = {
  phone: flag('phone') ?? process.env.SEED_PHONE ?? '',
  whatsapp: flag('whatsapp') ?? process.env.SEED_WHATSAPP ?? '',
  email: flag('email-address') ?? process.env.SEED_EMAIL ?? '',
  address: flag('address') ?? process.env.SEED_ADDRESS ?? '',
  facebookUrl: flag('facebook') ?? process.env.SEED_FACEBOOK_URL ?? '',
  location: flag('location') ?? process.env.SEED_LOCATION ?? '',
};

const rl = createInterface({ input: stdin, output: stdout });
const password = await rl.question(`Password for ${adminEmail}: `);
rl.close();

if (!password) fail('No password entered.');

// 1. Sign in — need an ID token so the admin-only write rule can pass.
const signInRes = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password, returnSecureToken: true }),
  },
);

if (!signInRes.ok) {
  const err = await signInRes.json().catch(() => ({}));
  fail(`Sign-in failed: ${err?.error?.message ?? signInRes.status}`);
}

const { idToken, localId } = await signInRes.json();
console.log(`✓ Signed in as ${adminEmail} (uid ${localId})`);

// 2. Refuse to clobber an existing document unless --force.
const existingRes = await fetch(`${BASE}/${DOC_PATH}?key=${API_KEY}`);
if (existingRes.ok && !has('force')) {
  const existing = await existingRes.json();
  console.log('\n⚠  site/settings already exists:');
  console.log(JSON.stringify(existing.fields ?? {}, null, 2));
  fail('Refusing to overwrite. Re-run with --force if you really mean to replace it.');
}
if (existingRes.status === 403) {
  fail('Read was denied (403). Deploy firestore.rules from the admin-panel repo first.');
}

// 3. Write with the admin token, so the rule is genuinely exercised.
const fields = Object.fromEntries(
  Object.entries(values).map(([key, value]) => [key, { stringValue: value ?? '' }]),
);

const writeRes = await fetch(`${BASE}/${DOC_PATH}?key=${API_KEY}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    fields: {
      ...fields,
      updatedAt: { timestampValue: new Date().toISOString() },
      updatedBy: { stringValue: localId },
    },
  }),
});

if (!writeRes.ok) {
  const err = await writeRes.json().catch(() => ({}));
  fail(`Write failed: ${err?.error?.message ?? writeRes.status}`);
}

const written = await writeRes.json();
console.log('\n✓ Wrote site/settings:');
console.log(JSON.stringify(written.fields ?? {}, null, 2));

// 4. Prove the public read path works unauthenticated.
const publicRes = await fetch(`${BASE}/${DOC_PATH}?key=${API_KEY}`);
console.log(
  publicRes.ok
    ? '\n✓ Anonymous read succeeded (public site can read this document).'
    : `\n✗ Anonymous read returned ${publicRes.status} — check the rules.`,
);

if (Object.values(values).every((v) => !v)) {
  console.log('\nNote: every field is empty. The public site will hide all contact rows.');
}
