// How an issue is shown to the outside world, and how the public list is
// filtered. Pure functions with no database, so they are easy to test.
// shared/service/issues.service.js re-exports toIssueJSON: that is the name
// the other panels import. Nobody else builds issue JSON or an issue filter.
import { daysBetween, shortDate } from './dates.js'
import { distanceInMeters, isPoint } from './geo.js'
import { departmentForCategory } from '../constants/departments.js'

const iso = (value) => (value ? new Date(value).toISOString() : undefined)
const short = (value) => (value ? shortDate(new Date(value)) : undefined)

// The PUBLIC view of one issue: the same field names the pages read today.
// It accepts a lean object or a Mongoose document, and it is synchronous.
//
// Fields are picked by name, never spread, so a private field can never leak.
// Never included: pendingAfterImg, departmentNote, sentBack, sentBackHistory,
// submittedAt, submittedOn, editedAt, reporterEmail. Staff views add what they
// need on top. The owner's sent-back history is added by issues.service.js.
//
// extras:
//   votes  number of votes (default 0). The caller counts them from Vote rows.
//   voted  true or false for a signed-in viewer. Left out for guests.
//   mine   true or false for a signed-in viewer: did they file this issue?
//          Replaces sending the reporter's email. Left out for guests.
//   from   [lat, lng] of the viewer. Adds distanceM when given.
//   now    for tests.
export function toIssueJSON(issue, extras = {}) {
  const doc = typeof issue.toObject === 'function' ? issue.toObject() : issue
  const { votes = 0, voted, mine, from, now = new Date() } = extras
  const created = doc.createdAt ?? now
  const department = departmentForCategory(doc.category)

  const json = {
    id: String(doc._id),
    title: doc.title,
    category: doc.category,
    department,
    status: doc.status,
    priority: doc.priority,
    // true when the photo was scored by CLIP (F1); the screens then mark the priority "AI".
    aiAssessed: doc.severityScore != null ? true : undefined,
    verification: doc.verification,
    votes,
    location: doc.location,
    ward: doc.ward,
    division: doc.division,
    lat: doc.lat,
    lng: doc.lng,
    description: doc.description,
    reporter: doc.reporter,
    beforeImg: doc.beforeImg,
    afterImg: doc.afterImg,
    seenBefore: doc.seenBefore,
    // Display fields, worked out here and never stored.
    daysAgo: daysBetween(created, now),
    reportedOn: short(created),
    sentOn: department ? short(created) : null,
    startedOn: doc.startedOn ?? short(doc.startedAt),
    resolvedOn: doc.resolvedOn ?? short(doc.resolvedAt),
    fixedInDays: doc.fixedInDays,
    reopenedFrom: doc.reopenedFrom,
    createdAt: iso(created),
    startedAt: iso(doc.startedAt),
    resolvedAt: iso(doc.resolvedAt),
    reopenedAt: iso(doc.reopenedAt),
  }

  if (typeof voted === 'boolean') json.voted = voted
  if (typeof mine === 'boolean') json.mine = mine
  if (isPoint(from) && Number.isFinite(doc.lat) && Number.isFinite(doc.lng)) {
    json.distanceM = Math.round(distanceInMeters(from, [doc.lat, doc.lng]))
  }
  return json
}

// ---------- The public list filter ----------

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const isAll = (value) => value === undefined || value === null || value === '' || value === 'All'

// category and status: 'All' (or nothing) means no filter. search matches the
// title or the street, ignoring case; what is typed is escaped, so "(" or "*"
// is just a character. String() means an object smuggled into the query can
// never act as a Mongo operator.
export function buildIssueFilter({ category, status, search } = {}) {
  const filter = {}
  if (!isAll(category)) filter.category = String(category)
  if (!isAll(status)) filter.status = String(status)
  const text = typeof search === 'string' ? search.trim() : ''
  if (text) {
    const pattern = new RegExp(escapeRegex(text), 'i')
    filter.$or = [{ title: pattern }, { location: pattern }]
  }
  return filter
}
