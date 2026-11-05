import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { ServicesError, logServicesError, toServicesError } from './errors'
import { servicesFormSchema } from './schema'
import type { ServicesContent, ServicesFormValues } from './types'

const SERVICES_REF = doc(db, 'site', 'services')

function readTimestamp(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null
}

/**
 * The admin form writes the whole document, so a stored document that fails the
 * form schema means someone edited it by hand. Refuse it instead of filling the
 * gaps with invented copy; the page can then show a repair message.
 */
function toServicesContent(data: Record<string, unknown>): ServicesContent {
  const parsed = servicesFormSchema.safeParse(data)

  if (!parsed.success) {
    throw new ServicesError('invalid-document')
  }

  return {
    ...parsed.data,
    updatedAt: readTimestamp(data.updatedAt),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
  }
}

export async function getServicesContent(): Promise<{
  content: ServicesContent | null
  exists: boolean
}> {
  try {
    const snapshot = await getDoc(SERVICES_REF)
    if (!snapshot.exists()) {
      return { content: null, exists: false }
    }

    return {
      content: toServicesContent(snapshot.data() as Record<string, unknown>),
      exists: true,
    }
  } catch (error) {
    const mapped = toServicesError(error)
    logServicesError(mapped.code, (error as { code?: string } | null)?.code)
    throw mapped
  }
}

/**
 * Full replace: a removed key cannot linger in the document. There are no
 * uploads to roll back, so a failed write leaves the form state untouched.
 */
export async function saveServicesContent(
  values: ServicesFormValues,
  uid: string,
): Promise<ServicesContent> {
  const parsed = servicesFormSchema.safeParse(values)

  if (!parsed.success) {
    throw new ServicesError(
      'validation',
      parsed.error.issues[0]?.message ?? undefined,
    )
  }

  try {
    await setDoc(SERVICES_REF, {
      hero: parsed.data.hero,
      directory: parsed.data.directory,
      services: parsed.data.services,
      process: parsed.data.process,
      cta: parsed.data.cta,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    })

    return {
      ...parsed.data,
      updatedAt: new Date(),
      updatedBy: uid,
    }
  } catch (error) {
    throw toServicesError(error)
  }
}
