import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { reviewIdentityBody } from '../admin.schemas.js'
import * as controller from '../controller/identity.controller.js'

const router = Router()

router.get('/identity', controller.getQueue)
router.get('/identity/count', controller.getCount)
router.get('/identity/:id/photo', controller.getPhoto)
router.post('/identity/:id/review', validate({ body: reviewIdentityBody }), controller.review)

export default router
