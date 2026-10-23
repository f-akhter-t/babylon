import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { idParams, listQuery, startBody, submitBody } from '../department.schemas.js'
import * as controller from '../controller/work.controller.js'

const router = Router()

router.get('/issues', validate({ query: listQuery }), controller.list)
router.patch('/issues/:id/status', validate({ params: idParams, body: startBody }), controller.start)
router.post('/issues/:id/submit', validate({ params: idParams, body: submitBody }), controller.submit)

export default router