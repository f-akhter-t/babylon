// Admin: how each department is doing. The rule itself lives in the shared
// stats service, because Home shows the same figures.
import { getPeriodReport } from '../../shared/service/stats.service.js'

export function getAccountability(weeks) {
  return getPeriodReport(weeks)
}
