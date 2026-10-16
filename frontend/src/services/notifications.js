// Notifications, one list per account (by email), kept in the browser until
// the backend exists. Each notice has exactly one recipient:
//   { id, recipient, kind, text, link, issueId, createdAt, read }
// recipient: the account's email. kind: what happened (see KINDS in the bell).
// text: one whole sentence. link: the page it opens. issueId: the report it is
// about (null for identity and level notices), so deleting a report can
// remove every notice about it. Pages listen through useNotifications().

const KEY = 'babylon.notifications'
const SEEDED_KEY = 'babylon.notificationsSeeded'
const DELETED_ISSUES_KEY = 'babylon.deletedIssues' // written by deleteIssue (api.js)
const CAP = 50 // newest notices kept per account
export const NOTIFICATIONS_EVENT = 'babylon:notifications'

const DEMO_CITIZEN = 'citizen@babylon.test'

const key = (email) => (email ?? '').toLowerCase()

function readJson(name, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(name)) ?? fallback
  } catch {
    return fallback
  }
}

function readAll() {
  const all = readJson(KEY, {})
  return all && typeof all === 'object' ? all : {}
}

function writeAll(all) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // storage full or blocked: the notice is lost, the action itself still happened
  }
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
}

let counter = 0
const newId = () => `n_${Date.now().toString(36)}_${(counter++).toString(36)}`

// One notice to one account. Newest first; only the newest CAP are kept.
export function notify(recipient, { kind, text, link, issueId = null }) {
  if (!recipient) return
  const all = readAll()
  const list = all[key(recipient)] ?? []
  const notice = { id: newId(), recipient: key(recipient), kind, text, link, issueId: issueId == null ? null : String(issueId), createdAt: Date.now(), read: false }
  all[key(recipient)] = [notice, ...list].slice(0, CAP)
  writeAll(all)
}

// The same notice copied to each account (staff: every account in a department, every admin).
export function notifyEach(recipients, notice) {
  for (const email of new Set(recipients.map(key))) notify(email, notice)
}

// The demo citizen starts with a few notices about real seed reports, once per
// browser, so the bell is not empty in demos. Reports already deleted are skipped.
const DAY = 86400000
function seedDemo(all) {
  const seeded = readJson(SEEDED_KEY, [])
  if (seeded.includes(DEMO_CITIZEN)) return all
  const deleted = readJson(DELETED_ISSUES_KEY, []).map(String)
  const now = Date.now()
  const seed = [
    { kind: 'welcome', text: 'Welcome to Babylon. Updates on your reports will show up here.', link: '/my-reports', issueId: null, at: now - 4 * DAY },
    { kind: 'filed', text: 'Your report "Deep pothole near Wasa Circle" was sent to Roads & Highways.', link: '/my-reports?report=1', issueId: '1', at: now - 3 * DAY },
    { kind: 'resolved', text: 'Your report "Burst water pipe by the school gate" is resolved and verified.', link: '/my-reports?report=6', issueId: '6', at: now - 2 * DAY },
  ]
    .filter((n) => !n.issueId || !deleted.includes(n.issueId))
    .map((n, i) => ({ id: `seed_${i}`, recipient: DEMO_CITIZEN, kind: n.kind, text: n.text, link: n.link, issueId: n.issueId, createdAt: n.at, read: n.kind === 'welcome' }))
  const next = { ...all, [DEMO_CITIZEN]: [...(all[DEMO_CITIZEN] ?? []), ...seed].sort((a, b) => b.createdAt - a.createdAt).slice(0, CAP) }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
    window.localStorage.setItem(SEEDED_KEY, JSON.stringify([...seeded, DEMO_CITIZEN]))
  } catch {
    // storage blocked: show the seed this time only
  }
  // Tell the bell, so the seed shows on the first sign-in without a refresh.
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
  return next
}

// For useSyncExternalStore: the stored text (a stable snapshot), and the
// account's notices read from it.
export function readRaw() {
  try {
    return window.localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function listFrom(raw, email) {
  if (!email || !raw) return []
  try {
    return JSON.parse(raw)?.[key(email)] ?? []
  } catch {
    return []
  }
}

// This account's notices, newest first (seeds the demo citizen's first time).
export function getNotifications(email) {
  if (!email) return []
  let all = readAll()
  if (key(email) === DEMO_CITIZEN) all = seedDemo(all)
  return all[key(email)] ?? []
}

export function markRead(email, id) {
  const all = readAll()
  const list = all[key(email)]
  if (!list?.some((n) => n.id === id && !n.read)) return
  all[key(email)] = list.map((n) => (n.id === id ? { ...n, read: true } : n))
  writeAll(all)
}

export function markAllRead(email) {
  const all = readAll()
  const list = all[key(email)]
  if (!list?.some((n) => !n.read)) return
  all[key(email)] = list.map((n) => ({ ...n, read: true }))
  writeAll(all)
}

// A report was deleted: every notice about it goes, for every account.
export function removeForIssue(issueId) {
  const id = String(issueId)
  const all = readAll()
  let changed = false
  for (const [email, list] of Object.entries(all)) {
    const kept = list.filter((n) => n.issueId !== id)
    if (kept.length !== list.length) {
      all[email] = kept
      changed = true
    }
  }
  if (changed) writeAll(all)
}

// Re-render when notices change in this tab (the event) or another tab (storage).
export function subscribe(listener) {
  const onStorage = (e) => {
    if (e.key === KEY || e.key === null) listener()
  }
  window.addEventListener(NOTIFICATIONS_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
