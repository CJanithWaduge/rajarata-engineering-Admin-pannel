import { afterEach, describe, expect, it, vi } from 'vitest'

const validEnv: Record<string, string> = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef',
}

function stubValidEnv() {
  for (const [key, value] of Object.entries(validEnv)) {
    vi.stubEnv(key, value)
  }
}

describe('firebase env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reads every Firebase key from import.meta.env', async () => {
    stubValidEnv()
    vi.stubEnv('VITE_FIREBASE_DATABASE_ID', '')
    vi.resetModules()

    const { env } = await import('../env')

    expect(env).toEqual({ ...validEnv, VITE_FIREBASE_DATABASE_ID: '(default)' })
    expect(Object.isFrozen(env)).toBe(true)
  })

  it('uses the named Firestore database id when one is configured', async () => {
    stubValidEnv()
    vi.stubEnv('VITE_FIREBASE_DATABASE_ID', '  default  ')
    vi.resetModules()

    const { env } = await import('../env')

    expect(env.VITE_FIREBASE_DATABASE_ID).toBe('default')
  })

  it('trims whitespace around values', async () => {
    stubValidEnv()
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '  test-project  ')
    vi.resetModules()

    const { env } = await import('../env')

    expect(env.VITE_FIREBASE_PROJECT_ID).toBe('test-project')
  })

  it('fails fast and names every missing key', async () => {
    stubValidEnv()
    vi.stubEnv('VITE_FIREBASE_API_KEY', '')
    vi.stubEnv('VITE_FIREBASE_APP_ID', '   ')
    vi.resetModules()

    await expect(import('../env')).rejects.toThrow(
      /VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID/,
    )
  })
})
