import Button from '../../components/ui/Button'

const BLOCK = 'rounded-card bg-white/50 motion-safe:animate-pulse'

// Grey shapes in the same places as the real page, while the profile loads.
export function ProfileLoading() {
  return (
    <div role="status" className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <span className="sr-only">Loading your profile…</span>
      <div aria-hidden="true" className={`h-64 lg:col-start-2 lg:row-start-1 ${BLOCK}`} />
      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className={`h-80 ${BLOCK}`} />
        <div className={`h-48 ${BLOCK}`} />
        <div className={`h-56 ${BLOCK}`} />
      </div>
    </div>
  )
}

export function ProfileError({ onRetry }) {
  return (
    <section
      role="alert"
      className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-panel bg-white p-8 text-center"
    >
      <h2 className="font-heading text-2xl font-extrabold text-navy">Could not load your profile</h2>
      <p className="font-body text-sm text-slate">
        Something went wrong. Please try again in a moment.
      </p>
      <Button variant="dark" onClick={onRetry}>
        Try again
      </Button>
    </section>
  )
}
