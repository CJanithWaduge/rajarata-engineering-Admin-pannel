import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { SelectField } from '../../../components/ui/SelectField'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import {
  SERVICE_ANCHORS,
  SERVICE_ICON_OPTIONS,
  SUITABLE_FOR_COUNT,
} from '../constants'
import type { ServicesFormValues } from '../types'

type Props = {
  index: number
  register: UseFormRegister<ServicesFormValues>
  errors: FieldErrors<ServicesFormValues>['services'] | undefined
  disabled: boolean
}

/**
 * One fixed service slot. The number and anchor are derived from the index and
 * deliberately not editable; the public card uses both.
 */
export function ServiceCardEditor({
  index,
  register,
  errors,
  disabled,
}: Props) {
  const number = String(index + 1).padStart(2, '0')
  const anchor = SERVICE_ANCHORS[index]
  const cardErrors = errors?.[index]

  return (
    <fieldset className="rounded-card border border-outline-variant bg-surface-container-low/40 p-5">
      <legend className="px-1 font-headline-sm text-headline-sm text-on-surface">
        Service {index + 1}
      </legend>
      <p className="mb-5 font-body-sm text-body-sm text-secondary">
        Read-only position:{' '}
        <span className="font-label-sm text-label-sm text-on-surface">
          {number} · #{anchor}
        </span>
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id={`services-card-${index}-icon`}
          label="Card icon"
          options={SERVICE_ICON_OPTIONS}
          disabled={disabled}
          error={cardErrors?.icon?.message}
          {...register(
            `services.${index}.icon` as FieldPath<ServicesFormValues>,
          )}
        />
        <TextField
          id={`services-card-${index}-category`}
          label="Category badge"
          hint="1–40 characters."
          disabled={disabled}
          error={cardErrors?.category?.message}
          {...register(
            `services.${index}.category` as FieldPath<ServicesFormValues>,
          )}
        />
        <div className="sm:col-span-2">
          <TextField
            id={`services-card-${index}-title`}
            label="Title"
            hint="1–80 characters."
            disabled={disabled}
            error={cardErrors?.title?.message}
            {...register(
              `services.${index}.title` as FieldPath<ServicesFormValues>,
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <TextArea
            id={`services-card-${index}-description`}
            label="What It Is"
            rows={3}
            hint="1–320 characters."
            disabled={disabled}
            error={cardErrors?.description?.message}
            {...register(
              `services.${index}.description` as FieldPath<ServicesFormValues>,
            )}
          />
        </div>
        <div className="sm:col-span-2">
          <TextArea
            id={`services-card-${index}-scope`}
            label="Scope of work"
            rows={4}
            hint="1–500 characters."
            disabled={disabled}
            error={cardErrors?.scope?.message}
            {...register(
              `services.${index}.scope` as FieldPath<ServicesFormValues>,
            )}
          />
        </div>

        <div className="sm:col-span-2">
          <p className="font-label-sm text-label-sm font-semibold text-on-surface">
            Suitable for
          </p>
          <p className="mb-3 font-body-sm text-body-sm text-secondary">
            Exactly {SUITABLE_FOR_COUNT} short chips, each 1–40 characters.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: SUITABLE_FOR_COUNT }, (_, chipIndex) => (
              <TextField
                key={chipIndex}
                id={`services-card-${index}-suitable-${chipIndex}`}
                label={`Suitable-for chip ${chipIndex + 1}`}
                disabled={disabled}
                error={cardErrors?.suitableFor?.[chipIndex]?.message}
                {...register(
                  `services.${index}.suitableFor.${chipIndex}` as FieldPath<ServicesFormValues>,
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </fieldset>
  )
}
