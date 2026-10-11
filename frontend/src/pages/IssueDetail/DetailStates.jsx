import Button from '../../components/ui/Button'

const BLOCK = 'rounded-panel bg-white/50 motion-safe:animate-pulse'

// Grey shapes in the same places as the real page, while the issue loads.
export function DetailLoading() {
  return (
    <div role="status" className="mt-9 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <span className="sr-only">Loading issue…</span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className={`h-64 sm:h-80 ${BLOCK}`} />
        <div className={`h-60 ${BLOCK}`} />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className={`h-8 w-2/3 ${BLOCK}`} />
        <div className={`h-24 ${BLOCK}`} />
        <div className={`h-12 ${BLOCK}`} />
        <div className={`h-56 ${BLOCK}`} />
      </div>
    </div>
  )
}

// "Issue not found" (wrong id), or a loading error.
export function DetailMessage({ error = false }) {
  return (
    <section className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-panel bg-white p-8 text-center">
      <h1 className="font-heading text-3xl font-extrabold text-navy">
        {error ? 'Could not load this issue' : 'Issue not found'}
      </h1>
      <p className="text-sm text-slate">
        {error
          ? 'Something went wrong. Please try again in a moment.'
          : 'There is no issue with this number. The link may be wrong, or the issue was removed.'}
      </p>
      <Button to="/map" variant="dark">
        Back to map
      </Button>
    </section>
  )
}
