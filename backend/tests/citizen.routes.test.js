// The citizen routes over HTTP: sign-in, role, the checked body, the owner from
// the token and the answers. The services are replaced; their rules live in the
// service tests and in citizen.json.
import { test, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const url = (path) => new URL(path, import.meta.url).href
const ID = '64b7f0f0f0f0f0f0f0f0f0f0'
const calls = []
let fail = null

// Every fake service function records its call, then answers or fails.
async function reply(name, args, data) {
  calls.push({ name, args })
  if (fail) {
    const { default: AppError } = await import('../src/utils/AppError.js')
    throw new AppError(fail.code, fail.status, 'x')
  }
  return data
}

mock.module(url('../src/citizen/service/reports.service.js'), {
  namedExports: {
    createReport: (email, body) => reply('createReport', [email, body], { id: ID, votes: 1 }),
    listMyReports: (email) => reply('listMyReports', [email], []),
    getMyReport: (email, id) => reply('getMyReport', [email, id], { id }),
    updateReport: (email, id, body) => reply('updateReport', [email, id, body], { id, ...body }),
    deleteReport: (email, id) => reply('deleteReport', [email, id], { id }),
  },
})
mock.module(url('../src/citizen/service/votes.service.js'), {
  namedExports: {
    addVote: (email, id) => reply('addVote', [email, id], { id, votes: 2, voted: true }),
    removeVote: (email, id) => reply('removeVote', [email, id], { id, votes: 1, voted: false }),
  },
})
mock.module(url('../src/citizen/service/alerts.service.js'), {
  namedExports: {
    listAlerts: (email) => reply('listAlerts', [email], { alerts: [], unreadCount: 0 }),
    getUnreadCount: (email) => reply('getUnreadCount', [email], { unreadCount: 0 }),
    markRead: (email, id) => reply('markRead', [email, id], { id, read: true }),
    markAllRead: (email) => reply('markAllRead', [email], { unreadCount: 0 }),
  },
})
mock.module(url('../src/citizen/service/me.service.js'), {
  namedExports: {
    getMe: (email) => reply('getMe', [email], { email, name: 'Nadia R.' }),
    getPoints: (email) => reply('getPoints', [email], { points: 60 }),
  },
})

let app
let signToken
before(async () => {
  const { default: reports } = await import('../src/citizen/routes/reports.routes.js')
  const { default: votes } = await import('../src/citizen/routes/votes.routes.js')
  const { default: alerts } = await import('../src/citizen/routes/alerts.routes.js')
  const { default: me } = await import('../src/citizen/routes/me.routes.js')
  const { default: authenticate } = await import('../src/middlewares/authenticate.js')
  const { default: authorize } = await import('../src/middlewares/authorize.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  ;({ signToken } = await import('../src/utils/token.js'))
  app = express()
  app.use(express.json())
  app.use('/api/citizen', authenticate, authorize('citizen'), reports, votes, alerts, me)
  app.use(errorHandler)
})

beforeEach(() => {
  calls.length = 0
  fail = null
})

const token = (email = 'citizen@babylon.test') => signToken({ email, role: 'citizen' })
const send = (method, path, who = token()) =>
  request(app)[method](`/api/citizen${path}`).set('Authorization', `Bearer ${who}`)
const last = () => calls.at(-1)

const VALID = {
  category: 'Roads',
  description: 'Big pothole near the main gate that is dangerous for bikes.',
  photoUrl: 'data:image/png;base64,iVBORw0KGgo=',
  location: { lat: 22.3569, lng: 91.7832, label: 'Main Gate, Ward 5', division: 'Chattogram' },
}

const ROUTES = [
  ['post', '/reports'],
  ['get', '/reports'],
  ['get', `/reports/${ID}`],
  ['patch', `/reports/${ID}`],
  ['delete', `/reports/${ID}`],
  ['post', `/reports/${ID}/vote`],
  ['delete', `/reports/${ID}/vote`],
  ['get', '/me'],
  ['get', '/points/earn'],
  ['get', '/alerts'],
  ['get', '/alerts/unread-count'],
  ['patch', `/alerts/${ID}/read`],
  ['post', '/alerts/read-all'],
]

test('no token gives 401 and a department token gives 403 on all 13 routes, and no service runs', async () => {
  const dept = signToken({ email: 'd@babylon.test', role: 'department', department: 'Roads & Highways' })
  for (const [method, path] of ROUTES) {
    const none = await request(app)[method](`/api/citizen${path}`)
    assert.equal(none.status, 401, `${method} ${path}`)
    assert.equal(none.body.code, 'unauthorized')
    const wrong = await send(method, path, dept)
    assert.equal(wrong.status, 403, `${method} ${path}`)
    assert.equal(wrong.body.code, 'forbidden')
  }
  assert.equal(calls.length, 0)
})

test('create: 201, the owner is the email in the token, and extra fields are dropped', async () => {
  const res = await send('post', '/reports').send({ ...VALID, reporterEmail: 'evil@babylon.test', status: 'resolved' })
  assert.equal(res.status, 201)
  assert.equal(res.body.success, true)
  const [email, body] = last().args
  assert.equal(email, 'citizen@babylon.test')
  assert.equal(body.reporterEmail, undefined)
  assert.equal(body.status, undefined)
  assert.equal(body.category, 'Roads')
})

test('create: a bad body is 400 with the field, and the service is not called', async () => {
  const cases = [
    ['photoUrl', { ...VALID, photoUrl: undefined }],
    ['photoUrl', { ...VALID, photoUrl: 'not-a-picture' }],
    ['category', { ...VALID, category: 'Flying' }],
    ['description', { ...VALID, description: 'Hi' }],
    ['location', { ...VALID, location: undefined }],
    ['location', { ...VALID, location: { lat: 1, lng: 2 } }],
  ]
  for (const [field, body] of cases) {
    const res = await send('post', '/reports').send(body)
    assert.equal(res.status, 400, field)
    assert.equal(res.body.code, 'invalid')
    assert.equal(res.body.field, field)
  }
  assert.equal(calls.length, 0)
})

test('my reports and one report: 200, the owner comes from the token', async () => {
  assert.equal((await send('get', '/reports')).status, 200)
  assert.deepEqual(last().args, ['citizen@babylon.test'])
  const one = await send('get', `/reports/${ID}`, token('other@babylon.test'))
  assert.equal(one.status, 200)
  assert.deepEqual(last().args, ['other@babylon.test', ID])
})

test('a service refusal keeps its status and the standard shape (404, 403)', async () => {
  fail = { code: 'not-found', status: 404 }
  const gone = await send('get', `/reports/${ID}`)
  assert.equal(gone.status, 404)
  assert.equal(gone.body.success, false)
  assert.equal(gone.body.code, 'not-found')
  fail = { code: 'forbidden', status: 403 }
  const notMine = await send('get', `/reports/${ID}`)
  assert.equal(notMine.status, 403)
  assert.equal(notMine.body.code, 'forbidden')
})

test('edit: 200 keeps the title sent, a short title is 400, a started report is 423', async () => {
  const ok = await send('patch', `/reports/${ID}`).send({ title: 'Pothole near gate' })
  assert.equal(ok.status, 200)
  assert.deepEqual(last().args, ['citizen@babylon.test', ID, { title: 'Pothole near gate' }])

  calls.length = 0
  const short = await send('patch', `/reports/${ID}`).send({ title: 'Hi' })
  assert.equal(short.status, 400)
  assert.equal(short.body.field, 'title')
  assert.equal(calls.length, 0)

  fail = { code: 'locked', status: 423 }
  const locked = await send('patch', `/reports/${ID}`).send({ description: 'Pothole is now much bigger and blocks the lane.' })
  assert.equal(locked.status, 423)
  assert.equal(locked.body.code, 'locked')
})

test('delete: 200 for the owner, 403 for someone else', async () => {
  assert.equal((await send('delete', `/reports/${ID}`)).status, 200)
  assert.deepEqual(last().args, ['citizen@babylon.test', ID])
  fail = { code: 'forbidden', status: 403 }
  assert.equal((await send('delete', `/reports/${ID}`)).status, 403)
})

test('votes: add and remove use the email in the token; a resolved issue is 409', async () => {
  const added = await send('post', `/reports/${ID}/vote`, token('other@babylon.test'))
  assert.equal(added.status, 200)
  assert.equal(added.body.data.votes, 2)
  assert.deepEqual(last().args, ['other@babylon.test', ID])
  const removed = await send('delete', `/reports/${ID}/vote`)
  assert.equal(removed.status, 200)
  assert.equal(removed.body.data.voted, false)
  fail = { code: 'conflict', status: 409 }
  const closed = await send('post', `/reports/${ID}/vote`)
  assert.equal(closed.status, 409)
  assert.equal(closed.body.code, 'conflict')
})

test('me and points: 200 for the signed-in citizen', async () => {
  const me = await send('get', '/me')
  assert.equal(me.status, 200)
  assert.equal(me.body.data.name, 'Nadia R.')
  assert.deepEqual(last().args, ['citizen@babylon.test'])
  const points = await send('get', '/points/earn')
  assert.equal(points.status, 200)
  assert.equal(points.body.data.points, 60)
})

test('alerts: list, unread count, mark one read, mark all read, and someone else\'s is 404', async () => {
  assert.equal((await send('get', '/alerts')).body.data.unreadCount, 0)
  assert.equal((await send('get', '/alerts/unread-count')).status, 200)
  const read = await send('patch', `/alerts/${ID}/read`)
  assert.equal(read.status, 200)
  assert.deepEqual(last().args, ['citizen@babylon.test', ID])
  assert.equal((await send('post', '/alerts/read-all')).body.data.unreadCount, 0)
  fail = { code: 'not-found', status: 404 }
  const other = await send('patch', `/alerts/${ID}/read`, token('other@babylon.test'))
  assert.equal(other.status, 404)
  assert.equal(other.body.code, 'not-found')
})