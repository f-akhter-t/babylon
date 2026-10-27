// F4 help chat, reopen, and the department weekly summary (F5).
// Everything goes through http.js: it adds the token, unwraps { data } and turns
// failures into plain Errors with `code` and `field`.
import { get, post } from './http.js'

// history: up to 6 earlier turns, each { role: 'user' | 'assistant', text }.
export async function sendChat(message, history = []) {
  const data = await post('/citizen/chat', { message, history })
  return { reply: String(data?.reply ?? '') }
}

// The server reads the owner from the token. No body is needed.
export const reopenReport = (id) => post(`/citizen/reports/${encodeURIComponent(id)}/reopen`)

// { department, days, counts, summary }. summary is null when the AI is off.
export async function getWeeklySummary() {
  const data = await get('/department/summary/weekly')
  return {
    department: data?.department ?? '',
    days: data?.days ?? 7,
    counts: data?.counts ?? {},
    summary: typeof data?.summary === 'string' ? data.summary : null,
  }
}