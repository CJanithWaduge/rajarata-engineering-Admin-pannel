const REQUIRED_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

/**
 * Optional keys with a fallback, so a missing value is never fatal.
 *
 * `VITE_FIREBASE_DATABASE_ID` is the Firestore database id. It defaults to
 * `(default)`, the database every Firebase SDK uses out of the box.
 *
 * This project currently runs on a *named* database (`default`) instead:
 * Google only allows creating the standard `(default)` database through the
 * API when billing is enabled, so on the free Spark plan the Console or a
 * named database are the only options. Point this variable at `(default)`
 * once the standard database exists — no other code change is needed.
 */
const OPTIONAL_ENV_DEFAULTS = {
  VITE_FIREBASE_DATABASE_ID: '(default)',
} as const

export type FirebaseEnvKey = (typeof REQUIRED_ENV_KEYS)[number]
export type OptionalEnvKey = keyof typeof OPTIONAL_ENV_DEFAULTS

export type FirebaseEnv = Record<FirebaseEnvKey, string> &
  Record<OptionalEnvKey, string>

function readFirebaseEnv(): FirebaseEnv {
  const values = {} as FirebaseEnv
  const missing: FirebaseEnvKey[] = []
  const source = import.meta.env as Record<string, string | undefined>

  for (const key of REQUIRED_ENV_KEYS) {
    const raw = source[key]
    const value = typeof raw === 'string' ? raw.trim() : ''

    if (!value) {
      missing.push(key)
      continue
    }

    values[key] = value
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(', ')}. ` +
        'Add them to .env (see .env.example) and restart the dev server.',
    )
  }

  for (const key of Object.keys(OPTIONAL_ENV_DEFAULTS) as OptionalEnvKey[]) {
    const raw = source[key]
    const value = typeof raw === 'string' ? raw.trim() : ''
    values[key] = value || OPTIONAL_ENV_DEFAULTS[key]
  }

  return Object.freeze(values)
}

export const env: FirebaseEnv = readFirebaseEnv()
