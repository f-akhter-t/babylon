import { Router } from 'express'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { validate } from '../../middlewares/validate.js'
import { EMAIL_CODE_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { emailVerifyBody } from '../emailCheck.schemas.js'
import * as controller from '../controller/emailCheck.controller.js'

const router = Router()

// Per signed-in citizen, so a code cannot be guessed by hammering the route.
const limited = rateLimit({ ...EMAIL_CODE_LIMITS.checkRate, message: MSG.emailCodeTooMany })

router.post('/profile/email-code', limited, controller.requestCode)
router.post('/profile/email-verify', limited, validate({ body: emailVerifyBody }), controller.verify)

export default router
