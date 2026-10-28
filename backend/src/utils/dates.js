export const DAY_MS = 86400000

// "24 Sep", as the frontend shows dates.
export function shortDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

// Whole days between two moments, never less than 1.
export function daysBetween(from, to = new Date()) {
  return Math.max(1, Math.round((new Date(to) - new Date(from)) / DAY_MS))
}
