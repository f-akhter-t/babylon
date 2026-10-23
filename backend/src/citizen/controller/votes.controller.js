import * as service from '../service/votes.service.js'
import { success } from '../../utils/response.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

export async function addVote(req, res, next) {
  try {
    const data = await service.addVote(req.user.email, req.params.id)
    return success(res, 200, MESSAGES.VOTE_ADDED, data)
  } catch (err) {
    return next(err)
  }
}

export async function removeVote(req, res, next) {
  try {
    const data = await service.removeVote(req.user.email, req.params.id)
    return success(res, 200, MESSAGES.VOTE_REMOVED, data)
  } catch (err) {
    return next(err)
  }
}