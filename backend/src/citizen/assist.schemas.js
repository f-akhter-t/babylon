import { z } from 'zod'
import { CATEGORIES, ASSIST_LIMITS, SUMMARIZE_LIMITS } from '../constants/limits.js'
import { MSG } from '../constants/messages/index.js'

// POST /api/citizen/reports/assist. Only the photo (and the category, if the
// citizen has already chosen one) goes to the AI. Nothing about the person does.
export const assistBody = z.object({
  photoUrl: z
    .string({ error: MSG.assistPhotoMissing })
    .min(1, { error: MSG.assistPhotoMissing })
    .max(ASSIST_LIMITS.photoMaxChars, { error: MSG.assistPhotoTooBig })
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, { error: MSG.assistPhotoInvalid }),
  category: z.enum(CATEGORIES, { error: MSG.assistCategoryInvalid }).optional(),
})

// POST /api/citizen/reports/summarize
export const summarizeBody = z.object({
  text: z
    .string({ error: MSG.summarizeTextMissing })
    .trim()
    .min(1, { error: MSG.summarizeTextMissing })
    .min(SUMMARIZE_LIMITS.textMin, { error: MSG.summarizeTextShort(SUMMARIZE_LIMITS.textMin) })
    .max(SUMMARIZE_LIMITS.textMax, { error: MSG.summarizeTextLong(SUMMARIZE_LIMITS.textMax) }),
})
