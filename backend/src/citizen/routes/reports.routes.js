// Endpoints only. No logic, no database.
import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { authorize } from '../../middlewares/authorize.js'
import * as controller from '../controller/reports.controller.js'

const router = Router()
router.use(authenticate(), authorize('citizen'))

router.post('/reports', controller.createReport)
router.get('/reports', controller.listMyReports)
router.get('/reports/:id', controller.getMyReport)
router.patch('/reports/:id', controller.updateReport)
router.delete('/reports/:id', controller.deleteReport)

export default router