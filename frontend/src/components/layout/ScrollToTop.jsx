import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// A new page opens at the top. Only when the path changes by a link or a
// redirect (PUSH or REPLACE): Back and Forward (POP) leave the scroll to the
// browser, and query or hash changes (?view=, ?report=) keep their place.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps -- only a path change should scroll

  return null
}
