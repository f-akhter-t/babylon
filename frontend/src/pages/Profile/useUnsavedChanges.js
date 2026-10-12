import { useEffect } from 'react'

// Asks before leaving the page while something is not saved yet:
// closing or reloading the tab, and clicking a link inside the app.
//   useUnsavedChanges(hasChanges, 'You have unsaved changes. Leave anyway?')
// The app uses <BrowserRouter>, which has no navigation blocker, so links are
// checked here before React Router handles the click.
export function useUnsavedChanges(when, message) {
  useEffect(() => {
    if (!when) return

    function handleBeforeUnload(e) {
      e.preventDefault()
      e.returnValue = '' // older browsers need this to show their own warning
    }

    function handleClick(e) {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // opens a new tab
      const link = e.target.closest?.('a[href]')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return // the tab unloads: handled above
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return
      }
      if (!window.confirm(message)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick, true) // before React Router sees it
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick, true)
    }
  }, [when, message])
}
