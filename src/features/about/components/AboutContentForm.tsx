import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { UnsavedChangesGuard } from '../../../components/ui/UnsavedChangesGuard'
import {
  imageSelectionFromContent,
  valuesFromContent,
} from '../defaults'
import { formatAboutBytes, readAboutImageFile } from '../media'
import { aboutFormSchema } from '../schema'
import type {
  AboutContent,
  AboutDraft,
  AboutFormValues,
  AboutImageSelection,
} from '../types'
import { AboutCtaEditor } from './AboutCtaEditor'
import { AboutHeroEditor } from './AboutHeroEditor'
import { AboutImageField } from './AboutImageField'
import { CorePillarsEditor } from './CorePillarsEditor'
import { HeritageEditor } from './HeritageEditor'
import { IndustriesEditor } from './IndustriesEditor'
import { MethodologyEditor } from './MethodologyEditor'
import { VisionMissionEditor } from './VisionMissionEditor'

type SectionKey =
  | 'hero'
  | 'heritage'
  | 'visionMission'
  | 'pillars'
  | 'methodology'
  | 'industries'
  | 'cta'

type Props = {
  initial: AboutContent | null
  isSaving: boolean
  errorMessage: string | null
  onSubmit: (draft: AboutDraft) => void
}

function imageUrlFor(image: AboutImageSelection): string {
  if (image.kind === 'new') return image.previewUrl
  if (image.kind === 'stored') return image.image.url
  return ''
}

function imageMeta(image: AboutImageSelection): string | null {
  if (image.kind === 'new') {
    const optimized =
      image.optimized && image.originalSize > image.size
        ? ` · optimized from ${formatAboutBytes(image.originalSize)}`
        : ''
    return `${image.file.name} · ${image.width} x ${image.height} px · ${formatAboutBytes(image.size)}${optimized}`
  }
  if (image.kind === 'stored' && image.image.width > 0) {
    return `${image.image.width} x ${image.image.height} px`
  }
  return null
}

