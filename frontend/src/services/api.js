// Every page gets its data from here. Now it reads src/mock/.
// Later, each function becomes a fetch() call. Pages will not change,
// because every function is already async.

import { issues as rawIssues } from '../mock/issues'
import {
  CATEGORY_DEPARTMENT,
  departments,
  accountabilityPeriod,
  waitingLongest,
  weeklyReports,
} from '../mock/departments'
import { currentUser, alerts, earnPoints } from '../mock/user'

// The ONE ranking rule: priority first, then votes.
const PRIORITY_ORDER = ['urgent', 'high', 'reopened', 'medium', 'fix-verified']

// Department comes from the category, decided in one place.
const all = rawIssues.map((issue) => ({
  ...issue,
  department: CATEGORY_DEPARTMENT[issue.category],
}))

function rankIssues(list) {
  return [...list]
    .sort(
      (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
        b.votes - a.votes,
    )
    .map((issue, index) => ({ ...issue, rank: index + 1 }))
}

const sum = (list, key) => list.reduce((total, item) => total + item[key], 0)

// ---------- Issues (Map, Feed, Detail) ----------

// category and status: 'All' or a real value. search matches title or street.
export async function getIssues({ category = 'All', status = 'All', search = '' } = {}) {
  const query = search.trim().toLowerCase()
  const list = all.filter(
    (issue) =>
      (category === 'All' || issue.category === category) &&
      (status === 'All' || issue.status === status) &&
      (!query ||
        issue.title.toLowerCase().includes(query) ||
        issue.location.toLowerCase().includes(query)),
  )
  return rankIssues(list)
}

export async function getIssueById(id) {
  return all.find((issue) => String(issue.id) === String(id)) ?? null
}

// ---------- Home ----------

export async function getFixedThisWeek() {
  return all.filter((issue) => issue.status === 'resolved').slice(0, 3)
}

export async function getStats() {
  const received = sum(departments, 'assigned')
  const resolved = sum(departments, 'resolved')
  const reopened = sum(departments, 'reopened')
  const avgDays =
    departments.reduce((total, d) => total + d.avgDays * d.resolved, 0) / resolved
  return {
    received, // 228
    resolved, // 176
    avgDays: Math.round(avgDays * 10) / 10, // 4.3
    reopenedPercent: Math.round((reopened / resolved) * 1000) / 10, // 4.5
  }
}

// ---------- Department panel ----------

export async function getDepartmentIssues(departmentName) {
  // Reopened issues go to the admin first, so they are not in this list.
  return rankIssues(
    all.filter(
      (issue) =>
        issue.department === departmentName &&
        issue.status !== 'resolved' &&
        issue.priority !== 'reopened',
    ),
  )
}

export async function getDepartmentSummary(departmentName) {
  const list = await getDepartmentIssues(departmentName)
  return {
    open: list.filter((i) => i.status === 'open').length,
    inProgress: list.filter((i) => i.status === 'in-progress' && i.verification === 'none').length,
    awaiting: list.filter((i) => i.verification === 'awaiting').length,
  }
}

// ---------- Admin ----------

// Newest submission first, as in the Figma.
export async function getVerificationQueue() {
  return all
    .filter((issue) => issue.verification === 'awaiting')
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export async function getReopenedIssues() {
  return all.filter((issue) => issue.verification === 'reopened')
}

export async function getAdminCounts() {
  const queue = await getVerificationQueue()
  const reopened = await getReopenedIssues()
  return { queue: queue.length, reopened: reopened.length }
}

export async function getAccountability() {
  return {
    period: accountabilityPeriod,
    stats: await getStats(),
    departments,
    waitingLongest,
    weekly: weeklyReports,
  }
}

// ---------- Citizen (Alerts and points) ----------

export async function getCurrentUser() {
  return currentUser
}

export async function getEarnPoints() {
  return earnPoints
}

// group: 'All' | 'status' | 'nearby' | 'reopened'
export async function getAlerts(group = 'All') {
  return alerts.filter((alert) => group === 'All' || alert.group === group)
}

export async function getUnreadAlertCount() {
  return alerts.filter((alert) => alert.unread).length
}