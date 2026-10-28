import { useEffect, useState } from 'react'
import { getIdentityQueueCount, PROFILE_EVENT } from '../services/api'

// How many identity submissions are waiting for the admin. Used for the
// "Identity checks" badge in the admin sidebar. Updates by itself after a
// review or a new submission (this tab or another one).
export function usePendingIdentityCount(enabled = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Only admins may read this number; a department account would get a 403.
    if (!enabled) return undefined
    let ignore = false
    const refresh = () => {
      getIdentityQueueCount()
        .then((next) => {
          if (!ignore) setCount(next)
        })
        .catch(() => {
          // a failed refresh keeps the number already shown
        })
    }
    refresh()
    window.addEventListener(PROFILE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      ignore = true
      window.removeEventListener(PROFILE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [enabled])

  return enabled ? count : 0
}
