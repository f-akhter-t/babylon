// A citizen reads and marks their OWN notices. The logic is shared by every
// role, so it lives in shared/service/alerts.service.js. These are re-exported
// so the citizen controller keeps its own import.
export { listAlerts, getUnreadCount, markRead, markAllRead } from '../../shared/service/alerts.service.js'
