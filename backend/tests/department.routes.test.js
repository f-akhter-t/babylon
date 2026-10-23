// The 4 department endpoints and the citizen profile read, with the database and
// the teammates' services replaced by fakes. Run:
//   node --experimental-test-module-mocks --test tests/department.routes.test.js
import { test, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import express from 'express'
import request from 'supertest'
import { fakeModel } from './helpers/fakeModel.js'

// Set before any app code loads. The URI is never used: nothing connects.
process.env.MONGODB_URI = 'mongodb://localhost/unused-never-connected'
process.env.JWT_SECRET = 'test-secret-not-real'

const ROADS = 'Roads & Highways'
const url = (path) => new URL(path, import.meta.url).href
const fakes = { issue: null, user: null, identity: null }
const proxy = (key) => new Proxy({}, { get: (_, method) => (...args) => fakes[key][method](...args) })
const notices = []

mock.module(url('../src/models/issue.model.js'), { defaultExport: proxy('issue') })
mock.module(url('../src/models/user.model.js'), { defaultExport: proxy('user') })
mock.module(url('../src/models/identity.model.js'), { defaultExport: proxy('identity') })
mock.module(url('../src/shared/service/alerts.service.js'), {
  namedExports: {
    notify: async (email, payload) => { notices.push({ email, ...payload }) },
    notifyMany: async (emails, payload) => { for (const email of emails) notices.push({ email, ...payload }) },
  },
})
mock.module(url('../src/shared/service/issues.service.js'), {
  namedExports: {
    toIssueJSON: (issue) => {
      const { _id, ...rest } = issue
      return { id: String(_id), ...rest }
    },
  },
})
// A stand-in ranker (most votes first). The real one is Farhana's.
mock.module(url('../src/utils/rankIssues.js'), {
  namedExports: { rankIssues: (list) => [...list].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)) },
})

const makeIssues = () => [
  { title: 'Pothole A', category: 'Roads', status: 'open', priority: 'high', verification: 'none', votes: 5, reporterEmail: 'nadia@babylon.test' },
  { title: 'Bridge crack', category: 'Bridges', status: 'open', priority: 'medium', verification: 'none', votes: 9, reporterEmail: 'arif@babylon.test' },
  { title: 'Road in progress', category: 'Roads', status: 'in-progress', priority: 'medium', verification: 'none', votes: 2, reporterEmail: 'arif@babylon.test' },
  { title: 'Road waiting', category: 'Roads', status: 'in-progress', priority: 'medium', verification: 'awaiting', votes: 1, pendingAfterImg: 'data:image/png;base64,AAAA' },
  { title: 'Road fixed', category: 'Roads', status: 'resolved', priority: 'fix-verified', verification: 'verified', votes: 3 },
  { title: 'Road reopened', category: 'Roads', status: 'in-progress', priority: 'reopened', verification: 'reopened', votes: 4 },
  { title: 'Bin overflow', category: 'Waste', status: 'open', priority: 'medium', verification: 'none', votes: 7 },
  { title: 'Stray dogs', category: 'Other', status: 'open', priority: 'medium', verification: 'none', votes: 8 },
  { title: 'Streetlight out', category: 'Lighting', status: 'open', priority: 'medium', verification: 'none', votes: 1 },
]

const makeUsers = () => [
  { email: 'nadia@babylon.test', name: 'Nadia Rahman', role: 'citizen', phone: '01712345678', address: '12 Lake Road', division: 'Chattogram' },
  { email: 'arif@babylon.test', name: 'Arif Hossain', role: 'citizen', division: 'Dhaka' },
  { email: 'admin@babylon.test', name: 'Admin', role: 'admin' },
]

const makeIdentities = () => [
  { userEmail: 'nadia@babylon.test', status: 'pending', nidLast4: '4821', reason: '', photo: { data: 'secret-photo-bytes', contentType: 'image/png' } },
]

let app
let tokens

