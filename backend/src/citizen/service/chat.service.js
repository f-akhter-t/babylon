// F4 citizen help chat. Goes through the shared Gemini service
// (shared/service/gemini.service.js). The AI never blocks the core flow: any
// failure or an empty reply becomes AppError('ai-unavailable', 503) and the
// citizen simply uses the app without the chat.
// Only the question and the earlier messages of this chat are sent: nothing
// about the person, and no report data.
import AppError from '../../utils/AppError.js'
import { cut, oneLine } from '../../utils/aiText.js'
import { CHAT_LIMITS } from '../../constants/limits.js'
import { AI_MESSAGES } from '../../constants/messages/ai.js'
import { chatRequest } from './chat.prompts.js'

// Loaded when first needed, so a missing file is a 503 and not a crash at start.
async function loadGemini() {
  try {
    return await import('../../shared/service/gemini.service.js')
  } catch {
    return null
  }
}

const unavailable = () => new AppError('ai-unavailable', 503, AI_MESSAGES.UNAVAILABLE)

export function createChatService({ getGemini = loadGemini } = {}) {
  return {
    // -> { reply } (plain text, at most CHAT_LIMITS.replyMax characters)
    async chat({ message, history = [] }) {
      let reply
      try {
        const gemini = await getGemini()
        if (typeof gemini?.generateText !== 'function') throw new Error('no gemini service')
        reply = await gemini.generateText(chatRequest({ message, history }))
      } catch {
        throw unavailable()
      }
      // Keep the line breaks the model chose, but never more than one blank line.
      const text = typeof reply === 'string' ? reply.replace(/\n{3,}/g, '\n\n').trim() : ''
      if (oneLine(text).length < 2) throw unavailable()
      return { reply: cut(text, CHAT_LIMITS.replyMax) }
    },
  }
}

export const { chat } = createChatService()
