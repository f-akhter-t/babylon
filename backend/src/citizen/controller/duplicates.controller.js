import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as service from '../service/duplicates.service.js'

// The person is always the email from the token. Never req.body.
export const check = async (req, res) =>
  success(res, MSG.duplicatesChecked, await service.check({ ...req.valid.body, email: req.user.email }))