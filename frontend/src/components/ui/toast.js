import { useSyncExternalStore } from 'react'

// The app's toasts, shown by <Toaster /> (mounted once in App.jsx).
//   const toast = useToast()
//   toast.info('You upvoted this issue.')   // leaves after about 4 s
//   toast.error('We could not save that.')  // stays until Dismiss
// Messages are whole sentences. Only one info toast shows at a time: a new
// one replaces the old one. Any component can raise one; no provider needed.

const SPEAK_DELAY_MS = 60
const TOAST_ZONE_PX = 80 // the strip at the bottom of the screen where toasts sit

let state = {
  info: null, // { id, text }
  errors: [], // [{ id, text }]
  spoken: '', // what the polite live region says
  clearance: 0, // px the toasts must sit above a bar at the bottom
}
let nextId = 1
let speakTimer = 0
const listeners = new Set()

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

// Bars a toast must not cover carry data-toast-clearance: the Profile save bar,
// the staff action bars and the Map dock. Any of them reaching into the
// bottom strip of the screen pushes the toasts up above it.
function measureClearance() {
  let clearance = 0
  for (const bar of document.querySelectorAll('[data-toast-clearance]')) {
    const box = bar.getBoundingClientRect()
    if (!box.width || !box.height) continue
    if (box.top < window.innerHeight && box.bottom > window.innerHeight - TOAST_ZONE_PX) {
      clearance = Math.max(clearance, window.innerHeight - box.top)
    }
  }
  return clearance
}

export function updateClearance() {
  const clearance = measureClearance()
  if (clearance !== state.clearance) setState({ clearance })
}

function showInfo(text) {
  // Clear the live region first, so the same sentence twice is still read out.
  clearTimeout(speakTimer)
  setState({ info: { id: nextId++, text }, spoken: '', clearance: measureClearance() })
  speakTimer = setTimeout(() => setState({ spoken: text }), SPEAK_DELAY_MS)
}

function showError(text) {
  // The same error again moves to the end with a new id, so it is read again.
  const others = state.errors.filter((e) => e.text !== text)
  setState({ errors: [...others, { id: nextId++, text }], clearance: measureClearance() })
}

export function dismissError(id) {
  setState({ errors: state.errors.filter((e) => e.id !== id) })
}

export function dismissInfo(id) {
  if (state.info?.id === id) setState({ info: null })
}

const api = { info: showInfo, error: showError }

export function useToast() {
  return api
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToastState() {
  return useSyncExternalStore(subscribe, () => state)
}
