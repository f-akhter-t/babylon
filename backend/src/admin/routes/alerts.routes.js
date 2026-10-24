// The admin's own notices (the bell). Always the signed-in admin's, by token.
// Endpoints only. Auth is applied in admin/index.js.
import { Router } from 'express'
import * as controller from '../controller/alerts.controller.js'

const router = Router()

router.get('/alerts', controller.listAlerts)
router.get('/alerts/unread-count', controller.getUnreadCount)
router.post('/alerts/read-all', controller.markAllRead)
router.patch('/alerts/:id/read', controller.markRead)

export default router
