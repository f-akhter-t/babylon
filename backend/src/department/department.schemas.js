import { z } from 'zod'
import { MSG } from '../constants/messages/index.js'

export const DEPARTMENT_LIMITS = Object.freeze({
  noteMax: 500,
  photoMaxChars: 7_000_000, // about 5 MB of image as text
})

export const listQuery = z.object({
  scope: z.enum(['assigned', 'completed'], { error: MSG.deptScopeInvalid }).default('assigned'),
})

export const idParams = z.object({ id: z.string().min(1, MSG.deptIssueGone) })

export const startBody = z.object({
  status: z.literal('in-progress', { error: MSG.deptStatusInvalid }),
})

export const submitBody = z.object({
  note: z.string().trim().max(DEPARTMENT_LIMITS.noteMax, MSG.deptNoteTooLong).default(''),
  photoUrl: z
    .string({ error: MSG.deptPhotoNeeded })
    .min(1, MSG.deptPhotoNeeded)
    .max(DEPARTMENT_LIMITS.photoMaxChars, MSG.deptPhotoTooLarge)
    .refine((v) => v.startsWith('data:image/') || /^https?:\/\//.test(v), MSG.deptPhotoInvalid),
})