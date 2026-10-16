import { ISSUES_EVENT } from '../services/api'
import { getSession } from '../services/auth'

// The live source for report changes. Pages read it through useLiveIssues.
// Today it listens to this browser: this tab's own changes (ISSUES_EVENT) and
// other tabs' changes (the storage event). A backend poll or socket can
// replace this one module later: it only has to call schedule() when
// something changed, and pages do not change.
//
//   const unsubscribe = subscribe(() => ...)
//   getSnapshot() -> { version, remote, animate }   (the same object until a change)
//     remote:  the change came from another tab (or, later, the server)
//     animate: the tab was visible, so the change may be shown with motion
//
// Storage keys it reacts to (the issue loaders in services/api.js read these):
//   babylon.submittedIssues   reports filed on this device
//   babylon.deletedIssues     reports their citizen deleted
//   babylon.issueEdits        a citizen's changes to their own report
//   babylon.issueWorkflow     department and admin steps, sent-back reasons and
//                             their history, reopened issues
//   babylon:voted:<email>, babylon:followed:<email>   this account's votes and follows
// Not: notifications, profiles and identity checks (their own hooks follow
// them), the session, names, passwords or seen alerts.
const ISSUE_KEYS = new Set([
  'babylon.submittedIssues',
  'babylon.deletedIssues',
  'babylon.issueEdits',
  'babylon.issueWorkflow',
])

function isOwnList(key) {
  const email = getSession()?.email
  return Boolean(email) && (key === `babylon:voted:${email}` || key === `babylon:followed:${email}`)
}

let snapshot = { version: 0, remote: false, animate: true }
const listeners = new Set()
let pendingRemote = false
let scheduled = 0
let scheduledWith = null // 'frame' | 'timeout'

// Many events in one frame (a storage event and the ISSUES_EVENT it causes,
// or several writes in a row) become one update. A hidden tab gets no
// animation frames, so it uses a timeout instead and applies the update
// without motion.
function schedule(remote) {
  pendingRemote = pendingRemote || remote
  if (scheduled) return
  if (document.visibilityState === 'hidden') {
    scheduledWith = 'timeout'
    scheduled = setTimeout(flush, 0)
  } else {
    scheduledWith = 'frame'
    scheduled = requestAnimationFrame(flush)
  }
}

function flush() {
  scheduled = 0
  snapshot = {
    version: snapshot.version + 1,
    remote: pendingRemote,
    animate: document.visibilityState === 'visible',
  }
  pendingRemote = false
  listeners.forEach((listener) => listener())
}

function onIssuesEvent() {
  schedule(false)
}

function onStorage(e) {
  if (ISSUE_KEYS.has(e.key) || isOwnList(e.key)) schedule(true)
}

export function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener(ISSUES_EVENT, onIssuesEvent)
    window.addEventListener('storage', onStorage)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    window.removeEventListener(ISSUES_EVENT, onIssuesEvent)
    window.removeEventListener('storage', onStorage)
    if (scheduled) {
      if (scheduledWith === 'frame') cancelAnimationFrame(scheduled)
      else clearTimeout(scheduled)
      scheduled = 0
      pendingRemote = false
    }
  }
}

export function getSnapshot() {
  return snapshot
}
