import { success } from '../../utils/response.js'
import { PUBLIC_MESSAGES as M } from '../../constants/messages/public.js'
import * as home from '../service/home.service.js'

export async function hero(req, res) {
  success(res, M.heroLoaded, home.getHero())
}

export async function fixedThisWeek(req, res) {
  success(res, M.fixedLoaded, await home.getFixedThisWeek())
}

export async function activity(req, res) {
  success(res, M.activityLoaded, await home.getActivity(req.valid.query.limit))
}

export async function stats(req, res) {
  success(res, M.statsLoaded, await home.getStats())
}
