// Every page gets its data from here. Now it reads src/mock/.
// Later, each function becomes a fetch() call. Pages will not change,
// because every function is already async.

import { CATEGORIES, issues as rawIssues, MAP_CENTER } from '../mock/issues'
import { heroSlides, heroSearchCategories } from '../mock/heroSlides'
import {
  ACCOUNTABILITY_PERIODS,
  CATEGORY_DEPARTMENT,
  DEFAULT_PERIOD_WEEKS,
  DEPARTMENT_CODES,
  departments,
  departmentsByPeriod,
  waitingLongest,
  weeklyReports,
} from '../mock/departments'
import { earnPoints } from '../mock/user'
import { sampleIdentitySubmissions } from '../mock/identitySubmissions'
import { distanceInMeters } from '../utils/geo'
import { prepareIdPhoto, UNREADABLE_PHOTO } from '../utils/idPhoto'
import {
  deleteOtherPhotos,
  deletePhoto,
  deleteStalePhotos,
  readPhoto,
  savePhoto,
} from './identityPhotos'
import {
  getAccount,
  getAccountName,
  getSession,
  isOnboarded,
  markOnboarded,
  renameAccount,
  staffEmails,
} from './auth'
import { notify, notifyEach, removeForIssue } from './notifications'
import {
  checkDetails,
  checkIdPhoto,
  checkJobTitle,
  checkName,
  checkNid,
  checkPhone,
  checkRejectReason,
  normalizeNid,
  normalizePhone,
} from '../utils/profileRules'

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

// Reports their citizen deleted (see deleteIssue), by issue id. A list of its
// own, so deleted mock issues stay deleted too.
const DELETED_KEY = 'babylon.deletedIssues'

function loadDeleted() {
  try {
    const list = JSON.parse(window.localStorage.getItem(DELETED_KEY))
    return Array.isArray(list) ? list.map(String) : []
  } catch {
    return []
  }
}

let deletedIds = loadDeleted()

// Takes an issue out of the lists in memory (not out of storage).
function dropFromMemory(id) {
  const key = String(id)
  for (const list of [all, submitted]) {
    const index = list.findIndex((item) => String(item.id) === key)
    if (index !== -1) list.splice(index, 1)
  }
}
deletedIds.forEach(dropFromMemory)

// Pages listen to this to refresh when a report is created, upvoted or an alert is read.
export const ISSUES_EVENT = 'babylon:issues'
const notifyIssuesChanged = () => window.dispatchEvent(new Event(ISSUES_EVENT))

// Another tab (another citizen) upvoted or reported: pick it up here.
window.addEventListener('storage', (e) => {
  if (e.key !== SUBMITTED_KEY) return
  for (const item of loadSubmitted()) {
    const live = all.find((i) => String(i.id) === String(item.id))
    const kept = submitted.find((i) => String(i.id) === String(item.id))
    if (live) live.votes = item.votes
    if (kept) kept.votes = item.votes
    if (!live) {
      all.push(withDepartment(item))
      submitted.push(item)
    }
  }
  notifyIssuesChanged()
})

// Another tab deleted a report: drop it here too.
window.addEventListener('storage', (e) => {
  if (e.key !== DELETED_KEY) return
  deletedIds = loadDeleted()
  deletedIds.forEach(dropFromMemory)
  notifyIssuesChanged()
})

// Changes a citizen made to their own report (see updateIssue), by issue id.
// Kept apart from the reports themselves, so mock issues can be edited too.
const EDITS_KEY = 'babylon.issueEdits'

function loadEdits() {
  try {
    return JSON.parse(window.localStorage.getItem(EDITS_KEY)) ?? {}
  } catch {
    return {}
  }
}

const edits = loadEdits()
for (const [id, changes] of Object.entries(edits)) {
  const index = all.findIndex((issue) => String(issue.id) === id)
  if (index !== -1) all[index] = withDepartment({ ...all[index], ...changes })
}

// ---------- Department and admin workflow ----------
// Start work, submit for verification, approve and reject, saved by issue id
// on top of the issues above (like the edits). Citizens see the status change
// at once. The after-photo waiting for the admin (pendingAfterImg) and a
// "sent back" reason stay in this store: only the department and verify
// loaders add them, never the citizen pages.
// Mock only: a real backend checks the role and department on the server.
const WORKFLOW_KEY = 'babylon.issueWorkflow'

function loadWorkflow() {
  try {
    return JSON.parse(window.localStorage.getItem(WORKFLOW_KEY)) ?? {}
  } catch {
    return {}
  }
}

let workflow = loadWorkflow()

function publicPart(entry) {
  const { pendingAfterImg, sentBack, sentBackHistory, updatedAt, ...rest } = entry
  void [pendingAfterImg, sentBack, sentBackHistory, updatedAt]
  return rest
}

function applyWorkflow() {
  for (const [id, entry] of Object.entries(workflow)) {
    const issue = all.find((item) => String(item.id) === id)
    if (issue) Object.assign(issue, publicPart(entry))
  }
}
applyWorkflow()

// Another tab (another admin or the department) moved an issue on.
window.addEventListener('storage', (e) => {
  if (e.key !== WORKFLOW_KEY) return
  workflow = loadWorkflow()
  applyWorkflow()
  notifyIssuesChanged()
})

// The staff-only details, for the department and verify loaders.
function withStaffDetails(issue) {
  const entry = workflow[String(issue.id)] ?? {}
  return { ...issue, pendingAfterImg: entry.pendingAfterImg, sentBack: entry.sentBack }
}

const shortDate = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

function workflowError(code, message) {
  return Object.assign(new Error(message), { code })
}

