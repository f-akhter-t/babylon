// Reads the request, calls one service function, sends the answer. No rules here.
import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as alerts from '../service/alerts.service.js'

export async function list(req, res) {
  success(res, MSG.deptAlertsListed, await alerts.listAlerts(req.user.email))
}

export async function unreadCount(req, res) {
  success(res, MSG.deptAlertsUnreadCount, await alerts.getUnreadCount(req.user.email))
}

export async function readAll(req, res) {
  success(res, MSG.deptAlertsAllRead, await alerts.markAllRead(req.user.email))
}

export async function readOne(req, res) {
  success(res, MSG.deptAlertMarkedRead, await alerts.markRead(req.user.email, req.valid.params.id))
}