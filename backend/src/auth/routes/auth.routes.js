import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import validate from '../../middlewares/validate.js'
import { loginBody, passwordBody, signupBody } from '../auth.schemas.js'
import * as controller from '../controller/auth.controller.js'

const router = Router()

router.post('/signup', validate({ body: signupBody }), controller.signup)
router.post('/login', validate({ body: loginBody }), controller.login)
router.post('/logout', controller.logout)
router.get('/me', authenticate, controller.me)
router.patch('/password', authenticate, validate({ body: passwordBody }), controller.changePassword)

export default router
