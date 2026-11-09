import { getAboutContent, saveAboutContent } from '../about/aboutContentService'
import { SEED_ABOUT } from '../about/seed-data'
import { getHomeContent, saveHomeContent } from '../home/homeContentService'
import { seedHomeDraft } from '../home/seed-data'
import { PROJECT_COUNT } from '../projects/constants'
import {
  getProjectsContent,
  saveProjectsContent,
} from '../projects/projectsContentService'
import { SEED_PROJECTS } from '../projects/seed-data'
import { saveServicesContent } from '../services/servicesContentService'
import { SEED_SERVICES } from '../services/seed-data'
import type { AboutContent, AboutDraft } from '../about/types'
import type { HomeContent } from '../home/types'
import type { ProjectsContent, ProjectsDraft } from '../projects/types'

export type SeedSummary = {
  /** Human-readable page names that were written. */
  pages: string[]
}

/**
 * Seeding only covers the pages whose copy is stored as plain text: Services,
 * About, Projects, the featured Home project cards, and the three Home service
 * cards. Home images are retained when present; no media is invented.
 * Settings contact details come from the public site's build-time environment,
 * so they are not written here.
 */
function toAboutDraft(content: AboutContent): AboutDraft {
  const { heritage, visionMission, pillars, methodology, industries, cta, hero } =
    content

  return {
    heritage,
    visionMission,
    pillars,
    methodology,
    industries,
    cta,
    hero: {
      eyebrow: hero.eyebrow,
      title: hero.title,
      intro: hero.intro,
      alt: hero.image.alt,
      approachLabel: hero.approachLabel,
      snapshotLabel: hero.snapshotLabel,
      snapshots: hero.snapshots,
      overlay: hero.overlay,
      // An empty selection keeps the public page's build-time hero artwork.
      image: { kind: 'none' },
    },
  }
}

function toProjectsDraft(content: ProjectsContent): ProjectsDraft {
  const { hero, portfolio, trackRecord, cta } = content

  return {
    hero,
    // The stored content keeps the image on each card; the form keeps the
    // images in a parallel list, so drop the card image before submitting.
    portfolio: {
      projects: portfolio.projects.map(({ image: _image, ...project }) => project),
    },
    trackRecord,
    cta,
    images: Array.from({ length: PROJECT_COUNT }, () => ({ kind: 'none' as const })),
  }
}

async function previousOrNull<T>(
  load: () => Promise<{ content: T | null }>,
): Promise<T | null> {
  try {
    return (await load()).content
  } catch {
    // A malformed or unreadable document must not block seeding; there is
    // simply no previous Storage object to clean up.
    return null
  }
}

function pageError(page: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : 'Unknown error.'
  return new Error(`${page} could not be seeded. ${detail}`)
}

/**
 * Writes the public site's build-time copy into `site/services`,
 * `site/about`, and `site/projects` through the same validated save functions
 * the admin forms use. Each document is replaced, so the seeded copy is exactly
 * the public page's current wording. Existing Home images, contact details, and
 * the logo are preserved.
 */
export async function seedAllContent(uid: string): Promise<SeedSummary> {
  if (uid.trim() === '') {
    throw new Error('Sign in again before seeding content.')
  }

  const pages: string[] = []

  try {
    await saveServicesContent(SEED_SERVICES, uid)
    pages.push('Services')
  } catch (error) {
    throw pageError('Services', error)
  }

  let previousHome: HomeContent | null
  try {
    previousHome = (await getHomeContent()).content
  } catch (error) {
    throw pageError('Home', error)
  }
  try {
    await saveHomeContent(seedHomeDraft(previousHome), uid, previousHome)
    pages.push('Home')
  } catch (error) {
    throw pageError('Home', error)
  }

  const previousAbout = await previousOrNull<AboutContent>(getAboutContent)
  try {
    await saveAboutContent(toAboutDraft(SEED_ABOUT), uid, previousAbout)
    pages.push('About')
  } catch (error) {
    throw pageError('About', error)
  }

  const previousProjects =
    await previousOrNull<ProjectsContent>(getProjectsContent)
  try {
    await saveProjectsContent(toProjectsDraft(SEED_PROJECTS), uid, previousProjects)
    pages.push('Projects')
  } catch (error) {
    throw pageError('Projects', error)
  }

  return { pages }
}
