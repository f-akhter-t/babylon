import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import { ROLES } from '../constants/roles.js'

const router = Router()
router.use(authenticate, authorize(ROLES.DEPARTMENT))
// Riktika: add your department routes below.

export default router