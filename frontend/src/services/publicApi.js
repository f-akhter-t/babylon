// What a guest can read from the backend: the Home page data now, and the issue
// list and detail in the next step. api.js re-exports these, so pages keep
// importing them from there. They live in their own file so the tests can load
// them without the rest of the mock API.
import { get } from './http.js'

// The hero text never changes while the app runs, and the backend answers both
// lists in one reply, so the first call asks and the second one reuses it. A
// failed request is forgotten, so "try again" asks the server again.
let heroRequest = null
function hero() {
  heroRequest ??= get('/home/hero').catch((error) => {
    heroRequest = null
    throw error
  })
  return heroRequest
}

export async function getHeroSlides() {
  return (await hero()).slides
}

export async function getHeroCategories() {
  return (await hero()).categories
}

// The latest fixed issues that have an after-photo (the server picks them).
export async function getFixedThisWeek() {
  return get('/home/fixed-this-week')
}

// Newest reports first, for the ticker on Home.
export async function getRecentActivity(limit = 8) {
  return get('/home/activity', { query: { limit } })
}

// The four stat cards for the last 8 weeks, worked out by the server from the
// same department rows the admin Accountability page uses.
export async function getStats() {
  return get('/home/stats')
}
