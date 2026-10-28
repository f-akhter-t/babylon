import { z } from 'zod'
import { CATEGORIES, ASSIST_LIMITS } from '../constants/limits.js'
import { MSG } from '../constants/messages/index.js'

// POST /api/citizen/reports/duplicates. Only the report photo (and the category,
// if already chosen) is used. Nothing about the person goes to CLIP.
export const duplicatesBody = z.object({
  photoUrl: z
    .string({ error: MSG.duplicatesPhotoMissing })
    .min(1, { error: MSG.duplicatesPhotoMissing })
    .max(ASSIST_LIMITS.photoMaxChars, { error: MSG.duplicatesPhotoTooBig })
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, { error: MSG.duplicatesPhotoInvalid }),
  category: z.enum(CATEGORIES, { error: MSG.assistCategoryInvalid }).optional(),
})