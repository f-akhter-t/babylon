import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { accountabilityQuery } from '../admin.schemas.js'
import * as controller from '../controller/accountability.controller.js'

const router = Router()

router.get('/accountability', validate({ query: accountabilityQuery }), controller.getAccountability)

export default router
