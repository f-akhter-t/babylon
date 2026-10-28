// What a guest can read from the backend: the Home page data, and the issue list
// and detail for Map, Feed and the issue page. api.js re-exports these, so pages
// keep importing them from there. They live in their own file so the tests can
// load them without the rest of api.js.
import { get } from './http.js'
import { MAP_CENTER } from '../utils/geo.js'
import { hasPosition } from '../utils/position.js'

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

// ---------- Issues (Map, Feed, issue page) ----------

// A way to see the error states while developing: set sessionStorage
// 'babylon:failLoads' and the loads below fail on purpose. Never in production.
function failLoadsForTesting() {
  if (!import.meta.env?.DEV) return
  let on = false
  try {
    on = Boolean(globalThis.sessionStorage?.getItem('babylon:failLoads'))
  } catch {
    // storage blocked: never fail on purpose
  }
  if (on) throw new Error('Load failed on purpose (babylon:failLoads).')
}

// The ranked list from GET /issues. category and status are 'All' or a real
// value; search matches the title or the street. The viewer is always measured
// from MAP_CENTER, so every issue has distanceM. A signed-in citizen's token
// is sent by http.js, which adds voted and mine to each issue.
// division: one of the 8 division names, or '' for all of Bangladesh.
// The map pages and pickers need a position to draw a pin, so an issue without
// coordinates is left out unless includeUnlocated is true (the Feed lists them all).
export async function getIssues({ category = 'All', status = 'All', search = '', division = '', includeUnlocated = false } = {}) {
  failLoadsForTesting()
  const list = await get('/issues', {
    query: { category, status, search: search.trim(), division, lat: MAP_CENTER[0], lng: MAP_CENTER[1] },
  })
  return includeUnlocated ? list : list.filter(hasPosition)
}

// One issue from GET /issues/:id, or null when there is no such issue (the page
// then shows "not found"). The owner also gets the sent-back history.
export async function getIssueById(id) {
  try {
    return await get(`/issues/${encodeURIComponent(id)}`, {
      query: { lat: MAP_CENTER[0], lng: MAP_CENTER[1] },
    })
  } catch (error) {
    if (error?.code === 'not-found') return null
    throw error
  }
}