// The issue, checked against the logged-in staff account. Reads the store
// again first, because another tab may have acted since this page loaded.
function staffIssue(id, role) {
  const session = getSession()
  if (session?.role !== role) {
    throw workflowError(
      'forbidden',
      role === 'admin'
        ? 'Only an admin can check a fix.'
        : 'Only a department account can work on issues.',
    )
  }
  workflow = loadWorkflow()
  applyWorkflow()
  const issue = all.find((item) => String(item.id) === String(id))
  if (!issue) throw workflowError('not-found', 'This issue no longer exists.')
  if (role === 'department' && issue.department !== session.department) {
    throw workflowError('forbidden', 'This issue belongs to another department.')
  }
  return issue
}

// Saves first, then changes the issue in memory, so a failed save changes nothing.
function saveWorkflow(issue, changes) {
  const key = String(issue.id)
  const entry = { ...workflow[key], ...changes, updatedAt: new Date().toISOString() }
  for (const field of Object.keys(entry)) {
    if (entry[field] === null || entry[field] === undefined) delete entry[field]
  }
  const next = { ...workflow, [key]: entry }
  try {
    window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(next))
  } catch {
    throw workflowError(
      'storage',
      'This could not be saved because the storage on this device is full. Clear old demo data, or try a smaller photo.',
    )
  }
  workflow = next
  Object.assign(issue, publicPart(changes))
  notifyIssuesChanged()
}

// ---------- Notifications ----------
// Every notice is one whole sentence with a link, sent to one account (copied
// to each staff account of a department, or to every admin).
const reportLink = (issue) => `/my-reports?report=${issue.id}`

function tellReporter(issue, kind, text) {
  if (issue.reporterEmail) notify(issue.reporterEmail, { kind, text, link: reportLink(issue), issueId: issue.id })
}

function tellDepartment(issue, kind, text, link = '/department') {
  notifyEach(staffEmails({ role: 'department', department: issue.department }), { kind, text, link, issueId: issue.id })
}

// A reason as the end of a sentence: trailing full stops and spaces trimmed,
// then one full stop, unless it already ends with ? or !.
function reasonSentence(reason) {
  const text = reason.trim().replace(/[.\s]+$/, '')
  return /[?!]$/.test(text) ? text : `${text}.`
}

function tellAdmins(issue, kind, text) {
  notifyEach(staffEmails({ role: 'admin' }), { kind, text, link: '/admin/verify', issueId: issue.id })
}

// Department: an Open issue becomes In progress. The citizen can no longer edit it.
export async function startWork(id) {
  await wait()
  const issue = staffIssue(id, 'department')
  if (issue.priority === 'reopened' || issue.verification === 'reopened') {
    throw workflowError('conflict', 'This reopened issue goes to the admin first.')
  }
  if (issue.status !== 'open') {
    throw workflowError('conflict', 'Work on this issue has already started.')
  }
  saveWorkflow(issue, {
    status: 'in-progress',
    startedOn: shortDate(),
    startedAt: new Date().toISOString(),
  })
  tellReporter(issue, 'in-progress', `Work has started on your report "${issue.title}".`)
  return withStaffDetails(present(issue))
}

// Department: send the after-photo (a small data URL) and a note to the admin.
export async function submitForVerification(id, { note = '', photoUrl } = {}) {
  await wait()
  const issue = staffIssue(id, 'department')
  if (issue.status !== 'in-progress') {
    throw workflowError('conflict', 'Start work on this issue before sending it for verification.')
  }
  if (issue.verification === 'awaiting') {
    throw workflowError('conflict', 'This issue is already waiting for the admin.')
  }
  if (typeof photoUrl !== 'string' || !photoUrl.startsWith('data:image/')) {
    throw workflowError('invalid', 'Add an after-photo before sending this for verification.')
  }
  const now = new Date()
  saveWorkflow(issue, {
    verification: 'awaiting',
    submittedOn: shortDate(),
    submittedAt: now.toISOString(),
    departmentNote: note.trim() || null,
    pendingAfterImg: photoUrl,
    sentBack: null,
  })
  tellReporter(issue, 'fix-submitted', `A fix for your report "${issue.title}" is waiting for the admin's check.`)
  tellAdmins(issue, 'fix-waiting', `A fix is waiting for your check: ${issue.title}.`)
  return withStaffDetails(present(issue))
}

function daysSinceReported(issue) {
  return Math.max(1, Math.round(ageMs(issue) / 86400000))
}

// Admin: the fix is real. The issue closes and the after-photo becomes public.
export async function approveResolution(id) {
  await wait()
  const issue = staffIssue(id, 'admin')
  if (issue.verification !== 'awaiting') {
    throw workflowError('conflict', 'This issue was already checked by another admin.')
  }
  const photo = workflow[String(issue.id)]?.pendingAfterImg
  saveWorkflow(issue, {
    status: 'resolved',
    priority: 'fix-verified',
    verification: 'verified',
    resolvedOn: shortDate(),
    fixedInDays: daysSinceReported(issue),
    ...(photo ? { afterImg: photo } : {}),
    pendingAfterImg: null,
    sentBack: null,
  })
  tellReporter(issue, 'resolved', `Your report "${issue.title}" is resolved and verified.`)
  tellDepartment(issue, 'fix-verified', `The admin verified your fix for "${issue.title}".`)
  return present(issue)
}

export const REJECT_REASON_NEEDED = 'Write a reason before sending this back.'

// Admin: the fix is not good enough. Back to In progress, with the reason.
// The rejected photo is deleted.
export async function rejectResolution(id, reason = '') {
  await wait()
  const text = reason.trim()
  if (!text) throw workflowError('invalid', REJECT_REASON_NEEDED)
  const issue = staffIssue(id, 'admin')
  if (issue.verification !== 'awaiting') {
    throw workflowError('conflict', 'This issue was already checked by another admin.')
  }
  saveWorkflow(issue, {
    verification: 'none',
    pendingAfterImg: null,
    sentBack: { reason: text, on: shortDate() },
    // Kept for the citizen who filed the report (see ownerDetails). Never
    // cleared, unlike sentBack, which only describes the current send-back.
    sentBackHistory: [
      ...(workflow[String(issue.id)]?.sentBackHistory ?? []),
      { reason: text, on: shortDate() },
    ],
    // A reopened issue goes to the department for the first time, so it must
    // stop being "reopened" (the department list and Start work skip those).
    // Its priority before it was reopened was not kept, so it becomes High.
    ...(issue.priority === 'reopened' ? { priority: 'high' } : {}),
  })
  const why = reasonSentence(text)
  tellReporter(issue, 'sent-back', `The department's fix for "${issue.title}" was sent back. Reason: ${why}`)
  tellDepartment(issue, 'sent-back', `The admin sent back your fix for "${issue.title}". Reason: ${why}`, '/department?status=in-progress')
  return present(issue)
}

