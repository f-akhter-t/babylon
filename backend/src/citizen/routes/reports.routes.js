// Endpoints only. No logic, no database. Auth is applied in citizen/index.js.
import { Router } from 'express'
import * as controller from '../controller/reports.controller.js'

const router = Router()

router.post('/reports', controller.createReport)
router.get('/reports', controller.listMyReports)
router.get('/reports/:id', controller.getMyReport)
router.patch('/reports/:id', controller.updateReport)
router.delete('/reports/:id', controller.deleteReport)

export default router