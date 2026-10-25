// What the app is told about a signed-in account, and the token for it.
// Shared by auth.service.js (citizen sign-up, log-in, me) and staff.service.js.
import { signToken } from '../../utils/token.js'
import { ROLES } from '../../constants/roles.js'
import { AUTH_LIMITS, NAME_PATTERN } from '../../constants/auth.js'
import { STAFF_LIMITS } from '../../constants/limits.js'

// Picked by name, so passwordHash (or any field added to the model later) can
// never leak.
export function toSessionUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department ?? null,
    onboarded: user.onboarded !== false,
  }
}

export function issueToken(user) {
  const session = toSessionUser(user)
  return signToken({
    email: session.email,
    role: session.role,
    department: session.department,
    onboarded: session.onboarded, // a staff member still setting up gets false
  })
}

const nameOk = (name) =>
  typeof name === 'string' &&
  name.trim().length >= AUTH_LIMITS.nameMin &&
  name.trim().length <= AUTH_LIMITS.nameMax &&
  NAME_PATTERN.test(name.trim())

// What a staff profile still needs before the setup can finish, as short phrases.
// The same sentences the Setup checklist on the frontend looks for.
export function setupMissing(profile) {
  const missing = []
  if (!nameOk(profile.name)) missing.push('a valid name')
  const title = (profile.jobTitle ?? '').trim()
  if (title.length < STAFF_LIMITS.jobTitle.min || title.length > STAFF_LIMITS.jobTitle.max) {
    missing.push('a job title')
  }
  if (!profile.phoneVerified) missing.push('a verified phone number')
  if (!profile.employeeIdVerified) missing.push('a verified Employee ID')
  if (profile.role === ROLES.DEPARTMENT && !profile.departmentVerified) {
    missing.push('a verified department code')
  }
  return missing
}

// A department or admin account as the staff pages show it. Picked by name.
// phone is only ever saved by the code check, and employeeId only by the roster
// check, so a non-empty value means "verified".
export function toStaffProfile(user) {
  const profile = {
    ...toSessionUser(user),
    jobTitle: user.jobTitle ?? '',
    phone: user.phone ?? '',
    phoneVerified: user.phoneVerified === true,
    employeeId: user.employeeId ?? '',
    employeeIdVerified: Boolean(user.employeeId),
    departmentVerified: user.departmentVerified === true,
    photo: user.photo ?? '',
  }
  return { ...profile, setupMissing: setupMissing(profile) }
}
