import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as accountability from '../service/accountability.service.js'

export async function getAccountability(req, res) {
  success(res, MSG.accountabilityLoaded, await accountability.getAccountability(req.valid.query.weeks))
}
