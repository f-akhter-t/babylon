// What the staff profile page (department and admin) reads and does on the
// backend: /auth/me and /auth/staff/*. api.js calls these for a staff account,
// so the pages do not change. They live in their own file so the tests can load
// them without the rest of api.js.
//
// Every profile comes back in the same shape:
//   { id, name, email, role, department, onboarded, jobTitle, phone, phoneVerified,
//     employeeId, employeeIdVerified, departmentVerified, emailVerified, photo,
//     setupMissing }
// phone and employeeId are only ever filled by their checks, so a value means
// "verified". setupMissing is the list of what the setup still needs.
import { get, patch, post } from './http.js'
import * as emailCheck from './emailCheckApi.js'

// The signed-in staff member's saved details (what the page shows after a reload).
export function getStaffProfile() {
  return get('/auth/me')
}

// details: { name?, jobTitle? }. The Employee ID is not part of it on purpose:
// only the roster check (verifyEmployeeId) can set it.
export function saveStaffDetails({ name, jobTitle }) {
  return patch('/auth/staff/details', { name, jobTitle })
}

// Department accounts only. A wrong code comes back as an error with field 'code'.
export function verifyDepartmentCode(code) {
  return post('/auth/staff/verify-code', { code })
}

export function verifyEmployeeId(employeeId) {
  return post('/auth/staff/verify-employee', { employeeId })
}

// photo: a small image data URL, or '' to remove it.
export function saveStaffPhoto(photo) {
  return post('/auth/staff/photo', { photo })
}

// -> { phone, resendIn }. The phone is the normalised number the code went to.
export async function sendPhoneCode(phone) {
  const sent = await post('/auth/staff/phone-code', { phone })
  return { phone: sent.phone, resendIn: sent.resendAfter }
}

// -> { status: 'verified', profile } | { status: 'wrong', attemptsLeft }
//    | { status: 'locked' } | { status: 'expired' }
// (the same four answers the phone card already understands). Anything else,
// such as no connection, is thrown.
export async function verifyPhoneCode(phone, code) {
  try {
    return { status: 'verified', profile: await post('/auth/staff/phone-verify', { phone, code }) }
  } catch (error) {
    if (error?.code === 'locked') return { status: 'locked' }
    if (error?.field === 'code') {
      if (/expired/i.test(error.message)) return { status: 'expired' }
      const left = /(\d+)\s+tr(?:y|ies)\s+left/i.exec(error.message)
      if (left) return { status: 'wrong', attemptsLeft: Number(left[1]) }
    }
    throw error
  }
}

// The email check is shared with citizens (emailCheckApi.js); these are the
// staff paths. -> { status: 'sent', email, resendIn } | { status: 'verified' },
// and { status: 'verified', profile } | { status: 'wrong', message } |
// { status: 'locked', message }.
export const sendEmailCode = () => emailCheck.sendEmailCode(emailCheck.STAFF_EMAIL_PATH)
export const verifyEmailCode = (code) => emailCheck.verifyEmailCode(emailCheck.STAFF_EMAIL_PATH, code)

// Ends the setup. -> { token, user }: a NEW token that says onboarded: true,
// which the caller must save (the old one still says false).
export function finishSetup() {
  return post('/auth/staff/finish')
}
