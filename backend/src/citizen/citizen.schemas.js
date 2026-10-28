import { z } from 'zod'
import { CATEGORIES, CITIZEN_LIMITS } from '../constants/limits.js'
import { MESSAGES as M } from '../constants/messages/citizen.js'

// Same order as the old check(): photo, category, description, location, title.
const photoUrl = z
  .string({ error: M.PHOTO_REQUIRED })
  .refine((value) => value.startsWith('data:image/'), M.PHOTO_REQUIRED)

const category = z.enum(CATEGORIES, { error: M.CATEGORY_INVALID })

const description = z
  .string({ error: M.DESCRIPTION_INVALID })
  .trim()
  .min(CITIZEN_LIMITS.description.min, M.DESCRIPTION_INVALID)
  .max(CITIZEN_LIMITS.description.max, M.DESCRIPTION_INVALID)

// division comes from the map pin. The rule against the citizen's own
// division needs the database, so it stays in the service.
const location = z.object(
  {
    lat: z.number({ error: M.LOCATION_INVALID }),
    lng: z.number({ error: M.LOCATION_INVALID }),
    label: z.string({ error: M.LOCATION_INVALID }).trim().min(1, M.LOCATION_INVALID),
    ward: z.string().optional(),
    division: z.string().optional(),
  },
  { error: M.LOCATION_INVALID },
)

const title = z
  .string({ error: M.TITLE_INVALID })
  .trim()
  .min(CITIZEN_LIMITS.title.min, M.TITLE_INVALID)
  .max(CITIZEN_LIMITS.title.max, M.TITLE_INVALID)

export const idParams = z.object({ id: z.string().min(1, M.REPORT_NOT_FOUND) })

export const createBody = z.object({
  photoUrl,
  category,
  description,
  location,
  title: title.optional(),
})

// Fields not sent keep their current value.
export const updateBody = z.object({
  photoUrl: photoUrl.optional(),
  category: category.optional(),
  description: description.optional(),
  location: location.optional(),
  title: title.optional(),
})