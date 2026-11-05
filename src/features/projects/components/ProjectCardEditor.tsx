import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { SelectField } from '../../../components/ui/SelectField'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { PROJECT_CATEGORY_OPTIONS, PROJECT_TEXT_LIMITS } from '../constants'
import type {
  ProjectImageSelection,
  ProjectsFormValues,
} from '../types'
import { ProjectImageField } from './ProjectImageField'

type Props = {
  index: number
  register: UseFormRegister<ProjectsFormValues>
  errors: FieldErrors<ProjectsFormValues>['portfolio'] | undefined
  disabled: boolean
  image: ProjectImageSelection
  imageError: string | null
  isValidating: boolean
  onImageSelect?: (file: File) => void
  onImageClear?: () => void
}

/**
 * One fixed project slot. The category is the only required field; every text
 * field is optional so a blank slot keeps the public page's build-time copy.
 * The image is optional too: without one the public page keeps its own artwork.
 */
export function ProjectCardEditor({
  index,
  register,
  errors,
  disabled,
  image,
  imageError,
  isValidating,
  onImageSelect,
  onImageClear,
}: Props) {
  const cardErrors = errors?.projects?.[index]
  const number = String(index + 1).padStart(2, '0')

  const imageUrl =
    image.kind === 'new'
      ? image.previewUrl
      : image.kind === 'stored'
        ? image.image.url
        : ''
  const meta =
    image.kind === 'new'
      ? `${image.file.name} · ${image.width} × ${image.height} px · ${(image.size / 1024).toFixed(0)} KB`
      : image.kind === 'stored' && image.image.width > 0
        ? `${image.image.width} × ${image.image.height} px`
        : null

  return (
    <fieldset className="rounded-card border border-outline-variant bg-surface-container-low/40 p-5">
      <legend className="px-1 font-headline-sm text-headline-sm text-on-surface">
        Project {index + 1}
      </legend>
      <p className="mb-5 font-body-sm text-body-sm text-secondary">
        Read-only position:{' '}
        <span className="font-label-sm text-label-sm text-on-surface">
          {number}
        </span>
      </p>

      <ProjectImageField
        id={`projects-card-${index}-image`}
        label="Card image"
        imageUrl={imageUrl}
        meta={meta}
        error={imageError}
        isValidating={isValidating}
        disabled={disabled}
        onSelect={(file) => onImageSelect?.(file)}
        showClear={image.kind !== 'none'}
        onClear={onImageClear}
      />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <SelectField
          id={`projects-card-${index}-category`}
          label="Category"
          options={PROJECT_CATEGORY_OPTIONS}
          disabled={disabled}
          error={cardErrors?.category?.message}
          {...register(
            `portfolio.projects.${index}.category` as FieldPath<ProjectsFormValues>,
          )}
        />
        <TextField
          id={`projects-card-${index}-sub-tag`}
          label="Sub tag"
          hint="0–60 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.subTag?.message}
          {...register(
            `portfolio.projects.${index}.subTag` as FieldPath<ProjectsFormValues>,
          )}
        />
        <TextField
          id={`projects-card-${index}-location`}
          label="Location"
          hint="0–60 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.location?.message}
          {...register(
            `portfolio.projects.${index}.location` as FieldPath<ProjectsFormValues>,
          )}
        />
        <TextField
          id={`projects-card-${index}-year`}
          label="Year"
          hint="0–20 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.year?.message}
          {...register(
            `portfolio.projects.${index}.year` as FieldPath<ProjectsFormValues>,
          )}
        />
        <TextField
          id={`projects-card-${index}-type`}
          label="Type placeholder"
          hint="0–60 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.typePlaceholder?.message}
          {...register(
            `portfolio.projects.${index}.typePlaceholder` as FieldPath<ProjectsFormValues>,
          )}
        />
        <TextField
          id={`projects-card-${index}-title`}
          label="Title"
          hint="0–100 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.title?.message}
          {...register(
            `portfolio.projects.${index}.title` as FieldPath<ProjectsFormValues>,
          )}
        />
        <div className="sm:col-span-2">
          <TextArea
            id={`projects-card-${index}-summary`}
            label="Summary"
            rows={3}
            hint="0–320 characters. Leave blank to keep the public copy."
            disabled={disabled}
            error={cardErrors?.summary?.message}
            {...register(
              `portfolio.projects.${index}.summary` as FieldPath<ProjectsFormValues>,
            )}
          />
        </div>
        <TextField
          id={`projects-card-${index}-ref`}
          label="Project reference"
          hint="0–80 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.ref?.message}
          {...register(
            `portfolio.projects.${index}.ref` as FieldPath<ProjectsFormValues>,
          )}
        />
        <TextField
          id={`projects-card-${index}-spec-label`}
          label="Scope label"
          hint="0–60 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.specLabel?.message}
          {...register(
            `portfolio.projects.${index}.specLabel` as FieldPath<ProjectsFormValues>,
          )}
        />
        <TextField
          id={`projects-card-${index}-spec-value`}
          label="Scope value"
          hint="0–80 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={cardErrors?.specValue?.message}
          {...register(
            `portfolio.projects.${index}.specValue` as FieldPath<ProjectsFormValues>,
          )}
        />
        <div className="sm:col-span-2">
          <TextArea
            id={`projects-card-${index}-spec-detail`}
            label="Scope detail"
            rows={4}
            hint="0–600 characters. Leave blank to keep the public copy."
            disabled={disabled}
            error={cardErrors?.specDetail?.message}
            {...register(
              `portfolio.projects.${index}.specDetail` as FieldPath<ProjectsFormValues>,
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id={`projects-card-${index}-image-alt`}
            label="Image alt text"
            hint={`Describe the selected image for screen readers (up to ${PROJECT_TEXT_LIMITS.projectImageAlt} characters). Required only when you choose an image.`}
            disabled={disabled}
            error={cardErrors?.alt?.message}
            {...register(
              `portfolio.projects.${index}.alt` as FieldPath<ProjectsFormValues>,
            )}
          />
        </div>
      </div>
    </fieldset>
  )
}
