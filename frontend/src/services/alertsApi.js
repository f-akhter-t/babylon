// The bell's calls to the backend. One client for all three roles: the caller
// passes the base path (/citizen/alerts, /department/alerts or /admin/alerts).
// The account always comes from the token, never from these arguments.
import { get, patch, post } from './http.js'

// { alerts, unreadCount }, newest first.
export const listAlerts = (base) => get(base)

// { unreadCount }
export const getUnreadAlertCount = (base) => get(`${base}/unread-count`)

export const markAlertRead = (base, id) => patch(`${base}/${encodeURIComponent(id)}/read`)

export const markAllAlertsRead = (base) => post(`${base}/read-all`)