// A reopened issue that the admin sent to the verification queue. Its
// priority stays 'reopened' until the admin approves or rejects it.
export function isReopenedInQueue(issue) {
  return issue.priority === 'reopened' && issue.verification === 'awaiting'
}

// Admin: put a reopened issue in the verification queue, where Approve keeps
// the fix and Reject sends it to the department with a reason.
export async function sendReopenedToQueue(id) {
  await wait()
  const issue = staffIssue(id, 'admin')
  if (issue.verification !== 'reopened') {
    throw workflowError('conflict', 'This issue is no longer reopened.')
  }
  const now = new Date()
  try {
    saveWorkflow(issue, {
      verification: 'awaiting',
      submittedOn: shortDate(),
      submittedAt: now.toISOString(),
    })
  } catch (err) {
    if (err.code !== 'storage') throw err
    throw workflowError(
      'storage',
      'This could not be saved because the storage on this device is full. Clear old demo data and try again.',
    )
  }
  return withStaffDetails(present(issue))
}

// Dev only: sessionStorage 'babylon:failLoads' makes the Department, Verify
// and Accountability pages and getIssues (Map, Feed, Report) fail to load, to
// try their error screens. Not in production builds.
function failLoadsForTesting() {
  if (!import.meta.env.DEV) return
  let on = false
  try {
    on = Boolean(window.sessionStorage.getItem('babylon:failLoads'))
  } catch {
    // storage blocked: never fail on purpose
  }
  if (on) throw new Error('Load failed on purpose (babylon:failLoads).')
}

// Dev only: sessionStorage 'babylon:slowPeriod' = '4' or '8' makes the
// Accountability load for that period wait 1.5 s, to check that a slow answer
// never replaces a newer one. Not in production builds.
async function slowPeriodForTesting(weeks) {
  if (!import.meta.env.DEV) return
  let slow = null
  try {
    slow = window.sessionStorage.getItem('babylon:slowPeriod')
  } catch {
    // storage blocked: never slow down on purpose
  }
  if (slow === String(weeks)) await new Promise((resolve) => setTimeout(resolve, 1500))
}

function makeTitle(description) {
  const firstSentence = description.split(/[.!?\n]/)[0].trim()
  if (!firstSentence) return 'New report'
  const title =
    firstSentence.length > 70 ? `${firstSentence.slice(0, 67).trimEnd()}…` : firstSentence
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// The reporter's current name, so a name changed on the Profile page
// shows on their older reports too.
function present(issue) {
  const name = getAccountName(issue.reporterEmail)
  return name ? { ...issue, reporter: name } : { ...issue }
}

function rankIssues(list) {
  return [...list]
    .sort(
      (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
        b.votes - a.votes,
    )
    .map((issue, index) => ({ ...present(issue), rank: index + 1 }))
}

const sum = (list, key) => list.reduce((total, item) => total + item[key], 0)

// ---------- Issues (Map, Feed, Detail) ----------

// category and status: 'All' or a real value. search matches title or street.
export async function getIssues({ category = 'All', status = 'All', search = '' } = {}) {
  failLoadsForTesting()
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
  const issue = all.find((item) => String(item.id) === String(id))
  return issue ? ownerDetails(present(issue)) : null
}

// A citizen's new report. location is { lat, lng, label, ward }.
// reporter is the logged-in account's name (pass session.name). The owner is
// the logged-in account's email, read here the way a backend reads its login.
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
    reporterEmail: getSession()?.email ?? null,
    description,
  }

  const email = issue.reporterEmail
  const levelBefore = email ? getLevel(ownReports(email).length * POINTS_PER_REPORT) : null

  submitted.push(issue)
  saveSubmitted(submitted)
  all.push(withDepartment(issue))

  // The same POINTS_PER_REPORT as the Report page's toast.
  tellReporter(issue, 'filed', `Your report "${issue.title}" is filed. You earned ${POINTS_PER_REPORT} points.`)
  tellDepartment(withDepartment(issue), 'new-report', `A new report is waiting in your department: ${issue.title}.`)
  if (email) {
    const levelAfter = getLevel(ownReports(email).length * POINTS_PER_REPORT)
    if (levelAfter.level > levelBefore.level) {
      notify(email, { kind: 'level-up', text: `You reached Level ${levelAfter.level}, ${levelAfter.role}.`, link: '/my-reports' })
    }
  }
  notifyIssuesChanged()
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
  notifyIssuesChanged()
  return issue.votes
}

// ---------- Editing a report ----------
// The citizen who filed a report may change its title, description, category,
// photo and pin while it is still Open. Votes, follows and status are never
// part of an edit. Every rule is checked again here, like a backend would.

export const TITLE_MIN = 5
export const TITLE_MAX = 70
const DESCRIPTION_MIN = 10
const DESCRIPTION_MAX = 500
const EDIT_CATEGORIES = [...CATEGORIES, 'Other']
export const LOCKED_MESSAGE = 'Work has started, so this report is locked.'

function findIssue(id) {
  return all.find((item) => String(item.id) === String(id))
}

function editError(code, message) {
  return Object.assign(new Error(message), { code })
}

