// The citizen's calls to the backend: reports, votes, "me" and points.
// api.js re-exports everything here, so pages keep importing from services/api.js.
// The account always comes from the token (http.js adds it), never from an
// argument: an email passed in is ignored.
import { del, get, patch, post } from './http.js'
import { getIssueById } from './publicApi.js'
import { ISSUES_EVENT } from './issuesEvent.js'

// The same limits as the backend (constants/limits.js), for the forms.
export const TITLE_MIN = 5
export const TITLE_MAX = 70
export const LOCKED_MESSAGE = 'Work has started, so this report is locked.'

// Lists on the open pages refresh when a report is filed, edited, deleted or voted on.
const notifyIssuesChanged = () => window.dispatchEvent(new Event(ISSUES_EVENT))

const reportPath = (id) => `/citizen/reports/${encodeURIComponent(id)}`

// Only what the backend reads from a pin. A missing ward or division is left
// out, because the server accepts text or nothing, not null.
function pin(location) {
  return {
    lat: location.lat,
    lng: location.lng,
    label: location.label,
    ...(location.ward ? { ward: location.ward } : {}),
    ...(location.division ? { division: location.division } : {}),
  }
}

// ---------- Reports ----------

// photoUrl is a small data URL. The server stores status open, priority medium
// and the owner from the token. It also checks the pin is inside the citizen's
// own division and answers with the report as My reports shows it.
export async function createIssue({ category, description, photoUrl, location }) {
  const report = await post('/citizen/reports', {
    category,
    description,
    photoUrl,
    location: pin(location),
  })
  notifyIssuesChanged()
  return report
}

// The citizen's own reports, newest first, with the history of fixes sent back.
export async function getMyReports(email) {
  if (!email) return []
  return get('/citizen/reports')
}

// 'ok' | 'not-owner' | 'locked'. The server marks a report `mine` for its owner,
// and a report can be edited only while it is Open (the server checks again).
export function canEditIssue(issue, email) {
  if (!issue || !email || !issue.mine) return 'not-owner'
  return issue.status === 'open' ? 'ok' : 'locked'
}

// One report for the Edit page, or null if there is no such report. Someone
// else's report comes back through the public route, so the page can say
// "not yours" (canEditIssue gives 'not-owner').
export async function getIssueForEdit(id) {
  try {
    return await get(reportPath(id))
  } catch (error) {
    if (error?.code === 'not-found') return null
    if (error?.code === 'forbidden') return getIssueById(id)
    throw error
  }
}

// changes: { title, description, category, photoUrl, location }.
// photoUrl: a new data URL, or undefined to keep the photo.
// location: { lat, lng, label, ward, division }, or undefined to keep the pin.
// Errors carry the server's `code`: 'not-found' | 'forbidden' | 'locked' | 'invalid'.
export async function updateIssue(id, changes) {
  const { title, description, category, photoUrl, location } = changes
  const report = await patch(reportPath(id), {
    title,
    description,
    category,
    photoUrl,
    location: location ? pin(location) : undefined,
  })
  notifyIssuesChanged()
  return report
}

// Deletes the citizen's own report while it is still Open.
// Errors carry the server's `code`: 'not-found' | 'forbidden' | 'locked'.
export async function deleteIssue(id) {
  const result = await del(reportPath(id))
  notifyIssuesChanged()
  return result
}

// ---------- Votes ----------
// Both answer { id, votes, voted }: the count after the change.

export async function addVote(id) {
  const answer = await post(`${reportPath(id)}/vote`)
  notifyIssuesChanged()
  return answer
}

export async function removeVote(id) {
  const answer = await del(`${reportPath(id)}/vote`)
  notifyIssuesChanged()
  return answer
}

// Adds one vote. Returns the new count, or null when the issue is closed
// (resolved issues cannot be voted on).
export async function upvoteIssue(id) {
  try {
    return (await addVote(id)).votes
  } catch (error) {
    if (error?.code === 'conflict') return null
    throw error
  }
}

// ---------- Me and points ----------

// { email, name, reports, points, level, role, nextTierAt }
export async function getCurrentUser(email) {
  if (!email) return null
  return get('/citizen/me')
}

// The "ways to earn points" list for the level card.
export async function getEarnPoints() {
  const data = await get('/citizen/points/earn')
  return Array.isArray(data) ? data : (data?.items ?? [])
}
