// Tiny client-side store. Nothing is hard-coded: reports, upvotes, points and
// notifications all come from user actions and are saved in localStorage.
// Later, Express replaces these functions with fetch calls and the pages stay the same.
import { useMemo, useSyncExternalStore } from 'react'

const KEY = 'babylon:my-reports:v1'

// One mapping, used everywhere (from the frontend plan)
const DEPARTMENT = {
  Roads: 'Roads & Highways',
  Bridges: 'Roads & Highways',
  Waste: 'Waste Management',
  Water: 'Water Supply',
  Lighting: 'Electricity',
  Other: null,
}

// Points rules. The "How you earn points" card renders this same list.
export const POINT_RULES = [
  { key: 'photo', label: 'A clear photo of the problem', points: 20 },
  { key: 'pin', label: 'An exact pin on the map', points: 20 },
  { key: 'upvote', label: 'Upvotes from neighbours', points: 2, each: true },
  { key: 'verified', label: 'Reports that end up verified as fixed', points: 50 },
]

const TIERS = [
  { level: 1, title: 'Newcomer', min: 0 },
  { level: 2, title: 'Reporter', min: 100 },
  { level: 3, title: 'Contributor', min: 300 },
  { level: 4, title: 'Champion', min: 600 },
]

const STATUS_TITLE = {
  in_progress: 'Your report is now In progress',
  resolved: 'Resolved and verified',
  reopened: 'Report reopened',
}
const STATUS_LABEL = { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', reopened: 'Reopened' }

/* ---------- helpers ---------- */
const uid = () => `r_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const formatDay = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

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
  return formatDay(ts)
}

// Shrinks the photo so it fits in localStorage, returns a data URL
export function fileToDataUrl(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function deriveTitle({ description, category, location }) {
  const first = (description || '').trim().split(/[.\n]/)[0].trim()
  if (first) {
    const t = first.length > 60 ? `${first.slice(0, 57).trimEnd()}…` : first
    return t[0].toUpperCase() + t.slice(1)
  }
  return `${category} issue${location ? ` at ${location}` : ''}`
}

export const pointsForReport = (r) =>
  (r.photoUrl ? 20 : 0) + (r.pinned ? 20 : 0) + r.upvotes * 2 + (r.status === 'resolved' ? 50 : 0)

export function computePoints(reports) {
  const score = reports.reduce((sum, r) => sum + pointsForReport(r), 0)
  const tier = [...TIERS].reverse().find((t) => score >= t.min)
  const next = TIERS.find((t) => t.min > score) || null
  return {
    score,
    level: tier.level,
    title: tier.title,
    toNext: next ? next.min - score : null,
    nextTitle: next ? next.title : null,
  }
}

/* ---------- store ---------- */
const welcome = () => ({
  id: uid(), kind: 'acc', title: 'Welcome to Babylon!',
  body: 'Report a problem to start earning points.', createdAt: Date.now(), unread: true,
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { reports: [], notifications: [welcome()] }
}

let state = load()
const listeners = new Set()

function commit(mutate) {
  const before = computePoints(state.reports)
  const next = mutate({ reports: state.reports, notifications: state.notifications })
  const after = computePoints(next.reports)
  if (after.level > before.level) {
    next.notifications = [
      { id: uid(), kind: 'acc', title: `You reached Level ${after.level} · ${after.title}`,
        body: `You have ${after.score} points. Keep reporting to climb higher.`, createdAt: Date.now(), unread: true },
      ...next.notifications,
    ]
  }
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full: keep in memory */ }
  listeners.forEach((l) => l())
}

// keeps two tabs in sync (handy to test "someone else upvoted")
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { state = load(); listeners.forEach((l) => l()) }
  })
}

/* ---------- actions ---------- */

// Call this from the Report form's submit
export function createReport({ category, description = '', location = '', pinned = false, photoUrl = null }) {
  const now = Date.now()
  const department = DEPARTMENT[category] ?? null
  const report = {
    id: uid(),
    title: deriveTitle({ description, category, location }),
    category, description, location, pinned, photoUrl,
    status: 'open', upvotes: 0, department,
    createdAt: now,
    update: department ? { text: `Sent to ${department}`, at: now } : null,
    history: [
      { label: 'Open', note: 'Reported', at: now },
      ...(department ? [{ label: `Sent to ${department}`, at: now }] : []),
    ],
  }
  const earned = pointsForReport(report)
  commit((s) => ({
    reports: [report, ...s.reports],
    notifications: [
      {
        id: uid(), kind: 'dep', title: 'Report filed', reportId: report.id, createdAt: now, unread: true,
        body: `${report.title}. ${department ? `Sent to ${department}.` : 'We will assign it to a department soon.'}${earned ? ` You earned ${earned} points.` : ''}`,
      },
      ...s.notifications,
    ],
  }))
  return report
}

// Call this from any upvote button. Only affects reports in this store.
export function upvoteReport(id) {
  if (!state.reports.some((r) => r.id === id)) return false
  commit((s) => {
    const report = s.reports.find((r) => r.id === id)
    const existing = s.notifications.find((n) => n.kind === 'up' && n.unread && n.reportId === id)
    const count = (existing?.count || 0) + 1
    const note = {
      id: existing?.id || uid(), kind: 'up', reportId: id, count, unread: true, createdAt: Date.now(),
      title: `${count} new upvote${count > 1 ? 's' : ''}`,
      body: `${report.title} is getting attention.`,
    }
    return {
      reports: s.reports.map((r) => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r)),
      notifications: [note, ...s.notifications.filter((n) => n.id !== note.id)],
    }
  })
  return true
}

// Call this from the department panel and the admin verify page
export function updateReportStatus(id, status, note) {
  if (!state.reports.some((r) => r.id === id)) return false
  const now = Date.now()
  commit((s) => {
    const report = s.reports.find((r) => r.id === id)
    const text = note || STATUS_LABEL[status]
    const updated = {
      ...report, status, update: { text, at: now },
      history: [...report.history, { label: STATUS_LABEL[status], note: note || undefined, at: now }],
    }
    const bonus = status === 'resolved' ? ' You earned 50 points.' : ''
    return {
      reports: s.reports.map((r) => (r.id === id ? updated : r)),
      notifications: STATUS_TITLE[status]
        ? [{ id: uid(), kind: 'dep', reportId: id, unread: true, createdAt: now,
             title: STATUS_TITLE[status], body: `${report.title}. ${text}.${bonus}` }, ...s.notifications]
        : s.notifications,
    }
  })
  return true
}

export const markNotificationRead = (id) =>
  commit((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)) }))

export const markAllNotificationsRead = () =>
  commit((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, unread: false })) }))

/* ---------- hooks ---------- */
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
const getSnapshot = () => state
const useStore = () => useSyncExternalStore(subscribe, getSnapshot)

export const useMyReports = () => useStore().reports
export const useNotifications = () => useStore().notifications
export function useMyPoints() {
  const reports = useStore().reports
  return useMemo(() => computePoints(reports), [reports])
}

// dev only: try it from the browser console, e.g. __babylon.upvoteReport('<id>')
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__babylon = { createReport, upvoteReport, updateReportStatus, getState: () => state }
}
