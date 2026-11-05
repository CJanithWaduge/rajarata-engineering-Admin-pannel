import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { UnsavedChangesGuard } from '../../../components/ui/UnsavedChangesGuard'
import { PROJECT_COUNT } from '../constants'
import { imageSelectionFromContent, valuesFromContent } from '../defaults'
import { readProjectImageFile } from '../media'
import { projectsFormSchema } from '../schema'
import type {
  ProjectImageSelection,
  ProjectsContent,
  ProjectsDraft,
  ProjectsFormValues,
} from '../types'
import { ProjectCardEditor } from './ProjectCardEditor'
import { ProjectsCtaEditor } from './ProjectsCtaEditor'
import { ProjectsHeroEditor } from './ProjectsHeroEditor'
import { ProjectsTrackRecordEditor } from './ProjectsTrackRecordEditor'

type SectionKey = 'hero' | 'portfolio' | 'trackRecord' | 'cta'

type Props = {
  initial: ProjectsContent | null
  isSaving: boolean
  errorMessage: string | null
  onSubmit: (draft: ProjectsDraft) => void
}

function hasImageSelection(selection: ProjectImageSelection | undefined): boolean {
  if (!selection) return false
  if (selection.kind === 'new') return true
  if (selection.kind === 'stored') return selection.image.url.trim() !== ''
  return false
}

export function ProjectsContentForm({
  initial,
  isSaving,
  errorMessage,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProjectsFormValues>({
    resolver: zodResolver(projectsFormSchema),
    defaultValues: valuesFromContent(initial),
    shouldFocusError: true,
  })

  const [images, setImages] = useState<ProjectImageSelection[]>(() =>
    imageSelectionFromContent(initial),
  )
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({})
  const [validatingIndex, setValidatingIndex] = useState<number | null>(null)
  const [isImageDirty, setIsImageDirty] = useState(false)
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    hero: true,
    portfolio: false,
    trackRecord: false,
    cta: false,
  })

  const previewUrls = useRef<Array<string | null>>(
    Array.from({ length: PROJECT_COUNT }, () => null),
  )
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const urls = previewUrls.current
    return () => {
      mounted.current = false
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL?.(url)
      })
    }
  }, [])

  const toggle = (key: SectionKey) => {
    setOpen((current) => ({ ...current, [key]: !current[key] }))
  }

  const handleImageSelect = async (index: number, file: File) => {
    setValidatingIndex(index)
    setImageErrors((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })

    const result = await readProjectImageFile(file).catch(() => null)

    if (!mounted.current) {
      if (result?.ok) URL.revokeObjectURL?.(result.image.previewUrl)
      return
    }

    setValidatingIndex(null)

    if (!result) {
      setImageErrors((current) => ({
        ...current,
        [index]: 'This image could not be read. Choose a different file.',
      }))
      return
    }

    if (!result.ok) {
      setImageErrors((current) => ({ ...current, [index]: result.message }))
      return
    }

    if (previewUrls.current[index]) {
      URL.revokeObjectURL?.(previewUrls.current[index]!)
    }
    previewUrls.current[index] = result.image.previewUrl
    setImages((current) =>
      current.map((image, i) => (i === index ? result.image : image)),
    )
    setIsImageDirty(true)
  }

  const handleImageClear = (index: number) => {
    if (previewUrls.current[index]) {
      URL.revokeObjectURL?.(previewUrls.current[index]!)
      previewUrls.current[index] = null
    }
    setImages((current) =>
      current.map((image, i) => (i === index ? { kind: 'none' } : image)),
    )
    setImageErrors((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })
    setIsImageDirty(true)
  }

  const handleInvalid = (formErrors: FieldErrors<ProjectsFormValues>) => {
    setOpen((current) => ({
      ...current,
      hero: current.hero || Boolean(formErrors.hero),
      portfolio: current.portfolio || Boolean(formErrors.portfolio),
      trackRecord: current.trackRecord || Boolean(formErrors.trackRecord),
      cta: current.cta || Boolean(formErrors.cta),
    }))

    window.setTimeout(() => {
      const firstInvalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      )
      firstInvalid?.focus()
    }, 0)
  }

  const submit = handleSubmit((values) => {
    // Text is optional, but an admin-supplied image still needs alt text: the
    // public page has no built-in image to fall back to.
    const missingAlt = values.portfolio.projects.findIndex(
      (project, index) =>
        hasImageSelection(images[index]) && project.alt.trim() === '',
    )

    if (missingAlt !== -1) {
      setImageErrors((current) => ({
        ...current,
        [missingAlt]: 'Add alt text for the selected image.',
      }))
      setOpen((current) => ({ ...current, portfolio: true }))
      window.setTimeout(() => {
        document.getElementById(`projects-card-${missingAlt}-image-alt`)?.focus()
      }, 0)
      return
    }

    setImageErrors({})
    onSubmit({ ...values, images })
  }, handleInvalid)

  const dirty = isDirty || isImageDirty
  const hasNewImage = images.some((image) => image.kind === 'new')

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

      <Alert variant="info">
        Every text field is optional; leave one blank to keep the public page’s
        build-time copy for that slot. The document is saved as one unit, so fixed
        array counts and the category allowlist must still be valid. Each card’s
        image is optional too: without one the public page keeps its own artwork.
      </Alert>

      <CollapsibleSection
        title="Hero"
        description="Eyebrow, headline, and intro shown at the top of the public Projects page."
        open={open.hero}
        onToggle={() => toggle('hero')}
        contentClassName="px-6 py-5"
      >
        <ProjectsHeroEditor register={register} errors={errors} disabled={isSaving} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Project Cards"
        description="Six fixed project cards. Blank text keeps the public page copy; images are optional."
        open={open.portfolio}
        onToggle={() => toggle('portfolio')}
        contentClassName="grid gap-5 px-6 py-5"
        badge={
          hasNewImage ? (
            <span className="rounded-chip bg-primary-container/10 px-2.5 py-1 font-label-caps text-label-caps uppercase tracking-wider text-primary">
              New image
            </span>
          ) : null
        }
      >
        {Array.from({ length: PROJECT_COUNT }, (_, index) => (
          <ProjectCardEditor
            key={index}
            index={index}
            register={register}
            errors={errors.portfolio}
            disabled={isSaving}
            image={images[index]!}
            imageError={imageErrors[index] ?? null}
            isValidating={validatingIndex === index}
            onImageSelect={(file) => void handleImageSelect(index, file)}
            onImageClear={() => handleImageClear(index)}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="Track Record"
        description="The three fixed capability columns that sit under the portfolio."
        open={open.trackRecord}
        onToggle={() => toggle('trackRecord')}
        contentClassName="px-6 py-5"
      >
        <ProjectsTrackRecordEditor register={register} errors={errors} disabled={isSaving} />
      </CollapsibleSection>

      <CollapsibleSection
        title="CTA"
        description="The closing panel copy. Contact buttons stay in Site Settings."
        open={open.cta}
        onToggle={() => toggle('cta')}
        contentClassName="px-6 py-5"
      >
        <ProjectsCtaEditor register={register} errors={errors} disabled={isSaving} />
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