// Another tab may have moved a report on since this page loaded, so the
// edit checks read its status again from storage.
function refreshStatus(issue) {
  const stored = loadSubmitted().find((item) => String(item.id) === String(issue.id))
  if (!stored) return
  const saved = submitted.find((item) => String(item.id) === String(issue.id))
  for (const target of [issue, saved]) {
    if (!target) continue
    target.status = stored.status
    target.priority = stored.priority
    target.verification = stored.verification
  }
}

// The department may have started work in another tab since this page loaded.
function refreshWorkflow(issue) {
  const entry = loadWorkflow()[String(issue.id)]
  if (entry) Object.assign(issue, publicPart(entry))
}

// 'ok' | 'not-owner' | 'locked'. email is the logged-in citizen's (session.email).
export function canEditIssue(issue, email) {
  if (!issue || !email || !isOwnReport(issue, email)) return 'not-owner'
  return issue.status === 'open' ? 'ok' : 'locked'
}

// The issue with its latest status, for the Edit page. null if the id is unknown.
export async function getIssueForEdit(id) {
  const issue = findIssue(id)
  if (!issue) return null
  refreshStatus(issue)
  refreshWorkflow(issue)
  return present(issue)
}

// changes: { title, description, category, photoUrl, location }.
// photoUrl: a new (small) data URL, or undefined to keep the photo.
// location: { lat, lng, label, ward }, or undefined to keep the pin.
// Throws an Error with code 'not-found' | 'forbidden' | 'locked' | 'invalid' | 'storage'.
export async function updateIssue(id, changes) {
  await wait()
  const issue = findIssue(id)
  if (!issue) throw editError('not-found', 'This issue no longer exists.')

  const session = getSession()
  if (session?.role !== 'citizen' || !isOwnReport(issue, session.email)) {
    throw editError('forbidden', 'Only the citizen who reported this issue can edit it.')
  }
  refreshStatus(issue)
  refreshWorkflow(issue)
  if (issue.status !== 'open') throw editError('locked', LOCKED_MESSAGE)

  const title = (changes.title ?? '').trim()
  const description = (changes.description ?? '').trim()
  const { category, photoUrl, location } = changes
  const valid =
    title.length >= TITLE_MIN &&
    title.length <= TITLE_MAX &&
    description.length >= DESCRIPTION_MIN &&
    description.length <= DESCRIPTION_MAX &&
    EDIT_CATEGORIES.includes(category) &&
    photoUrl !== null &&
    (!location || (Number.isFinite(location.lat) && Number.isFinite(location.lng)))
  if (!valid) throw editError('invalid', 'Some details are not valid. Please check the form.')

  const key = String(issue.id)
  const edit = { ...edits[key], title, description, category, editedAt: new Date().toISOString() }
  if (photoUrl) edit.beforeImg = photoUrl
  if (location) {
    Object.assign(edit, {
      lat: location.lat,
      lng: location.lng,
      location: location.label,
      ward: location.ward ?? '',
      distanceM: Math.round(distanceInMeters(MAP_CENTER, [location.lat, location.lng])),
    })
  }

  try {
    window.localStorage.setItem(EDITS_KEY, JSON.stringify({ ...edits, [key]: edit }))
  } catch {
    throw editError(
      'storage',
      'We could not save your changes on this device because its storage is full. Try a smaller photo.',
    )
  }
  edits[key] = edit
  const index = all.indexOf(issue)
  all[index] = withDepartment({ ...issue, ...edit })
  return present(all[index])
}

// Deletes the logged-in citizen's own report while it is still Open: the
// same rule as editing. It disappears from the map, the feed, My reports and
// the points. Saves first, so a failed save changes nothing.
// Throws an Error with code 'not-found' | 'forbidden' | 'locked' | 'storage'.
export async function deleteIssue(id, email) {
  await wait()
  const key = String(id)
  deletedIds = loadDeleted()
  const issue = findIssue(id)
  if (!issue || deletedIds.includes(key)) throw editError('not-found', 'This issue no longer exists.')

  const session = getSession()
  const sameAccount = email && session?.email?.toLowerCase() === email.toLowerCase()
  if (session?.role !== 'citizen' || !sameAccount || !isOwnReport(issue, session.email)) {
    throw editError('forbidden', 'Only the citizen who reported this issue can delete it.')
  }
  refreshStatus(issue)
  refreshWorkflow(issue)
  if (canEditIssue(issue, session.email) !== 'ok') throw editError('locked', LOCKED_MESSAGE)

  const nextDeleted = [...deletedIds, key]
  const nextSubmitted = submitted.filter((item) => String(item.id) !== key)
  const { [key]: droppedEdit, ...nextEdits } = edits
  const { [key]: droppedEntry, ...nextWorkflow } = loadWorkflow()
  void [droppedEdit, droppedEntry]
  try {
    window.localStorage.setItem(DELETED_KEY, JSON.stringify(nextDeleted))
    window.localStorage.setItem(SUBMITTED_KEY, JSON.stringify(nextSubmitted))
    window.localStorage.setItem(EDITS_KEY, JSON.stringify(nextEdits))
    window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(nextWorkflow))
  } catch {
    throw editError('storage', 'We could not delete your report because the storage on this device is blocked.')
  }

  deletedIds = nextDeleted
  delete edits[key]
  workflow = nextWorkflow
  dropFromMemory(key)
  removeForIssue(key) // every notice about it, for every account
  notifyIssuesChanged()
}

// ---------- Home ----------

export async function getHeroSlides() {
  return heroSlides
}
export async function getHeroCategories() {
  return heroSearchCategories
}
// Only issues with an after-photo: a reopened issue approved again has none.
export async function getFixedThisWeek() {
  return all.filter((issue) => issue.status === 'resolved' && issue.afterImg).slice(0, 3)
}
// Newest reports first. Used by the ticker on Home.
export async function getRecentActivity(limit = 8) {
  return [...all]
    .sort((a, b) => ageMs(a) - ageMs(b))
    .slice(0, limit)
    .map((issue) => ({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      time: timeAgo(issue),
    }))
}

