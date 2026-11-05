import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { ABOUT_TEXT_LIMITS, aboutTextHint } from '../constants'
import type { AboutFormValues } from '../types'

type Props = {
  register: UseFormRegister<AboutFormValues>
  errors: FieldErrors<AboutFormValues>
  disabled: boolean
}

type CardKey = 'vision' | 'mission'

const CARDS: { key: CardKey; label: string }[] = [
  { key: 'vision', label: 'Vision' },
  { key: 'mission', label: 'Mission' },
]

export function VisionMissionEditor({ register, errors, disabled }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {CARDS.map(({ key, label }) => {
        const cardErrors = errors.visionMission?.[key]
        return (
          <fieldset
            key={key}
            className="grid gap-5 rounded-card border border-outline-variant bg-surface-container-low/40 p-5"
          >
            <legend className="px-1 font-headline-sm text-headline-sm text-on-surface">
              {label}
            </legend>

            <TextField
              id={`about-${key}-eyebrow`}
              label="Eyebrow"
              hint={aboutTextHint(ABOUT_TEXT_LIMITS.visionEyebrow)}
              disabled={disabled}
              error={cardErrors?.eyebrow?.message}
              {...register(
                `visionMission.${key}.eyebrow` as FieldPath<AboutFormValues>,
              )}
            />
            <TextField
              id={`about-${key}-title`}
              label="Title"
              hint={aboutTextHint(ABOUT_TEXT_LIMITS.visionTitle)}
              disabled={disabled}
              error={cardErrors?.title?.message}
              {...register(
                `visionMission.${key}.title` as FieldPath<AboutFormValues>,
              )}
            />
            <TextArea
              id={`about-${key}-body`}
              label="Body"
              rows={5}
              hint={aboutTextHint(ABOUT_TEXT_LIMITS.visionBody)}
              disabled={disabled}
              error={cardErrors?.body?.message}
              {...register(
                `visionMission.${key}.body` as FieldPath<AboutFormValues>,
              )}
            />
            <TextField
              id={`about-${key}-footer`}
              label="Footer line"
              hint={aboutTextHint(ABOUT_TEXT_LIMITS.visionFooter)}
              disabled={disabled}
              error={cardErrors?.footer?.message}
              {...register(
                `visionMission.${key}.footer` as FieldPath<AboutFormValues>,
              )}
            />
          </fieldset>
        )
      })}
    </div>
  )
}
