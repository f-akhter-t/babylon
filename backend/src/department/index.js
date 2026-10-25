// The department panel: mounted by src/routes.js at /api/department.
// Only signed-in, onboarded department staff get in.
import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'
import authorize from '../middlewares/authorize.js'
import { ROLES } from '../constants/roles.js'
import workRoutes from './routes/work.routes.js'
import summaryRoutes from './routes/summary.routes.js'
import alertsRoutes from './routes/alerts.routes.js'

const router = Router()

router.use(authenticate, authorize(ROLES.DEPARTMENT))
router.use(workRoutes)
router.use(summaryRoutes)
router.use(alertsRoutes)

export default router