// The email check, for staff and citizens: a code is emailed to the signed-in
// account's own address (the server never takes the address from the page) and
// the right code marks it verified. Each role has its own path:
//   staff    POST /auth/staff/email-code and /email-verify
//   citizen  POST /citizen/profile/email-code and /email-verify
import { post } from './http.js'

export const STAFF_EMAIL_PATH = '/auth/staff'
export const CITIZEN_EMAIL_PATH = '/citizen/profile'

// Asks for a code to be emailed. -> { status: 'sent', email, resendIn }, or
// { status: 'verified' } when the address was already verified (the page was
// showing an old copy of the profile). Anything else is thrown with the
// server's sentence: too soon (429), email codes off (500), the mail server
// down (503), no connection.
export async function sendEmailCode(base) {
  try {
    const sent = await post(`${base}/email-code`)
    return { status: 'sent', email: sent.email, resendIn: sent.resendAfter }
  } catch (error) {
    if (error?.status === 409) return { status: 'verified' }
    throw error
  }
}

// -> { status: 'verified', profile } | { status: 'wrong', message }
//    | { status: 'locked', message }. `message` is the server's whole sentence.
// Anything else, such as no connection, is thrown.
export async function verifyEmailCode(base, code) {
  try {
    return { status: 'verified', profile: await post(`${base}/email-verify`, { code }) }
  } catch (error) {
    if (error?.code === 'locked') return { status: 'locked', message: error.message }
    if (error?.status === 400 && error?.field === 'code') {
      return { status: 'wrong', message: error.message }
    }
    throw error
  }
}
