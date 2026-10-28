// All of Bangladesh, south-west to north-east: the maps open on this.
export const BANGLADESH_BOUNDS = [
  [20.6, 88.0],
  [26.7, 92.7],
]

// Wasa Circle, Chattogram: where the maps open before the person's own position is known.
export const MAP_CENTER = [22.354, 91.824]

const EARTH_RADIUS_M = 6371000
const toRad = (deg) => (deg * Math.PI) / 180

// a and b are [lat, lng] pairs. Returns the straight-line distance in metres.
export function distanceInMeters(a, b) {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}
