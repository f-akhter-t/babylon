import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import { ROLES } from '../constants/roles.js'
import reportsRoutes from './routes/reports.routes.js'
import alertsRoutes from './routes/alerts.routes.js'
import profileRoutes from './routes/profile.routes.js'

const router = Router()
router.use(authenticate, authorize(ROLES.CITIZEN))
router.use(reportsRoutes) // Joyti: reports, votes, me, points
router.use(alertsRoutes) // Joyti
router.use(profileRoutes) // Riktika

export default router
