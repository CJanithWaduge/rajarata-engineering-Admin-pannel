import { BrandLogo } from '../../../components/brand/BrandLogo'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-auth-surface">
      {/* Login backdrop. The source PNG lives at the repo root; the optimised
          WebP in public/ is what ships. Scrims below keep the form readable
          without hiding the artwork. */}
      <img
        src="/login-bg.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-auth-surface/45"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-auth-surface via-auth-surface/10 to-auth-surface/60"
      />

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <BrandLogo variant="dark" className="mx-auto h-10 w-auto" />
            <p className="mt-6 font-label-caps text-label-caps uppercase tracking-widest text-primary-fixed-dim">
              Admin portal
            </p>
            <h1 className="mt-2 font-headline-md text-headline-md text-auth-on-surface">
              Admin sign in
            </h1>
            <p className="mt-2 font-body-md text-body-md text-auth-on-surface-muted">
              Manage Rajarata Engineering website content.
            </p>
          </div>

          <div className="rounded-card border border-t-[3px] border-auth-outline/70 border-t-primary-container bg-auth-surface-raised/80 p-6 shadow-overlay backdrop-blur-xl sm:p-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center font-body-sm text-body-sm text-auth-on-surface-muted">
            Authorised administrators only.
          </p>
        </div>
      </div>
    </main>
  )
}
