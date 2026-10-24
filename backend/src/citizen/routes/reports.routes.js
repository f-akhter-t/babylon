// Endpoints only. Auth is applied in citizen/index.js.
import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { createBody, idParams, updateBody } from '../citizen.schemas.js'
import * as controller from '../controller/reports.controller.js'

const router = Router()

router.post('/reports', validate({ body: createBody }), controller.createReport)
router.get('/reports', controller.listMyReports)
router.get('/reports/:id', validate({ params: idParams }), controller.getMyReport)
router.patch('/reports/:id', validate({ params: idParams, body: updateBody }), controller.updateReport)
router.delete('/reports/:id', validate({ params: idParams }), controller.deleteReport)

export default router