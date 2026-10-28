import * as service from '../service/emailCheck.service.js'
import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'

export async function requestCode(req, res) {
  success(res, MSG.emailCodeSent, await service.requestCode(req.user.email))
}

export async function verify(req, res) {
  success(res, MSG.emailVerified, await service.verify(req.user.email, req.valid.body.code))
}
