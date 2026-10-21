type Props = {
  id: string
  label: string
  imageUrl: string
  meta: string | null
  error: string | null
  isValidating: boolean
  disabled: boolean
  onSelect: (file: File) => void
}

const ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'

export function HomeImageField({
  id,
  label,
  imageUrl,
  meta,
  error,
  isValidating,
  disabled,
  onSelect,
}: Props) {
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
            No image selected
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
          JPEG, PNG, or WebP. The file is checked before it can be uploaded.
        </p>
      )}
    </div>
  )
}
