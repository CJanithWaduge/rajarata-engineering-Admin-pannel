import { CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { IconPicker } from '../../../components/ui/IconPicker'
import { SelectField } from '../../../components/ui/SelectField'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import {
  HOME_SERVICE_ICON_OPTIONS,
  HOME_SERVICE_LINK_OPTIONS,
} from '../constants'
import type { HomeService } from '../types'

export type HomeServiceTextField = 'icon' | 'title' | 'description' | 'href'

type Props = {
  index: number
  service: HomeService
  errors: Record<string, string>
  disabled: boolean
  open: boolean
  onToggle: () => void
  onChange: (field: HomeServiceTextField, value: string) => void
}

const LINK_OPTIONS = [
  { value: '', label: 'Keep current link' },
  ...HOME_SERVICE_LINK_OPTIONS,
]

export function HomeServiceEditor({
  index,
  service,
  errors,
  disabled,
  open,
  onToggle,
  onChange,
}: Props) {
  const errorFor = (field: HomeServiceTextField) =>
    errors[`services.${index}.${field}`]
  const fieldId = (field: HomeServiceTextField) =>
    `home-service-${index}-${field}`

  return (
    <CollapsibleSection
      title={`Service Card ${index + 1}`}
      description="Each field is optional. A blank field keeps the public site's current value."
      open={open}
      onToggle={onToggle}
      headingLevel={3}
      contentClassName="grid gap-5 px-6 py-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <IconPicker
          id={fieldId('icon')}
          label="Icon"
          value={service.icon}
          options={HOME_SERVICE_ICON_OPTIONS}
          emptyLabel="Keep current icon"
          onChange={(value) => onChange('icon', value)}
          hint="Search any icon by name. Curated icons use the public site's built-in font; other results load from Iconify."
          error={errorFor('icon')}
          disabled={disabled}
        />
      </div>

      <div className="sm:col-span-2">
        <SelectField
          id={fieldId('href')}
          label="Learn More link"
          value={service.href}
          options={LINK_OPTIONS}
          onChange={(event) => onChange('href', event.target.value)}
          hint="Service anchor on the Services page."
          error={errorFor('href')}
          disabled={disabled}
        />
      </div>

      <div className="sm:col-span-2">
        <TextField
          id={fieldId('title')}
          label="Title"
          value={service.title}
          onChange={(event) => onChange('title', event.target.value)}
          hint="The card heading (80 characters or fewer)."
          error={errorFor('title')}
          disabled={disabled}
        />
      </div>

      <div className="sm:col-span-2">
        <TextArea
          id={fieldId('description')}
          label="Description"
          value={service.description}
          onChange={(event) => onChange('description', event.target.value)}
          hint="The card body copy (320 characters or fewer)."
          rows={3}
          error={errorFor('description')}
          disabled={disabled}
        />
      </div>
    </CollapsibleSection>
  )
}
