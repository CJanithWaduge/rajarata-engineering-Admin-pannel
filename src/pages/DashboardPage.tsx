import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { FullPageSpinner } from '../components/ui/FullPageSpinner'
import { Alert } from '../components/ui/Alert'
import { ROUTES } from '../routes/paths'
import {
  HomeIcon,
  ServicesIcon,
  AboutIcon,
  ProjectsIcon,
  SettingsIcon,
} from '../components/layout/icons'
import { getSettings } from '../features/settings/settingsService'
import { getHomeContent } from '../features/home/homeContentService'
import { getServicesContent } from '../features/services/servicesContentService'
import { getAboutContent } from '../features/about/aboutContentService'
import { getProjectsContent } from '../features/projects/projectsContentService'

type SectionStatus = 'configured' | 'not-configured' | 'error'

interface SectionSummary {
  label: string
  route: string
  icon: React.ElementType
  status: SectionStatus
  updatedAt: Date | null
  updatedBy: string | null
  metric: string
  error?: string
}

function formatDate(date: Date | null): string {
  if (!date) return 'Not saved yet'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatTime(date: Date | null): string | null {
  if (!date) return null
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusColor(status: SectionStatus): string {
  switch (status) {
    case 'configured':
      return 'bg-secondary-container text-on-secondary-container border-secondary-container/30'
    case 'not-configured':
      return 'bg-error-container/10 text-primary-container border-primary-container/30'
    case 'error':
      return 'bg-error-container text-on-error-container border-error-container/30'
    default:
      return 'bg-surface-container text-on-surface border-outline-variant'
  }
}

function statusText(status: SectionStatus): string {
  switch (status) {
    case 'configured':
      return 'Configured'
    case 'not-configured':
      return 'Not configured'
    case 'error':
      return 'Error'
    default:
      return '—'
  }
}

export function DashboardPage() {
  const { admin } = useAuth()
  const [sections, setSections] = useState<SectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const HomeIconMod = HomeIcon
      const ServicesIconMod = ServicesIcon
      const AboutIconMod = AboutIcon
      const ProjectsIconMod = ProjectsIcon
      const SettingsIconMod = SettingsIcon

      const descriptors: Array<{
        label: string
        route: string
        icon: React.ElementType
        fetch: () => Promise<{
          exists: boolean
          updatedAt: Date | null
          updatedBy: string | null
          metric: string
        }>
      }> = [
        {
          label: 'Site Settings',
          route: ROUTES.settings,
          icon: SettingsIconMod,
          fetch: async () => {
            const { settings, exists } = await getSettings()
            const filled = [
              settings.phone,
              settings.whatsapp,
              settings.email,
              settings.address,
              settings.facebookUrl,
              settings.location,
            ].filter((value) => value.trim() !== '').length
            return {
              exists,
              updatedAt: settings.updatedAt,
              updatedBy: settings.updatedBy,
              metric: `${filled} of 6 contact fields filled`,
            }
          },
        },
        {
          label: 'Home Page',
          route: ROUTES.home,
          icon: HomeIconMod,
          fetch: async () => {
            const { content, exists } = await getHomeContent()
            const cards = content?.featuredProjects.filter(
              (project) => project.image.url.trim() !== ''
            ).length ?? 0
            return {
              exists,
              updatedAt: content?.updatedAt ?? null,
              updatedBy: content?.updatedBy ?? null,
              metric: `${cards} of 3 featured projects configured`,
            }
          },
        },
        {
          label: 'Services Page',
          route: ROUTES.services,
          icon: ServicesIconMod,
          fetch: async () => {
            const { content, exists } = await getServicesContent()
            const serviceCount = content?.services.length ?? 0
            return {
              exists,
              updatedAt: content?.updatedAt ?? null,
              updatedBy: content?.updatedBy ?? null,
              metric: `${serviceCount} of 8 service cards configured`,
            }
          },
        },
        {
          label: 'About Us Page',
          route: ROUTES.about,
          icon: AboutIconMod,
          fetch: async () => {
            const { content, exists } = await getAboutContent()
            const sectorCount = content?.industries.sectors.length ?? 0
            const pillarCount = content?.pillars.items.length ?? 0
            return {
              exists,
              updatedAt: content?.updatedAt ?? null,
              updatedBy: content?.updatedBy ?? null,
              metric: `${sectorCount} sectors, ${pillarCount} pillars configured`,
            }
          },
        },
        {
          label: 'Projects Page',
          route: ROUTES.projects,
          icon: ProjectsIconMod,
          fetch: async () => {
            const { content, exists } = await getProjectsContent()
            const projectCount = content?.portfolio.projects.length ?? 0
            return {
              exists,
              updatedAt: content?.updatedAt ?? null,
              updatedBy: content?.updatedBy ?? null,
              metric: `${projectCount} of 6 project cards configured`,
            }
          },
        },
      ]

      const results = await Promise.allSettled(
        descriptors.map((descriptor) => descriptor.fetch())
      )

      if (cancelled) return

      const summaries: SectionSummary[] = descriptors.map((descriptor, index) => {
        const result = results[index]
        if (result.status === 'rejected') {
          return {
            label: descriptor.label,
            route: descriptor.route,
            icon: descriptor.icon,
            status: 'error' as SectionStatus,
            updatedAt: null,
            updatedBy: null,
            metric: 'Failed to load',
            error:
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
          }
        }
        const value = result.value
        return {
          label: descriptor.label,
          route: descriptor.route,
          icon: descriptor.icon,
          status: value.exists
            ? ('configured' as SectionStatus)
            : ('not-configured' as SectionStatus),
          updatedAt: value.updatedAt,
          updatedBy: value.updatedBy,
          metric: value.metric,
        }
      })

      setSections(summaries)
      setLoading(false)
    }

    load().catch((err) => {
      if (!cancelled) {
        setError(
          err instanceof Error ? err.message : String(err)
        )
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <FullPageSpinner />
  }

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <p className="font-label-caps text-label-caps uppercase tracking-widest text-primary">
            Overview
          </p>
          <h1 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
            Dashboard
          </h1>
        </div>
        <Alert variant="error">{error}</Alert>
      </section>
    )
  }

  const configuredCount = sections.filter(
    (section) => section.status === 'configured'
  ).length
  const attentionCount = sections.filter(
    (section) => section.status === 'not-configured' || section.status === 'error'
  ).length
  const latestUpdate = sections.reduce<Date | null>((latest, section) => {
    if (!section.updatedAt) return latest
    return !latest || section.updatedAt > latest ? section.updatedAt : latest
  }, null)

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-outline-variant pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-caps text-label-caps uppercase tracking-widest text-primary">
            Overview
          </p>
          <h1 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl font-body-md text-body-md text-secondary">
            Manage your website content and see what needs attention.
          </p>
        </div>
        <p className="font-body-sm text-body-sm text-secondary sm:text-right">
          Signed in as{' '}
          <span className="font-label-md text-label-md text-on-surface">
            {admin?.email || 'admin'}
          </span>
        </p>
      </header>

      <div
        aria-label="Content overview"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div className="rounded-card border border-outline-variant bg-surface-container-lowest px-5 py-4 shadow-card">
          <p className="font-label-sm text-label-sm text-secondary">
            Content sections
          </p>
          <p className="mt-1 font-headline-sm text-headline-sm text-on-surface">
            {sections.length}
          </p>
        </div>
        <div className="rounded-card border border-outline-variant bg-surface-container-lowest px-5 py-4 shadow-card">
          <p className="font-label-sm text-label-sm text-secondary">
            Configured
          </p>
          <p className="mt-1 font-headline-sm text-headline-sm text-on-surface">
            {configuredCount}
            <span className="ml-1 font-body-sm text-body-sm text-secondary">
              of {sections.length}
            </span>
          </p>
        </div>
        <div className="rounded-card border border-outline-variant bg-surface-container-lowest px-5 py-4 shadow-card">
          <p className="font-label-sm text-label-sm text-secondary">
            Needs attention
          </p>
          <p
            className={`mt-1 font-headline-sm text-headline-sm ${attentionCount ? 'text-primary' : 'text-on-surface'}`}
          >
            {attentionCount}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">
              Website content
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">
              Choose a section to review or make changes.
            </p>
          </div>
          <p className="font-body-sm text-body-sm text-secondary">
            {latestUpdate
              ? `Latest update ${formatDate(latestUpdate)}`
              : 'No content saved yet'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section.route}
              className="group relative flex min-h-56 flex-col overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary-fixed-dim hover:shadow-hover"
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{
                  backgroundColor:
                    section.status === 'configured'
                      ? 'var(--color-secondary-container)'
                      : section.status === 'not-configured'
                        ? 'var(--color-primary-container)'
                        : 'var(--color-error-container)',
                }}
                aria-hidden="true"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-container-low text-primary">
                  <section.icon className="h-5 w-5" />
                </span>
                <span
                  className={`inline-flex items-center rounded-chip border px-2.5 py-1 font-label-sm text-label-sm uppercase tracking-wider ${statusColor(section.status)}`}
                >
                  {statusText(section.status)}
                </span>
              </div>
              <h3 className="mt-4 font-title-lg text-title-lg text-on-surface">
                {section.label}
              </h3>
              <p className="mt-1 font-body-md text-body-md text-secondary">
                {section.metric}
              </p>
              {section.error ? (
                <p className="mt-2 break-words font-body-sm text-body-sm text-error">
                  {section.error}
                </p>
              ) : null}
              <div className="mt-auto flex items-end justify-between gap-3 border-t border-outline-variant pt-4">
                <div className="min-w-0">
                  <p className="font-label-sm text-label-sm text-secondary">
                    Last saved
                  </p>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface">
                    {formatDate(section.updatedAt)}
                    {formatTime(section.updatedAt) ? (
                      <span className="ml-1 text-secondary">
                        · {formatTime(section.updatedAt)}
                      </span>
                    ) : null}
                  </p>
                </div>
                <Link
                  to={section.route}
                  className="shrink-0 rounded-control px-3 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary-container/10 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                >
                  Manage
                  <span aria-hidden="true" className="ml-1">
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
