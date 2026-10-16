import { useEffect, useRef } from 'react'
import Button from '../../components/ui/Button'

const BLOCK = 'skeleton rounded-panel bg-white/50'

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

// "Issue not found" (wrong id), a loading error, or a report that was
// deleted while it was open (deleted: its heading takes focus, so the change
// is heard and reading starts there).
export function DetailMessage({ error = false, deleted = false }) {
  const headingRef = useRef(null)
  useEffect(() => {
    if (deleted) headingRef.current?.focus()
  }, [deleted])

  let title = 'Issue not found'
  let text = 'There is no issue with this number. The link may be wrong, or the issue was removed.'
  if (error) {
    title = 'Could not load this issue'
    text = 'Something went wrong. Please try again in a moment.'
  } else if (deleted) {
    title = 'This report was deleted.'
    text = 'The citizen who filed it deleted it, so it is no longer on the map or in the feed.'
  }
  return (
    <section className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-panel bg-white p-8 text-center">
      <h1
        ref={headingRef}
        tabIndex={deleted ? -1 : undefined}
        className="font-heading text-3xl font-extrabold text-navy focus:outline-none"
      >
        {title}
      </h1>
      <p className="text-sm text-slate">{text}</p>
      <Button to="/map" variant="dark">
        Back to map
      </Button>
    </section>
  )
}
