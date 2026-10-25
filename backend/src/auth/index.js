import { Router } from 'express'
import authRoutes from './routes/auth.routes.js'
import staffRoutes from './routes/staff.routes.js'

const router = Router()
router.use(authRoutes) // Farhana: signup, login, logout, me, change password
router.use('/staff', staffRoutes) // Farhana: staff sign-up, setup checks, finish

export default router
