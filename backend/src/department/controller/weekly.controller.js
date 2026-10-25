import { success } from '../../utils/response.js'
import { MSG } from '../../constants/messages/index.js'
import * as weekly from '../service/weekly.service.js'

export async function get(req, res) {
  success(res, MSG.weeklyLoaded, await weekly.getWeekly(req.user))
}
