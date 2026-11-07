import type { ServicesContent } from './types'

/**
 * Build-time copy from the public site's Services components, written verbatim
 * so seeding recreates the live page instead of paraphrasing it. Keep this in
 * sync with `rajarata-engineering-public-site/src/components/services/`.
 */
export const SEED_SERVICES: ServicesContent = {
  hero: {
    eyebrow: 'Electrical Contracting Services',
    title: 'Electrical Engineering Solutions for Every Requirement',
    intro:
      'From MV/LV distribution and MDB/SMDB panel installation to industrial installations, cable containment, testing and commissioning, and ELV automation — Rajarata Engineering covers the electrical scope for residential, commercial, and industrial projects.',
    quickLinks: [
      { label: 'Industrial Installations', icon: 'factory', target: 'service-02' },
      { label: 'Commercial Wiring', icon: 'apartment', target: 'service-01' },
      { label: 'ELV & Automation', icon: 'settings_ethernet', target: 'service-07' },
      { label: 'Safety & LPS Systems', icon: 'bolt', target: 'service-08' },
    ],
    metrics: [
      {
        kicker: 'MV / LV',
        title: 'Distribution',
        description: 'Main and sub-main distribution boards and switchgear',
      },
      {
        kicker: 'Industrial',
        title: 'Installations',
        description: 'Plant distribution, control equipment, and cable infrastructure',
      },
      {
        kicker: 'Testing &',
        title: 'Commissioning',
        description:
          'Insulation resistance, earth loop impedance, and functional checks',
      },
      {
        kicker: 'ELV &',
        title: 'Automation',
        description: 'Communications, access control, and security systems',
      },
    ],
  },
  directory: {
    eyebrow: 'Engineering Services Directory',
    title: 'Complete Electrical Lifecycle Capabilities',
    intro:
      'Each service below sets out what the work involves, the scope it covers, and the kinds of buildings and facilities it suits — from first fix through to testing and handover.',
  },
  services: [
    {
      icon: 'apartment',
      category: 'LV Distribution',
      title: 'Residential & Commercial Electrical Wiring',
      description:
        'Complete electrical wiring for homes, commercial buildings, and retail fit-outs — incoming supply, distribution boards, final circuits, lighting, power outlets, and wiring accessories.',
      scope:
        'Lighting and power circuits, socket outlets and switches, distribution board wiring, and concealed or surface containment, with continuity, polarity, and insulation resistance checks on completion.',
      suitableFor: [
        'Residential complexes',
        'Commercial buildings',
        'Retail plazas',
        'Corporate headquarters',
      ],
    },
    {
      icon: 'precision_manufacturing',
      category: 'Industrial Grade',
      title: 'Industrial Electrical Installations',
      description:
        'Electrical installation work for factories, processing plants, and workshops — plant distribution, control equipment, and the cable infrastructure that connects them.',
      scope:
        'Plant distribution boards and feeders, motor and control wiring, containment routed through production areas, and termination to machinery and control panels.',
      suitableFor: [
        'Manufacturing plants',
        'Processing facilities',
        'Agro-processing factories',
        'Logistics hubs',
      ],
    },
    {
      icon: 'developer_board',
      category: 'Switchgear & Enclosures',
      title: 'MDB / SMDB Panel Installation',
      description:
        'Supply, assembly, and installation of main distribution boards and sub-main distribution boards for buildings and industrial sites.',
      scope:
        'Enclosure mounting, busbar and protective device installation, outgoing way wiring, metering provision, and circuit labelling, with terminal torque checks throughout.',
      suitableFor: [
        'High-rise developments',
        'Substation buildings',
        'Commercial complexes',
        'Hospitals',
      ],
    },
    {
      icon: 'linear_scale',
      category: 'Containment & Pulling',
      title: 'Cable Tray Installation & Cable Laying',
      description:
        'Cable containment and cable laying, routing power and control cables safely from supply points to panels, equipment, and distribution rooms.',
      scope:
        'Tray, trunking, and conduit installation, cable pulling and fixing, glanding and termination at both ends, and labelling of every circuit on the drum schedule.',
      suitableFor: [
        'Utility infrastructure',
        'Power distribution rooms',
        'Processing facilities',
        'Campus networks',
      ],
    },
    {
      icon: 'fact_check',
      category: 'Testing & Recording',
      title: 'Testing & Commissioning',
      description:
        'Electrical testing and commissioning carried out before a new installation is energised or an existing one goes into service.',
      scope:
        'Visual inspection, continuity and polarity checks, insulation resistance testing, earth loop impedance testing, RCD functional testing, and recorded results for each circuit.',
      suitableFor: [
        'New plant commissioning',
        'Refurbishment projects',
        'Facility handovers',
        'Pre-energisation checks',
      ],
    },
    {
      icon: 'build',
      category: 'Maintenance & Fault Finding',
      title: 'Electrical Maintenance & Troubleshooting',
      description:
        'Planned maintenance and fault finding for existing electrical installations, from routine inspection rounds to diagnosing breakdowns on lighting, power, and distribution circuits.',
      scope:
        'Scheduled visual and thermal inspection, fault diagnosis, repair or replacement of damaged components, and re-testing of affected circuits after the work is complete.',
      suitableFor: [
        'Critical healthcare centers',
        'Hotel chains',
        'Automated factories',
        'Commercial properties',
      ],
    },
    {
      icon: 'router',
      category: 'ELV & Automation',
      title: 'All Kinds of ELV Solutions',
      description:
        'Extra-low-voltage systems — communications, access control, security, and building automation — designed and installed to integrate with the wider electrical installation.',
      scope:
        'Structured cabling and communications wiring, access control and CCTV, door entry and alarm systems, and building control integration, routed and terminated on dedicated ELV containment.',
      suitableFor: [
        'Smart office towers',
        'Luxury residential villas',
        'Hospitality resorts',
        'Educational universities',
      ],
    },
    {
      icon: 'bolt',
      category: 'Surge & Transient Defense',
      title: 'Lightning Protection System (LPS)',
      description:
        'Lightning protection and surge protection for buildings and structures, from air terminals at the roof down to the earth electrode in the ground.',
      scope:
        'Air terminals and down conductors, earthing conductors and earth pits, equipotential bonding, surge protective devices at distribution boards, and continuity measurements across the finished system.',
      suitableFor: [
        'Data centers & telecom towers',
        'Elevated commercial towers',
        'Chemical & fuel depots',
        'Industrial compounds',
      ],
    },
  ],
  process: {
    eyebrow: 'Methodical Rigor',
    title: 'Our Engineering & Delivery Process',
    intro:
      'From the first load survey to final handover, every project moves through the same six phases — requirements, site assessment, design, installation, testing, and handover — so the scope is agreed before work begins.',
    steps: [
      {
        title: 'Understand Requirements',
        description:
          'In-depth operational requirement intake, load audit, utility liaison, and specification review.',
        mobileDescription:
          'Load audit, client requirement intake, municipal utility coordination, and code alignment.',
      },
      {
        title: 'Site Assessment',
        description:
          'On-site spatial feasibility, architectural layout verification, soil resistivity surveys, and structural checks.',
        mobileDescription:
          'Civil space evaluation, earth soil resistivity diagnostic, cable pathway assessment.',
      },
      {
        title: 'Planning & Design',
        description:
          'Detailed single line diagrams (SLD), CAD cable routing schemes, load calculations, and bill of quantities.',
        mobileDescription:
          'Single-line electrical diagram drafting, fault calculations, material selection, and BOQ submission.',
      },
      {
        title: 'Installation',
        description:
          'Precise on-site assembly, tray mounting, conduit pulling, switchboard positioning, and terminations.',
        mobileDescription:
          'Structural containment installation, armored cable pulling, switchgear assembly, and clean cable terminations.',
      },
      {
        title: 'Testing & Commissioning',
        description:
          'Insulation resistance measurement, earth fault loop impedance, thermal scanning, protective device checks, and recorded results for every circuit.',
        mobileDescription:
          'Insulation resistance measurement, earth loop impedance testing, RCD functional checks, and recorded results for every circuit.',
      },
      {
        title: 'Handover & Support',
        description:
          'As-built drawings, circuit schedules, and a walkthrough of the installed system with the client’s team before the supply is handed over.',
        mobileDescription:
          'As-built drawings, circuit schedules, a handover walkthrough with the site team, and planned maintenance visits.',
      },
    ],
  },
  cta: {
    eyebrow: 'Consultation & Site Assessment',
    title: 'Need a Customized Electrical Solution?',
    body: 'Tell us about the building, the load, or the fault you are dealing with. We will talk through the scope, arrange a site visit where one is needed, and set out the work involved before anything begins.',
    points: [
      'MV/LV distribution and MDB/SMDB panel installation',
      'Testing, commissioning, and ELV systems',
    ],
  },
  updatedAt: null,
  updatedBy: null,
}
