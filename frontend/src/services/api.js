// Every page gets its data from here. Now it reads src/mock/.
// Later, each function becomes a fetch() call. Pages will not change,
// because every function is already async.

import { CATEGORIES, issues as rawIssues, MAP_CENTER } from '../mock/issues'
import { heroSlides, heroSearchCategories } from '../mock/heroSlides'
import {
  CATEGORY_DEPARTMENT,
  departments,
  accountabilityPeriod,
  waitingLongest,
  weeklyReports,
} from '../mock/departments'
import { earnPoints } from '../mock/user'
import { sampleIdentitySubmissions } from '../mock/identitySubmissions'
import { distanceInMeters } from '../utils/geo'
import { prepareIdPhoto } from '../utils/idPhoto'
import {
  deleteOtherPhotos,
  deletePhoto,
  deleteStalePhotos,
  readPhoto,
  savePhoto,
} from './identityPhotos'
import { getAccountName, getSession, renameAccount } from './auth'
import {
  checkDetails,
  checkIdPhoto,
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
  return issue ? present(issue) : null
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

  submitted.push(issue)
  saveSubmitted(submitted)
  all.push(withDepartment(issue))
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

// Issues this department fixed and the admin closed (the "Completed" filter).
export async function getCompletedDepartmentIssues(departmentName) {
  return rankIssues(
    all.filter(
      (issue) => issue.department === departmentName && issue.status === 'resolved',
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

// The citizen's own reports, newest first (My reports page).
export async function getMyReports(email) {
  if (!email) return []
  return ownReports(email).sort((a, b) => ageMs(a) - ageMs(b))
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

function buildProfile(email) {
  const stored = readProfiles()[email.toLowerCase()] ?? {}
  const identity = { ...EMPTY_IDENTITY, ...stored.identity }
  return {
    email,
    name: getAccountName(email) ?? '',
    address: stored.address ?? '',
    ward: stored.ward ?? '',
    phone: stored.phone ?? '', // only set once the number is verified
    phoneVerified: Boolean(stored.phone),
    identity,
    isVerified: identity.status === 'verified',
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

  if (submission.sample) {
    sampleDecisions.set(submission.id, status)
    window.dispatchEvent(new Event(PROFILE_EVENT))
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

  let photoDeleted = true
  try {
    await deletePhoto(submission.email, submission.submittedAt)
  } catch {
    photoDeleted = false
  }
  return { ...submission, status, photoDeleted }
}