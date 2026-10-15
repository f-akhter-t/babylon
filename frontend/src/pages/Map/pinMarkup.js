// The Map page's issue pin as an HTML string: the pin, its staircase bars and
// the colour for each status. No Leaflet here, so pages without a live map
// (the My reports cards) can draw the same pin without loading the map library.
// Tailwind still finds these class names because each one is written out in full.

const pinFill = {
  open: 'fill-amber',
  'in-progress': 'fill-slate',
  resolved: 'fill-forest',
}

const barFill = {
  open: 'fill-navy',
  'in-progress': 'fill-white',
  resolved: 'fill-white',
}

// How many staircase bars are solid: more steps = closer to fixed.
const level = { open: 1, 'in-progress': 2, resolved: 3 }

const bars = [
  { x: 1, y: 8, h: 5 },
  { x: 6, y: 5, h: 8 },
  { x: 11, y: 2, h: 11 },
]

function staircase(status) {
  return bars
    .map(
      (bar, i) =>
        `<rect x="${bar.x}" y="${bar.y}" width="3.5" height="${bar.h}" rx="1"
          class="${barFill[status]}" opacity="${i < level[status] ? 1 : 0.35}" />`,
    )
    .join('')
}

// The ring sits under the pin's tip. Navy outline + strong amber fill so it
// stays visible on OpenStreetMap's yellow and orange roads.
const RING_CLASSES =
  'absolute bottom-0 left-1/2 h-5 w-14 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-navy bg-amber/70 shadow-md'
export const SVG_CLASSES = 'relative block size-full drop-shadow-md'

// Hovering a pin lifts it and grows it a little, anchored at its tip.
export const PIN_WRAPPER_CLASSES =
  'relative size-full origin-bottom transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-115'

export function pinHtml(status, selected) {
  const ring = selected ? `<span class="${RING_CLASSES}"></span>` : ''
  const outline = selected ? 'stroke-navy' : 'stroke-white'

  return `
    <div class="${PIN_WRAPPER_CLASSES}">
      ${ring}
      <svg viewBox="0 0 28 36" class="${SVG_CLASSES}">
        <path d="M14 35C14 35 2 22 2 13a12 12 0 0 1 24 0c0 9-12 22-12 22z"
          class="${pinFill[status]} ${outline}" stroke-width="2.5" />
        <svg x="6" y="6" width="16" height="14" viewBox="0 0 16 14">${staircase(status)}</svg>
      </svg>
    </div>`
}
