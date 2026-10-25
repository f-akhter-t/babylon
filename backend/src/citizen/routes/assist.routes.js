// F6 and F8 for citizens. citizen/index.js mounts this behind authenticate and
// authorize('citizen'), so the rate limit counts per signed-in citizen.
import { Router } from 'express'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { validate } from '../../middlewares/validate.js'
import { ASSIST_LIMITS, SUMMARIZE_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { assistBody, summarizeBody } from '../assist.schemas.js'
import * as controller from '../controller/assist.controller.js'

const router = Router()

router.post(
  '/reports/assist',
  rateLimit({ ...ASSIST_LIMITS.rate, message: MSG.assistTooMany }),
  validate({ body: assistBody }),
  controller.assist,
)
router.post(
  '/reports/summarize',
  rateLimit({ ...SUMMARIZE_LIMITS.rate, message: MSG.assistTooMany }),
  validate({ body: summarizeBody }),
  controller.summarize,
)

export default router
