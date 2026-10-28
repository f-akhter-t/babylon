import { useNumber, useT } from '../../i18n/useLanguage'

// "Previous  Page 2 of 7  Next" under a list (see hooks/useListView.js).
// Shows nothing when everything fits on one page.
export default function Pager({ view, onDark = false }) {
  const t = useT()
  const n = useNumber()
  if (view.pages <= 1) return null

  const button =
    'min-h-11 rounded-full border border-navy/40 bg-white px-5 py-2 font-body text-sm font-bold text-navy hover:bg-mint-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white'
  return (
    <nav aria-label={t('Pages')} className="flex flex-wrap items-center justify-center gap-4 py-3">
      <button type="button" className={button} disabled={view.page <= 1} onClick={() => view.setPage(view.page - 1)}>
        {t('Previous')}
      </button>
      <span className={`font-body text-sm font-semibold ${onDark ? 'text-frost/80' : 'text-muted'}`} aria-live="polite">
        {t('Page {page} of {pages}', { page: n(view.page), pages: n(view.pages) })}
      </span>
      <button type="button" className={button} disabled={view.page >= view.pages} onClick={() => view.setPage(view.page + 1)}>
        {t('Next')}
      </button>
    </nav>
  )
}
