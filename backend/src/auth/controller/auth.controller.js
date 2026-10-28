import { success } from '../../utils/response.js'
import { AUTH_MESSAGES as M } from '../../constants/messages/auth.js'
import * as auth from '../service/auth.service.js'

export const signup = async (req, res) =>
  success(res, M.signedUp, await auth.signup(req.valid.body), 201)

export const login = async (req, res) => success(res, M.loggedIn, await auth.login(req.valid.body))

// The token is not stored on the server: logging out means the app forgets it.
export const logout = (req, res) => success(res, M.loggedOut)

export const me = async (req, res) => success(res, M.me, await auth.getMe(req.user.email))

export const changePassword = async (req, res) => {
  await auth.changePassword(req.user.email, req.valid.body)
  return success(res, M.passwordChanged)
}
