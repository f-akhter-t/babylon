import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as summary from '../service/summary.service.js'

export async function get(req, res) {
  success(res, MSG.deptSummaryLoaded, await summary.getSummary(req.user))
}