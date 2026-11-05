import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { TextField } from '../../../components/ui/TextField'
import { METRIC_COUNT } from '../constants'
import type { ServicesFormValues } from '../types'

type Props = {
  register: UseFormRegister<ServicesFormValues>
  errors: FieldErrors<ServicesFormValues['hero']> | undefined
  disabled: boolean
}

/** The four-item metrics ribbon below the hero. */
export function MetricsEditor({ register, errors, disabled }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-label-md text-label-md font-semibold text-on-surface">
        Hero metrics
      </legend>
      <p className="font-body-sm text-body-sm text-secondary">
        Four short value statements. Emphasis stays fixed in the public layout.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: METRIC_COUNT }, (_, index) => (
          <div
            key={index}
            className="rounded-control border border-outline-variant bg-surface-container-low/50 p-4"
          >
            <p className="mb-3 font-label-sm text-label-sm font-semibold text-on-surface">
              Metric {index + 1}
            </p>
            <div className="grid gap-4">
              <TextField
                id={`services-metric-${index}-kicker`}
                label="Kicker"
                disabled={disabled}
                error={errors?.metrics?.[index]?.kicker?.message}
                {...register(
                  `hero.metrics.${index}.kicker` as FieldPath<ServicesFormValues>,
                )}
              />
              <TextField
                id={`services-metric-${index}-title`}
                label="Title"
                disabled={disabled}
                error={errors?.metrics?.[index]?.title?.message}
                {...register(
                  `hero.metrics.${index}.title` as FieldPath<ServicesFormValues>,
                )}
              />
              <TextField
                id={`services-metric-${index}-description`}
                label="Description"
                disabled={disabled}
                error={errors?.metrics?.[index]?.description?.message}
                {...register(
                  `hero.metrics.${index}.description` as FieldPath<ServicesFormValues>,
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
