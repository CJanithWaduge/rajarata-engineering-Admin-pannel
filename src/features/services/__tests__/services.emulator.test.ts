// @vitest-environment node
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServicesFormValues } from '../types'

/**
 * End-to-end Services CRUD against the Firebase emulators: real Auth,
 * Firestore rules, and the named database. `npm run test:emulator` starts the
 * emulators, runs this file, then shuts them down; nothing touches production.
 */
const PROJECT_ID = 'demo-rajarata-home'
const DATABASE_ID = 'default'
const ADMIN_EMAIL = 'services-emulator@example.test'
const NON_ADMIN_EMAIL = 'services-non-admin@example.test'
const PASSWORD = 'emulator-password-123'

vi.stubEnv('VITE_FIREBASE_API_KEY', 'demo-api-key')
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', `${PROJECT_ID}.firebaseapp.com`)
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', PROJECT_ID)
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', `${PROJECT_ID}.appspot.com`)
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '1234567890')
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:1234567890:web:emulator')
vi.stubEnv('VITE_FIREBASE_DATABASE_ID', DATABASE_ID)
vi.stubEnv('VITE_FIREBASE_USE_EMULATOR', 'true')
vi.stubEnv('VITE_FIREBASE_INLINE_MEDIA', 'false')

let firebase: typeof import('../../../lib/firebase')
let service: typeof import('../servicesContentService')
let testData: typeof import('./testData')
let uid = ''

async function seedAdmin(adminUid: string): Promise<void> {
  const response = await fetch(
    `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/admins/${adminUid}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer owner',
      },
      body: JSON.stringify({
        fields: {
          active: { booleanValue: true },
          role: { stringValue: 'owner' },
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Could not seed the admin document: HTTP ${response.status} ${await response.text()}`,
    )
  }
}

function payload(values: ServicesFormValues) {
  return {
    ...values,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }
}

beforeAll(async () => {
  firebase = await import('../../../lib/firebase')
  service = await import('../servicesContentService')
  testData = await import('./testData')

  try {
    await createUserWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  } catch {
    await signInWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  }

  const user = firebase.auth.currentUser
  if (!user) throw new Error('Could not sign in to the Auth emulator.')

  uid = user.uid
  await seedAdmin(uid)
})

beforeEach(async () => {
  if (!firebase.auth.currentUser) {
    await signInWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  }
  await deleteDoc(doc(firebase.db, 'site', 'services'))
})

afterAll(async () => {
  if (!firebase) return
  await signOut(firebase.auth).catch(() => {})
})

describe('services CRUD against the Firebase emulators', () => {
  it('reads an absent services document without creating it', async () => {
    await expect(service.getServicesContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('saves and reads the whole document', async () => {
    const values = testData.validValues()
    values.hero.title = 'Emulator Services Title'
    const saved = await service.saveServicesContent(values, uid)

    expect(saved.hero.title).toBe('Emulator Services Title')
    expect(saved.updatedBy).toBe(uid)
    expect(saved.updatedAt).toBeInstanceOf(Date)

    const stored = await service.getServicesContent()
    expect(stored.exists).toBe(true)
    expect(stored.content?.hero.title).toBe('Emulator Services Title')
    expect(stored.content?.services).toHaveLength(8)
    expect(stored.content?.process.steps).toHaveLength(6)
    expect(stored.content?.updatedBy).toBe(uid)
  })

  it('replaces the document on a second save', async () => {
    const first = testData.validValues()
    await service.saveServicesContent(first, uid)

    const second = testData.validValues()
    second.cta.title = 'Updated CTA title'
    await service.saveServicesContent(second, uid)

    const stored = await service.getServicesContent()
    expect(stored.content?.cta.title).toBe('Updated CTA title')
  })

  it('deletes the services document', async () => {
    await service.saveServicesContent(testData.validValues(), uid)
    await deleteDoc(doc(firebase.db, 'site', 'services'))

    await expect(service.getServicesContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('allows public reads but rejects anonymous writes', async () => {
    await service.saveServicesContent(testData.validValues(), uid)
    await signOut(firebase.auth)

    const publicRead = await service.getServicesContent()
    expect(publicRead.exists).toBe(true)

    await expect(
      setDoc(doc(firebase.db, 'site', 'services'), payload(testData.validValues())),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    await signInWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  })

  it('rejects writes from a signed-in non-admin', async () => {
    try {
      await createUserWithEmailAndPassword(
        firebase.auth,
        NON_ADMIN_EMAIL,
        PASSWORD,
      )
    } catch {
      await signInWithEmailAndPassword(firebase.auth, NON_ADMIN_EMAIL, PASSWORD)
    }

    await expect(
      setDoc(doc(firebase.db, 'site', 'services'), payload(testData.validValues())),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    await signInWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  })

  it('rejects a top-level contact or footer key', async () => {
    await expect(
      setDoc(doc(firebase.db, 'site', 'services'), {
        ...payload(testData.validValues()),
        phone: '+94 25 000 0000',
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects the wrong fixed counts', async () => {
    const values = testData.validValues()
    values.services = values.services.slice(0, 7)

    await expect(
      setDoc(doc(firebase.db, 'site', 'services'), payload(values)),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})
