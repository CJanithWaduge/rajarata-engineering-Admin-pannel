import { TextField } from '../../../components/ui/TextField'
import { formatBytes } from '../imageValidation'
import type { CardDraft, CardTextField } from '../types'
import { CollapsibleSection } from './CollapsibleSection'
import { HomeImageField } from './HomeImageField'

type Props = {
  index: number
  card: CardDraft
  errors: Record<string, string>
  imageError: string | null
  isValidating: boolean
  disabled: boolean
  open: boolean
  onToggle: () => void
  onImageSelect: (file: File) => void
  onChange: (field: CardTextField, value: string) => void
}

function imageUrlFor(card: CardDraft): string {
  if (card.image.kind === 'new') return card.image.previewUrl
  if (card.image.kind === 'stored') return card.image.image.url
  return ''
}

function imageMeta(card: CardDraft): string | null {
  if (card.image.kind === 'new') {
    return `${card.image.file.name} · ${card.image.width} x ${card.image.height} px · ${formatBytes(card.image.size)}`
  }
  if (card.image.kind === 'stored' && card.image.image.width > 0) {
    return `${card.image.image.width} x ${card.image.image.height} px`
  }
  return null
}

export function FeaturedProjectEditor({
  index,
  card,
  errors,
  imageError,
  isValidating,
  disabled,
  open,
  onToggle,
  onImageSelect,
  onChange,
}: Props) {
  const errorFor = (field: CardTextField) => errors[`cards.${index}.${field}`]
  const fieldId = (field: CardTextField) => `home-card-${index}-${field}`

  return (
    <CollapsibleSection
      title={`Card ${index + 1}`}
      description="Image, category, venue, topic, and tag for this slot."
      open={open}
      onToggle={onToggle}
      headingLevel={3}
      contentClassName="grid gap-5 px-6 py-5 sm:grid-cols-2"
      badge={
        card.image.kind === 'new' ? (
          <span className="rounded-chip bg-primary-container/10 px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-primary">
            New image
          </span>
        ) : null
      }
    >
      <div className="sm:col-span-2">
        <HomeImageField
          id={`home-card-${index}-file`}
          label={`Card ${index + 1} image`}
          imageUrl={imageUrlFor(card)}
          meta={imageMeta(card)}
          error={imageError}
          isValidating={isValidating}
          disabled={disabled}
          onSelect={onImageSelect}
        />
      </div>

      <div className="sm:col-span-2">
        <TextField
          id={fieldId('alt')}
          label="Image alt text"
          value={card.alt}
          onChange={(event) => onChange('alt', event.target.value)}
          hint="Describe the image for screen readers (1–160 characters)."
          error={errorFor('alt')}
          disabled={disabled}
        />
      </div>

      <TextField
        id={fieldId('category')}
        label="Category"
        value={card.category}
        onChange={(event) => onChange('category', event.target.value)}
        hint="Chip label, for example Industrial, Commercial, or ELV."
        error={errorFor('category')}
        disabled={disabled}
      />

      <TextField
        id={fieldId('venue')}
        label="Venue"
        value={card.venue}
        onChange={(event) => onChange('venue', event.target.value)}
        hint="Location shown in the metadata row."
        error={errorFor('venue')}
        disabled={disabled}
      />

      <TextField
        id={fieldId('topic')}
        label="Topic"
        value={card.topic}
        onChange={(event) => onChange('topic', event.target.value)}
        hint="The card title."
        error={errorFor('topic')}
        disabled={disabled}
      />

      <TextField
        id={fieldId('tag')}
        label="Tag (optional)"
        value={card.tag}
        onChange={(event) => onChange('tag', event.target.value)}
        hint="Short right-hand label. Leave empty to hide it."
        error={errorFor('tag')}
        disabled={disabled}
      />
    </CollapsibleSection>
  )
}
