import { useAuth } from '../features/auth/useAuth'

export function DashboardPage() {
  const { admin } = useAuth()

  return (
    <section className="space-y-6">
      <div>
        <p className="font-label-caps text-label-caps uppercase tracking-widest text-primary">
          Overview
        </p>
        <h1 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
          Dashboard
        </h1>
        <p className="mt-1 font-body-md text-body-md text-secondary">
          Signed in as {admin?.email || 'admin'}.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest p-8 shadow-card">
        <span
          className="absolute inset-y-0 left-0 w-[3px] bg-primary-container"
          aria-hidden="true"
        />
        <h2 className="font-title-lg text-title-lg text-on-surface">
          Content management
        </h2>
        <p className="mt-2 font-body-md text-body-md text-secondary">
          Website content sections will appear here in Phase 2.
        </p>
      </div>
    </section>
  )
}
