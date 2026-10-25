// The citizen panel's router. routes.js mounts it under /api/citizen.
import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import { ROLES } from '../constants/roles.js'
import assistRoutes from './routes/assist.routes.js'
import reportsRoutes from './routes/reports.routes.js'
import votesRoutes from './routes/votes.routes.js'
import meRoutes from './routes/me.routes.js'
import alertsRoutes from './routes/alerts.routes.js'
import profileRoutes from './routes/profile.routes.js'

const router = Router()
router.use(authenticate, authorize(ROLES.CITIZEN))
router.use(assistRoutes) // Farhana: F6 assist, F8 summarize (before the :id routes)
router.use(reportsRoutes) // Joyti: reports
router.use(votesRoutes) // Joyti: votes
router.use(meRoutes) // Joyti: me, points
router.use(alertsRoutes) // Joyti
router.use(profileRoutes) // Riktika

export default router