// "120 m" or "0.8 km"
export function formatDistance(meters) {
  return meters < 500 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`
}

// "1 day ago" or "3 days ago"
export function formatDaysAgo(days) {
  return days === 1 ? '1 day ago' : `${days} days ago`
}
// "12 Oct 2026" from a saved date (ISO string or timestamp)
export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// "Just now", "5 min ago", "Yesterday" ... from a timestamp (milliseconds)
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
