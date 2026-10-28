// F2 duplicate photo check. citizen/index.js mounts this behind authenticate and
// authorize('citizen'), so the rate limit counts per signed-in citizen.
import { Router } from 'express'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { validate } from '../../middlewares/validate.js'
import { DUPLICATE_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { duplicatesBody } from '../duplicates.schemas.js'
import * as controller from '../controller/duplicates.controller.js'

const router = Router()

router.post(
  '/reports/duplicates',
  rateLimit({ ...DUPLICATE_LIMITS.rate, message: MSG.duplicatesTooMany }),
  validate({ body: duplicatesBody }),
  controller.check,
)

export default router