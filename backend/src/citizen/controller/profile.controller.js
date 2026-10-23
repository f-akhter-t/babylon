import * as service from '../service/profile.service.js'
import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'

export async function get(req, res) {
  success(res, MSG.profileLoaded, await service.getProfile(req.user.email))
}

export async function update(req, res) {
  success(res, MSG.profileSaved, await service.updateProfile(req.user.email, req.valid.body))
}