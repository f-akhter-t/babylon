// Reads the request, calls one service function, sends the answer. No rules here.
import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as work from '../service/work.service.js'

export async function list(req, res) {
  success(res, MSG.deptIssuesLoaded, await work.listIssues(req.user, req.valid.query.scope))
}

export async function start(req, res) {
  success(res, MSG.deptStarted, await work.startWork(req.user, req.valid.params.id))
}

export async function submit(req, res) {
  success(res, MSG.deptSubmitted, await work.submitFix(req.user, req.valid.params.id, req.valid.body))
}