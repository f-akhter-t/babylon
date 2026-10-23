// Checks for PATCH /api/citizen/profile. Same rules as frontend/src/utils/profileRules.js.
import { z } from 'zod'
import { AUTH_LIMITS, NAME_PATTERN } from '../constants/auth.js'
import { AUTH_MESSAGES as A } from '../constants/messages/auth.js'
import { PROFILE_MESSAGES as P } from '../constants/messages/profile.js'
import { DIVISIONS } from '../constants/divisions.js'

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
