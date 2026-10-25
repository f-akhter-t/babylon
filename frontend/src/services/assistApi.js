// The report assistant (F6) and the short summary (F8) on the report form.
// Both call the backend through http.js and are optional: the citizen can always
// file a report without them, so every failure becomes one readable sentence
// and nothing here ever stops the form from being sent.
import { post } from './http.js'

// The same limits as the backend (SUMMARIZE_LIMITS in constants/limits.js).
export const SUMMARIZE_TEXT_MIN = 10
export const SUMMARIZE_TEXT_MAX = 2000

// F6. photoUrl is the small JPEG data URL made by resizeImage(); it is the only
// thing sent, plus the category if the citizen has already picked one.
// -> { category: 'Roads' | 'Waste' | 'Water' | 'Lighting' | 'Bridges' | null, description }
// category is null when the assistant could not tell.
export function getReportSuggestion({ photoUrl, category }) {
  const body = { photoUrl }
  if (category) body.category = category
  return post('/citizen/reports/assist', body)
}

// F8. -> the one-line summary (at most 70 characters), a string.
export async function getReportSummary(text) {
  const result = await post('/citizen/reports/summarize', { text })
  return result.summary
}

// True when the text is long enough to be summarised.
export function canSummarize(text) {
  return String(text ?? '').trim().length >= SUMMARIZE_TEXT_MIN
}

export const ASSIST_MESSAGES = Object.freeze({
  loggedOut: 'Please log in again to use the assistant.',
  notCitizen: 'The assistant is only for citizen accounts.',
  tooMany: 'You are asking the assistant too fast. Please wait a moment and try again.',
  unavailable: 'The assistant is not available right now. You can still fill in the report yourself.',
  photoTooBig: 'That photo is too big for the assistant. You can still fill in the report yourself.',
  other: 'The assistant could not help this time. You can still fill in the report yourself.',
})

// One sentence for the page to show under the button, for any error thrown by
// the two functions above. The status decides first, because
// a proxy can answer 429 or 503 with a page that is not JSON, and http.js then
// reports it as a network error. A 400 keeps the server's own sentence, since it
// names the exact problem ("Write at least 10 characters first...").
export function assistErrorMessage(error) {
  switch (error?.status) {
    case 401:
      return ASSIST_MESSAGES.loggedOut
    case 403:
      return ASSIST_MESSAGES.notCitizen
    case 413:
      return ASSIST_MESSAGES.photoTooBig
    case 429:
      return ASSIST_MESSAGES.tooMany
    case 502:
    case 503:
    case 504:
      return ASSIST_MESSAGES.unavailable
    default:
      break
  }
  if (error?.status === 400 && error.message) return error.message
  if (error?.code === 'network' && error.message) return error.message
  return ASSIST_MESSAGES.other
}