// The stat cards, from department rows: totals, and averages weighted by the
// number resolved. Only these two averages are rounded (one decimal).
function statsFrom(rows) {
  const received = sum(rows, 'assigned')
  const resolved = sum(rows, 'resolved')
  const reopened = sum(rows, 'reopened')
  const avgDays = rows.reduce((total, d) => total + d.avgDays * d.resolved, 0) / resolved
  return {
    received,
    resolved,
    avgDays: Math.round(avgDays * 10) / 10,
    reopenedPercent: Math.round((reopened / resolved) * 1000) / 10,
  }
}

// Home's figures: always the last 8 weeks (228, 176, 4.3 days, 4.5%).
export async function getStats() {
  return statsFrom(departments)
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
  ).map(withStaffDetails)
}

// Issues this department fixed and the admin closed (the "Completed" filter).
export async function getCompletedDepartmentIssues(departmentName) {
  return rankIssues(
    all.filter(
      (issue) => issue.department === departmentName && issue.status === 'resolved',
    ),
  ).map(withStaffDetails)
}

// Everything the Department panel shows, in one load.
export async function loadDepartmentPanel(departmentName) {
  failLoadsForTesting()
  const [assigned, completed] = await Promise.all([
    getDepartmentIssues(departmentName),
    getCompletedDepartmentIssues(departmentName),
  ])
  return { assigned, completed }
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
    .map((issue) => withStaffDetails(present(issue)))
}

// Everything the Verify resolutions page shows, in one load.
export async function loadVerification() {
  failLoadsForTesting()
  const [queue, reopened] = await Promise.all([getVerificationQueue(), getReopenedIssues()])
  return { queue, reopened }
}

export async function getReopenedIssues() {
  return all.filter((issue) => issue.verification === 'reopened')
}

export async function getAdminCounts() {
  const queue = await getVerificationQueue()
  const reopened = await getReopenedIssues()
  return { queue: queue.length, reopened: reopened.length }
}

export { ACCOUNTABILITY_PERIODS, DEFAULT_PERIOD_WEEKS }

// Everything the Accountability page shows for one period, in one load.
// The department rows are the single source: the cards are computed from them,
// and their totals match the chart's weeks. Waiting longest is the current
// state, the same for every period. With a real backend this becomes one
// fetch(`/api/accountability?weeks=${weeks}`).
export async function loadAccountability(weeks = DEFAULT_PERIOD_WEEKS) {
  failLoadsForTesting()
  await slowPeriodForTesting(weeks)
  const period = ACCOUNTABILITY_PERIODS.find((p) => p.weeks === weeks)
  const rows = departmentsByPeriod[weeks]
  if (!period || !rows) throw new Error('This period is not available.')
  return {
    weeks,
    label: period.label,
    stats: statsFrom(rows),
    departments: rows,
    weekly: weeklyReports.slice(-weeks),
    waitingLongest,
  }
}

// ---------- Citizen (My reports, points and alerts) ----------
// Everything here belongs to the logged-in account only, found by its email
// (pass session.email). No email = no data. Points = 60 per report this account filed.

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

// Reports saved before reporterEmail existed only have the reporter's name.
function isOwnReport(issue, email) {
  if (issue.reporterEmail) return issue.reporterEmail.toLowerCase() === email.toLowerCase()
  return String(issue.id).startsWith('new-') && issue.reporter === getAccountName(email)
}

function ownReports(email) {
  return all.filter((issue) => isOwnReport(issue, email)).map(present)
}

// The citizen's own reports, newest first (My reports page). Only for the
// logged-in account itself, with the details only the reporter may see.
export async function getMyReports(email) {
  if (!email || getSession()?.email?.toLowerCase() !== email.toLowerCase()) return []
  return ownReports(email)
    .sort((a, b) => ageMs(a) - ageMs(b))
    .map(ownerDetails)
}

// For the citizen who filed the report only: every time the admin sent the
// department's fix back, with the reason (sentBackHistory), and whether it is
// sent back right now. Other citizens, guests and staff get the issue as it is.
function ownerDetails(issue) {
  const session = getSession()
  if (session?.role !== 'citizen' || !isOwnReport(issue, session.email)) return issue
  const entry = workflow[String(issue.id)] ?? {}
  // Reports sent back before the history existed only have the current reason.
  const history = entry.sentBackHistory ?? (entry.sentBack ? [entry.sentBack] : [])
  return { ...issue, sentBackHistory: history, sentBackNow: Boolean(entry.sentBack) }
}

