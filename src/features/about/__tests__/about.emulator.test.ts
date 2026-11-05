// @vitest-environment node
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AboutDraft, AboutNewImage } from '../types'

/**
 * End-to-end About CRUD against the Firebase emulators: real Auth, Firestore
 * rules, Storage rules, and the named database. `npm run test:emulator` starts
 * the emulators, runs this file, then shuts them down; nothing touches the live
 * project.
 */
const PROJECT_ID = 'demo-rajarata-home'
const DATABASE_ID = 'default'
const ADMIN_EMAIL = 'about-emulator@example.test'
const NON_ADMIN_EMAIL = 'about-non-admin@example.test'
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
let service: typeof import('../aboutContentService')
let testData: typeof import('./testData')
let uid = ''

function jpegFile(label: string): File {
  return new File(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])],
    `${label}.jpg`,
    { type: 'image/jpeg' },
  )
}

function newImage(label: string): AboutNewImage {
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

function payload(values = testData.validDraft()) {
  const content = testData.validContent()
  return {
    hero: {
      eyebrow: values.hero.eyebrow,
      title: values.hero.title,
      intro: values.hero.intro,
      snapshots: values.hero.snapshots,
      overlay: values.hero.overlay,
      image: {
        imageUrl: content.hero.image.url,
        imagePath: content.hero.image.path,
        imageAlt: content.hero.image.alt,
        imageWidth: content.hero.image.width,
        imageHeight: content.hero.image.height,
        imageSize: content.hero.image.size,
        imageContentType: content.hero.image.contentType,
      },
    },
    heritage: values.heritage,
    visionMission: values.visionMission,
    pillars: values.pillars,
    methodology: values.methodology,
    industries: values.industries,
    cta: values.cta,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }
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
  service = await import('../aboutContentService')
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
  await deleteDoc(doc(firebase.db, 'site', 'about'))
})

afterAll(async () => {
  if (!firebase) return
  await signOut(firebase.auth).catch(() => {})
})

describe('about CRUD against the Firebase emulators', () => {
  it('reads an absent about document without creating it', async () => {
    await expect(service.getAboutContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('saves and reads the whole document with a stored image', async () => {
    const draft = testData.validDraft()
    draft.hero.title = 'Emulator About Title'
    const saved = await service.saveAboutContent(draft, uid, null)

    expect(saved.hero.title).toBe('Emulator About Title')
    expect(saved.hero.image.path).toBe('about/hero/stored.webp')
    expect(saved.updatedBy).toBe(uid)
    expect(saved.updatedAt).toBeInstanceOf(Date)

    const stored = await service.getAboutContent()
    expect(stored.exists).toBe(true)
    expect(stored.content?.hero.title).toBe('Emulator About Title')
    expect(stored.content?.hero.snapshots).toHaveLength(3)
    expect(stored.content?.heritage.milestones).toHaveLength(4)
    expect(stored.content?.pillars.items).toHaveLength(5)
    expect(stored.content?.methodology.steps).toHaveLength(5)
    expect(stored.content?.industries.sectors).toHaveLength(6)
    expect(stored.content?.updatedBy).toBe(uid)
  })

  it('saves blank text and no hero image for the public fallback', async () => {
    const draft: AboutDraft = {
      ...testData.validDraft(),
      hero: {
        ...testData.validDraft().hero,
        title: '',
        alt: '',
        image: { kind: 'none' },
      },
      cta: { ...testData.validDraft().cta, title: '' },
    }

    const saved = await service.saveAboutContent(draft, uid, null)

    expect(saved.hero.title).toBe('')
    expect(saved.hero.image.url).toBe('')
    expect(saved.hero.image.alt).toBe('')
    expect(saved.cta.title).toBe('')

    const stored = await service.getAboutContent()
    expect(stored.exists).toBe(true)
    expect(stored.content?.hero.title).toBe('')
    expect(stored.content?.hero.image.url).toBe('')
    expect(stored.content?.hero.image.path).toBe('')
    expect(stored.content?.cta.title).toBe('')
  })

  it('uploads a new hero image and reads it back', async () => {
    const draft: AboutDraft = {
      ...testData.validDraft(),
      hero: { ...testData.validDraft().hero, image: newImage('about-hero') },
    }

    const saved = await service.saveAboutContent(draft, uid, null)

    expect(saved.hero.image.path).toMatch(/^about\/hero\//)
    expect(saved.hero.image.url).toContain('127.0.0.1:9199')
    expect(saved.hero.image.contentType).toBe('image/jpeg')

    const imageResponse = await fetch(saved.hero.image.url)
    expect(imageResponse.status).toBe(200)

    const stored = await service.getAboutContent()
    expect(stored.content?.hero.image.url).toBe(saved.hero.image.url)
  })

  it('replaces the document on a second save', async () => {
    const first = testData.validDraft()
    await service.saveAboutContent(first, uid, null)

    const second = testData.validDraft()
    second.cta.title = 'Updated About CTA title'
    await service.saveAboutContent(second, uid, null)

    const stored = await service.getAboutContent()
    expect(stored.content?.cta.title).toBe('Updated About CTA title')
  })

  it('deletes the about document', async () => {
    await service.saveAboutContent(testData.validDraft(), uid, null)
    await deleteDoc(doc(firebase.db, 'site', 'about'))

    await expect(service.getAboutContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('allows public reads but rejects anonymous writes', async () => {
    await service.saveAboutContent(testData.validDraft(), uid, null)
    await signOut(firebase.auth)

    const publicRead = await service.getAboutContent()
    expect(publicRead.exists).toBe(true)

    await expect(
      setDoc(doc(firebase.db, 'site', 'about'), {
        ...payload(),
        updatedBy: 'anonymous',
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    await expect(
      uploadBytes(
        ref(firebase.storage, `about/hero/${Date.now()}-anonymous.jpg`),
        jpegFile('anonymous'),
        { contentType: 'image/jpeg' },
      ),
    ).rejects.toMatchObject({ code: 'storage/unauthorized' })

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
      setDoc(doc(firebase.db, 'site', 'about'), payload()),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    await signInWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  })

  it('rejects a top-level contact or footer key', async () => {
    await expect(
      setDoc(doc(firebase.db, 'site', 'about'), {
        ...payload(),
        phone: '+94 25 000 0000',
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects the wrong fixed counts', async () => {
    const values = testData.validDraft()
    values.industries.sectors = values.industries.sectors.slice(0, 5)

    await expect(
      setDoc(doc(firebase.db, 'site', 'about'), payload(values)),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})
