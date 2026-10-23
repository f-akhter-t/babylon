import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { authorize } from '../../middlewares/authorize.js'
import * as controller from '../controller/votes.controller.js'

const router = Router()
router.use(authenticate(), authorize('citizen'))

router.post('/reports/:id/vote', controller.addVote)
router.delete('/reports/:id/vote', controller.removeVote)

export default router