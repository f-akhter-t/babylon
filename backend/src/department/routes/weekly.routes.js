// F5. department/index.js mounts this behind authenticate and
// authorize('department'), so the rate limit counts per signed-in staff member.
import { Router } from 'express'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { WEEKLY_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import * as controller from '../controller/weekly.controller.js'

const router = Router()

router.get('/summary/weekly', rateLimit({ ...WEEKLY_LIMITS.rate, message: MSG.weeklyTooMany }), controller.get)

export default router
