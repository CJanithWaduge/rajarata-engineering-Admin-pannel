import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { SelectField } from '../../../components/ui/SelectField'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import {
  ABOUT_ICON_OPTIONS,
  ABOUT_TEXT_LIMITS,
  METHOD_STEP_COUNT,
  aboutTextHint,
} from '../constants'
import type { AboutFormValues } from '../types'

type Props = {
  register: UseFormRegister<AboutFormValues>
  errors: FieldErrors<AboutFormValues>
  disabled: boolean
}

/** Heading plus the five fixed project stages. */
export function MethodologyEditor({ register, errors, disabled }: Props) {
  const methodologyErrors = errors.methodology

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="about-methodology-eyebrow"
          label="Eyebrow"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodologyEyebrow)}
          disabled={disabled}
          error={methodologyErrors?.eyebrow?.message}
          {...register('methodology.eyebrow')}
        />
        <TextField
          id="about-methodology-title"
          label="Title"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodologyTitle)}
          disabled={disabled}
          error={methodologyErrors?.title?.message}
          {...register('methodology.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="about-methodology-intro"
            label="Intro"
            rows={3}
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodologyIntro)}
            disabled={disabled}
            error={methodologyErrors?.intro?.message}
            {...register('methodology.intro')}
          />
        </div>
        <TextField
          id="about-methodology-protocol-label"
          label="Protocol label"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodologyProtocolLabel)}
          disabled={disabled}
          error={methodologyErrors?.protocolLabel?.message}
          {...register('methodology.protocolLabel')}
        />
        <TextField
          id="about-methodology-stages-label"
          label="Stages label"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodologyStagesLabel)}
          disabled={disabled}
          error={methodologyErrors?.stagesLabel?.message}
          {...register('methodology.stagesLabel')}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="font-label-md text-label-md font-semibold text-on-surface">
          Stages
        </legend>
        <p className="font-body-sm text-body-sm text-secondary">
          Exactly {METHOD_STEP_COUNT} stages. The 01–05 number is derived from
          the position and is not editable; blank fields keep the public page
          value.
        </p>

        <div className="grid gap-4">
          {Array.from({ length: METHOD_STEP_COUNT }, (_, index) => {
            const stepErrors = methodologyErrors?.steps?.[index]
            return (
              <div
                key={index}
                className="grid gap-5 rounded-card border border-outline-variant bg-surface-container-low/40 p-5 sm:grid-cols-2"
              >
                <p className="font-label-sm text-label-sm font-semibold text-on-surface sm:col-span-2">
                  Stage {String(index + 1).padStart(2, '0')}
                </p>
                <SelectField
                  id={`about-method-${index}-icon`}
                  label="Icon"
                  options={ABOUT_ICON_OPTIONS}
                  disabled={disabled}
                  error={stepErrors?.icon?.message}
                  {...register(
                    `methodology.steps.${index}.icon` as FieldPath<AboutFormValues>,
                  )}
                />
                <TextField
                  id={`about-method-${index}-title`}
                  label="Title"
                  hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodStepTitle)}
                  disabled={disabled}
                  error={stepErrors?.title?.message}
                  {...register(
                    `methodology.steps.${index}.title` as FieldPath<AboutFormValues>,
                  )}
                />
                <div className="sm:col-span-2">
                  <TextArea
                    id={`about-method-${index}-description`}
                    label="Description"
                    rows={3}
                    hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodStepDescription)}
                    disabled={disabled}
                    error={stepErrors?.description?.message}
                    {...register(
                      `methodology.steps.${index}.description` as FieldPath<AboutFormValues>,
                    )}
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    id={`about-method-${index}-footer`}
                    label="Footer label"
                    hint={aboutTextHint(ABOUT_TEXT_LIMITS.methodStepFooter)}
                    disabled={disabled}
                    error={stepErrors?.footer?.message}
                    {...register(
                      `methodology.steps.${index}.footer` as FieldPath<AboutFormValues>,
                    )}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
