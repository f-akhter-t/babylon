// Endpoints only. Each line says: this URL goes to this controller.
import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { divisionQuery, rejectFixBody } from '../admin.schemas.js'
import * as controller from '../controller/verification.controller.js'

const router = Router()

router.get('/verification-queue', controller.getQueue)
router.get('/reopened', controller.getReopened)
router.get('/counts', validate({ query: divisionQuery }), controller.getCounts)
router.post('/issues/:id/approve', controller.approve)
router.post('/issues/:id/reject', validate({ body: rejectFixBody }), controller.reject)
router.post('/issues/:id/send-to-queue', controller.sendToQueue)

export default router
