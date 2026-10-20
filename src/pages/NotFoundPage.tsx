import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { ROUTES } from '../routes/paths'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-card">
        <BrandLogo className="mx-auto h-10 w-auto" />
        <p className="mt-6 font-label-caps text-label-caps uppercase tracking-widest text-primary">
          404
        </p>
        <h1 className="mt-1 font-headline-sm text-headline-sm text-on-surface">
          Page not found
        </h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">
          The page you are looking for does not exist.
        </p>
        <Link
          to={ROUTES.login}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-control bg-primary-container px-7 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-150 hover:bg-primary hover:shadow-md active:translate-y-px focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          Go to admin sign in
        </Link>
      </div>
    </main>
  )
}
