import {
  INLINE_IMAGE_MAX_BYTES_LABEL,
  INLINE_IMAGE_TARGETS,
  MAX_SOURCE_BYTES_LABEL,
} from '../../home/constants'
import { INLINE_MEDIA_ENABLED } from '../../home/mediaMode'
import { ABOUT_IMAGE_RULE } from '../constants'

type Props = {
  id: string
  label: string
  imageUrl: string
  meta: string | null
  error: string | null
  isValidating: boolean
  disabled: boolean
  onSelect: (file: File) => void
  /** Shown only when an image is selected; clearing restores the public hero. */
  onClear?: () => void
  showClear?: boolean
}

const ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'

/** Hero image picker for the About page. Same gate and preview as Home. */
export function AboutImageField({
  id,
  label,
  imageUrl,
  meta,
  error,
  isValidating,
  disabled,
  onSelect,
  onClear,
  showClear = false,
}: Props) {
  const rule = ABOUT_IMAGE_RULE
  const target = INLINE_IMAGE_TARGETS.hero
  const inlineHint = INLINE_MEDIA_ENABLED
    ? ` Saved inline at up to ${target.maxWidth} × ${target.maxHeight} px and ${INLINE_IMAGE_MAX_BYTES_LABEL.hero}.`
    : ''

  return (
    <div className="flex flex-col gap-3">
      <span
        id={`${id}-label`}
        className="font-label-sm text-label-sm font-semibold text-on-surface"
      >
        {label}
      </span>

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-control border border-outline-variant bg-surface-container">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center font-body-sm text-body-sm text-secondary">
            The public page hero will be used. Choose an image to replace it.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <input
          id={id}
          type="file"
          accept={ACCEPT}
          disabled={disabled || isValidating}
          aria-labelledby={`${id}-label`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="peer sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onSelect(file)
          }}
        />
        <label
          htmlFor={id}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-control border-[1.5px] border-outline-variant bg-transparent px-4 font-label-md text-label-md text-on-surface transition-colors hover:border-outline hover:bg-surface-container-low peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-container peer-disabled:pointer-events-none peer-disabled:opacity-50"
        >
          {imageUrl ? 'Replace image' : 'Choose image'}
        </label>

        {showClear && onClear ? (
          <button
            type="button"
            onClick={onClear}
            disabled={disabled || isValidating}
            className="inline-flex h-10 items-center justify-center rounded-control border-[1.5px] border-outline-variant bg-transparent px-4 font-label-md text-label-md text-on-surface transition-colors hover:border-outline hover:bg-surface-container-low disabled:pointer-events-none disabled:opacity-50"
          >
            Use public image
          </button>
        ) : null}

        {isValidating ? (
          <span role="status" className="font-body-sm text-body-sm text-secondary">
            Checking image…
          </span>
        ) : null}

        {meta ? (
          <span className="font-body-sm text-body-sm text-secondary">{meta}</span>
        ) : null}
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="font-body-sm text-body-sm text-primary-container">
          {error}
        </p>
      ) : (
        <p className="font-body-sm text-body-sm text-secondary">
          {`Min ${rule.minWidth} × ${rule.minHeight} px · max ${rule.maxWidth} × ${rule.maxHeight} px · aspect ${rule.minAspect}:1–${rule.maxAspect}:1 · JPEG, PNG or WebP · source up to ${MAX_SOURCE_BYTES_LABEL} · large files are optimized automatically.${inlineHint}`}
        </p>
      )}
    </div>
  )
}
