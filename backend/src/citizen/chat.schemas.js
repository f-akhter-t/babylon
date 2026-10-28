import { z } from 'zod'
import { CHAT_LIMITS } from '../constants/limits.js'
import { MSG } from '../constants/messages/index.js'

// POST /api/citizen/chat. Only the question and the earlier messages of this
// chat go to the AI. Nothing about the person does.
export const chatBody = z.object({
  message: z
    .string({ error: MSG.chatMessageMissing })
    .trim()
    .min(1, { error: MSG.chatMessageMissing })
    .max(CHAT_LIMITS.messageMax, { error: MSG.chatMessageLong(CHAT_LIMITS.messageMax) }),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant'], { error: MSG.chatHistoryInvalid }),
        text: z
          .string({ error: MSG.chatHistoryInvalid })
          .trim()
          .max(CHAT_LIMITS.historyTextMax, { error: MSG.chatHistoryInvalid }),
      }),
      { error: MSG.chatHistoryInvalid },
    )
    .max(CHAT_LIMITS.historyMax, { error: MSG.chatHistoryInvalid })
    .default([]),
})
