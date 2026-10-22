import { useEffect } from 'react'

// Shows the title in the browser tab, e.g. "Deep pothole near Wasa Circle · Babylon".
// { full: true } uses the title exactly as given, without " · Babylon" (the Home page).
// Puts the old tab title back when the page closes.
export function useDocumentTitle(title, { full = false } = {}) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = full ? title : `${title} · Babylon`
    return () => {
      document.title = previous
    }
  }, [title, full])
}
