// The "How you earn points" list. Built from the points rule itself (utils/points.js),
// so the list can never promise something the rule does not do.
import { LEVELS, POINTS_PER_REPORT } from './points.js'

export function earnPointsList() {
  const tiers = LEVELS.filter((entry) => entry.min > 0)
    .map((entry) => `${entry.min} for Level ${entry.level} (${entry.name})`)
    .join(', ')
  return [
    `Every report you file earns ${POINTS_PER_REPORT} points`,
    `Reach ${tiers}`,
    `If you delete a report, its ${POINTS_PER_REPORT} points go with it`,
    'Votes on your reports do not change your points',
  ]
}
