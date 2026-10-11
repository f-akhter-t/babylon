// Small animation helpers for the Map page. They use the browser's built-in
// element.animate(), so no extra CSS is needed. Everything is skipped for
// people who turned on "reduce motion" in their system settings.

export function prefersLessMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function animate(element, keyframes, options) {
  if (!element || prefersLessMotion()) return
  element.animate(keyframes, options)
}

// A slightly bouncy ease, so things "pop" instead of just appearing.
export const SPRING = 'cubic-bezier(0.2, 1.4, 0.4, 1)'

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
