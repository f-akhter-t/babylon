import crypto from 'node:crypto'
import PhoneCode from '../../models/phoneCode.model.js'
import AppError from '../../utils/AppError.js'
import { env } from '../../config/env.js'
import { PHONE_CODE_LIMITS as LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'

const MINUTE = 60 * 1000

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key])

const hashCode = (userId, phone, code) =>
  crypto.createHmac('sha256', env.jwtSecret).update(`${userId}:${phone}:${code}`).digest('hex')

const sameHash = (a, b) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const locked = () => new AppError('locked', 423, MSG.phoneCodeLocked)
const expired = () => new AppError('invalid', 400, MSG.phoneCodeExpired, 'code')

// The ONE place a code is made and delivered. A real SMS provider replaces
// only this function (use crypto.randomInt for the code, then send it).
function issueCode() {
  return LIMITS.devCode
}

// `now` is a parameter only so tests can move the clock.
export async function sendCode({ userId, phone }, now = Date.now()) {
  if (env.phoneCodeMode !== 'dev') throw new AppError('server-error', 500, MSG.phoneCodeOff)

  const existing = await PhoneCode.findOne({ userId, phone })
  if (existing) {
    const waited = (now - existing.lastSentAt.getTime()) / 1000
    if (waited < LIMITS.resendSeconds) {
      const seconds = Math.ceil(LIMITS.resendSeconds - waited)
      throw new AppError('too-many-requests', 429, fill(MSG.phoneCodeWait, { seconds }), 'phone')
    }
  }

  await PhoneCode.findOneAndUpdate(
    { userId, phone },
    {
      codeHash: hashCode(userId, phone, issueCode()),
      attempts: 0,
      lastSentAt: new Date(now),
      expiresAt: new Date(now + LIMITS.lifeMinutes * MINUTE),
    },
    { upsert: true },
  )
  return { sent: true, resendAfter: LIMITS.resendSeconds }
}

export async function verifyCode({ userId, phone, code }, now = Date.now()) {
  const record = await PhoneCode.findOne({ userId, phone })
  if (!record || record.expiresAt.getTime() <= now) throw expired()
  if (record.attempts >= LIMITS.maxAttempts) throw locked()

  if (sameHash(record.codeHash, hashCode(userId, phone, String(code)))) {
    await PhoneCode.deleteOne({ _id: record._id })
    return { verified: true }
  }

  // Atomic increment, so parallel guesses cannot dodge the limit.
  const updated = await PhoneCode.findOneAndUpdate(
    { _id: record._id },
    { $inc: { attempts: 1 } },
    { new: true },
  )
  const attempts = updated?.attempts ?? LIMITS.maxAttempts
  if (attempts >= LIMITS.maxAttempts) throw locked()
  const left = LIMITS.maxAttempts - attempts
  const key = left === 1 ? 'phoneCodeWrongOne' : 'phoneCodeWrong'
  throw new AppError('invalid', 400, fill(MSG[key], { left }), 'code')
}