import { z } from 'zod'
import { AUTH_LIMITS, DOORS, NAME_PATTERN } from '../constants/auth.js'
import { AUTH_MESSAGES as M } from '../constants/messages/auth.js'

const email = z
  .string({ error: M.emailInvalid })
  .trim()
  .toLowerCase()
  .max(AUTH_LIMITS.emailMax, { error: M.emailInvalid })
  .regex(/^\S+@\S+\.\S+$/, { error: M.emailInvalid })

// Passwords are never trimmed.
const newPassword = z
  .string({ error: M.passwordShort })
  .min(AUTH_LIMITS.passwordMin, { error: M.passwordShort })
  .max(AUTH_LIMITS.passwordMax, { error: M.passwordLong })

// Only citizens sign up here. A role in the body must say "citizen": anything
// else (admin, department) is refused, never quietly turned into a citizen.
export const signupBody = z.object({
  name: z
    .string({ error: M.nameInvalid })
    .trim()
    .min(AUTH_LIMITS.nameMin, { error: M.nameInvalid })
    .max(AUTH_LIMITS.nameMax, { error: M.nameInvalid })
    .regex(NAME_PATTERN, { error: M.nameInvalid }),
  email,
  password: newPassword,
  role: z.literal('citizen', { error: M.staffSignupClosed }).optional(),
})

// Login does not judge the email or password beyond "something was typed":
// a wrong one is a 401 from the service, the same for both.
export const loginBody = z.object({
  email: z.string({ error: M.emailRequired }).trim().toLowerCase().min(1, { error: M.emailRequired }),
  password: z
    .string({ error: M.passwordRequired })
    .min(1, { error: M.passwordRequired })
    .max(AUTH_LIMITS.passwordMax, { error: M.badLogin }),
  door: z.enum(DOORS, { error: M.doorInvalid }),
})

// The form shows each message under its own box, so the field names here are
// "current" and "new" (not the body keys), as the backend plan says.
export const passwordBody = z
  .object({ currentPassword: z.unknown().optional(), newPassword: z.unknown().optional() })
  .superRefine((body, ctx) => {
    const { currentPassword: current, newPassword: next } = body
    if (typeof current !== 'string' || current === '') {
      ctx.addIssue({ code: 'custom', path: ['current'], message: M.currentRequired })
    }
    if (typeof next !== 'string' || next === '') {
      ctx.addIssue({ code: 'custom', path: ['new'], message: M.newRequired })
    } else if (next.length < AUTH_LIMITS.passwordMin) {
      ctx.addIssue({ code: 'custom', path: ['new'], message: M.passwordShort })
    } else if (next.length > AUTH_LIMITS.passwordMax) {
      ctx.addIssue({ code: 'custom', path: ['new'], message: M.passwordLong })
    }
  })
  .transform(({ currentPassword, newPassword: next }) => ({ currentPassword, newPassword: next }))
