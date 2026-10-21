import { useId, type ReactNode } from 'react'
import { ChevronDownIcon } from '../../../components/layout/icons'

type Props = {
  title: string
  description: string
  open: boolean
  onToggle: () => void
  badge?: ReactNode
  headingLevel?: 2 | 3
  contentClassName?: string
  children: ReactNode
}

/**
 * Card wrapper with an accessible expand/collapse control.
 *
 * The content stays mounted and is hidden with the `hidden` attribute, so the
 * form keeps its state and `aria-controls` always points at a real element.
 */
export function CollapsibleSection({
  title,
  description,
  open,
  onToggle,
  badge,
  headingLevel = 2,
  contentClassName = 'px-6 py-5',
  children,
}: Props) {
  const contentId = useId()
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <section className="overflow-hidden rounded-card border border-outline-variant bg-surface shadow-card">
      <header className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-4">
        <div className="min-w-0">
          <Heading className="font-headline-sm text-headline-sm text-on-surface">
            {title}
          </Heading>
          <p className="mt-1 font-body-sm text-body-sm text-secondary">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            onClick={onToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            <ChevronDownIcon
              className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </header>

      <div id={contentId} hidden={!open}>
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  )
}
