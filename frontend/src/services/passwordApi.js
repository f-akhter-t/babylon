// Forgot password. Two calls, both made signed out, so no token is sent:
//   askForResetCode(email)   POST /auth/forgot-password  -> { resendAfter }
//   resetPassword({ ... })   POST /auth/reset-password
// The server answers "code sent" the same way for every email address, so
// nothing here (or on the page) can tell whether an account exists.
//
// A failure is the plain Error from http.js: `message` is a whole sentence the
// page can show. Wrong or expired code: 400 (field 'code'); too many wrong
// codes: 423; a bad new password: 400 (field 'new'); too many requests: 429;
// email codes switched off or the mail server down: 500 or 503.
import { post } from './http.js'

export const RESET_CODE_LENGTH = 6
export const RESET_CODE_MINUTES = 10 // how long a code works (EMAIL_CODE_LIMITS.lifeMinutes on the server)
export const RESEND_SECONDS = 30 // used only if the server leaves resendAfter out

export const RESET_MESSAGES = Object.freeze({
  codeSent: `If an account with that email exists, we have sent it a code. It works for ${RESET_CODE_MINUTES} minutes.`,
  codeResent: 'If that account exists, a new code is on its way. Use the newest one.',
  codeInvalid: `Enter the ${RESET_CODE_LENGTH}-digit code from the email.`,
  done: 'Your password is changed. Please log in with it.',
})

// People type or paste "123 456", so spaces are dropped before checking or sending.
export function normalizeResetCode(code) {
  return String(code ?? '').replace(/\s+/g, '')
}

// Returns a whole-sentence error, or null when the code looks right.
export function validateResetCode(code) {
  return new RegExp(`^\\d{${RESET_CODE_LENGTH}}$`).test(normalizeResetCode(code))
    ? null
    : RESET_MESSAGES.codeInvalid
}

// Asks for a code to be emailed. Resolves with how many seconds the person must
// wait before asking again.
export async function askForResetCode(email) {
  const data = await post('/auth/forgot-password', { email: email.trim() }, { auth: false })
  const wait = Number(data?.resendAfter)
  return { resendAfter: Number.isFinite(wait) && wait > 0 ? Math.ceil(wait) : RESEND_SECONDS }
}

// Sets a new password with the emailed code. It does not sign anyone in: the
// person logs in with the new password afterwards.
export async function resetPassword({ email, code, newPassword }) {
  await post(
    '/auth/reset-password',
    { email: email.trim(), code: normalizeResetCode(code), newPassword },
    { auth: false },
  )
}
