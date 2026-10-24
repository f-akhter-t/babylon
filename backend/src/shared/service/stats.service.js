// One rule for the accountability figures. Used by /api/admin/accountability
// and by /api/home/stats, so the two screens can never disagree.
//
// The department rows are the single source: the stat cards are computed from
// them, and the weekly chart covers the same weeks, so the rows and the chart
// always add up.
import Issue from '../../models/issue.model.js'
import AppError from '../../utils/AppError.js'
import { DAY_MS, daysBetween } from '../../utils/dates.js'
import {
  ACCOUNTABILITY_PERIODS,
  DEFAULT_PERIOD_WEEKS,
  DEPARTMENTS,
  departmentForCategory,
} from '../../constants/departments.js'
import { ADMIN_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'

const time = (value) => (value ? new Date(value).getTime() : null)
const oneDecimal = (n) => Math.round(n * 10) / 10
const sum = (list, key) => list.reduce((total, item) => total + item[key], 0)

// ---------- Pure functions (no database, easy to test) ----------

// One row per department for the last `weeks` weeks.
//   assigned: reported in the period
//   resolved: closed (verified by an admin) in the period
//   avgDays:  average days from report to close, over those resolved
//   reopened: reopened in the period
export function departmentRows(issues, weeks, now = new Date()) {
  const since = now.getTime() - weeks * 7 * DAY_MS
  return DEPARTMENTS.map((name) => {
    const mine = issues.filter((issue) => departmentForCategory(issue.category) === name)
    const assigned = mine.filter((issue) => time(issue.createdAt) >= since).length
    const closed = mine.filter((issue) => time(issue.resolvedAt) >= since)
    const days = closed.map((issue) => (time(issue.resolvedAt) - time(issue.createdAt)) / DAY_MS)
    return {
      name,
      assigned,
      resolved: closed.length,
      avgDays: closed.length ? oneDecimal(days.reduce((a, b) => a + b, 0) / closed.length) : 0,
      reopened: mine.filter((issue) => time(issue.reopenedAt) >= since).length,
    }
  })
}

// The stat cards, from department rows: totals, and averages weighted by the
// number resolved. Only these two averages are rounded (one decimal).
export function statsFrom(rows) {
  const received = sum(rows, 'assigned')
  const resolved = sum(rows, 'resolved')
  const reopened = sum(rows, 'reopened')
  const avgDays = resolved
    ? rows.reduce((total, row) => total + row.avgDays * row.resolved, 0) / resolved
    : 0
  return {
    received,
    resolved,
    avgDays: oneDecimal(avgDays),
    reopenedPercent: resolved ? Math.round((reopened / resolved) * 1000) / 10 : 0,
  }
}

// "Reports per week": `weeks` entries, oldest first, W1 to Wn.
export function weeklyReports(issues, weeks, now = new Date()) {
  const start = now.getTime() - weeks * 7 * DAY_MS
  const week = (when) => Math.floor((when - start) / (7 * DAY_MS))
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    week: `W${i + 1}`,
    received: 0,
    resolved: 0,
  }))
  for (const issue of issues) {
    if (!departmentForCategory(issue.category)) continue
    const made = week(time(issue.createdAt))
    if (made >= 0 && made < weeks) buckets[made].received += 1
    const closed = issue.resolvedAt ? week(time(issue.resolvedAt)) : -1
    if (closed >= 0 && closed < weeks) buckets[closed].resolved += 1
  }
  return buckets
}

// Unresolved issues, the longest wait first. The current state, so it is the
// same for every period.
export function waitingLongest(issues, now = new Date(), limit = ADMIN_LIMITS.waitingLongest) {
  return issues
    .filter((issue) => issue.status !== 'resolved' && departmentForCategory(issue.category))
    .map((issue) => ({
      title: issue.title,
      department: departmentForCategory(issue.category),
      days: daysBetween(issue.createdAt, now),
      ...(issue.priority === 'reopened' || issue.verification === 'reopened' ? { reopened: true } : {}),
    }))
    .sort((a, b) => b.days - a.days)
    .slice(0, limit)
}

export function periodFor(weeks) {
  const period = ACCOUNTABILITY_PERIODS.find((p) => p.weeks === weeks)
  if (!period) throw new AppError('invalid', 400, MSG.periodUnavailable, 'weeks')
  return period
}

// ---------- Database ----------

async function loadIssues() {
  return Issue.find(
    {},
    'title category status priority verification createdAt resolvedAt reopenedAt',
  ).lean()
}

// Everything the Accountability page shows for one period, in one load.
export async function getPeriodReport(weeks = DEFAULT_PERIOD_WEEKS, now = new Date()) {
  const period = periodFor(weeks)
  const issues = await loadIssues()
  const rows = departmentRows(issues, weeks, now)
  return {
    weeks,
    label: period.label,
    stats: statsFrom(rows),
    departments: rows,
    weekly: weeklyReports(issues, weeks, now),
    waitingLongest: waitingLongest(issues, now),
  }
}

// Home's four stat cards: always the default period (8 weeks).
export async function getHomeStats(now = new Date()) {
  const { stats } = await getPeriodReport(DEFAULT_PERIOD_WEEKS, now)
  return stats
}
