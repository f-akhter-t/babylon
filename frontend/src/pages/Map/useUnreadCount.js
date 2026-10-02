import { useEffect, useState } from 'react'
import { getUnreadAlertCount } from '../../services/api'

// The number for the navbar bell: unread alerts from the data, plus "extra"
// (for example how many issues this citizen follows, since each followed
// issue will send alerts). Any page can use it:
//   const unread = useUnreadCount(followedIds.length)
//   <Navbar variant="citizen" unread={unread} />
export function useUnreadCount(extra = 0) {
  const [alerts, setAlerts] = useState(0)

  useEffect(() => {
    let ignore = false
    getUnreadAlertCount()
      .then((count) => {
        if (!ignore) setAlerts(count)
      })
      .catch(() => {}) // the bell just shows the extra part if alerts fail to load
    return () => {
      ignore = true
    }
  }, [])

  return alerts + extra
}
