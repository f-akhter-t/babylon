import { Router } from 'express'
import * as controller from '../controller/profile.controller.js'

const router = Router()

router.get('/profile', controller.get)

export default router