import type { HomeErrorCode } from './types'

export class HomeError extends Error {
  code: HomeErrorCode

  constructor(code: HomeErrorCode, message?: string) {
    super(message ?? mapHomeError(code))
    this.name = 'HomeError'
    this.code = code
  }
}

const messages: Record<HomeErrorCode, string> = {
  'permission-denied':
    'You do not have permission to change home page content. Check that firestore.rules and storage.rules are deployed.',
  'not-ready':
    'Firestore is not set up for this project; home page content could not be reached.',
  network: 'Network error. Check your connection and try again.',
  validation: 'Some home page values are invalid. Check the fields below.',
  upload: 'An image could not be uploaded. Check Storage rules and try again.',
  unknown: 'Could not save home page content. Please try again.',
}

export function mapHomeError(code: HomeErrorCode): string {
  return messages[code]
}

export function mapFirestoreErrorToHomeCode(code?: string): HomeErrorCode {
  const raw = code ?? ''
  if (raw === 'permission-denied') return 'permission-denied'
  if (raw === 'failed-precondition' || raw === 'not-found') return 'not-ready'
  if (raw === 'unavailable' || raw === 'deadline-exceeded') return 'network'
  if (raw === 'unauthenticated' || raw === 'cancelled') return 'network'
  return 'unknown'
}

export function mapStorageErrorToHomeCode(code?: string): HomeErrorCode {
  const raw = code ?? ''
  if (raw === 'storage/unauthorized' || raw === 'storage/unauthenticated') {
    return 'permission-denied'
  }
  if (raw === 'storage/retry-limit-exceeded' || raw === 'storage/canceled') {
    return 'network'
  }
  if (
    raw === 'storage/unknown' ||
    raw === 'storage/quota-exceeded' ||
    raw === 'storage/server-file-wrong-size'
  ) {
    return 'upload'
  }
  return 'upload'
}

export function toHomeError(error: unknown): HomeError {
  if (error instanceof HomeError) return error

  const raw = (error as { code?: string } | null)?.code ?? ''
  const code = raw.startsWith('storage/')
    ? mapStorageErrorToHomeCode(raw)
    : mapFirestoreErrorToHomeCode(raw)
  logHomeError(code, raw)
  return new HomeError(code)
}

export function logHomeError(code: HomeErrorCode, raw?: string) {
  if (import.meta.env.MODE === 'test') return
  console.error(`[home] ${code} (raw: ${raw ?? 'unknown'})`)
}
