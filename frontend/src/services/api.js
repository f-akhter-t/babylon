// Every page gets its data from here. Now it reads src/mock/.
// Later, each function becomes a fetch() call. Pages will not change,
// because every function is already async.

import {  issues as rawIssues } from '../mock/issues'
import {
  ACCOUNTABILITY_PERIODS,
  CATEGORY_DEPARTMENT,
  DEFAULT_PERIOD_WEEKS,
} from '../utils/departments'
import { prepareIdPhoto, UNREADABLE_PHOTO } from '../utils/idPhoto'
import {
  deleteOtherPhotos,
  deletePhoto,
  savePhoto,
} from './identityPhotos'
import {
  getAccount,
  getAccountName,
  getSession,
  renameAccount,
  staffEmails,
  updateSession,
} from './auth'
import * as staff from './staffApi'
import { ISSUES_EVENT } from './issuesEvent'
import { notify, notifyEach } from './notifications'
import {
  checkDetails,
  checkIdPhoto,
  checkJobTitle,
  checkName,
  checkNid,
  checkPhone,
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
export { ISSUES_EVENT }
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

// Another tab saved an edit: apply it here too. Read-only: it only reads the
// store and tells the pages, and never writes storage, so it cannot loop.
window.addEventListener('storage', (e) => {
  if (e.key !== EDITS_KEY) return
  for (const [id, changes] of Object.entries(loadEdits())) {
    edits[id] = changes
    const index = all.findIndex((issue) => String(issue.id) === id)
    if (index !== -1) all[index] = withDepartment({ ...all[index], ...changes })
  }
  notifyIssuesChanged()
})

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

export const REJECT_REASON_NEEDED = 'Write a reason before sending this back.'

// A reopened issue that the admin sent to the verification queue. Its
// priority stays 'reopened' until the admin approves or rejects it.
export function isReopenedInQueue(issue) {
  return issue.priority === 'reopened' && issue.verification === 'awaiting'
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

// ---------- Issues (Map, Feed, Detail) ----------
// getIssues and getIssueById are served by the backend now (publicApi.js,
// re-exported below).

// ---------- Editing a report ----------
// The citizen who filed a report may change its title, description, category,
// photo and pin while it is still Open. Votes, follows and status are never
// part of an edit. Every rule is checked again here, like a backend would.

// ---------- Home and the public issue pages ----------
// Served by the backend now (publicApi.js). Pages still import them from here.
export {
  getFixedThisWeek,
  getHeroCategories,
  getHeroSlides,
  getIssueById,
  getIssues,
  getRecentActivity,
  getStats,
} from './publicApi'

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

export { ACCOUNTABILITY_PERIODS, DEFAULT_PERIOD_WEEKS }

// Served by the backend now (adminApi.js). Pages still import them from here.
export {
  approveResolution,
  getAdminCounts,
  getIdentityPhoto,
  getIdentityQueue,
  getIdentityQueueCount,
  loadAccountability,
  loadVerification,
  rejectResolution,
  reviewIdentity,
  sendReopenedToQueue,
  TRANSLATE_LANGUAGES,
  translateText,
} from './adminApi'

// ---------- Citizen (My reports, points and alerts) ----------
// Everything here belongs to the logged-in account only, found by its email
// (pass session.email). No email = no data. Points = 60 per report this account filed.

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
  const key = email.toLowerCase()
  const stored = readProfiles()[key] ?? {}
  const identity = { ...EMPTY_IDENTITY, ...stored.identity }
  const account = getAccount(email)
  return {
    email,
    name: getAccountName(email) ?? '',
    role: account?.role ?? 'citizen',
    department: account?.department ?? null,
    address: stored.address ?? '',
    division: stored.division ?? '',
    phone: stored.phone ?? '', // only set once the number is verified
    phoneVerified: Boolean(stored.phone),
    identity,
    isVerified: identity.status === 'verified',
    onboarded: true, // only staff have a setup to finish (see the staff section)
  }
}

// Department and admin accounts live on the server now (staffApi.js); citizens
// are still the mock above until the citizen profile is swapped.
const isStaff = () => {
  const role = getSession()?.role
  return role === 'department' || role === 'admin'
}

// Everything that shows the profile (name, photo, badges) reloads on this.
const profileChanged = () => window.dispatchEvent(new Event(PROFILE_EVENT))

export async function getProfile(email) {
  if (!email) return null
  if (isStaff()) return staff.getStaffProfile()
  await wait(300)
  return buildProfile(email)
}

// details: { name, address, division }. Checked again here, like a backend would.
export async function saveProfile(email, details) {
  await wait()
  const errors = checkDetails(details)
  if (Object.values(errors).some(Boolean)) {
    throw new Error('Some details are not valid. Please check the form.')
  }
  const name = details.name.trim()
  if (name !== getAccountName(email)) renameAccount(email, name)
  writeProfile(email, { address: details.address.trim(), division: details.division })
  return buildProfile(email)
}

// ---------- Staff profiles ----------
// Department and admin accounts: name, job title, phone (the same code check
// as citizens), a department code for department accounts, an Employee ID and a
// photo. All of it is saved and checked by the server (staffApi.js); the secrets
// (department codes, the staff list) never reach the browser. The functions keep
// the names and arguments the pages use; the person comes from the token, so
// `email` is only there for the pages' sake.

// details: { name, jobTitle }. Checked here for the form, and again by the server.
export async function saveStaffDetails(email, details) {
  if (checkName(details.name) || checkJobTitle(details.jobTitle)) {
    throw new Error('Some details are not valid. Please check the form.')
  }
  const profile = await staff.saveStaffDetails({
    name: details.name.trim(),
    jobTitle: details.jobTitle.trim(),
  })
  updateSession({ name: profile.name })
  profileChanged()
  return profile
}

export const DEPARTMENT_CODE_EMPTY = 'Enter your department code.'

// Returns the profile, or throws the server's whole-sentence message.
export async function verifyDepartmentCode(email, code) {
  const typed = code.trim()
  if (!typed) throw new Error(DEPARTMENT_CODE_EMPTY)
  const profile = await staff.verifyDepartmentCode(typed)
  profileChanged()
  return profile
}

export const EMPLOYEE_ID_EMPTY = 'Enter your Employee ID.'

// An ID must be on this account's staff list and belong to one account only; the
// server decides. Returns the profile, or throws its whole-sentence message.
export async function verifyEmployeeId(email, value) {
  const typed = value.trim()
  if (!typed) throw new Error(EMPLOYEE_ID_EMPTY)
  const profile = await staff.verifyEmployeeId(typed)
  profileChanged()
  return profile
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
  let photo = ''
  if (file) {
    const problem = checkIdPhoto(file)
    if (problem) throw new Error(problem)
    photo = await shrinkToAvatar(file)
  }
  const profile = await staff.saveStaffPhoto(photo)
  profileChanged()
  return profile
}

// What a staff profile still needs before the setup can finish, as short
// phrases ('a job title'). Empty when it is complete. The server works it out
// and sends it with the profile.
export function setupMissing(profile) {
  return profile.setupMissing ?? []
}

// Ends the staff setup. The server checks everything again and answers with a
// NEW token that says onboarded: true; it is saved here, because the old one is
// refused by every panel route. Throws the server's sentence if not ready.
export async function completeOnboarding() {
  const { token, user } = await staff.finishSetup()
  updateSession({ token, onboarded: true, name: user.name })
  profileChanged()
  return user
}

// Phone check with a one-time code. Held in memory, like a server would.
const otps = {}

// The number a staff member last asked a code for, kept until it is verified
// (the server needs it again with the code).
const staffPhones = {}

// Returns { phone, resendIn } once a code is "sent".
export async function requestOtp(email, phoneInput) {
  if (isStaff()) {
    if (checkPhone(phoneInput)) throw new Error('Please enter a valid mobile number first.')
    const sent = await staff.sendPhoneCode(normalizePhone(phoneInput))
    staffPhones[email.toLowerCase()] = sent.phone
    return sent
  }
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
  if (isStaff()) {
    const phone = staffPhones[email.toLowerCase()]
    if (!phone) return { status: 'expired' }
    const result = await staff.verifyPhoneCode(phone, code.trim())
    if (result.status === 'verified') {
      delete staffPhones[email.toLowerCase()]
      profileChanged()
    }
    return result
  }
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

export const ALREADY_REVIEWED = 'This submission was already reviewed.'
export const NO_PHOTO_TO_APPROVE =
  'No card photo was saved with this submission, so it cannot be approved. Reject it and ask the citizen to send it again.'
  'The card photo could not be loaded on this device, so this submission cannot be approved yet. Please try again.'

// The citizen's calls to the backend (reports, votes, me, points).
export * from './citizenApi.js'
