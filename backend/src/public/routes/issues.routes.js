import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import { validate } from '../../middlewares/validate.js'
import { issueParams, issuesQuery, positionQuery } from '../public.schemas.js'
import * as controller from '../controller/issues.controller.js'

const router = Router()

// Open to guests. A valid token only adds the viewer's own flags (voted, mine,
// and the owner's sent-back history); a missing or broken token means guest.
router.get('/', authenticate.optional, validate({ query: issuesQuery }), controller.list)
router.get(
  '/:id',
  authenticate.optional,
  validate({ params: issueParams, query: positionQuery }),
  controller.detail,
)

export default router
