import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: 'app' })),
  getApps: vi.fn((): unknown[] => []),
  getApp: vi.fn(() => ({ name: 'existing-app' })),
  getAuth: vi.fn(() => ({ name: 'auth' })),
  getFirestore: vi.fn(() => ({ name: 'db' })),
}))

vi.mock('firebase/app', () => ({
  initializeApp: mocks.initializeApp,
  getApps: mocks.getApps,
  getApp: mocks.getApp,
}))

vi.mock('firebase/auth', () => ({
  getAuth: mocks.getAuth,
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: mocks.getFirestore,
}))

const validEnv = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef',
}

describe('firebase initialization', () => {
  beforeEach(() => {
    vi.resetModules()

    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value)
    }

    vi.stubEnv('VITE_FIREBASE_DATABASE_ID', 'default')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('initializes auth and firestore from .env values', async () => {
    const module = await import('../firebase')

    expect(mocks.initializeApp).toHaveBeenCalledTimes(1)
    expect(mocks.initializeApp).toHaveBeenCalledWith({
      apiKey: validEnv.VITE_FIREBASE_API_KEY,
      authDomain: validEnv.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: validEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: validEnv.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: validEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: validEnv.VITE_FIREBASE_APP_ID,
    })
    expect(mocks.getAuth).toHaveBeenCalledWith({ name: 'app' })
    expect(mocks.getFirestore).toHaveBeenCalledWith({ name: 'app' }, 'default')
    expect(module.auth).toEqual({ name: 'auth' })
    expect(module.db).toEqual({ name: 'db' })
  })

  it('reuses an existing app instead of initializing a second time', async () => {
    mocks.getApps.mockReturnValueOnce([{ name: 'existing-app' }])

    await import('../firebase')

    expect(mocks.initializeApp).not.toHaveBeenCalled()
    expect(mocks.getApp).toHaveBeenCalledTimes(1)
    expect(mocks.getAuth).toHaveBeenCalledWith({ name: 'existing-app' })
  })
})
