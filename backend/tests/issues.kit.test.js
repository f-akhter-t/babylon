// Tests for Farhana's shared kit: rankIssues, geo, toIssueJSON, the public
// filter, and the issues service (list and detail).
//
// The pure parts run everywhere. The service tests use fake models (like the
// other panels' tests), and need Joyti's models/vote.model.js to exist: they are
// skipped until her pull request is merged, then they run by themselves.
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import mongoose from 'mongoose'

const url = (path) => new URL(path, import.meta.url).href
const { rankIssues } = await import('../src/utils/rankIssues.js')
const { distanceInMeters, isPoint } = await import('../src/utils/geo.js')
const { toIssueJSON, buildIssueFilter } = await import('../src/utils/issueView.js')

const NOW = new Date('2026-10-23T12:00:00Z')
const DAY = 86400000
const daysAgo = (n) => new Date(NOW.getTime() - n * DAY)

// ---------- rankIssues ----------

test('rankIssues: priority first, then votes', () => {
  const list = [
    { id: 'a', priority: 'medium', votes: 50 },
    { id: 'b', priority: 'urgent', votes: 3 },
    { id: 'c', priority: 'fix-verified', votes: 99 },
    { id: 'd', priority: 'urgent', votes: 7 },
    { id: 'e', priority: 'high', votes: 1 },
    { id: 'f', priority: 'reopened', votes: 5 },
  ]
  assert.deepEqual(rankIssues(list).map((i) => i.id), ['d', 'b', 'e', 'f', 'a', 'c'])
})

test('rankIssues: same priority and votes, the newer report first', () => {
  const list = [
    { id: 'old', priority: 'medium', votes: 4, createdAt: daysAgo(10) },
    { id: 'new', priority: 'medium', votes: 4, createdAt: daysAgo(1) },
  ]
  assert.deepEqual(rankIssues(list).map((i) => i.id), ['new', 'old'])
})

test('rankIssues: does not change the list it is given, and copes with gaps', () => {
  const list = [
    { id: 'x', priority: 'weird' },
    { id: 'y', priority: 'urgent' },
  ]
  const copy = [...list]
  const ranked = rankIssues(list)
  assert.deepEqual(list, copy)
  assert.deepEqual(ranked.map((i) => i.id), ['y', 'x'])
  assert.equal('rank' in ranked[0], false)
})

// ---------- geo ----------

test('distanceInMeters: a degree of latitude is about 111.2 km', () => {
  assert.ok(Math.abs(distanceInMeters([0, 0], [1, 0]) - 111195) < 5)
})

test('distanceInMeters: same point is 0, and it works both ways', () => {
  assert.equal(distanceInMeters([22.354, 91.824], [22.354, 91.824]), 0)
  const a = [22.354, 91.824]
  const b = [22.355, 91.8248]
  assert.equal(distanceInMeters(a, b), distanceInMeters(b, a))
  assert.ok(distanceInMeters(a, b) > 100 && distanceInMeters(a, b) < 160)
})

test('isPoint accepts only a real [lat, lng]', () => {
  assert.equal(isPoint([22.35, 91.82]), true)
  for (const bad of [null, undefined, [], [1], [NaN, 1], [91, 0], [0, 181], ['1', '2'], 'x']) {
    assert.equal(isPoint(bad), false, JSON.stringify(bad))
  }
})

// ---------- toIssueJSON ----------

const doc = (extra = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  title: 'Deep pothole near Wasa Circle',
  category: 'Roads',
  description: 'Large pothole in the left lane.',
  status: 'in-progress',
  priority: 'high',
  verification: 'awaiting',
  location: 'Wasa Circle',
  ward: 'Ward 15',
  division: 'Chattogram',
  lat: 22.355,
  lng: 91.8248,
  reporter: 'Nadia R.',
  reporterEmail: 'nadia@babylon.test',
  beforeImg: '/img/before.jpg',
  pendingAfterImg: 'data:image/png;base64,SECRET',
  departmentNote: 'internal note',
  sentBack: { reason: 'blurry', on: '1 Oct' },
  sentBackHistory: [{ reason: 'blurry', on: '1 Oct' }],
  submittedAt: daysAgo(1),
  submittedOn: '22 Oct',
  editedAt: daysAgo(2),
  createdAt: daysAgo(3),
  startedAt: daysAgo(2),
  ...extra,
})

test('toIssueJSON: id is text, department comes from the category', () => {
  const issue = doc()
  const json = toIssueJSON(issue, { now: NOW })
  assert.equal(json.id, String(issue._id))
  assert.equal(json.department, 'Roads & Highways')
  assert.equal(toIssueJSON(doc({ category: 'Other' }), { now: NOW }).department, null)
  assert.equal(toIssueJSON(doc({ category: 'Other' }), { now: NOW }).sentOn, null)
})

