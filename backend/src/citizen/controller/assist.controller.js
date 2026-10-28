import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as service from '../service/assist.service.js'

export const assist = async (req, res) =>
  success(res, MSG.assisted, await service.assist(req.valid.body))

export const summarize = async (req, res) =>
  success(res, MSG.summarized, await service.summarize(req.valid.body.text))
