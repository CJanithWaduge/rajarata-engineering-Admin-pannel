import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { SelectField } from '../../../components/ui/SelectField'
import { TextField } from '../../../components/ui/TextField'
import {
  QUICK_LINK_COUNT,
  SERVICE_ANCHOR_OPTIONS,
  SERVICE_ICON_OPTIONS,
} from '../constants'
import type { ServicesFormValues } from '../types'

type Props = {
  register: UseFormRegister<ServicesFormValues>
  errors: FieldErrors<ServicesFormValues['hero']> | undefined
  disabled: boolean
}

/** The four hero chips. Their target must resolve to one of the fixed cards. */
export function QuickLinksEditor({ register, errors, disabled }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-label-md text-label-md font-semibold text-on-surface">
        Quick links
      </legend>
      <p className="font-body-sm text-body-sm text-secondary">
        Four chips shown beside the hero. Each one jumps to a fixed service anchor.
      </p>

      <div className="grid gap-4">
        {Array.from({ length: QUICK_LINK_COUNT }, (_, index) => (
          <div
            key={index}
            className="rounded-control border border-outline-variant bg-surface-container-low/50 p-4"
          >
            <p className="mb-3 font-label-sm text-label-sm font-semibold text-on-surface">
              Quick link {index + 1}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                id={`services-quick-${index}-label`}
                label="Label"
                disabled={disabled}
                error={errors?.quickLinks?.[index]?.label?.message}
                {...register(
                  `hero.quickLinks.${index}.label` as FieldPath<ServicesFormValues>,
                )}
              />
              <SelectField
                id={`services-quick-${index}-icon`}
                label="Icon"
                options={SERVICE_ICON_OPTIONS}
                disabled={disabled}
                error={errors?.quickLinks?.[index]?.icon?.message}
                {...register(
                  `hero.quickLinks.${index}.icon` as FieldPath<ServicesFormValues>,
                )}
              />
              <SelectField
                id={`services-quick-${index}-target`}
                label="Anchor"
                options={SERVICE_ANCHOR_OPTIONS}
                disabled={disabled}
                error={errors?.quickLinks?.[index]?.target?.message}
                {...register(
                  `hero.quickLinks.${index}.target` as FieldPath<ServicesFormValues>,
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
