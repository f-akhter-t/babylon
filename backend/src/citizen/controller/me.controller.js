import * as service from '../service/me.service.js'
import { success } from '../../utils/response.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

export async function getMe(req, res) {
  success(res, MESSAGES.ME_LOADED, await service.getMe(req.user.email))
}

export async function getPoints(req, res) {
  success(res, MESSAGES.POINTS_LOADED, await service.getPoints(req.user.email))
}