import { success } from '../../utils/response.js'
import { AUTH_MESSAGES as M } from '../../constants/messages/auth.js'
import * as password from '../service/password.service.js'

export const forgotPassword = async (req, res) =>
  success(res, M.forgotSent, await password.forgotPassword(req.valid.body))

export const resetPassword = async (req, res) => {
  await password.resetPassword(req.valid.body)
  return success(res, M.passwordReset)
}
