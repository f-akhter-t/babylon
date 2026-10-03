// The area where citizens can drop a pin. Change this file to use a
// smaller area later (for example only Chattogram).

export const REGION_NAME = 'Bangladesh'

// A simplified outline of Bangladesh as [lat, lng] points, going around the
// border clockwise from the northern tip (Tetulia). It is approximate:
// small islands are left out and spots right on the border may be judged
// slightly wrong. Good enough for a demo.
export const REGION_OUTLINE = [
  // North-west and west border with India (West Bengal)
  [26.63, 88.43], [26.48, 88.35], [25.95, 88.15], [25.7, 88.25],
  [25.55, 88.45], [25.3, 88.85], [25.1, 89.0], [24.85, 88.4], [24.75, 88.05],
  [24.5, 88.15], [24.3, 88.55], [24.25, 88.75], [24.05, 88.7], [23.8, 88.55],
  [23.55, 88.75], [23.3, 88.95], [23.05, 88.88], [22.75, 88.95], [22.0, 89.05],
  // South coast: Sundarbans, Barishal, Noakhali, Chattogram, Cox's Bazar
  [21.65, 89.08], [21.72, 89.5], [21.8, 89.95], [21.88, 90.6],
  [22.0, 90.85], [22.15, 91.05], [22.45, 91.3], [22.75, 91.45], [22.5, 91.69],
  [22.24, 91.79], [22.0, 91.88], [21.75, 91.86], [21.55, 91.92], [21.43, 91.965],
  [21.2, 92.06], [20.95, 92.2], [20.74, 92.32],
  // South-east border with Myanmar, then Mizoram
  [21.0, 92.3], [21.2, 92.25], [21.25, 92.45], [21.5, 92.62], [21.85, 92.65],
  [22.1, 92.6], [22.5, 92.55], [22.9, 92.42], [23.2, 92.35], [23.42, 92.3],
  // East: around Tripura (Khagrachari, Feni, Comilla, Brahmanbaria, Sylhet)
  [23.3, 92.0], [23.25, 91.85], [22.98, 91.72], [23.25, 91.43], [23.45, 91.25],
  [23.85, 91.23], [24.1, 91.38], [24.22, 91.65], [24.2, 91.9], [24.45, 92.12],
  [24.85, 92.42],
  // North border with Assam and Meghalaya, then Kurigram and Lalmonirhat
  [25.05, 92.3], [25.17, 92.0], [25.18, 91.5], [25.18, 90.5],
  [25.25, 90.05], [25.35, 89.85], [25.8, 89.85], [26.12, 89.72], [26.12, 89.45],
  [26.35, 89.1], [26.22, 88.88], [26.33, 88.6],
]

// The smallest box around the outline, for a quick first check.
const lats = REGION_OUTLINE.map(([lat]) => lat)
const lngs = REGION_OUTLINE.map(([, lng]) => lng)
const BOX = {
  minLat: Math.min(...lats),
  maxLat: Math.max(...lats),
  minLng: Math.min(...lngs),
  maxLng: Math.max(...lngs),
}

// Point-in-polygon ("ray casting"): draw an imaginary line from the point
// towards the east and count how many border edges it crosses.
// An odd number of crossings means the point is inside.
export function isInRegion(lat, lng) {
  if (lat < BOX.minLat || lat > BOX.maxLat || lng < BOX.minLng || lng > BOX.maxLng) {
    return false // far away: no need for the full check
  }

  let inside = false
  for (let i = 0, j = REGION_OUTLINE.length - 1; i < REGION_OUTLINE.length; j = i++) {
    const [latA, lngA] = REGION_OUTLINE[i]
    const [latB, lngB] = REGION_OUTLINE[j]
    const crossesLatitude = latA > lat !== latB > lat
    if (crossesLatitude) {
      const edgeLng = lngA + ((lat - latA) / (latB - latA)) * (lngB - lngA)
      if (lng < edgeLng) inside = !inside
    }
  }
  return inside
}
