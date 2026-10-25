// The ONLY file that reads the staff secrets (D21): the staff access code, the
// department codes and the Employee ID roster. They come from the server
// environment (config/env.js), never from the frontend, and are never logged,
// never put in an error message and never sent in a response.
import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { ROLES } from '../../constants/roles.js'

const clean = (value) => String(value ?? '').trim().toUpperCase()

// Hashing both sides first gives two buffers of the same length, so the
// comparison takes the same time whatever was typed.
const digest = (value) => crypto.createHash('sha256').update(value).digest()
const same = (typed, secret) => crypto.timingSafeEqual(digest(clean(typed)), digest(clean(secret)))

// A secret that is not set in the environment matches nothing, so a missing
// variable closes the door instead of opening it.
const matches = (typed, secret) => Boolean(clean(secret)) && same(typed, secret)

export const accessCodeMatches = (typed) => matches(typed, env.staffAccessCode)

export const departmentCodeMatches = (department, typed) =>
  matches(typed, env.departmentCodes?.[department])

export const normalizeEmployeeId = clean

// Department staff are checked against their own department's list, admins
// against the "admin" list.
export function isOnRoster({ role, department }, employeeId) {
  const list = env.employeeRoster?.[role === ROLES.ADMIN ? 'admin' : department]
  return Array.isArray(list) && list.map(clean).includes(clean(employeeId))
}
