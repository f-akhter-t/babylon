import 'dotenv/config'
import { pickEmailMode } from './emailMode.js'

const required = ['MONGODB_URI', 'JWT_SECRET']
const missing = required.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(`Missing in backend/.env: ${missing.join(', ')}`)
  process.exit(1)
}
if (process.env.JWT_SECRET.length < 16) {
  console.error('JWT_SECRET is too short. Use at least 16 characters.')
  process.exit(1)
}

// STAFF secrets (D21). They live only in the server environment. A value that
// is missing or not valid JSON leaves staff checks closed (nobody passes); the
// message names the variable, never its value.
function readJson(name) {
  const raw = process.env[name]
  if (!raw) return {}
  try {
    const value = JSON.parse(raw)
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
  } catch {
    // falls through to the message below
  }
  console.error(`${name} in backend/.env is not a JSON object. Staff checks that use it will refuse everyone.`)
  return {}
}

// A Gmail app password is shown in groups of four with spaces; the spaces are not part of it.
const emailUser = (process.env.EMAIL_USER ?? '').trim()
const emailAppPassword = (process.env.EMAIL_APP_PASSWORD ?? '').replace(/\s+/g, '')
const email = pickEmailMode({
  mode: process.env.EMAIL_MODE,
  user: emailUser,
  password: emailAppPassword,
  isProduction: process.env.NODE_ENV === 'production',
})
if (email.problem) console.error(email.problem)

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',

  // The rate limits count visitors by address. Live, the app sits behind Vercel's
  // proxy, so the real visitor address is the one the proxy writes in X-Forwarded-For
  // (Vercel overwrites a value sent by the visitor), and Express only reads it when
  // told to trust that one proxy. Off elsewhere: with no proxy in front, a visitor could
  // fake the header to dodge a limit.
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : false,

  // Only the exact word 'dev' turns phone codes on. Missing or anything else: off.
  phoneCodeMode: process.env.PHONE_CODE_MODE === 'dev' ? 'dev' : 'off',

  // Email codes (forgot password). 'dev' | 'smtp' | 'off', see config/emailMode.js.
  // The credentials are read only by shared/service/mailer.service.js.
  emailMode: email.mode,
  emailUser,
  emailAppPassword,

  // CLIP photo severity (F1). On for everyone by default, whatever the .env says
  // (or does not say). Only the exact word 'false' turns it off, which the tests
  // use so they never load the model.
  clipEnabled: process.env.CLIP_ENABLED !== 'false',

  // Staff accounts (D21). Read only by auth/service/staffRoster.service.js.
  //   STAFF_ACCESS_CODE  the one code a new staff member needs to sign up.
  //   DEPARTMENT_CODES   { "Roads & Highways": "<code>", ... }
  //   EMPLOYEE_ROSTER    { "Roads & Highways": ["<id>", ...], "admin": ["<id>", ...] }
  staffAccessCode: (process.env.STAFF_ACCESS_CODE ?? '').trim(),
  departmentCodes: readJson('DEPARTMENT_CODES'),
  employeeRoster: readJson('EMPLOYEE_ROSTER'),

}