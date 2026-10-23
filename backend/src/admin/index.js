// The admin panel: mounted by src/routes.js at /api/admin.
// Every route below needs a signed-in admin. Nothing here reads who the user
// is from the request body: authenticate() puts them on req.user.
import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import { ROLES } from '../constants/roles.js'
import verificationRoutes from './routes/verification.routes.js'
import accountabilityRoutes from './routes/accountability.routes.js'
import identityRoutes from './routes/identity.routes.js'

const router = Router()

router.use(authenticate, authorize(ROLES.ADMIN))
router.use(verificationRoutes)
router.use(accountabilityRoutes)
router.use(identityRoutes)

export default router
