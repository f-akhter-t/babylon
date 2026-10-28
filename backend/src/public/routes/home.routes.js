import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { activityQuery } from '../public.schemas.js'
import * as controller from '../controller/home.controller.js'

const router = Router()

router.get('/hero', controller.hero)
router.get('/fixed-this-week', controller.fixedThisWeek)
router.get('/activity', validate({ query: activityQuery }), controller.activity)
router.get('/stats', controller.stats)

export default router
