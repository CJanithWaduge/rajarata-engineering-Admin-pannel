import { describe, expect, it } from 'vitest'
import { AUTH_ERROR_MESSAGES, notAdminError, toAuthError } from '../errors'

describe('toAuthError', () => {
  it.each([
    ['auth/invalid-credential', 'invalid-credentials'],
    ['auth/wrong-password', 'invalid-credentials'],
    ['auth/user-not-found', 'invalid-credentials'],
    ['auth/invalid-email', 'invalid-email'],
    ['auth/user-disabled', 'user-disabled'],
    ['auth/too-many-requests', 'too-many-requests'],
    ['auth/network-request-failed', 'network'],
    ['auth/operation-not-allowed', 'provider-disabled'],
    ['auth/unauthorized-domain', 'domain-not-authorized'],
    ['auth/configuration-not-found', 'config-error'],
    ['auth/invalid-api-key', 'config-error'],
    ['permission-denied', 'firestore-permission-denied'],
    ['failed-precondition', 'firestore-not-ready'],
    ['not-found', 'firestore-not-ready'],
    ['unavailable', 'network'],
    ['auth/some-new-code', 'unknown'],
  ] as const)('maps %s to %s', (firebaseCode, expectedCode) => {
    const result = toAuthError({ code: firebaseCode })

    expect(result.code).toBe(expectedCode)
    expect(result.message).toBe(AUTH_ERROR_MESSAGES[expectedCode])
  })

  it('uses the same message for every credential failure', () => {
    const messages = [
      toAuthError({ code: 'auth/invalid-credential' }).message,
      toAuthError({ code: 'auth/wrong-password' }).message,
      toAuthError({ code: 'auth/user-not-found' }).message,
    ]

    expect(new Set(messages)).toEqual(
      new Set([AUTH_ERROR_MESSAGES['invalid-credentials']]),
    )
  })

  it('recognises the not-admin error', () => {
    const result = toAuthError(notAdminError())

    expect(result).toEqual({
      code: 'not-admin',
      message: AUTH_ERROR_MESSAGES['not-admin'],
    })
  })

  it('falls back to unknown for non-error values', () => {
    expect(toAuthError(undefined).code).toBe('unknown')
    expect(toAuthError('boom').code).toBe('unknown')
    expect(toAuthError({ code: 42 }).code).toBe('unknown')
  })
})
