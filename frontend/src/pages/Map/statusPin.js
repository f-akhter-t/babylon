import { divIcon } from 'leaflet'
import { DRAFT_PIN_SIZE, draftPinHtml, pinHtml } from './pinMarkup'

// Leaflet pins are plain HTML strings, not React. The issue pin itself is
// drawn in pinMarkup.js (shared with the My reports cards). Tailwind still
// finds these class names because each one is written out in full below.

const CLUSTER_CLASSES =
  'flex size-full items-center justify-center rounded-full border-3 border-paper bg-ink font-heading text-base font-extrabold text-paper shadow-lg ring-4 ring-navy/25 transition duration-200 ease-out hover:bg-slate hover:ring-8 motion-safe:hover:scale-115'

// Icons are reused instead of rebuilt on every render.
const cache = {}

export function pinIcon(status, selected = false) {
  const key = `${status}-${selected}`
  if (!cache[key]) {
    const [width, height] = selected ? [40, 50] : [30, 38]
    cache[key] = divIcon({
      className: '', // removes Leaflet's default white square
      html: pinHtml(status, selected),
      iconSize: [width, height],
      iconAnchor: [width / 2, height], // the tip of the pin sits on the spot
      popupAnchor: [0, -height],
    })
  }
  return cache[key]
}

// Navy pin with a green dot: the citizen's own "report here" pin.
export function draftPinIcon() {
  if (!cache.draft) {
    cache.draft = divIcon({
      className: '',
      html: draftPinHtml(),
      iconSize: DRAFT_PIN_SIZE,
      iconAnchor: [DRAFT_PIN_SIZE[0] / 2, DRAFT_PIN_SIZE[1]],
    })
  }
  return cache.draft
}

// Round navy badge with a number, for pins that sit on top of each other.
export function clusterIcon(count) {
  const key = `cluster-${count}`
  if (!cache[key]) {
    cache[key] = divIcon({
      className: '',
      html: `<div class="${CLUSTER_CLASSES}">${count}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20], // centred on the spot
    })
  }
  return cache[key]
}
