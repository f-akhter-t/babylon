import { Router } from 'express'
import authRoutes from './routes/auth.routes.js'
import passwordRoutes from './routes/password.routes.js'
import staffRoutes from './routes/staff.routes.js'

const router = Router()
router.use(authRoutes) // Farhana: signup, login, logout, me, change password
router.use(passwordRoutes) // Farhana: forgot password, reset password (email code)
router.use('/staff', staffRoutes) // Farhana: staff sign-up, setup checks, finish

export default router
