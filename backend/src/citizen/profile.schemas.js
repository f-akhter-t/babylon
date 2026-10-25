// Checks for PATCH /api/citizen/profile. Same rules as frontend/src/utils/profileRules.js.
import { z } from 'zod'
import { AUTH_LIMITS, NAME_PATTERN } from '../constants/auth.js'
import { AUTH_MESSAGES as A } from '../constants/messages/auth.js'
import { PROFILE_MESSAGES as P } from '../constants/messages/profile.js'
import { DIVISIONS } from '../constants/divisions.js'
import { IDENTITY_LIMITS } from '../constants/limits.js'

export const PROFILE_LIMITS = Object.freeze({ addressMax: 120 })

// Every field is optional (this is a PATCH). Unknown keys, such as phone or
// email, are dropped. Phone is saved only by the code check, never here.
export const updateBody = z
  .object({
    name: z
      .string({ error: A.nameInvalid })
      .trim()
      .min(AUTH_LIMITS.nameMin, { error: A.nameInvalid })
      .max(AUTH_LIMITS.nameMax, { error: A.nameInvalid })
      .regex(NAME_PATTERN, { error: A.nameInvalid })
      .optional(),
    address: z
      .string({ error: P.addressLong })
      .trim()
      .max(PROFILE_LIMITS.addressMax, { error: P.addressLong })
      .optional(),
    division: z.enum(DIVISIONS, { error: P.divisionInvalid }).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { error: P.profileNothing })

  // Same rule as frontend normalizePhone: strip spaces and hyphens, +880... becomes 0...
export function normalizePhone(raw) {
  let p = String(raw ?? '').replace(/[\s-]/g, '')
  if (p.startsWith('+880')) p = '0' + p.slice(4)
  return p
}

const PHONE_PATTERN = /^01[3-9]\d{8}$/

const phoneField = z
  .string({ error: P.phoneInvalid })
  .transform(normalizePhone)
  .pipe(z.string().regex(PHONE_PATTERN, { error: P.phoneInvalid }))

const codeField = z
  .string({ error: P.codeFormat })
  .trim()
  .regex(/^\d{6}$/, { error: P.codeFormat })

export const phoneCodeBody = z.object({ phone: phoneField })
export const phoneVerifyBody = z.object({ phone: phoneField, code: codeField })

// Endpoint 21. The body has the photo as a data URL and the last 4 digits only.
// The full NID number must never be sent to the server.
const DATA_URL = new RegExp(
  `^data:(${IDENTITY_LIMITS.photoTypes.map((t) => t.replace('/', '\\/')).join('|')});base64,[A-Za-z0-9+/]+={0,2}$`,
)
// Longest allowed text: base64 is 4/3 of the bytes, plus the "data:...;base64," start.
const PHOTO_MAX_CHARS = Math.ceil((IDENTITY_LIMITS.photoMaxBytes * 4) / 3) + 64

const photoField = z
  .string({ error: P.identityPhotoInvalid })
  .max(PHOTO_MAX_CHARS, { error: P.identityPhotoTooLarge }) // cheap check before any decoding
  .regex(DATA_URL, { error: P.identityPhotoInvalid })
  .transform((value) => ({
    contentType: value.slice(5, value.indexOf(';')),
    data: Buffer.from(value.slice(value.indexOf(',') + 1), 'base64'),
  }))
  .refine((photo) => photo.data.length > 0 && photo.data.length <= IDENTITY_LIMITS.photoMaxBytes, {
    error: P.identityPhotoTooLarge,
  })

export const identityBody = z.object({
  nidLast4: z.string({ error: P.nidLast4Invalid }).trim().regex(/^\d{4}$/, { error: P.nidLast4Invalid }),
  photo: photoField,
})