export async function getCurrentUser(email) {
  if (!email) return null
  const reports = ownReports(email).length
  const points = reports * POINTS_PER_REPORT
  return { name: getAccountName(email), reports, points, ...getLevel(points) }
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

// "N neighbours upvoted your report". Votes start at 1 (the reporter's own vote).
function alertForVotes(issue) {
  const others = (issue.votes ?? 1) - 1
  if (others < 1) return null
  return {
    id: `votes-${issue.id}`,
    issueId: issue.id,
    group: 'status',
    type: 'upvote',
    title: `${others} neighbour${others === 1 ? '' : 's'} upvoted your report`,
    message: `${issue.title} is getting attention.`,
    time: timeAgo(issue),
    unread: false,
  }
}

// Open issues by other people, same category as one of the user's reports, within 500 m.
async function getNearbyAlerts(email) {
  const mine = ownReports(email)
  const seen = new Set()
  const result = []

  for (const own of mine) {
    for (const other of all) {
      if (
        isOwnReport(other, email) ||
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

// An alert counts as read once the citizen opened it. Kept per account in this browser.
const SEEN_KEY = 'babylon.seenAlerts'
// A new title (new status or new votes) makes the alert unread again.
const alertKey = (alert) => `${alert.id}|${alert.title}`

function readSeen(email) {
  try {
    const store = JSON.parse(window.localStorage.getItem(SEEN_KEY))
    return new Set(store?.[email.toLowerCase()] ?? [])
  } catch {
    return new Set()
  }
}

export function markAlertsSeen(email, alerts) {
  if (!email) return
  try {
    const store = JSON.parse(window.localStorage.getItem(SEEN_KEY)) ?? {}
    const key = email.toLowerCase()
    store[key] = [...new Set([...(store[key] ?? []), ...alerts.map(alertKey)])]
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(store))
  } catch {
    // storage blocked: alerts just stay unread
  }
  notifyIssuesChanged()
}

// group: 'All' | 'status' | 'nearby' | 'reopened'
export async function getAlerts(group = 'All', email) {
  if (!email) return []
  const own = ownReports(email)
    .sort((a, b) => ageMs(a) - ageMs(b))
    .flatMap((issue) => [alertForIssue(issue), alertForVotes(issue)].filter(Boolean))
  const nearby = await getNearbyAlerts(email)
  const seen = readSeen(email)
  return [...own, ...nearby]
    .filter((alert) => group === 'All' || alert.group === group)
    .map((alert) => ({ ...alert, unread: !seen.has(alertKey(alert)) }))
}

export async function getUnreadAlertCount(email) {
  if (!email) return 0
  return (await getAlerts('All', email)).filter((alert) => alert.unread).length
}

// ---------- Citizen profile ----------
// Kept in this browser per account (by email) until the backend exists.
// Privacy rule, even in the mock: the full NID number is never stored. Only
// its last 4 digits and the review status are kept here. The NID card photo
// is kept only while the submission is Pending, in its own store
// (services/identityPhotos.js, never in this profile), and is deleted when
// the admin approves or rejects, or replaced when the citizen sends again.
//
// identity.status: 'not-submitted' | 'pending' | 'verified' | 'rejected'
// A citizen counts as Verified once identity.status is 'verified'.

const PROFILES_KEY = 'babylon.profiles'
export const PROFILE_EVENT = 'babylon:profile' // fired on window after every change

export const DEMO_OTP = '123456' // nothing is really sent, so the code is fixed
export const OTP_RESEND_SECONDS = 30
export const OTP_ATTEMPTS = 3
const OTP_VALID_MS = 10 * 60 * 1000

const EMPTY_IDENTITY = { status: 'not-submitted', nidLast4: '', submittedAt: null, reason: '' }

// A short pause, so loading and saving states show like they would online.
const wait = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

function readProfiles() {
  try {
    return JSON.parse(window.localStorage.getItem(PROFILES_KEY)) ?? {}
  } catch {
    return {}
  }
}

function writeProfile(email, changes) {
  const key = email.toLowerCase()
  const profiles = readProfiles()
  profiles[key] = { ...profiles[key], ...changes }
  try {
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  } catch {
    throw new Error('We could not save on this device. Please try again.')
  }
  window.dispatchEvent(new Event(PROFILE_EVENT))
}

// The demo staff are onboarded, so their profiles start filled in. Changes
// they make are saved on top of these, like any other profile.
const STAFF_DEMO_PROFILES = {
  'roads@babylon.test': {
    jobTitle: 'Road maintenance officer',
    phone: '01811000201',
    departmentVerified: true,
  },
  'admin@babylon.test': {
    jobTitle: 'City operations administrator',
    phone: '01911000302',
  },
}

function buildProfile(email) {
  const key = email.toLowerCase()
  const stored = { ...STAFF_DEMO_PROFILES[key], ...readProfiles()[key] }
  const identity = { ...EMPTY_IDENTITY, ...stored.identity }
  const account = getAccount(email)
  return {
    email,
    name: getAccountName(email) ?? '',
    role: account?.role ?? 'citizen',
    department: account?.department ?? null,
    address: stored.address ?? '',
    ward: stored.ward ?? '',
    phone: stored.phone ?? '', // only set once the number is verified
    phoneVerified: Boolean(stored.phone),
    identity,
    isVerified: identity.status === 'verified',
    // Staff only
    jobTitle: stored.jobTitle ?? '',
    photo: stored.photo ?? '', // a small data: URL, or ''
    departmentVerified: Boolean(stored.departmentVerified),
    onboarded: isOnboarded(email),
  }
}

export async function getProfile(email) {
  if (!email) return null
  await wait(300)
  return buildProfile(email)
}

// details: { name, address, ward }. Checked again here, like a backend would.
export async function saveProfile(email, details) {
  await wait()
  const errors = checkDetails(details)
  if (Object.values(errors).some(Boolean)) {
    throw new Error('Some details are not valid. Please check the form.')
  }
  const name = details.name.trim()
  if (name !== getAccountName(email)) renameAccount(email, name)
  writeProfile(email, { address: details.address.trim(), ward: details.ward })
  return buildProfile(email)
}

// ---------- Staff profiles ----------
// Department and admin accounts: name, job title, phone (the same code check
// as citizens), a department code for department accounts, and a photo.

// details: { name, jobTitle }. Checked again here, like a backend would.
export async function saveStaffDetails(email, details) {
  await wait()
  if (checkName(details.name) || checkJobTitle(details.jobTitle)) {
    throw new Error('Some details are not valid. Please check the form.')
  }
  const name = details.name.trim()
  writeProfile(email, { jobTitle: details.jobTitle.trim() })
  if (name !== getAccountName(email)) renameAccount(email, name)
  return buildProfile(email)
}

export const DEPARTMENT_CODE_EMPTY = 'Enter your department code.'

// Mock only: the code is compared in the browser. A server must check it.
// Returns the profile, or throws a whole-sentence message.
export async function verifyDepartmentCode(email, code) {
  await wait()
  const account = getAccount(email)
  if (account?.role !== 'department') throw new Error('Only department accounts have a department code.')
  const typed = code.trim().toUpperCase()
  if (!typed) throw new Error(DEPARTMENT_CODE_EMPTY)
  if (typed !== DEPARTMENT_CODES[account.department]?.toUpperCase()) {
    throw new Error(
      `That code does not match the ${account.department} department. Ask your department head for the code.`,
    )
  }
  writeProfile(email, { departmentVerified: true })
  return buildProfile(email)
}

const AVATAR_EDGE = 192 // px, square: plenty for a 40px circle on a sharp screen

// A square, centred crop of the photo, made small enough to keep in the
// profile. WebP keeps any transparency, so nothing is painted behind it.
async function shrinkToAvatar(file) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(UNREADABLE_PHOTO)
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_EDGE
  canvas.height = AVATAR_EDGE
  const context = canvas.getContext('2d')
  if (!context || !side) throw new Error(UNREADABLE_PHOTO)
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_EDGE,
    AVATAR_EDGE,
  )
  bitmap.close?.()
  return canvas.toDataURL('image/webp', 0.85)
}

// file: an image File, or null to remove the photo. If the photo cannot be
// read or kept, this throws a whole-sentence message and the old photo stays.
export async function saveStaffPhoto(email, file) {
  await wait(300)
  if (!file) {
    writeProfile(email, { photo: '' })
    return buildProfile(email)
  }
  const problem = checkIdPhoto(file)
  if (problem) throw new Error(problem)
  const photo = await shrinkToAvatar(file)
  try {
    writeProfile(email, { photo })
  } catch {
    throw new Error('This device has no space left for your photo, so your old photo is kept.')
  }
  return buildProfile(email)
}

// What a staff profile still needs before the setup can finish, as short
// phrases ('a job title'). Empty when it is complete.
export function setupMissing(profile) {
  const missing = []
  if (checkName(profile.name)) missing.push('a valid name')
  if (checkJobTitle(profile.jobTitle)) missing.push('a job title')
  if (!profile.phoneVerified) missing.push('a verified phone number')
  if (profile.role === 'department' && !profile.departmentVerified) {
    missing.push('a verified department code')
  }
  return missing
}

// Ends the staff setup. Checks everything again from storage first, the way
// a backend would, and refuses with a whole-sentence message if not ready.
export async function completeOnboarding(email) {
  await wait(300)
  const missing = setupMissing(buildProfile(email))
  if (missing.length) {
    throw new Error('Your profile is not complete yet. Please finish every step first.')
  }
  markOnboarded(email)
  window.dispatchEvent(new Event(PROFILE_EVENT))
  return buildProfile(email)
}

// Phone check with a one-time code. Held in memory, like a server would.
const otps = {}

// Returns { phone, resendIn } once a code is "sent".
export async function requestOtp(email, phoneInput) {
  await wait()
  if (checkPhone(phoneInput)) throw new Error('Please enter a valid mobile number first.')
  const phone = normalizePhone(phoneInput)
  const key = email.toLowerCase()

  const previous = otps[key]
  const secondsSince = previous ? (Date.now() - previous.sentAt) / 1000 : Infinity
  if (previous?.phone === phone && secondsSince < OTP_RESEND_SECONDS) {
    const left = Math.ceil(OTP_RESEND_SECONDS - secondsSince)
    throw new Error(`Please wait ${left} seconds before asking for a new code.`)
  }

  otps[key] = { phone, sentAt: Date.now(), attemptsLeft: OTP_ATTEMPTS }
  return { phone, resendIn: OTP_RESEND_SECONDS }
}

// Returns { status: 'verified', profile } | { status: 'wrong', attemptsLeft }
//       | { status: 'locked' } | { status: 'expired' }
export async function verifyOtp(email, code) {
  await wait()
  const key = email.toLowerCase()
  const otp = otps[key]
  if (!otp || Date.now() - otp.sentAt > OTP_VALID_MS) return { status: 'expired' }
  if (otp.attemptsLeft <= 0) return { status: 'locked' }

  if (code.trim() !== DEMO_OTP) {
    otp.attemptsLeft -= 1
    return otp.attemptsLeft > 0
      ? { status: 'wrong', attemptsLeft: otp.attemptsLeft }
      : { status: 'locked' }
  }

  delete otps[key]
  writeProfile(email, { phone: otp.phone })
  return { status: 'verified', profile: buildProfile(email) }
}

const ALREADY_SUBMITTED = 'Your identity is already submitted.'
const PHOTO_STORAGE_BLOCKED =
  'We could not keep your card photo on this device, so your identity was not sent. Private windows and some browser settings block site storage. Please allow it and try again.'
const PHOTO_STORAGE_FULL =
  'This device has no space left for your card photo, so your identity was not sent. Free some space and try again.'

function identitySent(email) {
  const { status } = buildProfile(email).identity
  return status === 'pending' || status === 'verified'
}

// nid is the full number and photo is a File. The full number is never kept:
// the profile only gets the last 4 digits. The photo is made smaller and saved
// in its own store FIRST; only then does the profile say Pending (and the
// profile event fire), so a Pending submission always has its photo.
// Throws a whole-sentence message; nothing changes on the profile then.
export async function submitIdentity(email, { nid, photo }) {
  await wait(700)
  if (checkNid(nid) || checkIdPhoto(photo)) {
    throw new Error('Please check your NID number and photo.')
  }
  if (identitySent(email)) throw new Error(ALREADY_SUBMITTED)

  const blob = await prepareIdPhoto(photo)
  const submittedAt = new Date().toISOString()
  try {
    await savePhoto(email, submittedAt, blob)
  } catch (err) {
    throw new Error(err.code === 'storage-full' ? PHOTO_STORAGE_FULL : PHOTO_STORAGE_BLOCKED, {
      cause: err,
    })
  }

  try {
    if (identitySent(email)) throw new Error(ALREADY_SUBMITTED) // sent from another tab meanwhile
    writeProfile(email, {
      identity: {
        status: 'pending',
        nidLast4: normalizeNid(nid).slice(-4),
        submittedAt,
        reason: '',
      },
    })
  } catch (err) {
    // Not Pending, so the photo must not stay. If this delete fails too, the
    // stale-photo cleanup removes it when the admin queue next loads.
    await deletePhoto(email, submittedAt).catch(() => {})
    throw err
  }
  // A new submission replaces the photo of any earlier one.
  await deleteOtherPhotos(email, submittedAt).catch(() => {})
  return buildProfile(email)
}

// ---------- Admin: identity checks ----------
// The queue lists every account whose identity is waiting for review, plus a
// few sample submissions (src/mock/) so the demo queue is never empty.
// Real decisions are saved on the citizen's profile, so their Profile page and
// the navbar badge update. Sample decisions live only in this module, so the
// sidebar badge and the queue always agree, and a reload starts the demo again.
// The queue never sees the full NID number. The card photo of a real
// submission is read separately (getIdentityPhoto) and deleted after review.

const sampleSubmissions = sampleIdentitySubmissions.map(({ submittedDaysAgo, ...item }) => ({
  ...item,
  sample: true,
  submittedAt: new Date(Date.now() - submittedDaysAgo * 86400000 - 2 * 3600000).toISOString(),
}))
const sampleDecisions = new Map() // sample id -> 'verified' | 'rejected'

export const ALREADY_REVIEWED = 'This submission was already reviewed.'
export const NO_PHOTO_TO_APPROVE =
  'No card photo was saved with this submission, so it cannot be approved. Reject it and ask the citizen to send it again.'
const PHOTO_UNREADABLE_FOR_REVIEW =
  'The card photo could not be loaded on this device, so this submission cannot be approved yet. Please try again.'

const profileQueueId = (email) => `profile:${email}`

function pendingSubmissions() {
  const real = Object.entries(readProfiles())
    .filter(([, stored]) => stored.identity?.status === 'pending')
    .map(([email, stored]) => ({
      id: profileQueueId(email),
      email,
      name: getAccountName(email) ?? email,
      nidLast4: stored.identity.nidLast4,
      submittedAt: stored.identity.submittedAt,
      sample: false,
    }))
  const samples = sampleSubmissions.filter((item) => !sampleDecisions.has(item.id))
  // Oldest first, so whoever has waited longest is checked first.
  return [...real, ...samples].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
}

// A photo may wait this long for its Pending write (another tab still sending)
// before the cleanup may remove it.
const PHOTO_CLEANUP_MIN_AGE_MS = 60 * 1000

function isPendingSubmission(email, submittedAt) {
  const identity = readProfiles()[email.toLowerCase()]?.identity
  return identity?.status === 'pending' && identity.submittedAt === submittedAt
}

export async function getIdentityQueue() {
  await wait(400)
  // Removes photos a review could not delete at the time.
  await deleteStalePhotos(isPendingSubmission, PHOTO_CLEANUP_MIN_AGE_MS).catch(() => {})
  return pendingSubmissions()
}

// The card photo for a submission from getIdentityQueue():
//   { kind: 'sample' }        made-up submission, no real photo
//   { kind: 'photo', blob }   the photo, for this submission only
//   { kind: 'missing' }       none was saved (sent before photos were kept)
//   { kind: 'error' }         this browser's storage could not be read
export async function getIdentityPhoto(submission) {
  if (submission.sample) return { kind: 'sample' }
  try {
    const blob = await readPhoto(submission.email, submission.submittedAt)
    return blob ? { kind: 'photo', blob } : { kind: 'missing' }
  } catch {
    return { kind: 'error' }
  }
}

export async function getIdentityQueueCount() {
  return pendingSubmissions().length
}

// submission is an item from getIdentityQueue().
// decision: 'approve' | 'reject'. A reject needs a reason, which the citizen sees.
// Throws if someone already reviewed it (for example in another tab), or if
// the citizen has sent a new submission since this one was listed. A real
// submission can only be approved once its card photo has been seen.
// Returns { ...submission, status, photoDeleted }. The decision is saved
// first, then the photo is deleted; photoDeleted is false if that delete
// failed (the cleanup in getIdentityQueue removes it later).
export async function reviewIdentity(submission, { decision, reason = '' }) {
  await wait()
  if (decision === 'reject' && checkRejectReason(reason)) {
    throw new Error('Please write a reason for the citizen.')
  }
  const status = decision === 'approve' ? 'verified' : 'rejected'
  const stillPending = () =>
    pendingSubmissions().some(
      (item) => item.id === submission.id && item.submittedAt === submission.submittedAt,
    )
  if (!stillPending()) throw new Error(ALREADY_REVIEWED)

  // The citizen hears the outcome in their bell, with a link to their profile.
  const why = decision === 'reject' ? reasonSentence(reason) : ''
  const tellCitizen = () =>
    notify(submission.email, {
      kind: status === 'verified' ? 'identity-verified' : 'identity-rejected',
      text: status === 'verified' ? 'Your identity is verified.' : `Your identity was not approved. Reason: ${why}`,
      link: '/profile',
    })

  if (submission.sample) {
    sampleDecisions.set(submission.id, status)
    window.dispatchEvent(new Event(PROFILE_EVENT))
    tellCitizen()
    return { ...submission, status, photoDeleted: true }
  }

  if (decision === 'approve') {
    const photo = await getIdentityPhoto(submission)
    if (photo.kind === 'error') throw new Error(PHOTO_UNREADABLE_FOR_REVIEW)
    if (photo.kind !== 'photo') throw new Error(NO_PHOTO_TO_APPROVE)
    if (!stillPending()) throw new Error(ALREADY_REVIEWED) // reviewed elsewhere meanwhile
  }

  const { identity } = buildProfile(submission.email)
  writeProfile(submission.email, {
    identity: {
      ...identity,
      status,
      reason: status === 'rejected' ? reason.trim() : '',
      reviewedAt: new Date().toISOString(),
    },
  })
  tellCitizen()

  let photoDeleted = true
  try {
    await deletePhoto(submission.email, submission.submittedAt)
  } catch {
    photoDeleted = false
  }
  return { ...submission, status, photoDeleted }
}