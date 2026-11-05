import { describe, expect, it } from 'vitest'
import {
  CTA_POINT_COUNT,
  METRIC_COUNT,
  PROCESS_STEP_COUNT,
  QUICK_LINK_COUNT,
  SERVICE_COUNT,
  SUITABLE_FOR_COUNT,
} from '../constants'
import { servicesFormSchema } from '../schema'
import { validValues } from './testData'

function paths(result: ReturnType<typeof servicesFormSchema.safeParse>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('servicesFormSchema', () => {
  it('accepts a complete document and trims every string', () => {
    const values = validValues()
    values.hero.title = '  Electrical engineering services  '
    values.services[0]!.scope = '  Service scope  '

    const result = servicesFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.hero.title).toBe('Electrical engineering services')
    expect(result.data.services[0]?.scope).toBe('Service scope')
    expect(result.data.hero.quickLinks).toHaveLength(QUICK_LINK_COUNT)
    expect(result.data.hero.metrics).toHaveLength(METRIC_COUNT)
    expect(result.data.services).toHaveLength(SERVICE_COUNT)
    expect(result.data.process.steps).toHaveLength(PROCESS_STEP_COUNT)
    expect(result.data.cta.points).toHaveLength(CTA_POINT_COUNT)
    expect(result.data.services[0]?.suitableFor).toHaveLength(SUITABLE_FOR_COUNT)
  })

  it('allows blank text and treats it as a keep-the-public-value slot', () => {
    const values = validValues()
    values.directory.title = '   '

    const result = servicesFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.directory.title).toBe('')
  })

  it('rejects text over its limit', () => {
    const values = validValues()
    values.services[0]!.title = 'x'.repeat(81)

    expect(paths(servicesFormSchema.safeParse(values))).toContain(
      'services.0.title',
    )
  })

  it('rejects the wrong number of services', () => {
    const values = validValues()
    values.services = values.services.slice(0, SERVICE_COUNT - 1)

    expect(paths(servicesFormSchema.safeParse(values))).toContain('services')
  })

  it('rejects the wrong number of quick links, metrics, steps, and CTA points', () => {
    const values = validValues()
    values.hero.quickLinks = values.hero.quickLinks.slice(0, QUICK_LINK_COUNT - 1)
    values.hero.metrics = values.hero.metrics.slice(0, METRIC_COUNT - 1)
    values.process.steps = values.process.steps.slice(0, PROCESS_STEP_COUNT - 1)
    values.cta.points = values.cta.points.slice(0, CTA_POINT_COUNT - 1)

    const issuePaths = paths(servicesFormSchema.safeParse(values))
    expect(issuePaths).toContain('hero.quickLinks')
    expect(issuePaths).toContain('hero.metrics')
    expect(issuePaths).toContain('process.steps')
    expect(issuePaths).toContain('cta.points')
  })

  it('rejects a suitable-for list that is not exactly four items', () => {
    const values = validValues()
    values.services[0]!.suitableFor = ['One item']

    expect(paths(servicesFormSchema.safeParse(values))).toContain(
      'services.0.suitableFor',
    )
  })

  it('rejects an icon outside the allowlist', () => {
    const values = validValues()
    values.services[0]!.icon = 'not_a_real_icon' as never

    expect(paths(servicesFormSchema.safeParse(values))).toContain(
      'services.0.icon',
    )
  })

  it('rejects a quick-link target outside the eight anchors', () => {
    const values = validValues()
    values.hero.quickLinks[0]!.target = 'service-09' as never

    expect(paths(servicesFormSchema.safeParse(values))).toContain(
      'hero.quickLinks.0.target',
    )
  })

  it('allows a blank mobile process description', () => {
    const values = validValues()
    values.process.steps[0]!.mobileDescription = '   '

    const result = servicesFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.process.steps[0]?.mobileDescription).toBe('')
  })

  it('does not contain contact, footer, image, or SEO fields', () => {
    const keys = Object.keys(servicesFormSchema.shape)

    expect(keys.sort()).toEqual(['cta', 'directory', 'hero', 'process', 'services'])
  })
})
