import { ISSUES_EVENT } from '../services/issuesEvent.js'

// The live source for report changes. Pages read it through useLiveIssues.
// While anyone is subscribed it ticks every POLL_MS (15 seconds): each tick makes
// the pages load their list again, quietly, and they show only what changed.
// It also ticks at once when this tab's own code announces a change
// (ISSUES_EVENT) and when a hidden tab becomes visible again. It stops when the
// last page unsubscribes. (It used to listen for the browser's storage event,
// which only worked between tabs of one browser; a poll sees the server.)
//
//   const unsubscribe = subscribe(() => ...)
//   getSnapshot() -> { version, remote, animate }   (the same object until a change)
//     remote:  the change came from outside this tab's own actions (the poll)
//     animate: the tab was visible, so the change may be shown with motion
export const POLL_MS = 15_000

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

// A hidden tab does not poll (nobody is looking); it catches up the moment it
// is shown again.
function onVisible() {
  if (document.visibilityState === 'visible') schedule(true)
}

let poller = 0

export function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener(ISSUES_EVENT, onIssuesEvent)
    document.addEventListener('visibilitychange', onVisible)
    poller = setInterval(onVisible, POLL_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    window.removeEventListener(ISSUES_EVENT, onIssuesEvent)
    document.removeEventListener('visibilitychange', onVisible)
    clearInterval(poller)
    poller = 0
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
