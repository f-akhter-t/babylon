import { Router } from 'express'
import * as controller from '../controller/me.controller.js'

const router = Router()

router.get('/me', controller.getMe)
router.get('/points/earn', controller.getPoints)

export default router