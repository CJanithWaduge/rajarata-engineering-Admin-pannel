import type { AboutContent } from './types'

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
 * Build-time copy from the public site's About components, written verbatim so
 * seeding recreates the live page instead of paraphrasing it. Keep this in sync
 * with `rajarata-engineering-public-site/src/components/about/`.
 *
 * The hero image is intentionally empty: seeding never invents media, so the
 * public page keeps its own artwork.
 */
export const SEED_ABOUT: AboutContent = {
  hero: {
    eyebrow: 'Electrical Engineering & Contracting',
    title: 'About Rajarata Engineering',
    intro:
      'Rajarata Engineering is an electrical engineering and contracting company based in Anuradhapura. The practice plans, installs, tests, and commissions MV/LV distribution, industrial installations, MDB/SMDB panels, cable tray and cable laying, lightning protection systems, ELV and automation, and residential and commercial wiring.',
    image: {
      ...EMPTY_IMAGE,
      alt: 'Electrical engineer inspecting a control panel in an industrial facility',
    },
    approachLabel: 'Our Approach & Methodology',
    snapshotLabel: 'Scope',
    snapshots: [
      { title: 'MV/LV Distribution', description: 'Panels, cable tray and laying' },
      { title: 'Testing & Commissioning', description: 'Checks before handover' },
      { title: 'ELV & Automation', description: 'Structured cabling and controls' },
    ],
    overlay: {
      title: 'Commissioning Panel Checks',
      description: 'Insulation, earthing, and functional testing before handover',
      stage: 'Test & Handover',
      stageLabel: 'Work Stage',
    },
  },
  heritage: {
    eyebrow: 'Inside the Practice',
    title: 'How We Work & What We Do',
    narrative:
      'Rajarata Engineering is an electrical engineering and contracting company based in Anuradhapura. Each job follows the same route: review the site and its load requirements, design the distribution and protection scheme, install panels, cable tray and cabling, then test and commission before handover. MV/LV distribution, industrial installations, MDB/SMDB panel work, lightning protection systems, ELV and automation, and residential and commercial wiring make up the day-to-day scope of the practice.',
    approach:
      'Design, installation, and testing are treated as one continuous job, so responsibility stays clear from the first drawing to the final handover.',
    basedInLabel: 'Based In',
    basedInValue: 'Anuradhapura, Sri Lanka',
    approachLabel: 'Our Approach',
    milestones: [
      {
        kicker: 'Distribution Networks',
        badge: 'MV / LV',
        title: 'Medium- and low-voltage distribution',
        description:
          'Design and installation of MV/LV distribution, from the incoming supply through MDB and SMDB panels to the final circuits.',
      },
      {
        kicker: 'Industrial Installations',
        badge: 'Panels & Cable',
        title: 'Panels, cable tray, and cable laying',
        description:
          'MDB/SMDB panel installation, cable tray routing, and cable laying and termination across industrial and commercial sites.',
      },
      {
        kicker: 'Protection & ELV',
        badge: 'ELV & Automation',
        title: 'Lightning protection, ELV, and automation',
        description:
          'Lightning protection systems, ELV networks, and automation controls are installed alongside the power distribution work.',
      },
      {
        kicker: 'Wiring & Commissioning',
        badge: 'Handover',
        title: 'Wiring, testing, and commissioning',
        description:
          'Residential and commercial wiring is completed, then the installation is tested and commissioned before it is handed over.',
      },
    ],
  },
  visionMission: {
    vision: {
      eyebrow: 'Strategic Horizon',
      title: 'Our Vision',
      body: 'To be an electrical contractor known for careful work — planning every installation properly, testing it thoroughly, and standing behind the result on every site we work on.',
      footer: 'Engineering Future-Ready Infrastructure',
    },
    mission: {
      eyebrow: 'Tactical Purpose',
      title: 'Our Mission',
      body: 'To carry out MV/LV distribution, industrial installations, MDB/SMDB panel installation, cable tray and cable laying, lightning protection systems, ELV and automation, and residential and commercial wiring with careful planning, clean installation, and testing before every handover.',
      footer: 'Uncompromising Safety & Quality Governance',
    },
  },
  pillars: {
    eyebrow: 'Guiding Code',
    title: 'Core Pillars of Engineering Conduct',
    intro:
      'The standards Rajarata Engineering commits to on every job — the way the work is approached, from the first site survey to the final handover.',
    items: [
      {
        icon: 'health_and_safety',
        title: 'Safety',
        description:
          'Planning for safe working on every site: clear isolation, careful sequencing, and tidy work areas throughout the installation.',
        footer: 'Safety planned into every job',
      },
      {
        icon: 'precision_manufacturing',
        title: 'Quality',
        description:
          'Materials chosen for the job and installed with care, so panels, cable runs, and terminations are finished to a consistent standard.',
        footer: 'Right materials for the job',
      },
      {
        icon: 'balance',
        title: 'Integrity',
        description:
          'A clear scope and honest communication from the first quotation through to handover, so the client always knows what is being done and why.',
        footer: 'Honest Contracts',
      },
      {
        icon: 'schedule',
        title: 'Reliability',
        description:
          'Coordinating with the client and other trades so the work follows an agreed sequence and the site keeps moving.',
        footer: 'Kept to the agreed plan',
      },
      {
        icon: 'trending_up',
        title: 'Improvement',
        description:
          'Reviewing each finished job for what went well and what could be done better, and carrying those lessons into the next one.',
        footer: 'Lessons carried forward',
      },
    ],
  },
  methodology: {
    eyebrow: 'Execution Architecture',
    title: 'Our 5-Stage Project Methodology',
    intro:
      'Every project moves through the same five stages, from the first site survey to support after handover, so the client always knows what happens next.',
    protocolLabel: 'Lifecycle Protocol',
    stagesLabel: 'Project Stages',
    steps: [
      {
        icon: 'manage_search',
        title: 'Understand',
        description:
          'In-depth requirement analysis, site constraints, load surveys, and environmental hazard evaluations.',
        footer: 'Audit & Assessment',
      },
      {
        icon: 'architecture',
        title: 'Plan',
        description:
          'Detailed schematics, CAD layouts, load calculations, cable sizing, bill of quantities, and safety protocols.',
        footer: 'Engineering Design',
      },
      {
        icon: 'handyman',
        title: 'Execute',
        description:
          'MDB/SMDB panels are installed, cable tray is routed, and cables are laid and terminated, with the work checked against the approved design as it progresses.',
        footer: 'Rigorous Deployment',
      },
      {
        icon: 'fact_check',
        title: 'Test',
        description:
          'Rigorous electrical diagnostic testing, insulation resistance, earth fault loop impedance, and live calibration.',
        footer: 'Verification & Sign-off',
      },
      {
        icon: 'contact_support',
        title: 'Support',
        description:
          'Once the system is in service, the client has a single point of contact for questions about the installed work and for any follow-on requirements.',
        footer: 'Continuous Lifecycle',
      },
    ],
  },
  industries: {
    eyebrow: 'Where We Work',
    title: 'Sectors Our Services Cover',
    intro:
      'Distribution, panels, cable installation, testing, and ELV systems apply across these settings, with each installation sized to the site in front of us.',
    sectors: [
      {
        icon: 'precision_manufacturing',
        title: 'Factories & Manufacturing',
        description:
          'MV/LV distribution to plant and machinery, MDB/SMDB panels, cable tray and cable laying, and testing and commissioning for production sites.',
      },
      {
        icon: 'storefront',
        title: 'Commercial & Retail',
        description:
          'Commercial wiring, distribution boards, and lighting and power circuits for shops, offices, and showrooms.',
      },
      {
        icon: 'apartment',
        title: 'Residential Developers',
        description:
          'Residential wiring from board to final circuit, plus cable laying and lightning protection for houses and multi-unit buildings.',
      },
      {
        icon: 'hotel',
        title: 'Hospitality & Hotels',
        description:
          'Power distribution, commercial wiring, and ELV systems for guest rooms, public areas, and back-of-house operations.',
      },
      {
        icon: 'warehouse',
        title: 'Warehouses & Logistics',
        description:
          'Cable tray and cable laying across large floor areas, distribution panels, lighting circuits, and lightning protection.',
      },
      {
        icon: 'local_hospital',
        title: 'Educational & Healthcare',
        description:
          'Distribution, wiring, and ELV systems for classrooms, wards, and administration areas, tested before handover.',
      },
    ],
  },
  cta: {
    eyebrow: 'engineering',
    title: 'Plan Your Next Electrical Installation',
    body: 'Reach the team directly by WhatsApp or phone to discuss MV/LV distribution, panel installation, cable work, testing and commissioning, or ELV and automation for your site.',
    projectsLabel: 'View Past Projects',
    phoneLabel: 'Phone',
    whatsappLabel: 'WhatsApp',
  },
  updatedAt: null,
  updatedBy: null,
}
