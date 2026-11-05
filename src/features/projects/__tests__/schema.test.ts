import { describe, expect, it } from 'vitest'
import { PROJECT_COUNT, TRACK_RECORD_COUNT } from '../constants'
import { projectsFormSchema } from '../schema'
import { validValues } from './testData'

function paths(result: ReturnType<typeof projectsFormSchema.safeParse>) {
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('projectsFormSchema', () => {
  it('accepts a complete document and trims every string', () => {
    const values = validValues()
    values.hero.title = '  Electrical projects we take on  '
    values.portfolio.projects[0]!.title = '  Project 1  '

    const result = projectsFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.hero.title).toBe('Electrical projects we take on')
    expect(result.data.portfolio.projects[0]?.title).toBe('Project 1')
    expect(result.data.portfolio.projects).toHaveLength(PROJECT_COUNT)
    expect(result.data.trackRecord.columns).toHaveLength(TRACK_RECORD_COUNT)
  })

  it('allows blank text and treats it as a keep-the-public-value slot', () => {
    const values = validValues()
    values.cta.title = '   '

    const result = projectsFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.cta.title).toBe('')
  })

  it('rejects text over its limit', () => {
    const values = validValues()
    values.portfolio.projects[0]!.summary = 'x'.repeat(321)

    expect(paths(projectsFormSchema.safeParse(values))).toContain(
      'portfolio.projects.0.summary',
    )
  })

  it('rejects the wrong number of projects', () => {
    const values = validValues()
    values.portfolio.projects = values.portfolio.projects.slice(0, PROJECT_COUNT - 1)

    expect(paths(projectsFormSchema.safeParse(values))).toContain(
      'portfolio.projects',
    )
  })

  it('rejects the wrong number of track-record columns', () => {
    const values = validValues()
    values.trackRecord.columns = values.trackRecord.columns.slice(0, TRACK_RECORD_COUNT - 1)

    expect(paths(projectsFormSchema.safeParse(values))).toContain(
      'trackRecord.columns',
    )
  })

  it('rejects a category outside the allowlist', () => {
    const values = validValues()
    values.portfolio.projects[0]!.category = 'not_a_real_category' as never

    expect(paths(projectsFormSchema.safeParse(values))).toContain(
      'portfolio.projects.0.category',
    )
  })

  it('does not contain contact, footer, image, or SEO fields', () => {
    const keys = Object.keys(projectsFormSchema.shape)

    expect(keys.sort()).toEqual([
      'cta',
      'hero',
      'portfolio',
      'trackRecord',
    ])
  })
})
