import { beforeEach, describe, expect, it, vi } from 'vitest'
import { aboutFormSchema } from '../../about/schema'
import { projectsFormSchema } from '../../projects/schema'
import { servicesFormSchema } from '../../services/schema'

const mocks = vi.hoisted(() => ({
  saveServicesContent: vi.fn(),
  saveAboutContent: vi.fn(),
  saveProjectsContent: vi.fn(),
  getAboutContent: vi.fn(),
  getProjectsContent: vi.fn(),
}))

vi.mock('../../services/servicesContentService', () => ({
  saveServicesContent: mocks.saveServicesContent,
}))

vi.mock('../../about/aboutContentService', () => ({
  getAboutContent: mocks.getAboutContent,
  saveAboutContent: mocks.saveAboutContent,
}))

vi.mock('../../projects/projectsContentService', () => ({
  getProjectsContent: mocks.getProjectsContent,
  saveProjectsContent: mocks.saveProjectsContent,
}))

import { seedAllContent } from '../seedContentService'

describe('seedAllContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAboutContent.mockResolvedValue({ content: null, exists: false })
    mocks.getProjectsContent.mockResolvedValue({ content: null, exists: false })
    mocks.saveServicesContent.mockResolvedValue({})
    mocks.saveAboutContent.mockResolvedValue({})
    mocks.saveProjectsContent.mockResolvedValue({})
  })

  it('writes the three text pages with drafts that pass their form schemas', async () => {
    const result = await seedAllContent('uid-1')

    expect(result.pages).toEqual(['Services', 'About', 'Projects'])
    expect(mocks.saveServicesContent).toHaveBeenCalledTimes(1)
    expect(mocks.saveAboutContent).toHaveBeenCalledTimes(1)
    expect(mocks.saveProjectsContent).toHaveBeenCalledTimes(1)

    const services = mocks.saveServicesContent.mock.calls[0]![0]
    expect(servicesFormSchema.safeParse(services).success).toBe(true)

    const about = mocks.saveAboutContent.mock.calls[0]![0]
    expect(aboutFormSchema.safeParse(about).success).toBe(true)
    expect(about.hero.image).toEqual({ kind: 'none' })

    const projects = mocks.saveProjectsContent.mock.calls[0]![0]
    expect(projectsFormSchema.safeParse(projects).success).toBe(true)
    expect(projects.images).toHaveLength(6)
    expect(projects.images.every((image: { kind: string }) => image.kind === 'none')).toBe(
      true,
    )
    expect(
      projects.portfolio.projects.every(
        (project: Record<string, unknown>) => !('image' in project),
      ),
    ).toBe(true)
  })

  it('passes the current documents so replaced storage objects can be cleaned up', async () => {
    const previousAbout = { hero: 'previous about' }
    const previousProjects = { hero: 'previous projects' }
    mocks.getAboutContent.mockResolvedValue({
      content: previousAbout,
      exists: true,
    })
    mocks.getProjectsContent.mockResolvedValue({
      content: previousProjects,
      exists: true,
    })

    await seedAllContent('uid-1')

    expect(mocks.saveAboutContent).toHaveBeenCalledWith(
      expect.anything(),
      'uid-1',
      previousAbout,
    )
    expect(mocks.saveProjectsContent).toHaveBeenCalledWith(
      expect.anything(),
      'uid-1',
      previousProjects,
    )
  })

  it('still seeds when the previous documents cannot be read', async () => {
    mocks.getAboutContent.mockRejectedValue(new Error('invalid-document'))
    mocks.getProjectsContent.mockRejectedValue(new Error('invalid-document'))

    await expect(seedAllContent('uid-1')).resolves.toEqual({
      pages: ['Services', 'About', 'Projects'],
    })
    expect(mocks.saveAboutContent).toHaveBeenCalledWith(
      expect.anything(),
      'uid-1',
      null,
    )
    expect(mocks.saveProjectsContent).toHaveBeenCalledWith(
      expect.anything(),
      'uid-1',
      null,
    )
  })

  it('stops at the failing page and names it in the error', async () => {
    mocks.saveServicesContent.mockRejectedValue(new Error('validation failed'))

    await expect(seedAllContent('uid-1')).rejects.toThrow(
      'Services could not be seeded. validation failed',
    )
    expect(mocks.saveAboutContent).not.toHaveBeenCalled()
    expect(mocks.saveProjectsContent).not.toHaveBeenCalled()
  })

  it('requires an authenticated admin', async () => {
    await expect(seedAllContent('  ')).rejects.toThrow(
      'Sign in again before seeding content.',
    )
    expect(mocks.saveServicesContent).not.toHaveBeenCalled()
  })
})
