import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { CARD_COUNT, type ImageKind } from '../constants'
import { draftFromContent } from '../defaults'
import { formatBytes, readImageFile } from '../imageValidation'
import { homeTextSchema } from '../schema'
import type { CardTextField, HomeContent, HomeDraft, NewImage } from '../types'
import { CollapsibleSection } from './CollapsibleSection'
import { FeaturedProjectEditor } from './FeaturedProjectEditor'
import { HomeImageField } from './HomeImageField'
import { UnsavedChangesGuard } from './UnsavedChangesGuard'

type Props = {
  initial: HomeContent | null
  isSaving: boolean
  errorMessage: string | null
  onSubmit: (draft: HomeDraft) => void
}

function textFieldId(path: string): string {
  if (path === 'heroAlt') return 'home-hero-alt'
  const match = /^cards\.(\d+)\.(\w+)$/.exec(path)
  return match ? `home-card-${match[1]}-${match[2]}` : ''
}

function imageMeta(draft: HomeDraft['hero']): string | null {
  if (draft.image.kind === 'new') {
    return `${draft.image.file.name} · ${draft.image.width} x ${draft.image.height} px · ${formatBytes(draft.image.size)}`
  }
  if (draft.image.kind === 'stored' && draft.image.image.width > 0) {
    return `${draft.image.image.width} x ${draft.image.image.height} px`
  }
  return null
}

function imageUrlFor(image: HomeDraft['hero']['image']): string {
  if (image.kind === 'new') return image.previewUrl
  if (image.kind === 'stored') return image.image.url
  return ''
}

