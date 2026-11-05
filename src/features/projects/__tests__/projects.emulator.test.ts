// @vitest-environment node
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, uploadBytes } from 'firebase/storage'
import type { ProjectNewImage, ProjectsDraft } from '../types'

/**
 * End-to-end Projects CRUD against the Firebase emulators: real Auth,
 * Firestore rules, and the named database. `npm run test:emulator` starts the
 * emulators, runs this file, then shuts them down; nothing touches production.
 */
const PROJECT_ID = 'demo-rajarata-home'
const DATABASE_ID = 'default'
const ADMIN_EMAIL = 'projects-emulator@example.test'
const NON_ADMIN_EMAIL = 'projects-non-admin@example.test'
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
let service: typeof import('../projectsContentService')
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

function payload(draft: ProjectsDraft) {
  // Mirror the document shape the admin client writes: per-project text
  // without the `alt` field, one `image` object per slot, no `images` key.
  const projects = draft.portfolio.projects.map((project) => {
    const { alt: _alt, ...text } = project

    return {
      ...text,
      image: {
        imageUrl: '',
        imagePath: '',
        imageAlt: '',
        imageWidth: 0,
        imageHeight: 0,
        imageSize: 0,
        imageContentType: '',
      },
    }
  })

  return {
    hero: draft.hero,
    portfolio: { projects },
    trackRecord: draft.trackRecord,
    cta: draft.cta,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }
}

function jpegFile(label: string): File {
  return new File(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])],
    `${label}.jpg`,
    { type: 'image/jpeg' },
  )
}

function newImage(label: string): ProjectNewImage {
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

function draftWithImage(label: string): ProjectsDraft {
  const draft = testData.validDraft()
  draft.images = draft.images.map((_, index) =>
    index === 0 ? newImage(label) : { kind: 'none' },
  )
  draft.portfolio.projects[0]!.alt = `${label} alt text`
  return draft
}

beforeAll(async () => {
  firebase = await import('../../../lib/firebase')
  service = await import('../projectsContentService')
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
  await deleteDoc(doc(firebase.db, 'site', 'projects'))
})

afterAll(async () => {
  if (!firebase) return
  await signOut(firebase.auth).catch(() => {})
})

describe('projects CRUD against the Firebase emulators', () => {
  it('reads an absent projects document without creating it', async () => {
    await expect(service.getProjectsContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('saves and reads the whole document', async () => {
    const draft = testData.validDraft()
    draft.hero.title = 'Emulator Projects Title'
    const saved = await service.saveProjectsContent(draft, uid, null)

    expect(saved.hero.title).toBe('Emulator Projects Title')
    expect(saved.updatedBy).toBe(uid)
    expect(saved.updatedAt).toBeInstanceOf(Date)

    const stored = await service.getProjectsContent()
    expect(stored.exists).toBe(true)
    expect(stored.content?.hero.title).toBe('Emulator Projects Title')
    expect(stored.content?.portfolio.projects).toHaveLength(6)
    expect(stored.content?.trackRecord.columns).toHaveLength(3)
    expect(stored.content?.updatedBy).toBe(uid)
  })

  it('saves a document that keeps the six images empty (public artwork stays)', async () => {
    const draft = testData.validDraft()
    await service.saveProjectsContent(draft, uid, null)

    const stored = await service.getProjectsContent()

    expect(stored.exists).toBe(true)
    stored.content?.portfolio.projects.forEach((project) => {
      expect(project.image.url).toBe('')
      expect(project.alt).toBe('')
    })
  })

  it('uploads a card image and reads the same file back from Storage', async () => {
    const saved = await service.saveProjectsContent(
      draftWithImage('card-one'),
      uid,
      null,
    )

    expect(saved.portfolio.projects[0]?.image.path).toMatch(/^projects\/cards\/1\//)
    expect(saved.portfolio.projects[0]?.image.url).toContain('127.0.0.1:9199')

    const response = await fetch(saved.portfolio.projects[0]?.image.url ?? '')
    expect(response.status).toBe(200)

    const stored = await service.getProjectsContent()
    expect(stored.content?.portfolio.projects[0]?.image.url).toBe(
      saved.portfolio.projects[0]?.image.url,
    )
    expect(stored.content?.portfolio.projects[0]?.image.alt).toBe(
      'card-one alt text',
    )
    expect(stored.content?.portfolio.projects[1]?.image.url).toBe('')
  })

  it('deletes the replaced card image object after a second save', async () => {
    const first = await service.saveProjectsContent(
      draftWithImage('card-one'),
      uid,
      null,
    )
    const replaced = first.portfolio.projects[0]?.image
    expect((await fetch(replaced?.url ?? '')).status).toBe(200)

    const second = await service.saveProjectsContent(
      draftWithImage('card-two'),
      uid,
      first,
    )

    expect(second.portfolio.projects[0]?.image.path).not.toBe(replaced?.path)
    expect((await fetch(replaced?.url ?? '')).status).toBe(404)

    const stored = await service.getProjectsContent()
    expect(stored.content?.portfolio.projects[0]?.image.path).toBe(
      second.portfolio.projects[0]?.image.path,
    )
  })

  it('replaces the document on a second save', async () => {
    const first = testData.validDraft()
    await service.saveProjectsContent(first, uid, null)

    const second = testData.validDraft()
    second.cta.title = 'Updated CTA title'
    const previous = (await service.getProjectsContent()).content
    await service.saveProjectsContent(second, uid, previous)

    const stored = await service.getProjectsContent()
    expect(stored.content?.cta.title).toBe('Updated CTA title')
  })

  it('deletes the projects document', async () => {
    await service.saveProjectsContent(testData.validDraft(), uid, null)
    await deleteDoc(doc(firebase.db, 'site', 'projects'))

    await expect(service.getProjectsContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
  })

  it('allows public reads but rejects anonymous writes', async () => {
    await service.saveProjectsContent(testData.validDraft(), uid, null)
    await signOut(firebase.auth)

    const publicRead = await service.getProjectsContent()
    expect(publicRead.exists).toBe(true)

    await expect(
      setDoc(doc(firebase.db, 'site', 'projects'), payload(testData.validDraft())),
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
      setDoc(doc(firebase.db, 'site', 'projects'), payload(testData.validDraft())),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    await signInWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  })

  it('rejects a top-level contact or footer key', async () => {
    await expect(
      setDoc(doc(firebase.db, 'site', 'projects'), {
        ...payload(testData.validDraft()),
        phone: '+94 25 000 0000',
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('rejects anonymous Storage writes to the projects/cards path', async () => {
    await signOut(firebase.auth)

    await expect(
      uploadBytes(
        ref(firebase.storage, `projects/cards/1/${Date.now()}-anonymous.jpg`),
        jpegFile('anonymous'),
        { contentType: 'image/jpeg' },
      ),
    ).rejects.toMatchObject({ code: 'storage/unauthorized' })

    await signInWithEmailAndPassword(firebase.auth, ADMIN_EMAIL, PASSWORD)
  })

  it('rejects the wrong fixed counts', async () => {
    const draft = testData.validDraft()
    draft.portfolio.projects = draft.portfolio.projects.slice(0, 5)

    await expect(
      setDoc(doc(firebase.db, 'site', 'projects'), payload(draft)),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})