before(async () => {
  const { default: departmentRouter } = await import('../src/department/index.js')
  const { default: profileRoutes } = await import('../src/citizen/routes/profile.routes.js')
  const { default: authenticate } = await import('../src/middlewares/authenticate.js')
  const { default: authorize } = await import('../src/middlewares/authorize.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  const { signToken } = await import('../src/utils/token.js')

  app = express()
  app.use(express.json())
  app.use('/api/department', departmentRouter)
  // Only the profile routes, so Joyti's files can change without breaking this test.
  app.use('/api/citizen', authenticate, authorize('citizen'), profileRoutes)
  app.use(errorHandler)

  tokens = {
    roads: signToken({ email: 'roads@babylon.test', role: 'department', department: ROADS }),
    power: signToken({ email: 'power@babylon.test', role: 'department', department: 'Electricity' }),
    notOnboarded: signToken({ email: 'new@babylon.test', role: 'department', department: ROADS, onboarded: false }),
    citizen: signToken({ email: 'nadia@babylon.test', role: 'citizen' }),
    stranger: signToken({ email: 'ghost@babylon.test', role: 'citizen' }),
    admin: signToken({ email: 'admin@babylon.test', role: 'admin' }),
  }
})

beforeEach(() => {
  fakes.issue = fakeModel(makeIssues())
  fakes.user = fakeModel(makeUsers())
  fakes.identity = fakeModel(makeIdentities())
  notices.length = 0
})

const as = (who) => ({ Authorization: `Bearer ${tokens[who]}` })
const rowOf = (title) => fakes.issue.rows.find((row) => row.title === title)
const idOf = (title) => String(rowOf(title)._id)
const titles = (res) => res.body.data.map((item) => item.title)

const list = (scope, who = 'roads') =>
  request(app).get('/api/department/issues').query(scope ? { scope } : {}).set(as(who))
const summary = (who = 'roads') => request(app).get('/api/department/summary').set(as(who))
const start = (id, body = { status: 'in-progress' }, who = 'roads') =>
  request(app).patch(`/api/department/issues/${id}/status`).set(as(who)).send(body)
const submit = (id, body, who = 'roads') =>
  request(app).post(`/api/department/issues/${id}/submit`).set(as(who)).send(body)
const profile = (who = 'citizen') => request(app).get('/api/citizen/profile').set(as(who))

const GOOD_FIX = { note: 'Patched.', photoUrl: 'data:image/png;base64,AAAA' }

// ---------- access ----------

test('no token gives 401', async () => {
  const res = await request(app).get('/api/department/summary')
  assert.equal(res.status, 401)
  assert.equal(res.body.code, 'unauthorized')
})

test('citizen, admin and not-onboarded tokens give 403', async () => {
  for (const who of ['citizen', 'admin', 'notOnboarded']) {
    const res = await summary(who)
    assert.equal(res.status, 403, who)
    assert.equal(res.body.code, 'forbidden')
  }
})

// ---------- list ----------

test('assigned list: only this department, no reopened, ranked 1 to n', async () => {
  const res = await list('assigned')
  assert.equal(res.status, 200)
  assert.deepEqual(titles(res), ['Bridge crack', 'Pothole A', 'Road in progress', 'Road waiting'])
  assert.deepEqual(res.body.data.map((item) => item.rank), [1, 2, 3, 4])
})

test('no scope means assigned', async () => {
  assert.deepEqual(titles(await list()), ['Bridge crack', 'Pothole A', 'Road in progress', 'Road waiting'])
})

test('completed list: only resolved issues of this department', async () => {
  assert.deepEqual(titles(await list('completed')), ['Road fixed'])
})

test('another department sees only its own issues', async () => {
  assert.deepEqual(titles(await list('assigned', 'power')), ['Streetlight out'])
})

test('a bad scope gives 400 with the field name', async () => {
  const res = await list('everything')
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'invalid')
  assert.equal(res.body.field, 'scope')
})

// ---------- summary ----------

test('summary counts equal the list lengths', async () => {
  const res = await summary()
  assert.equal(res.status, 200)
  const assigned = (await list('assigned')).body.data
  const completed = (await list('completed')).body.data
  assert.deepEqual(res.body.data, {
    department: ROADS,
    assigned: assigned.length,
    open: 2,
    inProgress: 2,
    awaiting: 1,
    completed: completed.length,
  })
})

// ---------- start work ----------

