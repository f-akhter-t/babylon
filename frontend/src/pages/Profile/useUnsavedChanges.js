import { useEffect } from 'react'
import { confirmLeave, setLeaveGuard } from '../../utils/leaveGuard'

// Marks the extra history entry that catches the browser's Back button.
const GUARD_KEY = 'babylonUnsaved'

// Back steps this hook takes by itself (to remove its extra entry). They must
// not ask the person anything, even if the page has new changes by then.
const ownBackSteps = new WeakSet()

// Asks before leaving the page while something is not saved yet:
// closing or reloading the tab, clicking a link inside the app, the browser's
// Back button, and anything that calls confirmLeave() (see utils/leaveGuard).
//   useUnsavedChanges(hasChanges, 'You have unsaved changes. Leave anyway?')
// The app uses <BrowserRouter>, which has no navigation blocker, so links are
// checked here before React Router handles the click.
export function useUnsavedChanges(when, message) {
  useEffect(() => {
    if (!when) return

    const release = setLeaveGuard(() => window.confirm(message))
    let asking = false
    let leaving = false

    // Back button: put a copy of this page on top of the history. Pressing
    // Back removes the copy (the page stays), and we can ask first.
    const addCopy = () =>
      window.history.pushState({ ...window.history.state, [GUARD_KEY]: true }, '')
    addCopy()

    function handlePopState(e) {
      if (ownBackSteps.has(e)) return
      if (leaving || asking) return // a second Back press while the question is open
      asking = true
      const ok = confirmLeave()
      asking = false
      if (ok) {
        leaving = true
        window.history.back() // carry on to where Back was going
      } else {
        addCopy()
      }
    }

    function handleBeforeUnload(e) {
      if (leaving) return // already agreed to leave: do not ask a second time
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
      if (confirmLeave()) {
        leaving = true
      } else {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick, true) // before React Router sees it
    return () => {
      release()
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick, true)
      // Saved or cleared while still on this page: take the extra copy away quietly.
      if (!leaving && window.history.state?.[GUARD_KEY]) {
        // Registered before any newer listener, so it marks the event first.
        window.addEventListener('popstate', (e) => ownBackSteps.add(e), { once: true })
        window.history.back()
      }
    }
  }, [when, message])
}
