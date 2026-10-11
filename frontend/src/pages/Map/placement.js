// Small helpers that decide where a map popup goes. All sizes are pixels
// inside the map box.

export const GAP = 12 // space between the pin and the popup
const PIN_HALF = 20 // half the width of a selected pin (see statusPin.js)
const LIFT = 12 // the popup's top sits this far above the pin's head
const CONTROLS = 72 // the zoom buttons column on the left: 16 + 44 + 12
const EDGE = 16

// Room to keep free inside the map, so the popup never covers the zoom
// buttons, the legend, or (below lg) the "Report an issue" button.
export function edgePadding(map) {
  const wide = window.matchMedia('(min-width: 1024px)').matches
  const top = (wide ? EDGE : 80) + hiddenByNavbar(map)
  return { topLeft: [CONTROLS, top], bottomRight: [EDGE, wide ? 72 : 104] }
}

// Below lg the page scrolls, and the sticky navbar can cover the top of the map.
function hiddenByNavbar(map) {
  const navbar = document.querySelector('header')
  if (!navbar) return 0
  const mapTop = map.getContainer().getBoundingClientRect().top
  return Math.max(0, navbar.getBoundingClientRect().bottom - mapTop)
}

// Too narrow for the controls, a pin and a popup side by side (phones).
export function shouldDock(map, popupWidth) {
  return map.getSize().x < CONTROLS + PIN_HALF * 2 + GAP + popupWidth + EDGE
}

// Right of the pin if it fits, otherwise left. If neither fits right now,
// the side with more room (the map then pans a little to make the rest).
export function chooseSide(map, pinX, popupWidth) {
  const roomRight = map.getSize().x - EDGE - (pinX + PIN_HALF + GAP)
  const roomLeft = pinX - PIN_HALF - GAP - CONTROLS
  if (roomRight >= popupWidth) return 'right'
  if (roomLeft >= popupWidth) return 'left'
  return roomRight >= roomLeft ? 'right' : 'left'
}

// Leaflet centres a popup above its point: left = -width / 2 + offset.x and
// bottom = -offset.y. These offsets move it beside the pin instead, with its
// top just above the pin's head, so new content grows downwards.
export function popupOffset(side, width, height, pinHeight) {
  const half = Math.round(width / 2)
  const x = side === 'right' ? half + PIN_HALF + GAP : half - width - PIN_HALF - GAP
  return [x, height - pinHeight - LIFT]
}
