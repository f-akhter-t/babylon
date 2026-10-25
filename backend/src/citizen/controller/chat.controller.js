import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as service from '../service/chat.service.js'

export const chat = async (req, res) =>
  success(res, MSG.chatReplied, await service.chat(req.valid.body))
