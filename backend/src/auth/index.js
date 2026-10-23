import { Router } from 'express'
import authRoutes from './routes/auth.routes.js'

const router = Router()
router.use(authRoutes) // Farhana: signup, login, logout, me, change password
// Staff accounts (open question 2) will be added here as their own routes.

export default router
