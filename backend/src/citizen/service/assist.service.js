// F6 report assistant and F8 summarize. Both go through the shared Gemini
// service (shared/service/gemini.service.js). The AI never blocks the core flow:
// any failure, an empty reply or an answer in the wrong shape becomes
// AppError('ai-unavailable', 503) and the citizen simply files the report by hand.
// Only the photo or the report text is sent: nothing about the person.
import AppError from '../../utils/AppError.js'
import { CATEGORIES, ASSIST_LIMITS, SUMMARIZE_LIMITS } from '../../constants/limits.js'
import { AI_MESSAGES } from '../../constants/messages/ai.js'
import { assistRequest, summarizeRequest } from './assist.prompts.js'

// Loaded when first needed, so a missing file is a 503 and not a crash at start.
async function loadGemini() {
  try {
    return await import('../../shared/service/gemini.service.js')
  } catch {
    return null
  }
}

const unavailable = () => new AppError('ai-unavailable', 503, AI_MESSAGES.UNAVAILABLE)

// The model sometimes wraps its JSON in a code fence. Take the outermost { }.
function readJson(reply) {
  const text = String(reply ?? '')
  const open = text.indexOf('{')
  const close = text.lastIndexOf('}')
  if (open === -1 || close <= open) return null
  try {
    return JSON.parse(text.slice(open, close + 1))
  } catch {
    return null
  }
}

const oneLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

function cut(text, max) {
  if (text.length <= max) return text
  const room = text.slice(0, max - 1)
  const space = room.lastIndexOf(' ')
  return `${(space > max / 2 ? room.slice(0, space) : room).replace(/[\s,;:.-]+$/, '')}…`
}

export function createAssistService({ getGemini = loadGemini } = {}) {
  async function ask(method, request) {
    try {
      const gemini = await getGemini()
      if (typeof gemini?.[method] !== 'function') throw new Error('no gemini service')
      return await gemini[method](request)
    } catch (err) {
      // A bad photo is the citizen's mistake and keeps its own message.
      if (err instanceof AppError && err.code === 'invalid') throw err
      throw unavailable()
    }
  }

  return {
    // -> { category: 'Roads' | ... | null, description }
    async assist({ photoUrl, category }) {
      const reply = await ask('generateFromPhoto', assistRequest({ photoUrl, category }))
      const answer = readJson(reply)
      const description = cut(oneLine(answer?.description), ASSIST_LIMITS.descriptionMax)
      if (description.length < 10) throw unavailable()
      const suggested = CATEGORIES.find((c) => c.toLowerCase() === oneLine(answer?.category).toLowerCase())
      return { category: suggested ?? null, description }
    },

    // -> { summary } (at most SUMMARIZE_LIMITS.summaryMax characters, one line)
    async summarize(text) {
      const reply = await ask('generateText', summarizeRequest(text))
      const summary = cut(oneLine(reply).replace(/^["'“”‘’]+|["'“”‘’]+$/g, ''), SUMMARIZE_LIMITS.summaryMax)
      if (summary.length < 3) throw unavailable()
      return { summary }
    },
  }
}

export const { assist, summarize } = createAssistService()
