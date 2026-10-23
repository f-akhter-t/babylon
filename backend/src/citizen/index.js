// The citizen panel's router. routes.js mounts it under /api/citizen.
import { Router } from 'express'
import reportsRoutes from './routes/reports.routes.js'
import votesRoutes from './routes/votes.routes.js'
import meRoutes from './routes/me.routes.js'

const router = Router()
router.use(reportsRoutes)
router.use(votesRoutes)
router.use(meRoutes)

export default router