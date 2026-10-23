// What each public endpoint accepts, checked by validate(). Query values
// arrive as text; an empty value counts as "not sent".
import { z } from 'zod'
import { CATEGORIES, STATUSES } from '../constants/limits.js'
import { HOME_LIMITS } from '../constants/home.js'
import { PUBLIC_MESSAGES as M } from '../constants/messages/public.js'

const blank = (value) => (value === '' ? undefined : value)
const optional = (schema) => z.preprocess(blank, schema.optional())
const toNumber = (value) => (blank(value) === undefined ? undefined : Number(value))

const coordinate = (limit) =>
  z.preprocess(
    toNumber,
    z.number({ error: M.locationInvalid }).min(-limit, M.locationInvalid).max(limit, M.locationInvalid).optional(),
  )

// lat and lng go together: both, or neither.
const needBoth = (query, ctx) => {
  if ((query.lat === undefined) !== (query.lng === undefined)) {
    ctx.addIssue({ code: 'custom', message: M.locationInvalid, path: [query.lat === undefined ? 'lat' : 'lng'] })
  }
}

const position = { lat: coordinate(90), lng: coordinate(180) }

// GET /api/issues
export const issuesQuery = z
  .object({
    category: optional(z.enum(['All', ...CATEGORIES], { error: M.categoryInvalid })),
    status: optional(z.enum(['All', ...STATUSES], { error: M.statusInvalid })),
    search: optional(z.string({ error: M.searchTooLong }).trim().max(100, M.searchTooLong)),
    ...position,
  })
  .superRefine(needBoth)

// GET /api/issues/:id (the position is optional, for distanceM)
export const issueParams = z.object({ id: z.string({ error: M.idMissing }).min(1, M.idMissing) })
export const positionQuery = z.object(position).superRefine(needBoth)

// GET /api/home/activity
export const activityQuery = z.object({
  limit: z.preprocess(
    toNumber,
    z
      .number({ error: M.limitInvalid })
      .int(M.limitInvalid)
      .min(1, M.limitInvalid)
      .max(HOME_LIMITS.activityMax, M.limitInvalid)
      .default(HOME_LIMITS.activityDefault),
  ),
})
