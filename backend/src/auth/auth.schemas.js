import { z } from 'zod'
import { AUTH_LIMITS, DOORS, NAME_PATTERN } from '../constants/auth.js'
import { DEPARTMENTS } from '../constants/departments.js'
import { STAFF_LIMITS } from '../constants/limits.js'
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

const personName = z
  .string({ error: M.nameInvalid })
  .trim()
  .min(AUTH_LIMITS.nameMin, { error: M.nameInvalid })
  .max(AUTH_LIMITS.nameMax, { error: M.nameInvalid })
  .regex(NAME_PATTERN, { error: M.nameInvalid })

// Only citizens sign up here. A role in the body must say "citizen": anything
// else (admin, department) is refused, never quietly turned into a citizen.
export const signupBody = z.object({
  name: personName,
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


// POST /auth/forgot-password. Only the shape of the email is checked; the answer
// is the same whether or not an account exists.
export const forgotPasswordBody = z.object({ email })

// POST /auth/reset-password. The new password follows the same rules as sign-up
// and change password, and its message goes under the "new" box like the
// change-password form.
export const resetPasswordBody = z
  .object({
    email,
    code: z.string({ error: M.codeRequired }).trim().min(1, { error: M.codeRequired }).max(12, { error: M.codeRequired }),
    newPassword: z.unknown().optional(),
  })
  .superRefine((body, ctx) => {
    const next = body.newPassword
    if (typeof next !== 'string' || next === '') {
      ctx.addIssue({ code: 'custom', path: ['new'], message: M.newRequired })
    } else if (next.length < AUTH_LIMITS.passwordMin) {
      ctx.addIssue({ code: 'custom', path: ['new'], message: M.passwordShort })
    } else if (next.length > AUTH_LIMITS.passwordMax) {
      ctx.addIssue({ code: 'custom', path: ['new'], message: M.passwordLong })
    }
  })
  .transform(({ email: address, code, newPassword: next }) => ({ email: address, code, newPassword: next }))


// ---------- Staff accounts (/api/auth/staff/*) ----------
// A secret the person types (access code, department code, Employee ID). Only
// "something was typed" is checked here; the service compares it with the
// server's copy.
const secret = (required) =>
  z
    .string({ error: required })
    .trim()
    .min(1, { error: required })
    .max(STAFF_LIMITS.codeMax, { error: required })

// POST /auth/staff/signup. Department staff name their department; an admin
// has none, so anything sent for it is dropped.
export const staffSignupBody = z
  .object({
    name: personName,
    email,
    password: newPassword,
    role: z.enum(['department', 'admin'], { error: M.staffRoleInvalid }),
    department: z.string().optional(),
    accessCode: secret(M.accessCodeRequired),
  })
  .superRefine((body, ctx) => {
    if (body.role === 'department' && !DEPARTMENTS.includes(body.department)) {
      ctx.addIssue({ code: 'custom', path: ['department'], message: M.staffDepartmentInvalid })
    }
  })
  .transform((body) => ({ ...body, department: body.role === 'department' ? body.department : null }))

// POST /auth/staff/verify-code
export const departmentCodeBody = z.object({ code: secret(M.departmentCodeRequired) })

// POST /auth/staff/verify-employee
export const employeeIdBody = z.object({ employeeId: secret(M.employeeIdRequired) })

// PATCH /auth/staff/details. Both fields are optional (a PATCH) but one is needed.
// An Employee ID is NOT accepted here: it can only come from the roster check.
export const staffDetailsBody = z
  .object({
    name: personName.optional(),
    jobTitle: z
      .string({ error: M.jobTitleInvalid(STAFF_LIMITS.jobTitle.min, STAFF_LIMITS.jobTitle.max) })
      .trim()
      .min(STAFF_LIMITS.jobTitle.min, { error: M.jobTitleInvalid(STAFF_LIMITS.jobTitle.min, STAFF_LIMITS.jobTitle.max) })
      .max(STAFF_LIMITS.jobTitle.max, { error: M.jobTitleInvalid(STAFF_LIMITS.jobTitle.min, STAFF_LIMITS.jobTitle.max) })
      .optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { error: M.detailsNothing })

// POST /auth/staff/photo. A small image as a data URL, or '' to remove the photo.
export const staffPhotoBody = z.object({
  photo: z
    .string({ error: M.photoInvalid })
    .max(STAFF_LIMITS.photoMaxChars, { error: M.photoTooBig })
    .refine((value) => value === '' || /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value), {
      error: M.photoInvalid,
    }),
})

// Bangladesh mobile numbers: 11 digits, 013 to 019. +880 is accepted and turned
// into the leading 0, like the frontend does.
const phone = z
  .string({ error: M.phoneRequired })
  .transform((value) => {
    const digits = value.replace(/[\s-]/g, '')
    return digits.startsWith('+880') ? `0${digits.slice(4)}` : digits
  })
  .refine((value) => /^01[3-9]\d{8}$/.test(value), { error: M.phoneInvalid })

// POST /auth/staff/phone-code
export const phoneCodeBody = z.object({ phone })

// POST /auth/staff/phone-verify
export const phoneVerifyBody = z.object({
  phone,
  code: z.string({ error: M.codeRequired }).trim().min(1, { error: M.codeRequired }).max(12, { error: M.codeRequired }),
})
