// The 11 admin endpoints end to end (routes, validation, services), with the
// database replaced by in-memory fakes and the teammates' services replaced by
// recorders. Run: npm test
import { test, before, after, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import { TINY_PNG, seedEmail } from '../scripts/seedData.js'
import * as world from './helpers/world.js'

process.env.JWT_SECRET = 'test-secret-not-real'

const url = (path) => new URL(path, import.meta.url).href
const notices = []

// Fake mode: the three models are in-memory. Real mode (USE_DB=1): the real models.
if (!world.useDb) {
  mock.module(url('../src/models/issue.model.js'), { defaultExport: world.proxy('issue') })
  mock.module(url('../src/models/identity.model.js'), { defaultExport: world.proxy('identity') })
  mock.module(url('../src/models/user.model.js'), { defaultExport: world.proxy('user') })
}
// Always replaced: teammates' services, so this file tests only the admin panel.
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

let app
let token
let seed

before(async () => {
  await world.start()
  const { default: adminRouter } = await import('../src/admin/index.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  const { signToken } = await import('../src/utils/token.js')
  app = express()
  app.use(express.json())
  app.use('/api/admin', adminRouter)
  app.use(errorHandler)
  token = {
    admin: signToken({ email: 'admin@babylon.test', role: 'admin' }),
    department: signToken({ email: 'roads@babylon.test', role: 'department', department: 'Roads & Highways' }),
    citizen: signToken({ email: 'citizen@babylon.test', role: 'citizen' }),
  }
})

after(() => world.stop())

beforeEach(async () => {
  seed = await world.reset()
  notices.length = 0
})

const as = (who) => ({ Authorization: `Bearer ${token[who]}` })
const get = (path, who = 'admin') => request(app).get(`/api/admin${path}`).set(as(who))
const post = (path, body, who = 'admin') => request(app).post(`/api/admin${path}`).set(as(who)).send(body)

// ---------- which world is this? ----------

test(`running against ${world.useDb ? 'the REAL MongoDB' : 'in-memory fakes'}`, async () => {
  if (!world.useDb) return
  const { default: mongoose } = await import('mongoose')
  assert.equal(mongoose.connection.readyState, 1)
  assert.equal(mongoose.connection.name, world.TEST_DB_NAME)
  console.log(`      (connected to database "${mongoose.connection.name}" on ${mongoose.connection.host})`)
})

// ---------- access ----------

test('no token gives 401, a citizen or department token gives 403', async () => {
  assert.equal((await request(app).get('/api/admin/counts')).status, 401)
  assert.equal((await get('/counts', 'citizen')).status, 403)
  const res = await get('/verification-queue', 'department')
  assert.equal(res.status, 403)
  assert.deepEqual(Object.keys(res.body).sort(), ['code', 'message', 'success'])
  assert.equal(res.body.code, 'forbidden')
})

// ---------- verification reads ----------

test('queue lists the 3 waiting fixes, newest submission first, with the photo and note', async () => {
  const res = await get('/verification-queue')
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  const titles = res.body.data.map((i) => i.title)
  assert.deepEqual(titles, [
    'Overflowing bins at Lalkhan Bazar market',
    'Deep pothole near Wasa Circle',
    'Streetlight out on Jamal Khan Road',
  ])
  assert.match(res.body.data[0].pendingAfterImg, /^data:image\/png/)
  assert.ok(res.body.data[0].departmentNote)
})

test('counts equal the list lengths', async () => {
  const counts = (await get('/counts')).body.data
  assert.equal(counts.queue, (await get('/verification-queue')).body.data.length)
  assert.equal(counts.reopened, (await get('/reopened')).body.data.length)
  assert.deepEqual(counts, { queue: 3, reopened: 1 })
})

// ---------- approve ----------

test('approve closes the issue, publishes the photo, tells the reporter and the department', async () => {
  const id = await world.issueId('Deep pothole near Wasa Circle')
  const res = await post(`/issues/${id}/approve`)
  assert.equal(res.status, 200)
  const issue = res.body.data
  assert.equal(issue.status, 'resolved')
  assert.equal(issue.verification, 'verified')
  assert.equal(issue.priority, 'fix-verified')
  assert.ok(issue.resolvedAt)
  assert.match(issue.afterImg, /^data:image\/png/)
  assert.equal(issue.pendingAfterImg, undefined)
  assert.ok(issue.fixedInDays >= 1)

  assert.deepEqual(notices.map((n) => n.kind).sort(), ['fix-verified', 'resolved'])
  assert.ok(notices.filter((n) => n.kind === 'fix-verified').some((n) => n.email === seedEmail('roads-officer')))
  assert.equal((await get('/counts')).body.data.queue, 2)
})

test('a second approve gives 409', async () => {
  const id = await world.issueId('Deep pothole near Wasa Circle')
  await post(`/issues/${id}/approve`)
  const again = await post(`/issues/${id}/approve`)
  assert.equal(again.status, 409)
  assert.equal(again.body.code, 'conflict')
})

test('an unknown or malformed id gives 404', async () => {
  assert.equal((await post('/issues/not-an-id/approve')).status, 404)
  assert.equal((await post('/issues/64b7f0a1c2d3e4f5a6b7c8d9/approve')).status, 404)
})

// ---------- reject ----------

test('reject without a reason gives 400 with field reason', async () => {
  const id = await world.issueId('Streetlight out on Jamal Khan Road')
  for (const body of [{}, { reason: '' }, { reason: '   ' }]) {
    const res = await post(`/issues/${id}/reject`, body)
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'invalid')
    assert.equal(res.body.field, 'reason')
    assert.equal(res.body.message, 'Write a reason before sending this back.')
  }
  assert.equal((await world.issue(id)).verification, 'awaiting')
})

test('reject sends the fix back, keeps the reason, deletes the photo, and tells both', async () => {
  const id = await world.issueId('Streetlight out on Jamal Khan Road')
  const res = await post(`/issues/${id}/reject`, { reason: 'The lamp still flickers...' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.verification, 'none')
  assert.equal(res.body.data.status, 'in-progress')
  assert.equal(res.body.data.pendingAfterImg, undefined)
  assert.equal(res.body.data.sentBack.reason, 'The lamp still flickers...')
  assert.equal(res.body.data.sentBackHistory.length, 1)

  const sentBack = notices.filter((n) => n.kind === 'sent-back')
  assert.ok(sentBack.length >= 2)
  assert.match(sentBack.find((n) => n.email.endsWith('@seed-admin.test')).text, /Reason: The lamp still flickers\.$/)

  // sending it back twice is a conflict, not a second history entry
  const again = await post(`/issues/${id}/reject`, { reason: 'Again' })
  assert.equal(again.status, 409)
})

test('rejecting a reopened issue in the queue makes it High, not Reopened', async () => {
  const id = await world.issueId('Potholes along Tiger Pass Road')
  assert.equal((await post(`/issues/${id}/send-to-queue`)).status, 200)
  const res = await post(`/issues/${id}/reject`, { reason: 'Needs a full resurface.' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.priority, 'high')
  assert.equal(res.body.data.verification, 'none')
})

// ---------- send to queue ----------

test('send-to-queue moves a reopened issue to the queue and keeps its priority', async () => {
  const id = await world.issueId('Potholes along Tiger Pass Road')
  const res = await post(`/issues/${id}/send-to-queue`)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.verification, 'awaiting')
  assert.equal(res.body.data.priority, 'reopened')
  assert.ok(res.body.data.submittedAt)
  assert.deepEqual((await get('/counts')).body.data, { queue: 4, reopened: 0 })
})

test('send-to-queue on an issue that is not reopened gives 409', async () => {
  const res = await post(`/issues/${await world.issueId('Deep pothole near Wasa Circle')}/send-to-queue`)
  assert.equal(res.status, 409)
  assert.equal(res.body.message, 'This issue is no longer reopened.')
})

// ---------- accountability ----------

test('accountability answers for 4 and 8 weeks and the cards equal the rows', async () => {
  for (const weeks of [4, 8]) {
    const res = await get(`/accountability?weeks=${weeks}`)
    assert.equal(res.status, 200)
    const d = res.body.data
    assert.equal(d.weeks, weeks)
    assert.equal(d.label, `Last ${weeks} weeks`)
    assert.equal(d.departments.length, 4)
    assert.equal(d.stats.received, d.departments.reduce((n, r) => n + r.assigned, 0))
    assert.equal(d.stats.resolved, d.departments.reduce((n, r) => n + r.resolved, 0))
    assert.equal(d.weekly.length, weeks)
    assert.equal(d.weekly.reduce((n, w) => n + w.received, 0), d.stats.received)
    assert.equal(d.weekly.reduce((n, w) => n + w.resolved, 0), d.stats.resolved)
    const days = d.waitingLongest.map((w) => w.days)
    assert.deepEqual(days, [...days].sort((a, b) => b - a))
  }
})

test('accountability defaults to 8 weeks and refuses other periods', async () => {
  assert.equal((await get('/accountability')).body.data.weeks, 8)
  const bad = await get('/accountability?weeks=6')
  assert.equal(bad.status, 400)
  assert.equal(bad.body.code, 'invalid')
  assert.equal((await get('/accountability?weeks=abc')).status, 400)
})

test('the category "Other" counts nowhere', async () => {
  const { departments, waitingLongest } = (await get('/accountability?weeks=8')).body.data
  assert.ok(!waitingLongest.some((w) => w.title.startsWith('Stray dogs')))
  const assignedByHand = seed.issues.filter((i) => i.category !== 'Other' && i.createdAt >= new Date(Date.now() - 56 * 86400000)).length
  assert.equal(departments.reduce((n, r) => n + r.assigned, 0), assignedByHand)
})

// ---------- identity ----------

test('identity queue: pending only, oldest first, names, last 4 digits only, never the photo', async () => {
  const res = await get('/identity')
  assert.equal(res.status, 200)
  const queue = res.body.data
  assert.equal(queue.length, 4)
  assert.deepEqual(queue.map((q) => q.nidLast4), ['4821', '9034', '7390', '1156'])
  assert.equal(queue[0].name, 'Nadia Rahman')
  const text = JSON.stringify(res.body)
  assert.ok(!text.includes('photo'))
  assert.ok(queue.every((q) => /^\d{4}$/.test(q.nidLast4)))
  assert.deepEqual((await get('/identity/count')).body.data, { count: 4 })
})

test('the photo endpoint answers with the picture, and not for a submission without one', async () => {
  const withPhoto = await world.identityId('4821')
  const res = await get(`/identity/${withPhoto}/photo`)
  assert.equal(res.status, 200)
  assert.equal(res.headers['content-type'], 'image/png')
  assert.equal(res.headers['cache-control'], 'no-store')
  assert.ok(Buffer.from(res.body).equals(TINY_PNG))

  const without = await world.identityId('9034')
  assert.equal((await get(`/identity/${without}/photo`)).status, 404)
})

test('identity reject: reason rules, then the photo is gone and the citizen is told', async () => {
  const id = await world.identityId('4821')

  for (const [reason, status] of [[undefined, 400], ['abc', 400], ['x'.repeat(201), 400]]) {
    const res = await post(`/identity/${id}/review`, { decision: 'reject', reason })
    assert.equal(res.status, status)
    assert.equal(res.body.field, 'reason')
  }
  assert.equal((await post(`/identity/${id}/review`, { decision: 'maybe' })).status, 400)

  const res = await post(`/identity/${id}/review`, { decision: 'reject', reason: 'The card photo is blurry' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.status, 'rejected')
  assert.equal(res.body.data.photoDeleted, true)

  const stored = await world.identity(id)
  assert.equal(stored.photo, undefined)
  assert.equal(stored.reason, 'The card photo is blurry')
  assert.equal(notices.length, 1)
  assert.equal(notices[0].kind, 'identity-rejected')
  assert.equal(notices[0].text, 'Your identity was not approved. Reason: The card photo is blurry.')

  assert.equal((await get(`/identity/${id}/photo`)).status, 404)
  const again = await post(`/identity/${id}/review`, { decision: 'approve' })
  assert.equal(again.status, 409)
  assert.equal(again.body.message, 'This submission was already reviewed.')
})

test('identity approve: verified, photo deleted, citizen told; no photo means no approval', async () => {
  const id = await world.identityId('7390')
  const res = await post(`/identity/${id}/review`, { decision: 'approve' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.status, 'verified')
  assert.equal((await world.identity(id)).photo, undefined)
  assert.equal(notices[0].kind, 'identity-verified')

  const noPhoto = await world.identityId('9034')
  const blocked = await post(`/identity/${noPhoto}/review`, { decision: 'approve' })
  assert.equal(blocked.status, 409)
  assert.match(blocked.body.message, /cannot be approved/)
  // but it can still be rejected
  assert.equal((await post(`/identity/${noPhoto}/review`, { decision: 'reject', reason: 'Please send the photo again' })).status, 200)
})
