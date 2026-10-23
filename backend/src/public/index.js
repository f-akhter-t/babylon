import { Router } from 'express'
import issuesRoutes from './routes/issues.routes.js'
import homeRoutes from './routes/home.routes.js'

const router = Router()
// Farhana fills this. Do not edit src/routes.js: it mounts this router at /api.
router.use('/issues', issuesRoutes) // GET /api/issues, GET /api/issues/:id
router.use('/home', homeRoutes) // GET /api/home/hero, /fixed-this-week, /activity, /stats

export default router