test('start work: 200 the first time, 409 the second, one notice only', async () => {
  const id = idOf('Pothole A')
  const first = await start(id)
  assert.equal(first.status, 200)
  assert.equal(first.body.data.status, 'in-progress')
  assert.ok(rowOf('Pothole A').startedAt instanceof Date)
  assert.equal((await start(id)).status, 409)
  assert.equal(notices.length, 1)
  assert.equal(notices[0].email, 'nadia@babylon.test')
  assert.equal(notices[0].kind, 'in-progress')
})

test('start work on another department\'s issue gives 403 and changes nothing', async () => {
  const res = await start(idOf('Pothole A'), undefined, 'power')
  assert.equal(res.status, 403)
  assert.equal(rowOf('Pothole A').status, 'open')
})

test('start work on a reopened issue gives 409', async () => {
  const res = await start(idOf('Road reopened'))
  assert.equal(res.status, 409)
  assert.equal(rowOf('Road reopened').verification, 'reopened')
})

test('start work with an unknown or bad id gives 404', async () => {
  assert.equal((await start(String(new mongoose.Types.ObjectId()))).status, 404)
  assert.equal((await start('abc')).status, 404)
})

test('start work with a wrong status in the body gives 400', async () => {
  const res = await start(idOf('Pothole A'), { status: 'resolved' })
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'status')
})

// ---------- submit for verification ----------

test('submit without a photo gives 400', async () => {
  const res = await submit(idOf('Road in progress'), { note: 'Done.' })
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'photoUrl')
})

test('submit with a photo that is not an image gives 400', async () => {
  const res = await submit(idOf('Road in progress'), { note: 'Done.', photoUrl: 'not-a-photo' })
  assert.equal(res.status, 400)
})

test('submit before work started gives 409', async () => {
  const res = await submit(idOf('Pothole A'), GOOD_FIX)
  assert.equal(res.status, 409)
  assert.equal(rowOf('Pothole A').verification, 'none')
})

test('submit: 200, issue awaits the admin, notices sent, second submit gives 409', async () => {
  const id = idOf('Road in progress')
  const first = await submit(id, GOOD_FIX)
  assert.equal(first.status, 200)
  const row = rowOf('Road in progress')
  assert.equal(row.verification, 'awaiting')
  assert.equal(row.pendingAfterImg, GOOD_FIX.photoUrl)
  assert.equal(row.departmentNote, 'Patched.')
  assert.ok(row.submittedAt instanceof Date)

  const reporter = notices.find((n) => n.kind === 'fix-submitted')
  const admin = notices.find((n) => n.kind === 'fix-waiting')
  assert.equal(reporter.email, 'arif@babylon.test')
  assert.equal(admin.email, 'admin@babylon.test')

  assert.equal((await submit(id, GOOD_FIX)).status, 409)
})

test('submit on an issue already waiting gives 409', async () => {
  assert.equal((await submit(idOf('Road waiting'), GOOD_FIX)).status, 409)
})

test('submit on a reopened issue gives 409', async () => {
  assert.equal((await submit(idOf('Road reopened'), GOOD_FIX)).status, 409)
})

test('submit on another department\'s issue gives 403', async () => {
  const res = await submit(idOf('Road in progress'), GOOD_FIX, 'power')
  assert.equal(res.status, 403)
  assert.equal(rowOf('Road in progress').verification, 'none')
})

// ---------- citizen profile ----------

test('profile: no token gives 401, a department token gives 403', async () => {
  assert.equal((await request(app).get('/api/citizen/profile')).status, 401)
  assert.equal((await profile('roads')).status, 403)
})

test('profile: returns the signed-in citizen with division, and no NID photo', async () => {
  const res = await profile()
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data, {
    name: 'Nadia Rahman',
    email: 'nadia@babylon.test',
    phone: '01712345678',
    address: '12 Lake Road',
    division: 'Chattogram',
    identity: { status: 'pending', nidLast4: '4821', reason: '' },
  })
  const text = JSON.stringify(res.body)
  assert.equal(text.includes('secret-photo-bytes'), false)
  assert.equal(text.includes('photo'), false)
})

