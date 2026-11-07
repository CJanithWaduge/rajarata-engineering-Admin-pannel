import { describe, expect, it } from 'vitest'
import { seedHomeDraft } from '../seed-data'
import type { HomeContent, HomeImage } from '../types'

function image(path: string): HomeImage {
  return {
    url: `https://example.com/${path}.jpg`,
    path: `home/${path}`,
    alt: `Existing ${path} photograph`,
    width: 1200,
    height: 800,
    size: 1000,
    contentType: 'image/jpeg',
  }
}

describe('seedHomeDraft', () => {
  it('seeds the public project copy while preserving existing images', () => {
    const previous: HomeContent = {
      hero: image('hero'),
      featuredProjects: [
        {
          image: image('project-1'),
          category: 'Old category',
          venue: 'Old venue',
          topic: 'Old title',
          tag: 'Old tag',
        },
        {
          image: image('project-2'),
          category: 'Old category',
          venue: 'Old venue',
          topic: 'Old title',
          tag: 'Old tag',
        },
        {
          image: image('project-3'),
          category: 'Old category',
          venue: 'Old venue',
          topic: 'Old title',
          tag: 'Old tag',
        },
      ],
      featuredServices: [],
      updatedAt: null,
      updatedBy: null,
    }

    const draft = seedHomeDraft(previous)

    expect(draft.hero.image).toEqual({ kind: 'stored', image: previous.hero })
    expect(draft.cards.map((card) => card.topic)).toEqual([
      'Industrial Power Distribution & Installations',
      'MDB / SMDB Panels & Commercial Wiring',
      'ELV Systems & Building Automation',
    ])
    expect(draft.cards.map((card) => card.image)).toEqual(
      previous.featuredProjects.map((project) => ({
        kind: 'stored',
        image: project.image,
      })),
    )
    expect(draft.cards[0]?.alt).toBe('Existing project-1 photograph')
  })

  it('seeds project copy without inventing image selections when none exist', () => {
    const draft = seedHomeDraft()

    expect(draft.hero.image.kind).toBe('none')
    expect(draft.cards).toHaveLength(3)
    expect(draft.cards.every((card) => card.image.kind === 'none')).toBe(true)
    expect(draft.cards.every((card) => card.topic !== '')).toBe(true)
  })
})
