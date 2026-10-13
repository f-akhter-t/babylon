import { useEffect, useState } from 'react'
import { getIdentityQueueCount, PROFILE_EVENT } from '../services/api'

// How many identity submissions are waiting for the admin. Used for the
// "Identity checks" badge in the admin sidebar. Updates by itself after a
// review or a new submission (this tab or another one).
export function usePendingIdentityCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let ignore = false
    const refresh = () => {
      getIdentityQueueCount().then((next) => {
        if (!ignore) setCount(next)
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
  }, [])

  return count
}
