import { Alert } from '../../../components/ui/Alert'

export function SettingsEmptyState() {
  return (
    <Alert variant="info">
      No site settings document exists yet. The public site currently hides contact
      details. Saving the form below will create `site/settings`. No placeholder
      values are written automatically.
    </Alert>
  )
}
