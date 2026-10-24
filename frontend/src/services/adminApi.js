// What the admin panel reads and does on the backend. api.js re-exports these,
// so pages keep importing them from there. They live in their own file so the
// tests can load them without the rest of the mock API.
import { get, post, getToken } from './http.js'

// ---------- Verify resolutions ----------

// { queue, reopened }: the fixes waiting for a check (newest first) and the
// reopened issues, in one load.
export async function loadVerification() {
  const [queue, reopened] = await Promise.all([
    get('/admin/verification-queue'),
    get('/admin/reopened'),
  ])
  return { queue, reopened }
}

// { queue, reopened } as numbers, for the badges.
export async function getAdminCounts() {
  return get('/admin/counts')
}

// The fix is real: the issue closes and the after-photo becomes public.
export async function approveResolution(id) {
  return post(`/admin/issues/${encodeURIComponent(id)}/approve`)
}

// The fix is not good enough: back to In progress, with the reason.
export async function rejectResolution(id, reason = '') {
  return post(`/admin/issues/${encodeURIComponent(id)}/reject`, { reason })
}

// A reopened issue goes to the verification queue.
export async function sendReopenedToQueue(id) {
  return post(`/admin/issues/${encodeURIComponent(id)}/send-to-queue`)
}

// ---------- Accountability ----------

// Everything the Accountability page shows for one period (4 or 8 weeks).
export async function loadAccountability(weeks = 8) {
  return get('/admin/accountability', { query: { weeks } })
}

// ---------- Identity review ----------

// Everyone waiting, oldest first.
export async function getIdentityQueue() {
  return get('/admin/identity')
}

export async function getIdentityQueueCount() {
  return (await get('/admin/identity/count')).count
}

// submission is an item from getIdentityQueue().
// decision: 'approve' | 'reject'. A reject needs a reason, which the citizen sees.
// Returns { ...submission, status, photoDeleted }.
export async function reviewIdentity(submission, { decision, reason = '' }) {
  return post(`/admin/identity/${encodeURIComponent(submission.id)}/review`, { decision, reason })
}

// The card photo for a submission from getIdentityQueue():
//   { kind: 'photo', blob }   the photo, for this submission only
//   { kind: 'missing' }       the server has none (already reviewed, or never sent)
//   { kind: 'error' }         the server could not be reached or refused
// The photo is a picture, not JSON, so it cannot go through http.js yet.
// TODO: when http.js has the authenticated blob download (plan gate G2), use it here.
const API_URL = String(import.meta.env?.VITE_API_URL ?? '/api').replace(/\/+$/, '')

export async function getIdentityPhoto(submission) {
  try {
    const token = getToken()
    const response = await fetch(`${API_URL}/admin/identity/${encodeURIComponent(submission.id)}/photo`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (response.status === 404) return { kind: 'missing' }
    if (!response.ok) return { kind: 'error' }
    return { kind: 'photo', blob: await response.blob() }
  } catch {
    return { kind: 'error' }
  }
}


// ---------- Translate (F10) ----------

// The languages the server accepts (the same two as TRANSLATE_LIMITS on the backend).
export const TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bangla' },
]

// { translation, to } for report text. Needs a signed-in user. When the AI is off
// the server answers ai-unavailable and the error message says so in a sentence.
export async function translateText(text, to) {
  return post('/translate', { text, to })
}
