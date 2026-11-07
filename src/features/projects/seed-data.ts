import type { ProjectsContent } from './types'

const EMPTY_IMAGE = {
  url: '',
  path: '',
  alt: '',
  width: 0,
  height: 0,
  size: 0,
  contentType: '',
}

/**
 * Build-time copy from the public site's Projects components, written verbatim
 * so seeding recreates the live page instead of paraphrasing it. Keep this in
 * sync with `rajarata-engineering-public-site/src/components/projects/`.
 *
 * `location` and `year` use the public `ProjectCard` defaults, because the
 * build-time portfolio does not set per-card values. Card images stay empty:
 * seeding never invents media, so the public artwork remains.
 */
export const SEED_PROJECTS: ProjectsContent = {
  hero: {
    eyebrow: 'Work We Take On',
    title: 'Electrical Work & Capabilities',
    intro:
      'This page sets out the kinds of electrical work we take on across Anuradhapura and beyond — MV/LV distribution, MDB and SMDB panel installation, industrial installations, cable tray and laying, ELV and automation, lightning protection systems, and testing and commissioning.',
  },
  portfolio: {
    projects: [
      {
        category: 'industrial',
        subTag: 'HV/LV',
        location: 'Anuradhapura, Sri Lanka',
        year: 'Overview',
        typePlaceholder: 'Industrial Sector',
        title: 'Industrial Power Distribution & Installation',
        summary:
          'MV/LV distribution, MDB and SMDB panel installation, cable tray fixing and cable laying for factories, plants and other industrial facilities.',
        ref: 'MV/LV Scope',
        specLabel: 'Execution Scope',
        specValue: 'MV/LV Distribution & Panels',
        specDetail:
          'Work covers incoming supply distribution, main and sub-main distribution board installation, cable tray routes, cable laying and terminations carried out to match the site load requirements.',
        alt: 'Schematic of MV/LV distribution switchgear, panels and cabling.',
        image: { ...EMPTY_IMAGE },
      },
      {
        category: 'commercial',
        subTag: 'MDB Panels',
        location: 'Anuradhapura, Sri Lanka',
        year: 'Overview',
        typePlaceholder: 'Commercial Sector',
        title: 'Commercial Panel & Distribution Work',
        summary:
          'Main and sub-main distribution boards, cable tray routes and power installation for commercial buildings, offices and retail premises.',
        ref: 'Panel Scope',
        specLabel: 'System Architecture',
        specValue: 'MDB & Sub-Main Distribution',
        specDetail:
          'Panels are arranged around the building main and sub-main distribution points, with tray and conduit routes planned alongside the electrical layout so circuits stay grouped and serviceable.',
        alt: 'Schematic of a commercial main distribution board and its outgoing circuits.',
        image: { ...EMPTY_IMAGE },
      },
      {
        category: 'elv',
        subTag: 'Automation',
        location: 'Anuradhapura, Sri Lanka',
        year: 'Overview',
        typePlaceholder: 'ELV & Automation',
        title: 'ELV & Building Automation Systems',
        summary:
          'Structured cabling, containment and connected low-voltage systems such as access control, CCTV, intercom and building automation for commercial and residential sites.',
        ref: 'Integration Scope',
        specLabel: 'Integration Points',
        specValue: 'Structured Cabling & Controls',
        specDetail:
          'Low-voltage systems are routed and terminated on their own containment, keeping power, data and control circuits separated, labelled and easy to maintain.',
        alt: 'Schematic of structured cabling and connected low-voltage building systems.',
        image: { ...EMPTY_IMAGE },
      },
      {
        category: 'residential',
        subTag: 'Smart Power',
        location: 'Anuradhapura, Sri Lanka',
        year: 'Overview',
        typePlaceholder: 'Residential Sector',
        title: 'Residential & Commercial Wiring',
        summary:
          'House wiring, rewiring, distribution board installation and power point work for homes, extensions and renovation projects, alongside commercial fit-outs.',
        ref: 'Wiring Scope',
        specLabel: 'Specialty',
        specValue: 'Complete Wiring & Rewiring',
        specDetail:
          'Circuit layout, conduit and box work, switch and socket installation and distribution board connections for both new builds and upgrades to existing wiring.',
        alt: 'Schematic of residential wiring, a distribution board and connected circuits.',
        image: { ...EMPTY_IMAGE },
      },
      {
        category: 'industrial',
        subTag: 'Surge Safe',
        location: 'Anuradhapura, Sri Lanka',
        year: 'Overview',
        typePlaceholder: 'Lightning Protection',
        title: 'Lightning & Surge Protection Systems',
        summary:
          'Air terminals, down conductors, bonding and earthing, plus surge protective devices, installed to give structures and equipment a clear path to earth.',
        ref: 'Protection Scope',
        specLabel: 'Protection System',
        specValue: 'Air Terminals & Earthing',
        specDetail:
          'A protection layout runs from air terminals through down conductors and bonding to earth pits and earthing conductors, with surge protection added for sensitive equipment.',
        alt: 'Schematic of air terminals, down conductors and earthing conductors on a structure.',
        image: { ...EMPTY_IMAGE },
      },
      {
        category: 'maintenance',
        subTag: 'Inspection',
        location: 'Anuradhapura, Sri Lanka',
        year: 'Overview',
        typePlaceholder: 'Testing & Commissioning',
        title: 'Electrical Testing & Commissioning',
        summary:
          'Insulation resistance, earth continuity, earth loop impedance and functional checks carried out before an installation is handed over to the client.',
        ref: 'Test Scope',
        specLabel: 'Test Protocol',
        specValue: 'Insulation, Continuity & Loop Impedance',
        specDetail:
          'Circuits are tested for insulation resistance, earth continuity and earth loop impedance, then checked functionally so the installation is confirmed ready for use before handover.',
        alt: 'Schematic of test instruments connected to an electrical installation.',
        image: { ...EMPTY_IMAGE },
      },
    ],
  },
  trackRecord: {
    columns: [
      {
        kicker: 'Distribution & Panels',
        value: 'MV/LV',
        description:
          'MV/LV distribution, MDB and SMDB panel installation, cable tray work and cable laying across industrial and commercial sites.',
      },
      {
        kicker: 'Protection & Earthing',
        value: 'Earthing',
        description:
          'Lightning protection systems, earthing and surge protection installed alongside tested and commissioned electrical work.',
      },
      {
        kicker: 'Breadth of Work',
        value: 'End to End',
        description:
          'From residential and commercial wiring to industrial installations and ELV automation — planned, installed and tested under one scope of work.',
      },
    ],
  },
  cta: {
    eyebrow: 'Direct Engineering Consultation',
    title: 'Have a Similar Project to Execute?',
    body: 'Tell us about your site, load requirements and timeline, and we will assess the work and prepare a quotation for the installation.',
  },
  updatedAt: null,
  updatedBy: null,
}
