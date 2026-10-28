import * as service from '../service/profile.service.js'
import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'

export async function get(req, res) {
  success(res, MSG.profileLoaded, await service.getProfile(req.user.email))
}

export async function update(req, res) {
  success(res, MSG.profileSaved, await service.updateProfile(req.user.email, req.valid.body))
}

export async function requestPhoneCode(req, res) {
  success(res, MSG.phoneCodeSent, await service.requestPhoneCode(req.user.email, req.valid.body.phone))
}

export async function verifyPhone(req, res) {
  const { phone, code } = req.valid.body
  success(res, MSG.phoneVerified, await service.confirmPhoneCode(req.user.email, phone, code))
}

export async function submitIdentity(req, res) {
  success(res, MSG.identitySubmitted, await service.submitIdentity(req.user.email, req.valid.body))
}