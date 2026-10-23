// Points and levels. One rule, used by Me, the bell and the create-report notice.
// Points are never stored: they are 60 times the number of reports an account filed.

export const POINTS_PER_REPORT = 60

export const LEVELS = [
  { level: 1, name: 'Newcomer', min: 0 },
  { level: 2, name: 'Reporter', min: 120 },
  { level: 3, name: 'Watcher', min: 300 },
  { level: 4, name: 'Guardian', min: 600 },
  { level: 5, name: 'Champion', min: 1000 },
]

export const pointsFor = (reportCount) => reportCount * POINTS_PER_REPORT

export function levelFor(points) {
  const current = [...LEVELS].reverse().find((entry) => points >= entry.min)
  const next = LEVELS.find((entry) => entry.min > points)
  return {
    level: current.level,
    role: current.name,
    nextTierAt: next ? next.min : null, // null = top tier
  }
}

// { points, level, role, nextTierAt } for an account with this many reports.
export function summaryFor(reportCount) {
  const points = pointsFor(reportCount)
  return { points, ...levelFor(points) }
}

// True when one more report moves the account to a higher level.
export function crossesLevel(reportCountBefore, reportCountAfter) {
  return levelFor(pointsFor(reportCountAfter)).level > levelFor(pointsFor(reportCountBefore)).level
}
