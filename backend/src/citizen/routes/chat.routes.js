// F4 for citizens. citizen/index.js mounts this behind authenticate and
// authorize('citizen'), so the rate limit counts per signed-in citizen.
import { Router } from 'express'
import { rateLimit } from '../../middlewares/rateLimit.js'
import { validate } from '../../middlewares/validate.js'
import { CHAT_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { chatBody } from '../chat.schemas.js'
import * as controller from '../controller/chat.controller.js'

const router = Router()

router.post(
  '/chat',
  rateLimit({ ...CHAT_LIMITS.rate, message: MSG.chatTooMany }),
  validate({ body: chatBody }),
  controller.chat,
)

export default router
