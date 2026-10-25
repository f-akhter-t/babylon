// Staff accounts. auth/index.js mounts this under /api/auth/staff.
// Sign-up is public (it needs the staff access code). Everything else needs a
// signed-in department or admin account, finished with setup or not.
import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { validate } from '../../middlewares/validate.js'
import { STAFF_LIMITS } from '../../constants/limits.js'
import { AUTH_MESSAGES as M } from '../../constants/messages/auth.js'
import staffOnly from '../staffOnly.js'
import {
  departmentCodeBody,
  employeeIdBody,
  phoneCodeBody,
  phoneVerifyBody,
  staffDetailsBody,
  staffPhotoBody,
  staffSignupBody,
} from '../auth.schemas.js'
import * as controller from '../controller/staff.controller.js'

const router = Router()

// Routes that check a secret or send a code are limited per person, so a code
// cannot be guessed by hammering them.
const limited = rateLimit({ ...STAFF_LIMITS.checkRate, message: M.tooManyAttempts })
const signedIn = [authenticate, staffOnly]

router.post(
  '/signup',
  rateLimit({ ...STAFF_LIMITS.signupRate, message: M.tooManyAttempts }),
  validate({ body: staffSignupBody }),
  controller.signup,
)
router.post('/verify-code', ...signedIn, limited, validate({ body: departmentCodeBody }), controller.verifyCode)
router.post('/verify-employee', ...signedIn, limited, validate({ body: employeeIdBody }), controller.verifyEmployee)
router.patch('/details', ...signedIn, validate({ body: staffDetailsBody }), controller.saveDetails)
router.post('/photo', ...signedIn, validate({ body: staffPhotoBody }), controller.savePhoto)
router.post('/phone-code', ...signedIn, limited, validate({ body: phoneCodeBody }), controller.phoneCode)
router.post('/phone-verify', ...signedIn, limited, validate({ body: phoneVerifyBody }), controller.phoneVerify)
router.post('/finish', ...signedIn, controller.finish)

export default router
