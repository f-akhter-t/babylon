import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { idParams } from '../department.schemas.js'
import * as controller from '../controller/alerts.controller.js'

const router = Router()

router.get('/alerts', controller.list)
router.get('/alerts/unread-count', controller.unreadCount)
router.post('/alerts/read-all', controller.readAll)
router.patch('/alerts/:id/read', validate({ params: idParams }), controller.readOne)

export default router