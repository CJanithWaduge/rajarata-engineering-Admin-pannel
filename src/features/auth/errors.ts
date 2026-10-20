import type { AuthError, AuthErrorCode } from './types'

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-credentials': 'Email or password is incorrect.',
  'invalid-email': 'Enter a valid email address.',
  'user-disabled': 'This account has been disabled. Contact the site owner.',
  'too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  network: 'Network error. Check your connection and try again.',
  'not-admin':
    'This account does not have admin access. Ask the site owner to add you.',
  'provider-disabled':
    'Email and password sign-in is disabled for this Firebase project. Enable it under Authentication > Sign-in method.',
  'domain-not-authorized':
    'This domain is not authorised for Firebase Authentication. Add it under Authentication > Settings > Authorized domains.',
  'firestore-not-ready':
    'Firestore is not set up for this project. Create the Firestore database in the Firebase Console for the project in .env.',
  'firestore-permission-denied':
    'Firestore denied access to the admin record. Deploy firestore.rules and check the admins collection.',
  'config-error':
    'Firebase is misconfigured. Check the VITE_FIREBASE_* values in .env against the Firebase Console.',
  unknown: 'Sign-in is temporarily unavailable. Please try again.',
}

/**
 * Firebase error codes are namespaced inconsistently:
 * Authentication uses `auth/*`, Firestore uses bare codes such as
 * `permission-denied`. Both are mapped here because the admin check runs
 * against Firestore after a successful sign-in.
 */
const FIREBASE_CODE_MAP: Record<string, AuthErrorCode> = {
  // Firebase Authentication
  'auth/invalid-credential': 'invalid-credentials',
  'auth/wrong-password': 'invalid-credentials',
  'auth/user-not-found': 'invalid-credentials',
  'auth/invalid-email': 'invalid-email',
  'auth/user-disabled': 'user-disabled',
  'auth/too-many-requests': 'too-many-requests',
  'auth/network-request-failed': 'network',
  'auth/operation-not-allowed': 'provider-disabled',
  'auth/unauthorized-domain': 'domain-not-authorized',
  'auth/configuration-not-found': 'config-error',
  'auth/invalid-api-key': 'config-error',
  'auth/api-key-not-valid': 'config-error',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'config-error',
  'auth/invalid-app-credential': 'config-error',

  // Cloud Firestore (admin profile lookup)
  'permission-denied': 'firestore-permission-denied',
  'failed-precondition': 'firestore-not-ready',
  'not-found': 'firestore-not-ready',
  unavailable: 'network',
  'deadline-exceeded': 'network',
  aborted: 'network',
  cancelled: 'network',
}

export function notAdminError(): Error {
  return Object.assign(new Error(AUTH_ERROR_MESSAGES['not-admin']), {
    code: 'not-admin',
  })
}

function readErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown }
    return typeof code === 'string' ? code : null
  }

  return null
}

export function toAuthError(error: unknown): AuthError {
  const rawCode = readErrorCode(error)
  const code: AuthErrorCode =
    rawCode === 'not-admin'
      ? 'not-admin'
      : rawCode
        ? (FIREBASE_CODE_MAP[rawCode] ?? 'unknown')
        : 'unknown'

  const mapped: AuthError = { code, message: AUTH_ERROR_MESSAGES[code] }

  // Keep the raw Firebase/Firestore code visible while developing; the
  // user-facing message stays generic in production. Skipped under Vitest.
  if (import.meta.env.MODE !== 'test') {
    console.error(
      `[auth] ${mapped.code}${rawCode && rawCode !== mapped.code ? ` (raw: ${rawCode})` : ''}`,
      error,
    )
  }

  return mapped
}
