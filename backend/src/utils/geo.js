const EARTH_RADIUS_M = 6371000
const toRad = (deg) => (deg * Math.PI) / 180

// a and b are [lat, lng] pairs. Returns the straight-line distance in metres
// (the same formula the frontend uses in frontend/src/utils/geo.js).
export function distanceInMeters(a, b) {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

// True only for a real [lat, lng] pair. Used before measuring, so a missing or
// broken ?lat=&lng= simply means "no distance" instead of an error.
export function isPoint(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 90 &&
    Math.abs(value[1]) <= 180
  )
}
