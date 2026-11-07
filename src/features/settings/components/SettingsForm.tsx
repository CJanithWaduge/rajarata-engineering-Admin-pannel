import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SettingsFormValues } from '../types'
import { SETTINGS_FIELDS } from '../defaults'
import { settingsSchema } from '../schema'
import { Button } from '../../../components/ui/Button'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { Alert } from '../../../components/ui/Alert'
import { SettingsFieldGroup } from './SettingsFieldGroup'
import { SettingsImageField } from './SettingsImageField'
import { readSettingsImageFile } from '../media'
import type { SettingsDraft, SettingsImageSelection } from '../types'

type Props = {
  defaultValues: SettingsFormValues
  initialLogo: SettingsImageSelection
  onSubmit: (draft: SettingsDraft) => void
  isSaving: boolean
  errorMessage?: string | null
}

function imageUrlFor(image: SettingsImageSelection): string {
  if (image.kind === 'new') return image.previewUrl
  if (image.kind === 'stored') return image.image.url
  return ''
}

function imageMeta(image: SettingsImageSelection): string | null {
  if (image.kind === 'new') {
    const optimized =
      image.optimized && image.originalSize > image.size
        ? ` · optimized from ${(image.originalSize / 1024).toFixed(0)} KB`
        : ''
    return `${image.file.name} · ${image.width} x ${image.height} px · ${(image.size / 1024).toFixed(0)} KB${optimized}`
  }
  if (image.kind === 'stored' && image.image.width > 0) {
    return `${image.image.width} x ${image.image.height} px`
  }
  return null
}

export function SettingsForm({
  defaultValues,
  initialLogo,
  onSubmit,
  isSaving,
  errorMessage,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  })

  const prevDefault = useRef<SettingsFormValues>(defaultValues)

  useEffect(() => {
    if (JSON.stringify(prevDefault.current) !== JSON.stringify(defaultValues)) {
      prevDefault.current = defaultValues
      reset(defaultValues)
    }
  }, [defaultValues, reset])

  const [image, setImage] = useState<SettingsImageSelection>(initialLogo)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImageDirty, setIsImageDirty] = useState(false)

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

  const handleImageSelect = async (file: File) => {
    setIsValidating(true)
    setImageError(null)

    const result = await readSettingsImageFile(file).catch(() => null)

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

  const handleInvalid = () => {
    window.setTimeout(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      firstInvalid?.focus()
    }, 0)
  }

  const submit = handleSubmit((values) => {
    // Text is optional, but an admin-supplied logo still needs alt text: the
    // public page has no built-in image to fall back to.
    const hasSelectedImage =
      image.kind === 'new' ||
      (image.kind === 'stored' && image.image.url.trim() !== '')

    if (hasSelectedImage && values.logoAlt.trim() === '') {
      setImageError('Add alt text for the selected logo image.')
      window.setTimeout(() => {
        document.getElementById('settings-logo-alt')?.focus()
      }, 0)
      return
    }

    setImageError(null)
    onSubmit({ ...values, image })
  }, handleInvalid)

  const dirty = isDirty || isImageDirty

  const renderField = (field: (typeof SETTINGS_FIELDS)[number]) => (
    <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
      {field.type === 'textarea' ? (
        <TextArea
          {...register(field.key)}
          label={field.label}
          placeholder={field.placeholder}
          hint={field.hint}
          rows={3}
          error={errors[field.key]?.message}
          disabled={isSaving}
        />
      ) : (
        <TextField
          {...register(field.key)}
          label={field.label}
          placeholder={field.placeholder}
          autoComplete={field.autocomplete}
          hint={field.hint}
          error={errors[field.key]?.message}
          disabled={isSaving}
          tone="light"
        />
      )}
    </div>
  )

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      {errorMessage ? (
        <Alert variant="error">{errorMessage}</Alert>
      ) : null}

      <SettingsFieldGroup title="Logo">
        <div className="sm:col-span-2">
          <SettingsImageField
            id="settings-logo-file"
            label="Logo image"
            imageUrl={imageUrlFor(image)}
            meta={imageMeta(image)}
            error={imageError}
            isValidating={isValidating}
            disabled={isSaving}
            onSelect={(file) => void handleImageSelect(file)}
            showClear={image.kind !== 'none'}
            onClear={handleImageClear}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="settings-logo-alt"
            label="Logo alt text"
            hint="Describe the logo for screen readers (up to 160 characters). Required only when you upload a logo."
            disabled={isSaving}
            error={errors.logoAlt?.message}
            {...register('logoAlt')}
            tone="light"
          />
        </div>
      </SettingsFieldGroup>

      <SettingsFieldGroup title="Contact">
        {SETTINGS_FIELDS.filter((field) => field.group === 'contact').map(renderField)}
      </SettingsFieldGroup>

      <SettingsFieldGroup title="Location">
        {SETTINGS_FIELDS.filter((field) => field.group === 'location').map(renderField)}
      </SettingsFieldGroup>

      <SettingsFieldGroup title="Links">
        {SETTINGS_FIELDS.filter((field) => field.group === 'links').map(renderField)}
      </SettingsFieldGroup>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving} disabled={!dirty || isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
