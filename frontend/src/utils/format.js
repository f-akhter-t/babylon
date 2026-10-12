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
