import { Router } from 'express'
import authRoutes from './auth/index.js'
import citizenRoutes from './citizen/index.js'
import departmentRoutes from './department/index.js'
import adminRoutes from './admin/index.js'
import publicRoutes from './public/index.js'

const router = Router()
router.use('/auth', authRoutes)
router.use('/citizen', citizenRoutes)
router.use('/department', departmentRoutes)
router.use('/admin', adminRoutes)
router.use('/', publicRoutes)

export default router