// Forgot password and reset password. Nobody is signed in here, so the rate
// limits count per address (a code cannot be guessed by hammering the routes).
import { Router } from 'express'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { validate } from '../../middlewares/validate.js'
import { EMAIL_CODE_LIMITS } from '../../constants/limits.js'
import { AUTH_MESSAGES as M } from '../../constants/messages/auth.js'
import { forgotPasswordBody, resetPasswordBody } from '../auth.schemas.js'
import * as controller from '../controller/password.controller.js'

const router = Router()

router.post(
  '/forgot-password',
  rateLimit({ ...EMAIL_CODE_LIMITS.forgotRate, message: M.tooManyAttempts }),
  validate({ body: forgotPasswordBody }),
  controller.forgotPassword,
)
router.post(
  '/reset-password',
  rateLimit({ ...EMAIL_CODE_LIMITS.resetRate, message: M.tooManyAttempts }),
  validate({ body: resetPasswordBody }),
  controller.resetPassword,
)

export default router