test('profile: a citizen with no identity record gets status none', async () => {
  const res = await request(app)
    .get('/api/citizen/profile')
    .set({ Authorization: `Bearer ${tokens.citizen}` })
    .query({})
  assert.equal(res.body.data.identity.status, 'pending')
  fakes.identity = fakeModel([])
  const again = await profile()
  assert.deepEqual(again.body.data.identity, { status: 'none', nidLast4: null, reason: null })
})

test('profile: the owner comes from the token, not from the query', async () => {
  const res = await request(app)
    .get('/api/citizen/profile')
    .query({ email: 'arif@babylon.test' })
    .set(as('citizen'))
  assert.equal(res.body.data.email, 'nadia@babylon.test')
})

test('profile: a token for an account that does not exist gives 404', async () => {
  assert.equal((await profile('stranger')).status, 404)
})


// ---------- profile: PATCH ----------

const patchProfile = (body, who = 'citizen') =>
  request(app).patch('/api/citizen/profile').set(as(who)).send(body)
const userRow = (email) => fakes.user.rows.find((row) => row.email === email)

test('profile update: no token gives 401, a department token gives 403', async () => {
  assert.equal((await request(app).patch('/api/citizen/profile').send({ address: 'x' })).status, 401)
  assert.equal((await patchProfile({ address: 'x' }, 'roads')).status, 403)
})

test('profile update: saves name, address and division, and returns the new profile', async () => {
  const res = await patchProfile({ name: 'Nadia Rahman Khan', address: '14 Lake Road', division: 'Sylhet' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.name, 'Nadia Rahman Khan')
  assert.equal(res.body.data.address, '14 Lake Road')
  assert.equal(res.body.data.division, 'Sylhet')
  assert.equal(userRow('nadia@babylon.test').division, 'Sylhet')
})

test('profile update: only the fields that were sent change', async () => {
  const res = await patchProfile({ address: '  9 New Street  ' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.address, '9 New Street')
  assert.equal(res.body.data.name, 'Nadia Rahman')
  assert.equal(res.body.data.division, 'Chattogram')
})

test('profile update: an empty body gives 400 and changes nothing', async () => {
  const res = await patchProfile({})
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'invalid')
  assert.equal(userRow('nadia@babylon.test').address, '12 Lake Road')
})

test('profile update: a bad division gives 400 with the field name', async () => {
  const res = await patchProfile({ division: 'Mars' })
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'division')
  assert.equal(userRow('nadia@babylon.test').division, 'Chattogram')
})

test('profile update: an address over 120 characters gives 400', async () => {
  const res = await patchProfile({ address: 'a'.repeat(121) })
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'address')
  assert.equal((await patchProfile({ address: 'a'.repeat(120) })).status, 200)
})

test('profile update: a bad name gives 400', async () => {
  for (const name of ['A', '12345', '<b>x</b>', 'x'.repeat(51)]) {
    const res = await patchProfile({ name })
    assert.equal(res.status, 400, name)
    assert.equal(res.body.field, 'name', name)
  }
  assert.equal(userRow('nadia@babylon.test').name, 'Nadia Rahman')
})

test('profile update: phone and email in the body are ignored', async () => {
  const res = await patchProfile({ address: '5 Ignore Road', phone: '01999999999', email: 'x@y.z' })
  assert.equal(res.status, 200)
  const row = userRow('nadia@babylon.test')
  assert.equal(row.phone, '01712345678')
  assert.equal(row.email, 'nadia@babylon.test')
  assert.equal(row.address, '5 Ignore Road')
})

test('profile update: a body with only phone or email gives 400, not a fake "saved"', async () => {
  assert.equal((await patchProfile({ phone: '01999999999' })).status, 400)
  assert.equal((await patchProfile({ email: 'x@y.z' })).status, 400)
})

test('profile update: the owner comes from the token, not the body', async () => {
  const res = await patchProfile({ email: 'arif@babylon.test', address: 'Mine only' })
  assert.equal(res.status, 200)
  assert.equal(userRow('nadia@babylon.test').address, 'Mine only')
  assert.equal(userRow('arif@babylon.test').address, undefined)
})

test('profile update: a token for an account that does not exist gives 404', async () => {
  assert.equal((await patchProfile({ address: 'x' }, 'stranger')).status, 404)
})
