// Every page gets its data from here. Each function calls the Express backend
// (through the files imported below), and this file re-exports them all, so a
// page imports from one place.
import * as citizen from './profileApi'
import { PROFILE_EVENT } from './profileApi'
import { ACCOUNTABILITY_PERIODS, DEFAULT_PERIOD_WEEKS } from '../utils/departments'
import { UNREADABLE_PHOTO } from '../utils/idPhoto'
import { getSession, updateSession } from './auth'
import * as staff from './staffApi'
import * as emailCheck from './emailCheckApi'
import { ISSUES_EVENT } from './issuesEvent'
import {
  checkIdPhoto,
  checkJobTitle,
  checkName,
  checkPhone,
  normalizePhone,
} from '../utils/profileRules'

// ---------- Points ----------
export const POINTS_PER_REPORT = 60

// Pages listen to this to refresh when a report is created, upvoted or an alert is read.
export { ISSUES_EVENT }

export const REJECT_REASON_NEEDED = 'Write a reason before sending this back.'

// A reopened issue that the admin sent to the verification queue. Its
// priority stays 'reopened' until the admin approves or rejects it.
export function isReopenedInQueue(issue) {
  return issue.priority === 'reopened' && issue.verification === 'awaiting'
}

// ---------- Home and the public issue pages ----------
// Served by the backend (publicApi.js). Pages import them from here.
export {
  getFixedThisWeek,
  getHeroCategories,
  getHeroSlides,
  getIssueById,
  getIssues,
  getRecentActivity,
  getStats,
} from './publicApi'

// ---------- Admin ----------
export { ACCOUNTABILITY_PERIODS, DEFAULT_PERIOD_WEEKS }
// Served by the backend (adminApi.js). Pages import them from here.
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

export const ALREADY_REVIEWED = 'This submission was already reviewed.'

// ---------- Department panel ----------
// Served by the backend (departmentApi.js). Pages import them from here.
export { loadDepartmentPanel, startWork, submitForVerification } from './departmentApi'

// ---------- Profiles ----------
// Citizens (profileApi.js) and department and admin accounts (staffApi.js) are
// both on the server. The person comes from the token, so `email` is only there
// for the pages' sake.
export { PROFILE_EVENT }

const isStaff = () => {
  const role = getSession()?.role
  return role === 'department' || role === 'admin'
}

// Everything that shows the profile (name, photo, badges) reloads on this.
const profileChanged = () => window.dispatchEvent(new Event(PROFILE_EVENT))

export async function getProfile(email) {
  if (!email) return null
  if (isStaff()) return staff.getStaffProfile()
  return citizen.getProfile()
}

// details: { name, address, division }. Checked again by the server.
export async function saveProfile(email, details) {
  const profile = await citizen.saveProfile(details)
  if (profile?.name) updateSession({ name: profile.name })
  return profile
}

// ---------- Staff profiles ----------
// Department and admin accounts: name, job title, phone (the same code check
// as citizens), a department code for department accounts, an Employee ID and a
// photo. All of it is saved and checked by the server (staffApi.js); the secrets
// (department codes, the staff list) never reach the browser.

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

// Email check for staff and citizens: a code goes to the account's own address
// (emailCheckApi.js).
// -> { status: 'sent', email, resendIn } | { status: 'verified' }; throws the
// server's whole-sentence message otherwise.
export async function requestEmailCode() {
  const sent = isStaff()
    ? await staff.sendEmailCode()
    : await emailCheck.sendEmailCode(emailCheck.CITIZEN_EMAIL_PATH)
  if (sent.status === 'verified') profileChanged()
  return sent
}

// -> { status: 'verified', profile } | { status: 'wrong', message } | { status: 'locked', message }
export async function verifyEmailCode(code) {
  const result = isStaff()
    ? await staff.verifyEmailCode(code.trim())
    : await emailCheck.verifyEmailCode(emailCheck.CITIZEN_EMAIL_PATH, code.trim())
  if (result.status === 'verified') profileChanged()
  return result
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

// The number a staff member last asked a code for, kept until it is verified
// (the server needs it again with the code).
const staffPhones = {}

// Returns { phone, resendIn } once a code is sent.
export async function requestOtp(email, phoneInput) {
  if (isStaff()) {
    if (checkPhone(phoneInput)) throw new Error('Please enter a valid mobile number first.')
    const sent = await staff.sendPhoneCode(normalizePhone(phoneInput))
    staffPhones[email.toLowerCase()] = sent.phone
    return sent
  }
  return citizen.requestOtp(phoneInput)
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
  return citizen.verifyOtp(code)
}

// nid is the full number and photo is a File. The server keeps only the last 4
// digits of the number. Throws a whole-sentence message; nothing changes on the
// profile then.
export async function submitIdentity(email, details) {
  return citizen.submitIdentity(details)
}

// The citizen's calls to the backend (reports, votes, me, points).
export * from './citizenApi.js'
