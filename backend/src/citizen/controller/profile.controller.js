import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as profile from '../service/profile.service.js'

export async function get(req, res) {
  success(res, MSG.profileLoaded, await profile.getProfile(req.user.email))
}