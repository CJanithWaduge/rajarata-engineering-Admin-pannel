import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({
    path: `${collection}/${id}`,
  })),
  getDoc: vi.fn(),
}))

vi.mock('firebase/auth', () => authMocks)
vi.mock('firebase/firestore', () => firestoreMocks)
vi.mock('../../../lib/firebase', () => ({
  auth: { name: 'auth' },
  db: { name: 'db' },
}))

import {
  fetchAdminProfile,
  normalizeEmail,
  sendAdminResetEmail,
  signInAdmin,
  signOutAdmin,
  toAdminProfile,
} from '../authService'

const validUser = { uid: 'uid-1', email: 'admin@rajarata.test' }

function adminSnapshot(record: Record<string, unknown>) {
  return { exists: () => true, data: () => record }
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.signOut.mockResolvedValue(undefined)
    authMocks.sendPasswordResetEmail.mockResolvedValue(undefined)
    authMocks.signInWithEmailAndPassword.mockResolvedValue({ user: validUser })
    firestoreMocks.getDoc.mockResolvedValue(
      adminSnapshot({
        email: 'admin@rajarata.test',
        displayName: 'Site Admin',
        role: 'owner',
        active: true,
      }),
    )
  })

  it('signs in, trims the email, and returns the admin profile', async () => {
    const profile = await signInAdmin('  admin@rajarata.test ', 'CorrectHorse1!')

    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: 'auth' },
      'admin@rajarata.test',
      'CorrectHorse1!',
    )
    expect(firestoreMocks.getDoc).toHaveBeenCalledWith({
      path: 'admins/uid-1',
    })
    expect(profile).toEqual({
      uid: 'uid-1',
      email: 'admin@rajarata.test',
      displayName: 'Site Admin',
      role: 'owner',
      active: true,
    })
    expect(authMocks.signOut).not.toHaveBeenCalled()
  })

  it('signs out and rejects when the user has no admin record', async () => {
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false })

    await expect(signInAdmin('admin@rajarata.test', 'secret')).rejects.toMatchObject(
      { code: 'not-admin' },
    )
    expect(authMocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('signs out and rejects when the admin record is inactive', async () => {
    firestoreMocks.getDoc.mockResolvedValue(
      adminSnapshot({ active: false, role: 'admin' }),
    )

    await expect(signInAdmin('admin@rajarata.test', 'secret')).rejects.toMatchObject(
      { code: 'not-admin' },
    )
    expect(authMocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('signs out when the Firestore admin lookup fails', async () => {
    firestoreMocks.getDoc.mockRejectedValue(new Error('permission-denied'))

    await expect(signInAdmin('admin@rajarata.test', 'secret')).rejects.toThrow(
      'permission-denied',
    )
    expect(authMocks.signOut).toHaveBeenCalledTimes(1)
  })

  it('trims the email before sending a reset link', async () => {
    await sendAdminResetEmail('  admin@rajarata.test ')

    expect(authMocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      { name: 'auth' },
      'admin@rajarata.test',
    )
  })

  it('signs out through the Firebase SDK', async () => {
    await signOutAdmin()

    expect(authMocks.signOut).toHaveBeenCalledWith({ name: 'auth' })
  })

  it('returns null for a missing admin profile', async () => {
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false })

    await expect(fetchAdminProfile('uid-1')).resolves.toBeNull()
  })

  it('falls back to an email-keyed admin record', async () => {
    firestoreMocks.getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce(
        adminSnapshot({ email: 'admin@rajarata.test', role: 'owner', active: true }),
      )

    const profile = await fetchAdminProfile('uid-1', 'Admin@Rajarata.test')

    expect(firestoreMocks.getDoc).toHaveBeenNthCalledWith(1, { path: 'admins/uid-1' })
    expect(firestoreMocks.getDoc).toHaveBeenNthCalledWith(2, {
      path: 'admins/admin@rajarata.test',
    })
    expect(profile).toMatchObject({ uid: 'uid-1', role: 'owner', active: true })
  })

  it('rejects an email-keyed admin record that is inactive', async () => {
    firestoreMocks.getDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce(adminSnapshot({ active: false, role: 'admin' }))

    await expect(signInAdmin('admin@rajarata.test', 'secret')).rejects.toMatchObject({
      code: 'not-admin',
    })
    expect(authMocks.signOut).toHaveBeenCalledTimes(1)
  })
})

describe('admin record mapping', () => {
  it('defaults role to admin and treats missing active as active', () => {
    const profile = toAdminProfile('uid-9', 'fallback@rajarata.test', {})

    expect(profile).toEqual({
      uid: 'uid-9',
      email: 'fallback@rajarata.test',
      displayName: null,
      role: 'admin',
      active: true,
    })
  })

  it('prefers the stored email and trims values', () => {
    const profile = toAdminProfile('uid-9', 'auth@rajarata.test', {
      email: '  stored@rajarata.test ',
      displayName: '  Stored Name ',
      role: 'owner',
      active: false,
    })

    expect(profile.email).toBe('stored@rajarata.test')
    expect(profile.displayName).toBe('Stored Name')
    expect(profile.role).toBe('owner')
    expect(profile.active).toBe(false)
  })

  it('normalizes email whitespace', () => {
    expect(normalizeEmail('  a@b.com ')).toBe('a@b.com')
  })
})
