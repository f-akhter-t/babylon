// Department alerts: thin wrapper over the shared alerts service.
// One alert per staff member, keyed by the email in the token.
export { listAlerts, getUnreadCount, markRead, markAllRead } from '../../shared/service/alerts.service.js'