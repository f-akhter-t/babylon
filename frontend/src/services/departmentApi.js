// What the department panel reads and does on the backend. api.js re-exports
// these, so pages keep importing them from there.
import { get, patch, post } from './http.js'

// { assigned, completed } in one load. The server knows the department from
// the token, so the argument the page passes is not sent.
export async function loadDepartmentPanel() {
  const [assigned, completed] = await Promise.all([
    get('/department/issues', { query: { scope: 'assigned' } }),
    get('/department/issues', { query: { scope: 'completed' } }),
  ])
  return { assigned, completed }
}

// Open becomes In progress. Returns the issue.
export async function startWork(id) {
  return patch(`/department/issues/${encodeURIComponent(id)}/status`, { status: 'in-progress' })
}

// Sends the after-photo (a data URL) and a note to the admin.
export async function submitForVerification(id, { note = '', photoUrl } = {}) {
  return post(`/department/issues/${encodeURIComponent(id)}/submit`, { note, photoUrl })
}