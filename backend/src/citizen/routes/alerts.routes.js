// Endpoints only. Auth is applied in citizen/index.js.
import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { idParams } from '../citizen.schemas.js'
import * as controller from '../controller/alerts.controller.js'

const router = Router()

router.get('/alerts', controller.listAlerts)
router.get('/alerts/unread-count', controller.getUnreadCount)
router.post('/alerts/read-all', controller.markAllRead)
router.patch('/alerts/:id/read', validate({ params: idParams }), controller.markRead)

export default router