test('toIssueJSON: is synchronous (other panels call it without await)', () => {
  const json = toIssueJSON(doc(), { now: NOW })
  assert.equal(typeof json.then, 'undefined')
})

test('toIssueJSON: never leaks private or staff-only fields', () => {
  const json = toIssueJSON(doc(), { now: NOW, votes: 4, voted: true })
  const text = JSON.stringify(json)
  for (const field of [
    'pendingAfterImg',
    'departmentNote',
    'sentBack',
    'sentBackHistory',
    'submittedAt',
    'submittedOn',
    'editedAt',
    'reporterEmail',
    'nadia@babylon.test',
    'SECRET',
    'internal note',
  ]) {
    assert.equal(text.includes(field), false, `leaked: ${field}`)
  }
})

test('toIssueJSON: display fields are worked out, not stored', () => {
  const json = toIssueJSON(doc(), { now: NOW })
  assert.equal(json.daysAgo, 3)
  assert.equal(json.reportedOn, '20 Oct')
  assert.equal(json.sentOn, '20 Oct')
  assert.equal(json.startedOn, '21 Oct')
  assert.equal(json.votes, 0)
  assert.equal(json.createdAt, daysAgo(3).toISOString())
})

test('toIssueJSON: a brand-new report says 1 day ago, never 0', () => {
  assert.equal(toIssueJSON(doc({ createdAt: NOW }), { now: NOW }).daysAgo, 1)
})

test('toIssueJSON: distanceM only when the viewer position is given', () => {
  assert.equal('distanceM' in toIssueJSON(doc(), { now: NOW }), false)
  assert.equal('distanceM' in toIssueJSON(doc(), { now: NOW, from: [NaN, 1] }), false)
  const json = toIssueJSON(doc(), { now: NOW, from: [22.354, 91.824] })
  assert.ok(Number.isInteger(json.distanceM) && json.distanceM > 100 && json.distanceM < 160)
})

test('toIssueJSON: voted and mine appear only when given', () => {
  const plain = toIssueJSON(doc(), { now: NOW })
  assert.equal('voted' in plain, false)
  assert.equal('mine' in plain, false)
  const signedIn = toIssueJSON(doc(), { now: NOW, voted: false, mine: true })
  assert.equal(signedIn.voted, false)
  assert.equal(signedIn.mine, true)
})

test('toIssueJSON: takes a Mongoose document too', () => {
  // A small model of its own: the real issue model is replaced by a fake further down.
  const Sample = mongoose.models.KitSample ?? mongoose.model(
    'KitSample',
    new mongoose.Schema({ title: String, category: String, createdAt: Date }),
  )
  const real = new Sample({ title: 'Pothole', category: 'Roads', createdAt: daysAgo(2) })
  const json = toIssueJSON(real, { now: NOW })
  assert.equal(json.id, String(real._id))
  assert.equal(json.daysAgo, 2)
})

// ---------- buildIssueFilter ----------

test('buildIssueFilter: All or nothing means no filter', () => {
  assert.deepEqual(buildIssueFilter(), {})
  assert.deepEqual(buildIssueFilter({ category: 'All', status: 'All', search: '   ' }), {})
  assert.deepEqual(buildIssueFilter({ category: '', status: '' }), {})
})

test('buildIssueFilter: filters combine', () => {
  const filter = buildIssueFilter({ category: 'Roads', status: 'open', search: 'pothole' })
  assert.equal(filter.category, 'Roads')
  assert.equal(filter.status, 'open')
  assert.equal(filter.$or.length, 2)
})

test('buildIssueFilter: search ignores case, covers title and street, escapes symbols', () => {
  const [{ title: byTitle }, { location: byStreet }] = buildIssueFilter({ search: 'PotHole' }).$or
  assert.ok(byTitle.test('Deep pothole near Wasa Circle'))
  assert.ok(byStreet.test('Big POTHOLE on the road'))
  assert.equal(byTitle.test('Streetlight out'), false)

  const [{ title: dotted }] = buildIssueFilter({ search: 'a.b(c' }).$or
  assert.ok(dotted.test('xa.b(cx'))
  assert.equal(dotted.test('axb(c'), false) // the dot is a dot, not "any character"
})

test('buildIssueFilter: an object in the query can not become a Mongo operator', () => {
  const filter = buildIssueFilter({ category: { $ne: 'Roads' }, status: ['open'] })
  assert.equal(typeof filter.category, 'string')
  assert.equal(typeof filter.status, 'string')
  assert.equal(JSON.stringify(filter).includes('$ne'), false)
})

// ---------- The service (fake models) ----------

const hasVoteModel = existsSync(new URL('../src/models/vote.model.js', import.meta.url))
const needsVote = hasVoteModel ? {} : { skip: "needs models/vote.model.js (Joyti's pull request)" }

