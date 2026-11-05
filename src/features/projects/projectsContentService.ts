import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { ProjectsError, logProjectsError, toProjectsError } from './errors'
import { projectsFormSchema } from './schema'
import type { ProjectsContent, ProjectsFormValues } from './types'

const PROJECTS_REF = doc(db, 'site', 'projects')

function readTimestamp(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null
}

/**
 * The admin form writes the whole document, so a stored document that fails the
 * form schema means someone edited it by hand. Refuse it instead of filling the
 * gaps with invented copy; the page can then show a repair message.
 */
function toProjectsContent(data: Record<string, unknown>): ProjectsContent {
  const parsed = projectsFormSchema.safeParse(data)

  if (!parsed.success) {
    throw new ProjectsError('invalid-document')
  }

  return {
    ...parsed.data,
    updatedAt: readTimestamp(data.updatedAt),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
  }
}

export async function getProjectsContent(): Promise<{
  content: ProjectsContent | null
  exists: boolean
}> {
  try {
    const snapshot = await getDoc(PROJECTS_REF)
    if (!snapshot.exists()) {
      return { content: null, exists: false }
    }

    return {
      content: toProjectsContent(snapshot.data() as Record<string, unknown>),
      exists: true,
    }
  } catch (error) {
    const mapped = toProjectsError(error)
    logProjectsError(mapped.code, (error as { code?: string } | null)?.code)
    throw mapped
  }
}

/**
 * Full replace: a removed key cannot linger in the document. There are no
 * uploads to roll back, so a failed write leaves the form state untouched.
 */
export async function saveProjectsContent(
  values: ProjectsFormValues,
  uid: string,
): Promise<ProjectsContent> {
  const parsed = projectsFormSchema.safeParse(values)

  if (!parsed.success) {
    throw new ProjectsError(
      'validation',
      parsed.error.issues[0]?.message ?? undefined,
    )
  }

  try {
    await setDoc(PROJECTS_REF, {
      hero: parsed.data.hero,
      portfolio: { projects: parsed.data.portfolio.projects },
      trackRecord: { columns: parsed.data.trackRecord.columns },
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
    throw toProjectsError(error)
  }
}
