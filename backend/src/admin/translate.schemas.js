import { z } from 'zod'
import { TRANSLATE_LIMITS } from '../constants/limits.js'
import { MSG } from '../constants/messages/index.js'

// POST /api/translate
export const translateBody = z.object({
  text: z
    .string({ error: MSG.translateTextMissing })
    .trim()
    .min(1, MSG.translateTextMissing)
    .max(TRANSLATE_LIMITS.maxChars, MSG.translateTextTooLong(TRANSLATE_LIMITS.maxChars)),
  to: z.enum(TRANSLATE_LIMITS.languages.map((l) => l.code), { error: MSG.translateLanguageInvalid }),
})
