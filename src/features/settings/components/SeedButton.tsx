import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { seedAllContent } from '../seedContentService'

type SeedState = 'idle' | 'saving' | 'success' | 'error'

const CONFIRM_MESSAGE =
  'Seed Services, About, and Projects with the public site copy? This replaces the text in those three pages. Images, Home content, and contact details are not changed.'

export function SeedButton() {
  const { admin } = useAuth()
  const [state, setState] = useState<SeedState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSeed = async () => {
    if (state === 'saving') return
    if (!window.confirm(CONFIRM_MESSAGE)) return

    setState('saving')
    setMessage(null)

    try {
      const result = await seedAllContent(admin?.uid ?? '')
      setState('success')
      setMessage(
        `Seeded ${result.pages.join(', ')}. Reload those pages to see the new content.`,
      )
    } catch (error) {
      setState('error')
      setMessage(
        error instanceof Error ? error.message : 'Could not seed page content.',
      )
    }
  }

  return (
    <section className="rounded-card border border-outline-variant bg-surface shadow-card">
      <header className="border-b border-outline-variant px-6 py-4">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Seed page content
        </h2>
      </header>
      <div className="flex flex-col gap-3 px-6 py-5">
        <p className="font-body-sm text-body-sm text-secondary">
          Copies the public site&apos;s built-in Services, About, and Projects copy
          into Firestore so it can be edited here. Use this once on a new project,
          or to reset those pages to their original wording.
        </p>
        <p className="font-body-sm text-body-sm text-secondary">
          It does not touch Home images, the site logo, or contact details. Those
          stay where they are.
        </p>
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleSeed()}
            isLoading={state === 'saving'}
          >
            {state === 'saving' ? 'Seeding content…' : 'Seed page content'}
          </Button>
        </div>
        {state === 'success' && message ? (
          <Alert variant="success">{message}</Alert>
        ) : null}
        {state === 'error' && message ? (
          <Alert variant="error">{message}</Alert>
        ) : null}
      </div>
    </section>
  )
}
