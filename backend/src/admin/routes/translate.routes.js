// POST /api/translate for any signed-in role. Mounted in routes.js at /translate.
import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { validate } from '../../middlewares/validate.js'
import { TRANSLATE_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { translateBody } from '../translate.schemas.js'
import * as controller from '../controller/translate.controller.js'

const router = Router()

router.post(
  '/',
  authenticate,
  rateLimit({ ...TRANSLATE_LIMITS.rate, message: MSG.tooManyRequests }),
  validate({ body: translateBody }),
  controller.translate,
)

export default router
