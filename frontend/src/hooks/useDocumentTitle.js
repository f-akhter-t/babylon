import { useEffect } from 'react'
import { useT } from '../i18n/useLanguage'

// Shows the title in the browser tab, e.g. "Deep pothole near Wasa Circle · Babylon".
// { full: true } uses the title exactly as given, without " · Babylon" (the Home page).
// Puts the old tab title back when the page closes.
export function useDocumentTitle(rawTitle, { full = false } = {}) {
  const t = useT()
  const title = rawTitle ? t(rawTitle) : rawTitle
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = full ? title : `${title} · ${t('Babylon')}`
    return () => {
      document.title = previous
    }
  }, [title, full, t])
}
