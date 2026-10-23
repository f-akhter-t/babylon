// What each admin endpoint accepts, checked by validate(). The same limits are
// checked again in the services.
import { z } from 'zod'
import { ACCOUNTABILITY_PERIODS, DEFAULT_PERIOD_WEEKS } from '../constants/departments.js'
import { ADMIN_LIMITS } from '../constants/limits.js'
import { MSG } from '../constants/messages/index.js'

export const rejectFixBody = z.object({
  reason: z
    .string({ error: MSG.rejectReasonNeeded })
    .trim()
    .min(1, MSG.rejectReasonNeeded)
    .max(ADMIN_LIMITS.fixRejectReasonMax, MSG.rejectReasonTooLong),
})

const { min, max } = ADMIN_LIMITS.identityRejectReason

export const reviewIdentityBody = z
  .object({
    decision: z.enum(['approve', 'reject'], { error: MSG.chooseDecision }),
    reason: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision !== 'reject') return
    const reason = value.reason ?? ''
    const problem = !reason
      ? MSG.identityReasonNeeded
      : reason.length < min
        ? MSG.identityReasonShort
        : reason.length > max
          ? MSG.identityReasonLong
          : null
    if (problem) ctx.addIssue({ code: 'custom', message: problem, path: ['reason'] })
  })

export const accountabilityQuery = z.object({
  weeks: z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === '' ? DEFAULT_PERIOD_WEEKS : Number(value)))
    .refine((weeks) => ACCOUNTABILITY_PERIODS.some((p) => p.weeks === weeks), MSG.periodUnavailable),
})
