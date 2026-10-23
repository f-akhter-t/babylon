// Reads the request, calls one service function, sends the answer. No rules here.
import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as verification from '../service/verification.service.js'

export async function getQueue(req, res) {
  success(res, MSG.queueLoaded, await verification.getQueue())
}

export async function getReopened(req, res) {
  success(res, MSG.reopenedLoaded, await verification.getReopened())
}

export async function getCounts(req, res) {
  success(res, MSG.countsLoaded, await verification.getCounts())
}

export async function approve(req, res) {
  success(res, MSG.approved, await verification.approve(req.params.id))
}

export async function reject(req, res) {
  success(res, MSG.rejected, await verification.reject(req.params.id, req.valid.body.reason))
}

export async function sendToQueue(req, res) {
  success(res, MSG.sentToQueue, await verification.sendToQueue(req.params.id))
}
