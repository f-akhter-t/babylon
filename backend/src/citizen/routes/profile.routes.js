import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { updateBody, phoneCodeBody, phoneVerifyBody, identityBody } from '../profile.schemas.js'
import * as controller from '../controller/profile.controller.js'

const router = Router()

router.get('/profile', controller.get)
router.patch('/profile', validate({ body: updateBody }), controller.update)
router.post('/profile/phone-code', validate({ body: phoneCodeBody }), controller.requestPhoneCode)
router.post('/profile/phone-verify', validate({ body: phoneVerifyBody }), controller.verifyPhone)
router.post('/profile/identity', validate({ body: identityBody }), controller.submitIdentity)

export default router