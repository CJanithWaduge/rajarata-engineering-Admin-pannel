import { type ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
}

export function SettingsFieldGroup({ title, children }: Props) {
  return (
    <section className="rounded-card border border-outline-variant bg-surface shadow-card">
      <header className="border-b border-outline-variant px-6 py-4">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      </header>
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}
