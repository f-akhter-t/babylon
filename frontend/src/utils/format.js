// "120 m" or "0.8 km"
export function formatDistance(meters) {
  return meters < 500 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`
}

// "1 day ago" or "3 days ago"
export function formatDaysAgo(days) {
  return days === 1 ? '1 day ago' : `${days} days ago`
}