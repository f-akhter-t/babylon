import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { authorize } from '../../middlewares/authorize.js'
import * as controller from '../controller/me.controller.js'

const router = Router()
router.use(authenticate(), authorize('citizen'))

router.get('/me', controller.getMe)
router.get('/points/earn', controller.getPoints)

export default router