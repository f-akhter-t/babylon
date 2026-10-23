import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { updateBody } from '../profile.schemas.js'
import * as controller from '../controller/profile.controller.js'

const router = Router()

router.get('/profile', controller.get)
router.patch('/profile', validate({ body: updateBody }), controller.update)

export default router