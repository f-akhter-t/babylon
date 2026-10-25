import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as service from '../service/reopen.service.js'

export const reopen = async (req, res) =>
  success(res, MSG.reopenDone, await service.reopenReport(req.user, req.valid.params.id))
