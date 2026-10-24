import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as alerts from '../service/alerts.service.js'

// The owner is always the email from the token, never from the request.
export async function listAlerts(req, res) {
  success(res, MSG.adminAlertsListed, await alerts.listAlerts(req.user.email))
}

export async function getUnreadCount(req, res) {
  success(res, MSG.adminAlertsUnreadCount, await alerts.getUnreadCount(req.user.email))
}

export async function markRead(req, res) {
  success(res, MSG.adminAlertMarkedRead, await alerts.markRead(req.user.email, req.params.id))
}

export async function markAllRead(req, res) {
  success(res, MSG.adminAlertsAllRead, await alerts.markAllRead(req.user.email))
}