export function AboutContentForm({
  initial,
  isSaving,
  errorMessage,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AboutFormValues>({
    resolver: zodResolver(aboutFormSchema),
    defaultValues: valuesFromContent(initial),
    shouldFocusError: true,
  })

  const [image, setImage] = useState<AboutImageSelection>(() =>
    imageSelectionFromContent(initial),
  )
  const [imageError, setImageError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImageDirty, setIsImageDirty] = useState(false)
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    hero: true,
    heritage: false,
    visionMission: false,
    pillars: false,
    methodology: false,
    industries: false,
    cta: false,
  })

  const previewRef = useRef<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (previewRef.current) {
        URL.revokeObjectURL?.(previewRef.current)
        previewRef.current = null
      }
    }
  }, [])

  const toggle = (key: SectionKey) => {
    setOpen((current) => ({ ...current, [key]: !current[key] }))
  }

  const handleImageSelect = async (file: File) => {
    setIsValidating(true)
    setImageError(null)

    const result = await readAboutImageFile(file).catch(() => null)

    if (!mounted.current) {
      if (result?.ok) URL.revokeObjectURL?.(result.image.previewUrl)
      return
    }

    setIsValidating(false)

    if (!result) {
      setImageError('This image could not be read. Choose a different file.')
      return
    }

    if (!result.ok) {
      setImageError(result.message)
      return
    }

    if (previewRef.current) URL.revokeObjectURL?.(previewRef.current)
    previewRef.current = result.image.previewUrl
    setImage(result.image)
    setIsImageDirty(true)
  }

  const handleImageClear = () => {
    if (previewRef.current) {
      URL.revokeObjectURL?.(previewRef.current)
      previewRef.current = null
    }
    setImage({ kind: 'none' })
    setImageError(null)
    setIsImageDirty(true)
  }

  const handleInvalid = (formErrors: FieldErrors<AboutFormValues>) => {
    setOpen((current) => ({
      ...current,
      hero: current.hero || Boolean(formErrors.hero),
      heritage: current.heritage || Boolean(formErrors.heritage),
      visionMission: current.visionMission || Boolean(formErrors.visionMission),
      pillars: current.pillars || Boolean(formErrors.pillars),
      methodology: current.methodology || Boolean(formErrors.methodology),
      industries: current.industries || Boolean(formErrors.industries),
      cta: current.cta || Boolean(formErrors.cta),
    }))

    window.setTimeout(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      firstInvalid?.focus()
    }, 0)
  }

  const submit = handleSubmit((values) => {
    // Text is optional, but an admin-supplied image still needs alt text: the
    // public page has no built-in image to fall back to.
    const hasSelectedImage =
      image.kind === 'new' ||
      (image.kind === 'stored' && image.image.url.trim() !== '')

    if (hasSelectedImage && values.hero.alt.trim() === '') {
      setImageError('Add alt text for the selected hero image.')
      setOpen((current) => ({ ...current, hero: true }))
      window.setTimeout(() => {
        document.getElementById('about-hero-alt')?.focus()
      }, 0)
      return
    }

    setImageError(null)
    onSubmit({ ...values, hero: { ...values.hero, image } })
  }, handleInvalid)

  const dirty = isDirty || isImageDirty

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

      <Alert variant="info">
        Every field is optional. Leave anything blank to keep the value the
        public page already shows for that slot. Contact numbers and the business
        address stay in Site Settings.
      </Alert>

      <CollapsibleSection
        title="Hero"
        description="Eyebrow, headline, intro, hero image, snapshot and overlay labels."
        open={open.hero}
        onToggle={() => toggle('hero')}
        contentClassName="grid gap-6 px-6 py-5"
        badge={
          image.kind === 'new' ? (
            <span className="rounded-chip bg-primary-container/10 px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-primary">
              New image
            </span>
          ) : null
        }
      >
        <AboutImageField
          id="about-hero-file"
          label="Hero image"
          imageUrl={imageUrlFor(image)}
          meta={imageMeta(image)}
          error={imageError}
          isValidating={isValidating}
          disabled={isSaving}
          onSelect={(file) => void handleImageSelect(file)}
          showClear={image.kind !== 'none'}
          onClear={handleImageClear}
        />
        <AboutHeroEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Story & Milestones"
        description="The “How We Work & What We Do” copy and four fixed timeline entries."
        open={open.heritage}
        onToggle={() => toggle('heritage')}
        contentClassName="px-6 py-5"
      >
        <HeritageEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Vision & Mission"
        description="Two paired cards for the vision and mission statements."
        open={open.visionMission}
        onToggle={() => toggle('visionMission')}
        contentClassName="px-6 py-5"
      >
        <VisionMissionEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Core Pillars"
        description="Heading and five fixed conduct pillars."
        open={open.pillars}
        onToggle={() => toggle('pillars')}
        contentClassName="px-6 py-5"
      >
        <CorePillarsEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Project Methodology"
        description="Heading and five fixed project stages."
        open={open.methodology}
        onToggle={() => toggle('methodology')}
        contentClassName="px-6 py-5"
      >
        <MethodologyEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Industries Served"
        description="Heading and six fixed sector cards."
        open={open.industries}
        onToggle={() => toggle('industries')}
        contentClassName="px-6 py-5"
      >
        <IndustriesEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="CTA"
        description="The closing panel copy and action labels. Phone and WhatsApp numbers stay in Site Settings."
        open={open.cta}
        onToggle={() => toggle('cta')}
        contentClassName="px-6 py-5"
      >
        <AboutCtaEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <div className="flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body-sm text-body-sm text-secondary">
          One Save writes the whole document. Changes go live immediately.
        </p>
        <Button type="submit" isLoading={isSaving} disabled={!dirty || isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <UnsavedChangesGuard when={dirty && !isSaving} />
    </form>
  )
}
