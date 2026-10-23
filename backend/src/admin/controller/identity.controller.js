import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as identity from '../service/identity.service.js'

export async function getQueue(req, res) {
  success(res, MSG.identityQueueLoaded, await identity.getQueue())
}

export async function getCount(req, res) {
  success(res, MSG.identityCountLoaded, await identity.getCount())
}

// The one endpoint that answers with a picture, not JSON. Never cached, because
// the photo is deleted after the review.
export async function getPhoto(req, res) {
  const { contentType, data } = await identity.getPhoto(req.params.id)
  res.set('Content-Type', contentType)
  res.set('Cache-Control', 'no-store')
  res.send(data)
}

export async function review(req, res) {
  const result = await identity.review(req.params.id, req.valid.body)
  success(res, result.status === 'verified' ? MSG.identityApproved : MSG.identityRejected, result)
}
