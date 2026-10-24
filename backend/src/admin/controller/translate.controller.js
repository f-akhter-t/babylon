import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as service from '../service/translate.service.js'

export async function translate(req, res) {
  const { text, to } = req.valid.body
  success(res, MSG.translated, await service.translate(text, to))
}