export function HomeContentForm({
  initial,
  isSaving,
  errorMessage,
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState<HomeDraft>(() => draftFromContent(initial))
  const [textErrors, setTextErrors] = useState<Record<string, string>>({})
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({})
  const [validating, setValidating] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState(false)
  const [heroOpen, setHeroOpen] = useState(false)
  const [openCards, setOpenCards] = useState<boolean[]>(() =>
    Array.from({ length: CARD_COUNT }, () => false),
  )

  const previews = useRef<Record<string, string>>({})
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      Object.values(previews.current).forEach((url) => URL.revokeObjectURL?.(url))
      previews.current = {}
    }
  }, [])

  const clearTextError = (path: string) => {
    setTextErrors((current) => {
      if (!(path in current)) return current
      const next = { ...current }
      delete next[path]
      return next
    })
  }

  const toggleCard = (index: number) => {
    setOpenCards((current) =>
      current.map((open, cardIndex) => (cardIndex === index ? !open : open)),
    )
  }

  const replacePreview = (key: string, url: string) => {
    const previous = previews.current[key]
    if (previous) URL.revokeObjectURL?.(previous)
    previews.current[key] = url
  }

  const handleImageSelect = async (key: string, kind: ImageKind, file: File) => {
    setValidating((current) => ({ ...current, [key]: true }))
    setImageErrors((current) => ({ ...current, [key]: '' }))

    const result = await readImageFile(file, kind).catch(() => null)

    if (!mounted.current) {
      if (result?.ok) URL.revokeObjectURL?.(result.image.previewUrl)
      return
    }

    setValidating((current) => ({ ...current, [key]: false }))

    if (!result) {
      setImageErrors((current) => ({
        ...current,
        [key]: 'This image could not be read. Choose a different file.',
      }))
      return
    }

    if (!result.ok) {
      setImageErrors((current) => ({ ...current, [key]: result.message }))
      return
    }

    replacePreview(key, result.image.previewUrl)

    const selection: NewImage = {
      kind: 'new',
      file: result.image.file,
      previewUrl: result.image.previewUrl,
      width: result.image.width,
      height: result.image.height,
      size: result.image.size,
      contentType: result.image.contentType,
    }

    if (key === 'hero') {
      setDraft((current) => ({
        ...current,
        hero: { ...current.hero, image: selection },
      }))
    } else {
      const index = Number(key.replace('card-', ''))
      setDraft((current) => ({
        ...current,
        cards: current.cards.map((card, cardIndex) =>
          cardIndex === index ? { ...card, image: selection } : card,
        ),
      }))
    }

    setImageErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setDirty(true)
  }

  const handleCardChange = (index: number, field: CardTextField, value: string) => {
    setDraft((current) => ({
      ...current,
      cards: current.cards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card,
      ),
    }))
    clearTextError(`cards.${index}.${field}`)
    setDirty(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = homeTextSchema.safeParse({
      heroAlt: draft.hero.alt,
      cards: draft.cards.map((card) => ({
        alt: card.alt,
        category: card.category,
        venue: card.venue,
        topic: card.topic,
        tag: card.tag,
      })),
    })

    const nextTextErrors: Record<string, string> = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextTextErrors[issue.path.join('.')] = issue.message
      }
    }

    const nextImageErrors: Record<string, string> = {}
    if (draft.hero.image.kind === 'none') {
      nextImageErrors.hero = 'Choose a hero image.'
    }
    draft.cards.forEach((card, index) => {
      if (card.image.kind === 'none') {
        nextImageErrors[`card-${index}`] = 'Choose an image for this card.'
      }
    })

    setTextErrors(nextTextErrors)
    setImageErrors(nextImageErrors)

    const cardErrorIndexes = new Set<number>()
    for (const path of Object.keys(nextTextErrors)) {
      const match = /^cards\.(\d+)\./.exec(path)
      if (match) cardErrorIndexes.add(Number(match[1]))
    }
    for (const key of Object.keys(nextImageErrors)) {
      if (key.startsWith('card-')) {
        cardErrorIndexes.add(Number(key.slice('card-'.length)))
      }
    }
    if (cardErrorIndexes.size > 0) {
      setOpenCards((current) =>
        current.map((open, index) => open || cardErrorIndexes.has(index)),
      )
    }
    if (nextTextErrors.heroAlt || nextImageErrors.hero) {
      setHeroOpen(true)
    }

    if (!parsed.success || Object.keys(nextImageErrors).length > 0) {
      const firstTextPath = Object.keys(nextTextErrors)[0]
      const firstImageKey = Object.keys(nextImageErrors)[0]

      window.setTimeout(() => {
        if (firstTextPath) {
          const id = textFieldId(firstTextPath)
          if (id) document.getElementById(id)?.focus()
        } else if (firstImageKey) {
          const id =
            firstImageKey === 'hero' ? 'home-hero-file' : `home-${firstImageKey}-file`
          document.getElementById(id)?.focus()
        }
      }, 0)
      return
    }

    onSubmit({
      hero: { image: draft.hero.image, alt: parsed.data.heroAlt },
      cards: draft.cards.map((card, index) => ({
        ...card,
        ...parsed.data.cards[index],
      })),
    })
  }

  const heroMeta = imageMeta(draft.hero)

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

      <CollapsibleSection
        title="Hero image"
        description="The photograph behind the Home page hero."
        open={heroOpen}
        onToggle={() => setHeroOpen((current) => !current)}
        contentClassName="grid gap-5 px-6 py-5 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <HomeImageField
            id="home-hero-file"
            label="Hero image"
            imageUrl={imageUrlFor(draft.hero.image)}
            meta={heroMeta}
            error={imageErrors.hero ?? null}
            isValidating={Boolean(validating.hero)}
            disabled={isSaving}
            onSelect={(file) => void handleImageSelect('hero', 'hero', file)}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="home-hero-alt"
            label="Image alt text"
            value={draft.hero.alt}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                hero: { ...current.hero, alt: event.target.value },
              }))
              clearTextError('heroAlt')
              setDirty(true)
            }}
            hint="Describe the image for screen readers (1–160 characters)."
            error={textErrors.heroAlt}
            disabled={isSaving}
          />
        </div>
      </CollapsibleSection>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Featured Engineering Projects
          </h2>
          <p className="mt-1 font-body-md text-body-md text-secondary">
            Each card is edited independently. Saving writes all three cards together.
          </p>
        </div>

        {draft.cards.map((card, index) => (
          <FeaturedProjectEditor
            key={index}
            index={index}
            card={card}
            errors={textErrors}
            imageError={imageErrors[`card-${index}`] ?? null}
            isValidating={Boolean(validating[`card-${index}`])}
            disabled={isSaving}
            open={openCards[index] ?? true}
            onToggle={() => toggleCard(index)}
            onImageSelect={(file) =>
              void handleImageSelect(`card-${index}`, 'card', file)
            }
            onChange={(field: CardTextField, value: string) =>
              handleCardChange(index, field, value)
            }
          />
        ))}
      </section>

      <div className="flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body-sm text-body-sm text-secondary">
          Images are validated before upload. Changes go live immediately after saving.
        </p>
        <Button type="submit" isLoading={isSaving} disabled={!dirty || isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <UnsavedChangesGuard when={dirty && !isSaving} />
    </form>
  )
}
