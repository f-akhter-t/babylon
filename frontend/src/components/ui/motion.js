import { useEffect, useState } from 'react'

// Motion started from JavaScript. The reduced-motion rule in index.css stops
// CSS animations and transitions, but not element.animate() or map moves, so
// everything here reads the preference itself, at the moment it runs.

export function prefersLessMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// The same values as the tokens in index.css, for element.animate().
export const DURATION = { fast: 150, base: 250, slow: 450, reveal: 700 }
export const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'
// A slightly bouncy ease, so things "pop" instead of just appearing.
export const SPRING = 'cubic-bezier(0.2, 1.4, 0.4, 1)'

// element.animate(), skipped for reduced motion and for a hidden tab (nobody
// would see it, and it would play late when the tab comes back).
// Returns the Animation, or null when nothing ran.
export function animate(element, keyframes, options) {
  if (!element || prefersLessMotion() || document.visibilityState === 'hidden') return null
  return element.animate(keyframes, options)
}

// Pins and badges drop in from a little above.
export const DROP_IN = [
  { opacity: 0, transform: 'translateY(-14px) scale(0.6)' },
  { opacity: 1, transform: 'none' },
]

// Cards and popups rise in gently.
export const RISE_IN = [
  { opacity: 0, transform: 'translateY(8px) scale(0.97)' },
  { opacity: 1, transform: 'none' },
]

export const FADE_IN = [{ opacity: 0 }, { opacity: 1 }]

// Map popups slide out from their pin's side; the phone card slides up.
export const SLIDE_IN = {
  right: [
    { opacity: 0, transform: 'translateX(-12px) scale(0.97)' },
    { opacity: 1, transform: 'none' },
  ],
  left: [
    { opacity: 0, transform: 'translateX(12px) scale(0.97)' },
    { opacity: 1, transform: 'none' },
  ],
  dock: [
    { opacity: 0, transform: 'translateY(16px)' },
    { opacity: 1, transform: 'none' },
  ],
}

// A short left-right shake for a wrong code or a pin outside the area.
export const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-8px)' },
  { transform: 'translateX(7px)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(3px)' },
  { transform: 'translateX(0)' },
]

// ---------- Maps ----------
// Full motion keeps Leaflet's own flights. Reduced motion jumps straight there.

export function flyTo(map, center, zoom, options) {
  if (prefersLessMotion()) map.setView(center, zoom, { animate: false })
  else map.flyTo(center, zoom, options)
}

export function flyToBounds(map, bounds, options) {
  if (prefersLessMotion()) map.fitBounds(bounds, { ...options, animate: false })
  else map.flyToBounds(bounds, options)
}

// Options for a new Leaflet map: its zoom and fade animations are switched
// off only for reduced motion.
export function mapMotionOptions() {
  const less = prefersLessMotion()
  return less ? { zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false } : {}
}

// ---------- Leaving ----------
// Keeps a closing panel on screen while it fades out. Everything that matters
// (aria-expanded, focus, listeners) follows `open` at once; only the picture
// trails. A timer ends it, never animationend, which may not fire when motion
// is zeroed. Reduced motion or a hidden tab: gone at once.
//   const { mounted, closing } = usePresence(open)
//   {mounted && <div inert={closing} aria-hidden={closing || undefined} ...>}
export function usePresence(open, ms = DURATION.fast) {
  const [state, setState] = useState({ open, closing: false })

  if (open && (!state.open || state.closing)) setState({ open: true, closing: false })
  if (!open && state.open && !state.closing) {
    const instant = prefersLessMotion() || document.visibilityState === 'hidden'
    setState(instant ? { open: false, closing: false } : { open: true, closing: true })
  }

  useEffect(() => {
    if (!state.closing) return
    const timer = setTimeout(() => setState({ open: false, closing: false }), ms)
    return () => clearTimeout(timer)
  }, [state.closing, ms])

  return { mounted: state.open, closing: state.closing }
}
