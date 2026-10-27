import { useEffect, useRef } from 'react'
import Button from '../../components/ui/Button'
import LogoLoader from '../../components/ui/LogoLoader'
import { useT } from '../../i18n/useLanguage'

// The logo, pulsing, while the issue loads.
export function DetailLoading() {
  const t = useT()
  return <LogoLoader label={t('Loading issue…')} className="mt-9" />
}

// "Issue not found" (wrong id), a loading error, or a report that was
// deleted while it was open (deleted: its heading takes focus, so the change
// is heard and reading starts there).
export function DetailMessage({ error = false, deleted = false }) {
  const t = useT()
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
        {t(title)}
      </h1>
      <p className="text-sm text-slate">{t(text)}</p>
      <Button to="/map" variant="dark">
        {t('Back to map')}
      </Button>
    </section>
  )
}
