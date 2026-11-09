import { describe, expect, it } from 'vitest'
import {
  METHOD_STEP_COUNT,
  MILESTONE_COUNT,
  PILLAR_COUNT,
  SECTOR_COUNT,
  SNAPSHOT_COUNT,
} from '../constants'
import { aboutContentSchema, aboutFormSchema } from '../schema'
import { validContent, validValues } from './testData'

function paths(result: ReturnType<typeof aboutFormSchema.safeParse>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join('.'))
}

function storedDocument() {
  const content = validContent()
  return {
    hero: {
      eyebrow: content.hero.eyebrow,
      title: content.hero.title,
      intro: content.hero.intro,
      snapshots: content.hero.snapshots,
      overlay: content.hero.overlay,
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
    heritage: content.heritage,
    visionMission: content.visionMission,
    pillars: content.pillars,
    methodology: content.methodology,
    industries: content.industries,
    cta: content.cta,
  }
}

describe('aboutFormSchema', () => {
  it('accepts a complete document and trims every string', () => {
    const values = validValues()
    values.hero.title = '  About the engineering practice  '
    values.pillars.items[0]!.description = '  Pillar description  '

    const result = aboutFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.hero.title).toBe('About the engineering practice')
    expect(result.data.pillars.items[0]?.description).toBe('Pillar description')
    expect(result.data.hero.snapshots).toHaveLength(SNAPSHOT_COUNT)
    expect(result.data.heritage.milestones).toHaveLength(MILESTONE_COUNT)
    expect(result.data.pillars.items).toHaveLength(PILLAR_COUNT)
    expect(result.data.methodology.steps).toHaveLength(METHOD_STEP_COUNT)
    expect(result.data.industries.sectors).toHaveLength(SECTOR_COUNT)
  })

  it('accepts blank text and stores an empty string', () => {
    const values = validValues()
    values.heritage.title = '   '

    const result = aboutFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.heritage.title).toBe('')
  })

  it('accepts a blank icon so the public page keeps its own', () => {
    const values = validValues()
    values.pillars.items[0]!.icon = ''

    const result = aboutFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.pillars.items[0]?.icon).toBe('')
  })

  it('accepts an empty hero image selection text state', () => {
    const values = validValues()
    values.hero.alt = ''

    expect(aboutFormSchema.safeParse(values).success).toBe(true)
  })

  it('rejects text over its limit', () => {
    const values = validValues()
    values.hero.title = 'x'.repeat(101)

    expect(paths(aboutFormSchema.safeParse(values))).toContain('hero.title')
  })

  it('rejects the wrong fixed counts', () => {
    const values = validValues()
    values.hero.snapshots = values.hero.snapshots.slice(0, SNAPSHOT_COUNT - 1)
    values.heritage.milestones = values.heritage.milestones.slice(
      0,
      MILESTONE_COUNT - 1,
    )
    values.pillars.items = values.pillars.items.slice(0, PILLAR_COUNT - 1)
    values.methodology.steps = values.methodology.steps.slice(
      0,
      METHOD_STEP_COUNT - 1,
    )
    values.industries.sectors = values.industries.sectors.slice(
      0,
      SECTOR_COUNT - 1,
    )

    const issuePaths = paths(aboutFormSchema.safeParse(values))
    expect(issuePaths).toContain('hero.snapshots')
    expect(issuePaths).toContain('heritage.milestones')
    expect(issuePaths).toContain('pillars.items')
    expect(issuePaths).toContain('methodology.steps')
    expect(issuePaths).toContain('industries.sectors')
  })

  it('rejects an icon outside the allowlist', () => {
    const values = validValues()
    values.pillars.items[0]!.icon = 'not_a_real_icon' as never

    expect(paths(aboutFormSchema.safeParse(values))).toContain('pillars.items.0.icon')
  })

  it('does not contain contact, footer, location, image, or SEO fields', () => {
    const keys = Object.keys(aboutFormSchema.shape)

    expect(keys.sort()).toEqual([
      'cta',
      'heritage',
      'hero',
      'industries',
      'methodology',
      'pillars',
      'visionMission',
    ])
    expect(keys).not.toContain('image')
    expect(keys).not.toContain('phone')
  })
})

describe('aboutContentSchema', () => {
  it('accepts the flat stored document shape', () => {
    const result = aboutContentSchema.safeParse(storedDocument())

    expect(result.success).toBe(true)
  })

  it('rejects a stored document with the wrong fixed count', () => {
    const document = storedDocument()
    document.industries.sectors = document.industries.sectors.slice(0, 5)

    expect(aboutContentSchema.safeParse(document).success).toBe(false)
  })

  it('accepts a stored document with blank text, a blank icon, and no image', () => {
    const document = storedDocument()
    document.hero.title = ''
    document.pillars.items[0]!.icon = ''
    document.hero.image = {
      imageUrl: '',
      imagePath: '',
      imageAlt: '',
      imageWidth: 0,
      imageHeight: 0,
      imageSize: 0,
      imageContentType: '',
    }

    expect(aboutContentSchema.safeParse(document).success).toBe(true)
  })

  it('accepts a stored document missing the later label fields', () => {
    const document = storedDocument() as Record<string, unknown>
    const hero = document.hero as Record<string, unknown>
    const heritage = document.heritage as Record<string, unknown>
    const methodology = document.methodology as Record<string, unknown>
    const cta = document.cta as Record<string, unknown>
    const overlay = hero.overlay as Record<string, unknown>

    delete hero.approachLabel
    delete hero.snapshotLabel
    delete overlay.stageLabel
    delete heritage.basedInLabel
    delete heritage.basedInValue
    delete heritage.approachLabel
    delete methodology.protocolLabel
    delete methodology.stagesLabel
    delete cta.projectsLabel
    delete cta.phoneLabel
    delete cta.whatsappLabel

    const result = aboutContentSchema.safeParse(document)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.hero.approachLabel).toBe('')
    expect(result.data.hero.snapshotLabel).toBe('')
    expect(result.data.hero.overlay.stageLabel).toBe('')
    expect(result.data.heritage.basedInLabel).toBe('')
    expect(result.data.heritage.basedInValue).toBe('')
    expect(result.data.heritage.approachLabel).toBe('')
    expect(result.data.methodology.protocolLabel).toBe('')
    expect(result.data.methodology.stagesLabel).toBe('')
    expect(result.data.cta.projectsLabel).toBe('')
    expect(result.data.cta.phoneLabel).toBe('')
    expect(result.data.cta.whatsappLabel).toBe('')
  })

  it('rejects a stored image without alt text', () => {
    const document = storedDocument()
    document.hero.image.imageAlt = ''

    expect(aboutContentSchema.safeParse(document).success).toBe(false)
  })

  it('rejects a stored document missing the hero image map', () => {
    const document = storedDocument() as Record<string, unknown>
    const hero = document.hero as Record<string, unknown>
    delete hero.image

    expect(aboutContentSchema.safeParse(document).success).toBe(false)
  })
})
