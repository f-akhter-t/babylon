import { useEffect } from 'react'

// Shows the title in the browser tab, e.g. "Deep pothole near Wasa Circle · Babylon".
// Puts the old tab title back when the page closes.
export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = `${title} · Babylon`
    return () => {
      document.title = previous
    }
  }, [title])
}
