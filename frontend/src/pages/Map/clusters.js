// Pins closer than this (in screen pixels) would overlap, so they become
// one round count badge instead.
const OVERLAP_PX = 28

// Splits issues into single pins and clusters for the given zoom level.
// map.project turns lat/lng into pixel positions at that zoom.
// The selected issue always stays a single pin, so it never hides in a badge.
export function groupNearby(map, zoom, issues, selectedId) {
  const selected = []
  const groups = []

  for (const issue of issues) {
    if (issue.id === selectedId) {
      selected.push(issue)
      continue
    }
    const point = map.project([issue.lat, issue.lng], zoom)
    const group = groups.find((g) => g.point.distanceTo(point) < OVERLAP_PX)
    if (group) group.issues.push(issue)
    else groups.push({ point, issues: [issue] })
  }

  const singles = [...selected]
  const clusters = []

  for (const group of groups) {
    if (group.issues.length === 1) {
      singles.push(group.issues[0])
    } else {
      const count = group.issues.length
      clusters.push({
        id: group.issues.map((issue) => issue.id).join('-'),
        issues: group.issues,
        // Badge sits in the middle of its pins.
        lat: group.issues.reduce((sum, issue) => sum + issue.lat, 0) / count,
        lng: group.issues.reduce((sum, issue) => sum + issue.lng, 0) / count,
      })
    }
  }

  return { singles, clusters }
}
