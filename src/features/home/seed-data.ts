import type { CardDraft, HomeContent, HomeDraft } from './types'

/**
 * Build-time copy from the public site's Home ServicesGrid and ProjectsSection
 * components, written verbatim so seeding recreates the live page.
 * Keep this in sync with `rajarata-engineering-public-site/src/components/home/ServicesGrid.astro`.
 *
 * Project copy is seeded without inventing image URLs. Existing uploaded
 * images are retained; otherwise the public site's fallback artwork remains.
 */
export const SEED_HOME_SERVICES: HomeContent['featuredServices'] = [
  {
    icon: 'home_repair_service',
    title: 'Residential, Commercial & Industrial Electrical Installations',
    description:
      'Complete electrical wiring, power distribution, and installation for homes, offices, commercial buildings, and industrial facilities with high safety standards.',
    href: '/services#service-01',
  },
  {
    icon: 'security',
    title: 'CCTV Camera Installation & Maintenance',
    description:
      'Professional security camera setup, advanced surveillance configuration, and regular maintenance to ensure maximum protection for your premises.',
    href: '/services#service-07',
  },
  {
    icon: 'electric_meter',
    title: 'MDB / SMDB Panel Installation',
    description:
      'Expert installation, wiring, and configuration of Main Distribution Boards (MDB) and Sub Main Distribution Boards (SMDB) for reliable and efficient power control.',
    href: '/services#service-03',
  },
]

const SEED_HOME_PROJECTS: Array<Omit<CardDraft, 'image'>> = [
  {
    alt: 'Illustration of an industrial electrical distribution installation',
    category: 'Industrial',
    venue: 'Anuradhapura, Sri Lanka',
    topic: 'Industrial Power Distribution & Installations',
    tag: 'MV / LV',
  },
  {
    alt: 'Illustration of a commercial main distribution panel assembly',
    category: 'Commercial',
    venue: 'Anuradhapura, Sri Lanka',
    topic: 'MDB / SMDB Panels & Commercial Wiring',
    tag: 'Panels',
  },
  {
    alt: 'Illustration of structured cabling and building automation systems',
    category: 'ELV',
    venue: 'Anuradhapura, Sri Lanka',
    topic: 'ELV Systems & Building Automation',
    tag: 'Automation',
  },
]

function storedOrNone(image: HomeContent['hero'] | undefined) {
  return image?.url ? { kind: 'stored' as const, image } : { kind: 'none' as const }
}

/** Builds seeded Home copy while retaining any existing hero/project images. */
export function seedHomeDraft(previous: HomeContent | null = null): HomeDraft {
  return {
    hero: {
      image: storedOrNone(previous?.hero),
      alt: previous?.hero?.alt ?? '',
    },
    cards: SEED_HOME_PROJECTS.map((project, index) => {
      const previousImage = previous?.featuredProjects?.[index]?.image
      return {
        image: storedOrNone(previousImage),
        alt: previousImage?.url ? previousImage.alt || project.alt : project.alt,
        category: project.category,
        venue: project.venue,
        topic: project.topic,
        tag: project.tag,
      }
    }),
    services: SEED_HOME_SERVICES,
  }
}
