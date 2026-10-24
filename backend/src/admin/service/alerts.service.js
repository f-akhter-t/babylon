// The admin's notices. The rules (own alerts only, 404 for someone else's or an
// unknown id) live in the shared alerts service, so every role behaves the same.
export { listAlerts, getUnreadCount, markRead, markAllRead } from '../../shared/service/alerts.service.js'
