// High-visibility cursors for the Map page: a thick navy edge with a white
// line inside, so each cursor shows on light map tiles and on the navy navbar.
// The shapes are drawn as small SVG images. The colours come from the theme.

const ARROW = '<path d="M3 1v19l5-5 3.5 7.5 3-1.4L11 13.6h7z" />'
const POINTER =
  '<path d="M10 9.5V4a2 2 0 0 0-4 0v10" /><path d="M14 10V9a2 2 0 0 0-4 0v1" /><path d="M18 11v-1a2 2 0 0 0-4 0" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15" />'
const GRAB =
  '<path d="M18 11V6a2 2 0 0 0-4 0" /><path d="M14 10V4a2 2 0 0 0-4 0v2" /><path d="M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15" />'
const GRABBING =
  '<path d="M18 11.5V9a2 2 0 0 0-4 0v1.4" /><path d="M14 10V8a2 2 0 0 0-4 0v2" /><path d="M10 9.9V9a2 2 0 0 0-4 0v5" /><path d="M6 14a2 2 0 0 0-4 0" /><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" />'
const CROSSHAIR =
  '<circle cx="12" cy="12" r="6" /><path d="M12 1v6M12 17v6M1 12h6M17 12h6" />'

function themeColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`)
  return value.trim() || fallback
}

// filled: the arrow is a solid navy shape; the hands and crosshair are line drawings.
function cursor(shape, [x, y], fallback, filled = false) {
  const dark = themeColor('navy', 'black')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="-2 -2 28 28"
    fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="${dark}" stroke-width="${filled ? 4 : 5.5}">${shape}</g>
    <g stroke="white" stroke-width="${filled ? 1.6 : 2.2}" fill="${filled ? dark : 'none'}">${shape}</g>
  </svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, ${fallback}`
}

// CSS variables for the page root. The numbers are the "hot spot": the exact
// pixel that clicks (the arrow's tip, the pointing finger, the centre).
export function cursorVariables() {
  return {
    '--cursor-arrow': cursor(ARROW, [5, 3], 'default', true),
    '--cursor-pointer': cursor(POINTER, [9, 3], 'pointer'),
    '--cursor-grab': cursor(GRAB, [14, 14], 'grab'),
    '--cursor-grabbing': cursor(GRABBING, [14, 14], 'grabbing'),
    '--cursor-crosshair': cursor(CROSSHAIR, [14, 14], 'crosshair'),
  }
}

// Which cursor goes where. leaflet.css sets its own cursors, so these use "!".
// Leaflet puts .leaflet-dragging on <body> while something is being dragged.
export const CURSOR_CLASSES = [
  'cursor-(--cursor-arrow)',
  '[&_a]:cursor-(--cursor-pointer)!',
  '[&_button:not(:disabled)]:cursor-(--cursor-pointer)!',
  '[&_input]:cursor-text',
  '[&_.leaflet-grab]:cursor-(--cursor-grab)!',
  '[&_.leaflet-interactive]:cursor-(--cursor-pointer)!',
  '[.leaflet-dragging_&_.leaflet-grab]:cursor-(--cursor-grabbing)!',
  '[.leaflet-dragging_&_.leaflet-interactive]:cursor-(--cursor-grabbing)!',
].join(' ')
