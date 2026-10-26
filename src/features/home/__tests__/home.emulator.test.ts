// @vitest-environment node
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardDraft, HomeDraft, NewImage } from '../types'

/**
 * End-to-end CRUD against the Firebase emulators: real Auth, Firestore rules,
 * Storage rules, and Storage objects. `npm run test:emulator` starts the
 * emulators, runs this file, then shuts them down; nothing touches the live
 * project.
 */
const PROJECT_ID = 'demo-rajarata-home'
const DATABASE_ID = 'default'
const EMAIL = 'home-emulator@example.test'
const PASSWORD = 'emulator-password-123'

vi.stubEnv('VITE_FIREBASE_API_KEY', 'demo-api-key')
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', `${PROJECT_ID}.firebaseapp.com`)
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', PROJECT_ID)
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', `${PROJECT_ID}.appspot.com`)
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '1234567890')
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:1234567890:web:emulator')
vi.stubEnv('VITE_FIREBASE_DATABASE_ID', DATABASE_ID)
vi.stubEnv('VITE_FIREBASE_USE_EMULATOR', 'true')
// The emulator suite exercises the Storage path; inline media is covered by
// separate image-pipeline tests.
vi.stubEnv('VITE_FIREBASE_INLINE_MEDIA', 'false')

let firebase: typeof import('../../../lib/firebase')
let service: typeof import('../homeContentService')
let defaults: typeof import('../defaults')
let uid = ''

function jpegFile(label: string): File {
  return new File(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])],
    `${label}.jpg`,
    { type: 'image/jpeg' },
  )
}

function newImage(label: string): NewImage {
  const file = jpegFile(label)
  return {
    kind: 'new',
    file,
    previewUrl: `blob:${label}`,
    width: 1600,
    height: 1000,
    size: file.size,
    contentType: 'image/jpeg',
    originalSize: file.size,
    optimized: false,
  }
}

function cardDraft(label: string): CardDraft {
  return {
    image: newImage(label),
    alt: `${label} alt text`,
    category: 'Industrial',
    venue: 'Anuradhapura',
    topic: `${label} distribution work`,
    tag: 'MV / LV',
  }
}

function heroDraft(): HomeDraft {
  const draft = defaults.createEmptyDraft()
  draft.hero = {
    image: newImage('hero'),
    alt: 'Technician testing an electrical distribution panel',
  }
  return draft
}

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

beforeAll(async () => {
  firebase = await import('../../../lib/firebase')
  service = await import('../homeContentService')
  defaults = await import('../defaults')

  try {
    await createUserWithEmailAndPassword(firebase.auth, EMAIL, PASSWORD)
  } catch {
    await signInWithEmailAndPassword(firebase.auth, EMAIL, PASSWORD)
  }

  const user = firebase.auth.currentUser
  if (!user) throw new Error('Could not sign in to the Auth emulator.')

  uid = user.uid
  await seedAdmin(uid)
})

beforeEach(async () => {
  if (!firebase.auth.currentUser) {
    await signInWithEmailAndPassword(firebase.auth, EMAIL, PASSWORD)
  }
  await deleteDoc(doc(firebase.db, 'site', 'home'))
})

afterAll(async () => {
  if (!firebase) return
  await signOut(firebase.auth).catch(() => {})
})

describe('home CRUD against the Firebase emulators', () => {
  it('reads an absent home document', async () => {
    await expect(service.getHomeContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('creates the document and uploads the hero image', async () => {
    const saved = await service.saveHomeContent(heroDraft(), uid, null)

    expect(saved.hero.path).toMatch(/^home\/hero\//)
    expect(saved.hero.url).toContain('127.0.0.1:9199')
    expect(saved.hero.contentType).toBe('image/jpeg')

    const imageResponse = await fetch(saved.hero.url)
    expect(imageResponse.status).toBe(200)

    const stored = await service.getHomeContent()
    expect(stored.exists).toBe(true)
    expect(stored.content?.hero.url).toBe(saved.hero.url)
    expect(stored.content?.hero.alt).toBe(saved.hero.alt)
    expect(stored.content?.featuredProjects).toHaveLength(3)
    expect(
      stored.content?.featuredProjects.every((project) => project.image.url === ''),
    ).toBe(true)
  })

  it('updates text without uploading the stored hero again', async () => {
    const first = await service.saveHomeContent(heroDraft(), uid, null)

    const draft = defaults.draftFromContent(first)
    draft.hero.alt = 'Updated hero alt text for the emulator test'
    const second = await service.saveHomeContent(draft, uid, first)

    expect(second.hero.url).toBe(first.hero.url)
    expect(second.hero.path).toBe(first.hero.path)

    const stored = await service.getHomeContent()
    expect(stored.content?.hero.alt).toBe('Updated hero alt text for the emulator test')
  })

  it('uploads a card image, then deletes the replaced object', async () => {
    const draft = heroDraft()
    draft.cards[0] = cardDraft('card-one')
    const first = await service.saveHomeContent(draft, uid, null)

    const oldImage = first.featuredProjects[0]?.image
    expect(oldImage?.path).toMatch(/^home\/projects\/1\//)
    expect((await fetch(oldImage?.url ?? '')).status).toBe(200)

    const update = defaults.draftFromContent(first)
    update.cards[0] = cardDraft('card-two')
    const second = await service.saveHomeContent(update, uid, first)

    const newImageValue = second.featuredProjects[0]?.image
    expect(newImageValue?.path).not.toBe(oldImage?.path)
    expect((await fetch(newImageValue?.url ?? '')).status).toBe(200)
    expect((await fetch(oldImage?.url ?? '')).status).toBe(404)

    const stored = await service.getHomeContent()
    expect(stored.content?.featuredProjects[0]?.image.path).toBe(newImageValue?.path)
    expect(stored.content?.featuredProjects[0]?.category).toBe('Industrial')
    expect(stored.content?.featuredProjects[1]?.image.url).toBe('')
    expect(stored.content?.featuredProjects[2]?.image.url).toBe('')
  })

  it('deletes the home document', async () => {
    await service.saveHomeContent(heroDraft(), uid, null)
    await deleteDoc(doc(firebase.db, 'site', 'home'))

    await expect(service.getHomeContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('allows public reads but rejects anonymous writes', async () => {
    await service.saveHomeContent(heroDraft(), uid, null)
    await signOut(firebase.auth)

    const publicRead = await service.getHomeContent()
    expect(publicRead.exists).toBe(true)

    await expect(
      setDoc(doc(firebase.db, 'site', 'home'), {
        hero: {},
        featuredProjects: [],
        updatedAt: serverTimestamp(),
        updatedBy: 'anonymous',
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    await expect(
      uploadBytes(
        ref(firebase.storage, `home/hero/${Date.now()}-anonymous.jpg`),
        jpegFile('anonymous'),
        { contentType: 'image/jpeg' },
      ),
    ).rejects.toMatchObject({ code: 'storage/unauthorized' })

    await signInWithEmailAndPassword(firebase.auth, EMAIL, PASSWORD)
  })
})
