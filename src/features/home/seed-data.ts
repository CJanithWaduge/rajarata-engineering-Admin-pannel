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
    title: 'Residential & Commercial Wiring',
    description:
      'Complete wiring for homes, offices, and retail spaces — conduit routing, socket and lighting circuits, and balanced load distribution.',
    href: '/services#service-01',
  },
  {
    icon: 'precision_manufacturing',
    title: 'Industrial Electrical Installations',
    description:
      'High-demand manufacturing floor power drops, transformer stations, motor controls, and heavy feeder wiring.',
    href: '/services#service-02',
  },
  {
    icon: 'assignment_turned_in',
    title: 'Testing & Commissioning',
    description:
      'Insulation resistance, loop impedance, earth electrode validation, thermal surveys, and formal handover certs.',
    href: '/services#service-05',
  },
  {
    icon: 'build_circle',
    title: 'Maintenance & Troubleshooting',
    description:
      'Fault finding, inspection, repair, and preventive upkeep of installed LV systems and equipment to keep them running safely.',
    href: '/services#service-06',
  },
  {
    icon: 'lan',
    title: 'All Kinds of ELV Solutions',
    description:
      'Structured cabling, access control, CCTV networks, addressable fire alarms, and Building Management Systems (BMS).',
    href: '/services#service-07',
  },
  {
    icon: 'bolt',
    title: 'Lightning Protection System (LPS)',
    description:
      'ESE and conventional air terminal networks, down-conductor dissipation paths, and transient surge suppression (SPD).',
    href: '/services#service-08',
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
