import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { getNotifications, listFrom, readRaw, subscribe } from '../services/notifications'

// The logged-in account's notifications, newest first, updated live when a
// notice arrives or is read in this tab or another one.
//   const { items, unread } = useNotifications(email)
export function useNotifications(email) {
  const raw = useSyncExternalStore(subscribe, readRaw)

  // The demo citizen's first visit adds a few notices (once per browser).
  useEffect(() => {
    if (email) getNotifications(email)
  }, [email])

  return useMemo(() => {
    const items = listFrom(raw, email)
    return { items, unread: items.filter((n) => !n.read).length }
  }, [raw, email])
}
