// Checks for POST /api/citizen/profile/email-verify. The code goes to the account's
// own email, so the code is all there is to send (there is no address to type).
import { z } from 'zod'
import { PROFILE_MESSAGES as P } from '../constants/messages/profile.js'

export const emailVerifyBody = z.object({
  code: z.string({ error: P.codeFormat }).trim().regex(/^\d{6}$/, { error: P.codeFormat }),
})
