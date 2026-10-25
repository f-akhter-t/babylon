// Staff accounts (department and admin): sign-up, the setup checks, and finish.
// Every rule lives here; controllers only pass the request in. The secrets
// (access code, department codes, roster) are read through staffRoster.service.js
// and never appear in an answer or a log.
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { hashPassword } from '../../utils/password.js'
import { ROLES } from '../../constants/roles.js'
import { COMMON } from '../../constants/messages/common.js'
import { AUTH_MESSAGES as M } from '../../constants/messages/auth.js'
import { sendCode, verifyCode } from '../../shared/service/phoneCode.service.js'
import * as emailCodes from '../../shared/service/emailCode.service.js'
import { PHONE_CODE_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { issueToken, toStaffProfile } from './session.js'
import * as roster from './staffRoster.service.js'

const gone = () => new AppError('unauthorized', 401, COMMON.unauthorized)
const emailTaken = () => new AppError('conflict', 409, M.emailTaken, 'email')
const idTaken = () => new AppError('conflict', 409, M.employeeIdTaken, 'employeeId')

// The signed-in staff account, read fresh from the database (the token only says
// who they are). A citizen, or an account that no longer exists, is refused.
async function loadStaff(email) {
  const user = await User.findOne({ email }).lean()
  if (!user) throw gone()
  if (user.role !== ROLES.DEPARTMENT && user.role !== ROLES.ADMIN) {
    throw new AppError('forbidden', 403, M.staffOnly)
  }
  return user
}

const profileOf = async (email) => toStaffProfile(await loadStaff(email))

// POST /auth/staff/signup. The access code is checked before anything else is
// said about the email, so it cannot be used to find out who has an account.
// The account starts NOT onboarded: the token says so until finish() is called.
export async function signup({ name, email, password, role, department, accessCode }) {
  if (!roster.accessCodeMatches(accessCode)) {
    throw new AppError('invalid', 400, M.accessCodeWrong, 'accessCode')
  }
  if (await User.exists({ email })) throw emailTaken()

  const passwordHash = await hashPassword(password)
  let user
  try {
    user = await User.create({ name, email, passwordHash, role, department, onboarded: false })
  } catch (err) {
    if (err?.code === 11000) throw emailTaken()
    throw err
  }
  return { token: issueToken(user), user: toStaffProfile(user) }
}

// POST /auth/staff/verify-code. Department accounts only.
export async function verifyDepartmentCode(email, code) {
  const user = await loadStaff(email)
  if (user.role !== ROLES.DEPARTMENT) throw new AppError('forbidden', 403, M.departmentOnly)
  if (!roster.departmentCodeMatches(user.department, code)) {
    throw new AppError('invalid', 400, M.departmentCodeWrong(user.department), 'code')
  }
  await User.updateOne({ _id: user._id }, { $set: { departmentVerified: true } })
  return profileOf(email)
}

// POST /auth/staff/verify-employee. The ID must be on this person's list
// (their department's, or the admin list) and not linked to another account.
// Once verified it cannot be changed.
export async function verifyEmployeeId(email, typed) {
  const user = await loadStaff(email)
  const employeeId = roster.normalizeEmployeeId(typed)

  if (user.employeeId && user.employeeId !== employeeId) {
    throw new AppError('conflict', 409, M.employeeIdLocked, 'employeeId')
  }
  if (!roster.isOnRoster(user, employeeId)) {
    const message =
      user.role === ROLES.ADMIN ? M.employeeIdNotOnAdminList : M.employeeIdNotOnList(user.department)
    throw new AppError('invalid', 400, message, 'employeeId')
  }
  if (user.employeeId === employeeId) return toStaffProfile(user) // already done

  if (await User.exists({ employeeId, email: { $ne: email } })) throw idTaken()
  try {
    await User.updateOne({ _id: user._id }, { $set: { employeeId } })
  } catch (err) {
    // Two accounts claiming the same ID at once: the unique index lets one through.
    if (err?.code === 11000) throw idTaken()
    throw err
  }
  return profileOf(email)
}

// PATCH /auth/staff/details: name and job title. (The Employee ID is not here on
// purpose: it can only be set by the roster check above.)
export async function saveDetails(email, { name, jobTitle }) {
  const user = await loadStaff(email)
  const set = {}
  if (name !== undefined) set.name = name
  if (jobTitle !== undefined) set.jobTitle = jobTitle
  await User.updateOne({ _id: user._id }, { $set: set })
  return profileOf(email)
}

// POST /auth/staff/photo: a small image as a data URL; '' removes it.
export async function savePhoto(email, photo) {
  const user = await loadStaff(email)
  await User.updateOne({ _id: user._id }, { $set: { photo } })
  return profileOf(email)
}

// POST /auth/staff/phone-code. Riktika's shared phone-code service does the work.
export async function requestPhoneCode(email, phone) {
  const user = await loadStaff(email)
  const sent = await sendCode({ userId: user._id, phone })
  return { phone, resendAfter: sent.resendAfter ?? PHONE_CODE_LIMITS.resendSeconds }
}

// POST /auth/staff/phone-verify. The number is saved on the account only now.
export async function verifyPhone(email, { phone, code }) {
  const user = await loadStaff(email)
  await verifyCode({ userId: user._id, phone, code })
  await User.updateOne({ _id: user._id }, { $set: { phone, phoneVerified: true } })
  return profileOf(email)
}

// POST /auth/staff/email-code. The code goes to the address the account signed
// up with (it is never taken from the request), so only someone who can read
// that mailbox can pass the check.
export async function requestEmailCode(email) {
  const user = await loadStaff(email)
  if (user.emailVerified === true) throw new AppError('conflict', 409, MSG.emailAlreadyVerified)
  const sent = await emailCodes.sendCode({ userId: user._id, email: user.email, purpose: 'verify' })
  return { email: user.email, resendAfter: sent.resendAfter }
}

// POST /auth/staff/email-verify. A right code (used up on the way) marks the
// address verified. Asking again for an address that is already verified just
// returns the profile.
export async function verifyEmail(email, code) {
  const user = await loadStaff(email)
  if (user.emailVerified === true) return toStaffProfile(user)
  await emailCodes.verifyCode({ userId: user._id, email: user.email, purpose: 'verify', code })
  await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } })
  return profileOf(email)
}

// POST /auth/staff/finish. Checks everything again from the database, sets
// onboarded, and returns a fresh token, because the flag is baked into the
// token (D13). Calling it again for a finished account just returns a new token.
export async function finish(email) {
  const user = await loadStaff(email)
  const profile = toStaffProfile(user)
  if (profile.setupMissing.length > 0) {
    throw new AppError('conflict', 409, M.setupIncomplete)
  }
  if (user.onboarded !== true) {
    await User.updateOne({ _id: user._id }, { $set: { onboarded: true } })
  }
  const done = await loadStaff(email)
  return { token: issueToken(done), user: toStaffProfile(done) }
}