const ids = {
  pothole: new mongoose.Types.ObjectId(),
  light: new mongoose.Types.ObjectId(),
  bin: new mongoose.Types.ObjectId(),
  big: new mongoose.Types.ObjectId(),
}
const rows = [
  doc({ _id: ids.pothole, title: 'Pothole near Wasa', priority: 'medium', status: 'open', verification: 'none', reporterEmail: 'other@babylon.test' }),
  doc({ _id: ids.light, title: 'Streetlight out', category: 'Lighting', priority: 'urgent', status: 'open', verification: 'none', reporterEmail: 'other@babylon.test' }),
  doc({ _id: ids.bin, title: 'Fixed bin', category: 'Waste', priority: 'fix-verified', status: 'resolved', verification: 'verified', reporterEmail: 'other@babylon.test' }),
  doc({ _id: ids.big, title: 'Big pothole', priority: 'urgent', status: 'open', verification: 'none', reporterEmail: 'ann@babylon.test' }),
]
const voteTotals = [
  { _id: ids.pothole, count: 20 },
  { _id: ids.light, count: 3 },
  { _id: ids.bin, count: 50 },
  { _id: ids.big, count: 7 },
]

let lastFilter = null
const query = (value) => ({
  select() { return this },
  lean() { return this },
  then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
})

let service
if (hasVoteModel) {
  mock.module(url('../src/models/issue.model.js'), {
    defaultExport: {
      find: (filter) => { lastFilter = filter; return query(rows) },
      findById: (id) => query(rows.find((row) => String(row._id) === String(id)) ?? null),
    },
  })
  mock.module(url('../src/models/vote.model.js'), {
    defaultExport: {
      aggregate: async () => voteTotals,
      // Ann has voted on the big pothole only.
      find: (filter) => query(filter.userEmail === 'ann@babylon.test' ? [{ issueId: ids.big }] : []),
    },
  })
  service = await import('../src/shared/service/issues.service.js')
}

test('issues.service re-exports the same toIssueJSON', needsVote, async () => {
  assert.equal(service.toIssueJSON, toIssueJSON)
})

test('listIssues: ranked 1 to n, votes counted, a guest gets no voted flag', needsVote, async () => {
  const list = await service.listIssues({})
  assert.deepEqual(list.map((i) => i.title), ['Big pothole', 'Streetlight out', 'Pothole near Wasa', 'Fixed bin'])
  assert.deepEqual(list.map((i) => i.rank), [1, 2, 3, 4])
  assert.deepEqual(list.map((i) => i.votes), [7, 3, 20, 50])
  assert.equal(list.every((i) => !('voted' in i) && !('mine' in i)), true)
  assert.equal(JSON.stringify(list).includes('SECRET'), false)
  assert.equal(JSON.stringify(list).includes('reporterEmail'), false)
})

test('listIssues: passes the filter to the database', needsVote, async () => {
  await service.listIssues({ category: 'Roads', status: 'open', search: 'pothole' })
  assert.equal(lastFilter.category, 'Roads')
  assert.equal(lastFilter.status, 'open')
  assert.equal(lastFilter.$or.length, 2)
})

test('listIssues: a signed-in viewer gets voted and mine', needsVote, async () => {
  const list = await service.listIssues({ viewerEmail: 'Ann@Babylon.test' })
  const big = list.find((i) => i.title === 'Big pothole')
  const other = list.find((i) => i.title === 'Fixed bin')
  assert.equal(big.voted, true)
  assert.equal(big.mine, true)
  assert.equal(other.voted, false)
  assert.equal(other.mine, false)
})

test('listIssues: distanceM on every item when the viewer position is sent', needsVote, async () => {
  const list = await service.listIssues({ from: [22.354, 91.824] })
  assert.equal(list.every((i) => Number.isInteger(i.distanceM)), true)
})

test('getIssueDetail: unknown or broken id gives 404', needsVote, async () => {
  for (const id of ['not-an-id', String(new mongoose.Types.ObjectId())]) {
    await assert.rejects(service.getIssueDetail(id), (err) => err.code === 'not-found' && err.status === 404)
  }
})

test('getIssueDetail: only the owner sees the sent-back history', needsVote, async () => {
  const guest = await service.getIssueDetail(String(ids.big))
  assert.equal('sentBackHistory' in guest, false)
  assert.equal('voted' in guest, false)

  const stranger = await service.getIssueDetail(String(ids.big), { viewerEmail: 'zed@babylon.test' })
  assert.equal('sentBackHistory' in stranger, false)
  assert.equal(stranger.voted, false)
  assert.equal(stranger.mine, false)

  const owner = await service.getIssueDetail(String(ids.big), { viewerEmail: 'ann@babylon.test' })
  assert.deepEqual(owner.sentBackHistory, [{ reason: 'blurry', on: '1 Oct' }])
  assert.equal(owner.sentBackNow, true)
  assert.equal(owner.voted, true)
  assert.equal(owner.mine, true)
  assert.equal(owner.votes, 7)
})
