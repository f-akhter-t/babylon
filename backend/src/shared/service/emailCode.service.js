import crypto from 'node:crypto'
import EmailCode from '../../models/emailCode.model.js'
import AppError from '../../utils/AppError.js'
import { env } from '../../config/env.js'
import { EMAIL_CODE_LIMITS as LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { sendMail } from './mailer.service.js'

const MINUTE = 60 * 1000

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key])

const hashCode = (userId, purpose, email, code) =>
  crypto.createHmac('sha256', env.jwtSecret).update(`${userId}:${purpose}:${email}:${code}`).digest('hex')

const sameHash = (a, b) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const wrong = () => new AppError('invalid', 400, MSG.emailCodeWrong, 'code')
const locked = () => new AppError('locked', 423, MSG.emailCodeLocked)

// What each email says. A new purpose needs its own entry here.
function mailFor(purpose, code) {
  if (purpose === 'reset') {
    return { subject: MSG.resetMailSubject, text: MSG.resetMailText(code, LIMITS.lifeMinutes) }
  }
  throw new Error(`No email text for the purpose "${purpose}".`)
}

// In 'dev' the code is fixed and nothing is sent. In 'smtp' it is random and goes
// by email. It is never logged and never sent back in an answer.
function issueCode() {
  if (env.emailMode === 'dev') return LIMITS.devCode
  return String(crypto.randomInt(0, 10 ** LIMITS.codeLength)).padStart(LIMITS.codeLength, '0')
}

// Callers use this first, before they look at any account, so a server that has
// email codes switched off answers the same way for every email address.
export function assertAvailable() {
  if (env.emailMode === 'off') throw new AppError('server-error', 500, MSG.emailCodeOff)
}

// Makes a code, stores its hash and (in 'smtp') emails it.
//   429 too-many-requests  a code was sent less than resendSeconds ago
//   503 email-unavailable  the mail server did not take the email; the stored code is removed
// `now` is a parameter only so tests can move the clock.
export async function sendCode({ userId, email, purpose }, now = Date.now()) {
  assertAvailable()

  const existing = await EmailCode.findOne({ userId, purpose })
  if (existing) {
    const waited = (now - existing.lastSentAt.getTime()) / 1000
    if (waited < LIMITS.resendSeconds) {
      const seconds = Math.ceil(LIMITS.resendSeconds - waited)
      throw new AppError('too-many-requests', 429, fill(MSG.emailCodeWait, { seconds }), 'email')
    }
  }

  const code = issueCode()
  await EmailCode.findOneAndUpdate(
    { userId, purpose },
    {
      email,
      codeHash: hashCode(userId, purpose, email, code),
      attempts: 0,
      lastSentAt: new Date(now),
      expiresAt: new Date(now + LIMITS.lifeMinutes * MINUTE),
    },
    { upsert: true },
  )

  if (env.emailMode === 'smtp') {
    try {
      await sendMail({ to: email, ...mailFor(purpose, code) })
    } catch (err) {
      // Only the error codes are logged: not the address, not the code.
      console.error('Email could not be sent:', err?.code ?? 'unknown', err?.responseCode ?? '')
      await EmailCode.deleteOne({ userId, purpose })
      throw new AppError('email-unavailable', 503, MSG.emailCodeFailed)
    }
  }
  return { sent: true, resendAfter: LIMITS.resendSeconds }
}

//   400 invalid (field code)  wrong, expired or never asked for: one sentence for all three
//   423 locked                too many wrong tries; asking for a new code clears it
// A right code is used up.
export async function verifyCode({ userId, email, purpose, code }, now = Date.now()) {
  const record = await EmailCode.findOne({ userId, purpose })
  if (!record || record.expiresAt.getTime() <= now) throw wrong()
  if (record.attempts >= LIMITS.maxAttempts) throw locked()

  if (sameHash(record.codeHash, hashCode(userId, purpose, email, String(code)))) {
    await EmailCode.deleteOne({ _id: record._id })
    return { verified: true }
  }

  // Atomic increment, so parallel guesses cannot dodge the limit.
  const updated = await EmailCode.findOneAndUpdate(
    { _id: record._id },
    { $inc: { attempts: 1 } },
    { new: true },
  )
  if ((updated?.attempts ?? LIMITS.maxAttempts) >= LIMITS.maxAttempts) throw locked()
  throw wrong()
}
