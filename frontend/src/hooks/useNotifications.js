import { useCallback, useEffect, useMemo, useState } from 'react'
import { listAlerts, markAlertRead, markAllAlertsRead } from '../services/alertsApi'

const POLL_MS = 15_000 // the same 15 seconds as the live issue refresh

// The server sends createdAt as text; the bell's timeAgo wants a number.
const toNotice = (alert) => ({ ...alert, createdAt: new Date(alert.createdAt).getTime() })

// The signed-in account's notices from the backend, newest first, refreshed
// every 15 seconds.
//   const { items, unread, markRead, markAllRead } = useNotifications(email, '/citizen/alerts')
// A failed load keeps what is already shown (the bell must never break a page).
export function useNotifications(email, alertsPath = '/citizen/alerts') {
  const key = email ? `${email}|${alertsPath}` : ''
  const [state, setState] = useState({ key: '', items: [] })

  const refresh = useCallback(async () => {
    if (!key) return
    try {
      const { alerts } = await listAlerts(alertsPath)
      setState({ key, items: alerts.map(toNotice) })
    } catch {
      // keep the last list
    }
  }, [key, alertsPath])

  useEffect(() => {
    if (!key) return undefined
    // The first load runs in a timer callback, not in the effect body itself.
    const first = setTimeout(refresh, 0)
    const timer = setInterval(refresh, POLL_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [key, refresh])

  const markRead = useCallback(
    async (id) => {
      try {
        await markAlertRead(alertsPath, id)
      } catch {
        // the next refresh shows the real state
      }
      refresh()
    },
    [alertsPath, refresh],
  )

  const markAllRead = useCallback(async () => {
    try {
      await markAllAlertsRead(alertsPath)
    } catch {
      // the next refresh shows the real state
    }
    refresh()
  }, [alertsPath, refresh])

  // A list that belongs to another account (just signed out or in) is not shown.
  return useMemo(() => {
    const items = state.key === key ? state.items : []
    return { items, unread: items.filter((n) => !n.read).length, markRead, markAllRead }
  }, [state, key, markRead, markAllRead])
}