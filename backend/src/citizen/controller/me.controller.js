import * as service from '../service/me.service.js'
import { success } from '../../utils/response.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

export async function getMe(req, res, next) {
  try {
    return success(res, 200, MESSAGES.ME_LOADED, await service.getMe(req.user.email))
  } catch (err) {
    return next(err)
  }
}

export async function getPoints(req, res, next) {
  try {
    return success(res, 200, MESSAGES.POINTS_LOADED, await service.getPoints(req.user.email))
  } catch (err) {
    return next(err)
  }
}