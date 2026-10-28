import * as service from '../service/alerts.service.js'
import { success } from '../../utils/response.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

export async function listAlerts(req, res) {
  success(res, MESSAGES.ALERTS_LISTED, await service.listAlerts(req.user.email))
}

export async function getUnreadCount(req, res) {
  success(res, MESSAGES.ALERTS_UNREAD_COUNT, await service.getUnreadCount(req.user.email))
}

export async function markRead(req, res) {
  success(res, MESSAGES.ALERT_MARKED_READ, await service.markRead(req.user.email, req.valid.params.id))
}

export async function markAllRead(req, res) {
  success(res, MESSAGES.ALERTS_ALL_READ, await service.markAllRead(req.user.email))
}