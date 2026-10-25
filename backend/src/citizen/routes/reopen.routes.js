// "This fixed problem came back". citizen/index.js mounts this behind
// authenticate and authorize('citizen').
import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { reopenParams } from '../reopen.schemas.js'
import * as controller from '../controller/reopen.controller.js'

const router = Router()

router.post('/reports/:id/reopen', validate({ params: reopenParams }), controller.reopen)

export default router
