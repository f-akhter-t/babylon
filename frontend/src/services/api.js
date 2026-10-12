// Every page gets its data from here. Now it reads src/mock/.
// Later, each function becomes a fetch() call. Pages will not change,
// because every function is already async.

import { issues as rawIssues, MAP_CENTER } from '../mock/issues'
import { heroSlides, heroSearchCategories } from '../mock/heroSlides'
import {
  CATEGORY_DEPARTMENT,
  departments,
  accountabilityPeriod,
  waitingLongest,
  weeklyReports,
} from '../mock/departments'
import { earnPoints } from '../mock/user'
import { distanceInMeters } from '../utils/geo'

// The ONE ranking rule: priority first, then votes.
const PRIORITY_ORDER = ['urgent', 'high', 'reopened', 'medium', 'fix-verified']

// ---------- Points and levels ----------
export const POINTS_PER_REPORT = 60

export const LEVELS = [
  { level: 1, name: 'Newcomer', min: 0 },
  { level: 2, name: 'Reporter', min: 120 },
  { level: 3, name: 'Watcher', min: 300 },
  { level: 4, name: 'Guardian', min: 600 },
  { level: 5, name: 'Champion', min: 1000 },
]

function getLevel(points) {
  const current = [...LEVELS].reverse().find((l) => points >= l.min)
  const next = LEVELS.find((l) => l.min > points)
  return {
    level: current.level,
    role: current.name,
    nextTierAt: next ? next.min : null, // null = top tier
  }
}

// Department comes from the category, decided in one place.
const withDepartment = (issue) => ({
  ...issue,
  department: CATEGORY_DEPARTMENT[issue.category],
})

const all = rawIssues.map(withDepartment)

// ---------- Reports made on this device ----------
// There is no backend yet, so a report a citizen submits is kept in the
// browser (localStorage) and added to the same list as the mock issues.
// When Express arrives, createIssue becomes a POST and this block goes away.

const SUBMITTED_KEY = 'babylon.submittedIssues'

function loadSubmitted() {
  try {
    const raw = window.localStorage.getItem(SUBMITTED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSubmitted(list) {
  try {
    window.localStorage.setItem(SUBMITTED_KEY, JSON.stringify(list))
  } catch {
    // storage full or blocked: the report still shows until the page reloads
  }
}

const submitted = loadSubmitted()
all.push(...submitted.map(withDepartment))

function makeTitle(description) {
  const firstSentence = description.split(/[.!?\n]/)[0].trim()
  if (!firstSentence) return 'New report'
  const title =
    firstSentence.length > 70 ? `${firstSentence.slice(0, 67).trimEnd()}…` : firstSentence
  return title.charAt(0).toUpperCase() + title.slice(1)
}

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

// A citizen's new report. location is { lat, lng, label, ward }.
// reporter is the logged-in account's name (pass session.name).
// photoUrl is a (small) data URL of the photo. Severity is a placeholder
// ('medium') until the AI severity engine exists.
export async function createIssue({ category, description, photoUrl, location, reporter }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  const issue = {
    id: `new-${Date.now()}`,
    createdAt: Date.now(), // used for "2 min ago" in the alerts
    title: makeTitle(description),
    category,
    status: 'open',
    priority: 'medium',
    verification: 'none',
    votes: 1,
    location: location.label,
    ward: location.ward ?? '',
    distanceM: Math.round(
      distanceInMeters(MAP_CENTER, [location.lat, location.lng]),
    ),
    lat: location.lat,
    lng: location.lng,
    daysAgo: 0,
    reportedOn: today,
    sentOn: today,
    beforeImg: photoUrl,
    reporter: reporter || 'You',
    description,
  }

  submitted.push(issue)
  saveSubmitted(submitted)
  all.push(withDepartment(issue))
  return issue
}

// Adds one vote. Returns the new count, or null if the issue cannot be voted on.
// Votes on the mock issues last until the page reloads.
export async function upvoteIssue(id) {
  const issue = all.find((item) => String(item.id) === String(id))
  if (!issue || issue.status === 'resolved') return null
  issue.votes += 1

  const saved = submitted.find((item) => String(item.id) === String(id))
  if (saved) {
    saved.votes = issue.votes
    saveSubmitted(submitted)
  }
  return issue.votes
}

// ---------- Home ----------

export async function getHeroSlides() {
  return heroSlides
}
export async function getHeroCategories() {
  return heroSearchCategories
}
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
// Everything here belongs to the logged-in account only.
// No name = no data. Points = 60 per report this account filed.

function ageMs(issue) {
  return issue.createdAt ? Date.now() - issue.createdAt : (issue.daysAgo ?? 0) * 86400000
}

function timeAgo(issue) {
  const mins = Math.floor(ageMs(issue) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function ownReports(userName) {
  return all.filter((issue) => issue.reporter === userName)
}

export async function getCurrentUser(name) {
  if (!name) return null
  const reports = ownReports(name).length
  const points = reports * POINTS_PER_REPORT
  return { name, reports, points, ...getLevel(points) }
}

export async function getEarnPoints() {
  return earnPoints
}

// One alert describing the latest state of one of the user's own reports.
function alertForIssue(issue) {
  const base = { id: `own-${issue.id}`, issueId: issue.id, time: timeAgo(issue), unread: false }

  if (issue.priority === 'reopened' || issue.verification === 'reopened') {
    return {
      ...base,
      group: 'reopened',
      type: 'reopened',
      title: 'A fixed problem came back',
      message: `${issue.title} was reopened and sent to the admin.`,
    }
  }
  if (issue.status === 'resolved') {
    return {
      ...base,
      group: 'status',
      type: 'resolved',
      title: 'Resolved and verified',
      message: `${issue.title}. The admin checked the after-photo.`,
    }
  }
  if (issue.status === 'in-progress') {
    return {
      ...base,
      group: 'status',
      type: 'status',
      title: 'Your report is now In progress',
      message: `${issue.title}. A repair crew is scheduled.`,
    }
  }
  return {
    ...base,
    group: 'status',
    type: 'status',
    title: `Your report was sent to ${issue.department ?? 'the department'}`,
    message: `${issue.title}. Waiting for work to start.`,
  }
}

// Open issues by other people, same category as one of the user's reports, within 500 m.
async function getNearbyAlerts(userName) {
  const mine = ownReports(userName)
  const seen = new Set()
  const result = []

  for (const own of mine) {
    for (const other of all) {
      if (
        other.reporter === userName ||
        other.status !== 'open' ||
        other.category !== own.category ||
        seen.has(other.id)
      ) {
        continue
      }
      const meters = Math.round(distanceInMeters([own.lat, own.lng], [other.lat, other.lng]))
      if (meters > 500) continue
      seen.add(other.id)
      result.push({
        id: `nearby-${other.id}`,
        group: 'nearby',
        type: 'nearby',
        title: 'Similar report nearby',
        message: `${other.title}, ${meters} m from you. Upvote instead of reporting again.`,
        issueId: other.id,
        time: timeAgo(other),
        unread: false,
      })
    }
  }
  return result.slice(0, 3)
}

// group: 'All' | 'status' | 'nearby' | 'reopened'
export async function getAlerts(group = 'All', name) {
  if (!name) return []
  const own = ownReports(name)
    .sort((a, b) => ageMs(a) - ageMs(b))
    .map(alertForIssue)
  const nearby = await getNearbyAlerts(name)
  return [...own, ...nearby].filter((alert) => group === 'All' || alert.group === group)
}

export async function getUnreadAlertCount(name) {
  if (!name) return 0
  return (await getAlerts('All', name)).length
}